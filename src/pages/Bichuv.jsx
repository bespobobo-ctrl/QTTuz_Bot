import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
    Scissors, CheckCircle2, Clock, Scan,
    History, Package, ChevronRight, X,
    Search, Camera, Image as ImageIcon, Trash2,
    Info, AlertTriangle, Ruler, Shirt, Layers,
    TrendingUp, BarChart3, Activity, ArrowLeft,
    ShoppingCart, ClipboardList, PenTool, Hash,
    ArrowRight, Save, Plus, Minus, Users, Briefcase, Calendar
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function BichuvPanel({ tab, data, load, showMsg }) {
    const [activeRoll, setActiveRoll] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerRef] = useState({ current: null });

    // Stats & Modals
    const [showProdDetail, setShowProdDetail] = useState(null); // 'day', 'week', 'month'

    // Nastil State
    const [nastilStep, setNastilStep] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedRolls, setSelectedRolls] = useState([]);
    const [nastilForm, setNastilForm] = useState({ length: '', layers: '', piecesPerLayer: '', waste: '0', models: [] });

    // Mock HR & Planning Data (since tables dont exist yet)
    const [employees] = useState([
        { id: 1, name: 'Anvar', present: true },
        { id: 2, name: 'Sardor', present: true },
        { id: 3, name: 'Malika', present: false },
        { id: 4, name: 'Javohir', present: true },
        { id: 5, name: 'Olim', present: true }
    ]);

    useEffect(() => {
        if (tab !== 'nastil') { setNastilStep(1); setSelectedOrder(null); setSelectedRolls([]); }
        if (scannerRef.current) { try { scannerRef.current.stop().catch(() => { }); } catch (e) { } scannerRef.current = null; setScannerActive(false); }
    }, [tab]);

    const S = {
        card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', padding: 20, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 15 },
        input: { width: '100%', padding: 15, background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', marginBottom: 10, outline: 'none' },
        btn: { width: '100%', padding: 15, borderRadius: 16, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' },
        badge: (c) => ({ padding: '5px 12px', background: `${c}20`, color: c, borderRadius: 10, fontSize: 11, fontWeight: '800', letterSpacing: '0.5px' }),
        glass: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 20, padding: 15, border: '1px solid rgba(255,255,255,0.05)' },
        statBox: { flex: 1, padding: 15, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }
    };

    const rolls = data.whRolls || [];
    const orders = data.whOrders || [];
    const logs = data.whLog || [];

    // Bichuv statistikasi
    const bichuvLogs = logs.filter(l => l.action_type === 'BICHUV' || l.action_type === 'NASTIL');

    const getStatsByPeriod = (period) => {
        const now = new Date();
        const filtered = bichuvLogs.filter(l => {
            const date = new Date(l.created_at || l.neto_date);
            if (period === 'day') return date.toDateString() === now.toDateString();
            if (period === 'week') return (now - date) / (1000 * 60 * 60 * 24) <= 7;
            if (period === 'month') return (now - date) / (1000 * 60 * 60 * 24) <= 30;
            return true;
        });

        const totalKg = filtered.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
        let totalPieces = 0;
        filtered.forEach(l => {
            try {
                if (l.action_type === 'NASTIL' && l.notes) {
                    const n = JSON.parse(l.notes);
                    totalPieces += (Number(n.pieces) || 0);
                } else if (l.notes) {
                    const match = l.notes.match(/Dona: (\d+)/);
                    if (match) totalPieces += Number(match[1]);
                }
            } catch (e) { }
        });

        return { count: filtered.length, kg: totalKg, pieces: totalPieces, items: filtered };
    };

    const dayStats = getStatsByPeriod('day');
    const weekStats = getStatsByPeriod('week');
    const monthStats = getStatsByPeriod('month');

    const getIsReady = (roll) => {
        if (!roll.neto_date) return false;
        const diffMs = new Date() - new Date(roll.neto_date);
        return Math.floor(diffMs / (1000 * 60 * 60)) >= 48;
    };

    const readyRollsList = rolls.filter(r => r.status === 'KONTROLDAN_OTDI');

    const fabricList = Object.values(readyRollsList.reduce((acc, r) => {
        const key = `${r.fabric_name}_${r.color}_${r.gramaj}`;
        if (!acc[key]) acc[key] = { id: key, name: r.fabric_name, color: r.color, gramaj: r.gramaj, rolls: [] };
        acc[key].rolls.push(r);
        return acc;
    }, {})).map(g => {
        const totalNeto = g.rolls.reduce((s, r) => s + (Number(r.neto) || 0), 0);
        const avgEn = g.rolls.reduce((s, r) => s + (Number(r.en) || 0), 0) / g.rolls.length;
        let dSum = 0; g.rolls.forEach(r => { try { const d = typeof r.defects === 'string' ? JSON.parse(r.defects) : r.defects; dSum += Object.values(d || {}).reduce((a, b) => a + b, 0); } catch (e) { } });
        return { ...g, totalNeto, avgEn, avgDefects: dSum / g.rolls.length, allReady: g.rolls.every(getIsReady) };
    });

    const handleFinishNastil = async () => {
        if (!nastilForm.length || !nastilForm.layers || !nastilForm.piecesPerLayer) return alert('To\'ldiring!');
        setIsSaving(true);
        try {
            const totalKg = selectedRolls.reduce((s, r) => s + r.neto, 0);
            const totalPieces = Number(nastilForm.layers) * Number(nastilForm.piecesPerLayer);
            await Promise.all(selectedRolls.map(r => supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', r.id)));
            await supabase.from('warehouse_log').insert({
                item_name: `NASTIL: ${selectedOrder.customer_name} (${totalPieces} dona)`,
                quantity: totalKg,
                action_type: 'NASTIL',
                notes: JSON.stringify({ order_id: selectedOrder.id, length: nastilForm.length, layers: nastilForm.layers, pieces: totalPieces, waste: nastilForm.waste, rolls: selectedRolls.map(r => r.id) })
            });
            showMsg('Tayyor! ✅');
            setNastilStep(1); setSelectedOrder(null); setSelectedRolls([]); load(true);
        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
    };

    // --- SUB-PANELS ---

    const renderProductionDetail = () => {
        if (!showProdDetail) return null;
        const s = getStatsByPeriod(showProdDetail);
        return (
            <div style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 10000, padding: 20, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
                    <button onClick={() => setShowProdDetail(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                    <h2 style={{ margin: 0, textTransform: 'uppercase', fontSize: 16 }}>{showProdDetail === 'day' ? 'Kunlik' : showProdDetail === 'week' ? 'Haftalik' : 'Oylik'} Hisobot</h2>
                    <div style={{ width: 24 }} />
                </div>

                <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1), rgba(0, 230, 118, 0.02))' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        <div style={S.glass}>
                            <div style={{ color: '#888', fontSize: 11 }}>JAMI DONA</div>
                            <div style={{ fontSize: 22, fontWeight: '900', color: '#00e676' }}>{s.pieces} ta</div>
                        </div>
                        <div style={S.glass}>
                            <div style={{ color: '#888', fontSize: 11 }}>SARF (KG)</div>
                            <div style={{ fontSize: 22, fontWeight: '900' }}>{s.kg.toFixed(1)} kg</div>
                        </div>
                    </div>
                </div>

                <h3 style={{ fontSize: 14, color: '#888', marginBottom: 15 }}>BATAFSIL RO'YXAT</h3>
                {s.items.map((l, i) => (
                    <div key={i} style={S.card}>
                        <div style={{ fontWeight: 'bold' }}>{l.item_name}</div>
                        <div style={{ fontSize: 12, color: '#00e676', marginTop: 5 }}>{l.quantity} kg | {new Date(l.created_at).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 8, fontStyle: 'italic' }}>{l.notes}</div>
                    </div>
                ))}
            </div>
        );
    };

    // --- MAIN RENDER ---

    if (activeRoll) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                    <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                    <h2 style={{ margin: 0, fontSize: 18 }}>Bichish</h2>
                </div>
                <div style={S.card}>
                    <div style={{ fontSize: 22, fontWeight: 'bold' }}>{activeRoll.fabric_name}</div>
                    <div style={{ color: '#F06292', fontWeight: 'bold' }}>{activeRoll.color} • {activeRoll.neto} kg</div>
                </div>
                <div style={S.card}>
                    <input style={S.input} placeholder="Model nomi" value={cutForm.model} onChange={e => setCutForm({ ...cutForm, model: e.target.value })} />
                    <input style={S.input} type="number" placeholder="Dona soni" value={cutForm.pieces} onChange={e => setCutForm({ ...cutForm, pieces: e.target.value })} />
                    <button onClick={async () => {
                        setIsSaving(true);
                        try {
                            await supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', activeRoll.id);
                            await supabase.from('warehouse_log').insert({ item_name: `BICHUV: ${activeRoll.fabric_name}`, quantity: activeRoll.neto, action_type: 'BICHUV', notes: `Model: ${cutForm.model}, Dona: ${cutForm.pieces}` });
                            showMsg('Bajarildi!'); setActiveRoll(null); load(true);
                        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
                    }} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>TASDIQLASH</button>
                </div>
            </motion.div>
        );
    }

    if (tab === 'orders') {
        return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 25, fontSize: 24, fontWeight: '900' }}>Buyurtmalar 📋</h2>
                {orders.map(o => (
                    <div key={o.id} style={S.card}>
                        <div style={{ fontWeight: 'bold', fontSize: 18 }}>{o.customer_name}</div>
                        <div style={{ color: '#F06292', fontSize: 12 }}>{o.fabric_type} • {o.total_quantity} dona</div>
                    </div>
                ))}
            </div>
        );
    }

    if (tab === 'nastil') {
        if (nastilStep === 1) return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 25 }}>Nastil: Buyurtma tanlang</h2>
                {orders.map(o => (
                    <div key={o.id} style={S.card} onClick={() => { setSelectedOrder(o); setNastilStep(2); }}>{o.customer_name} ({o.fabric_type})</div>
                ))}
            </div>
        );
        if (nastilStep === 2) return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 25 }}>Nastil: Rulonlar ({selectedRolls.length})</h2>
                {readyRollsList.map(r => (
                    <div key={r.id} style={{ ...S.card, opacity: selectedRolls.find(x => x.id === r.id) ? 1 : 0.6 }} onClick={() => {
                        if (selectedRolls.find(x => x.id === r.id)) setSelectedRolls(selectedRolls.filter(x => x.id !== r.id));
                        else setSelectedRolls([...selectedRolls, r]);
                    }}>{r.fabric_name} • {r.neto}kg</div>
                ))}
                <button style={{ ...S.btn, background: '#F06292', color: '#fff' }} onClick={() => setNastilStep(3)}>DAVOM ETISH</button>
            </div>
        );
        if (nastilStep === 3) return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 25 }}>Nastil Parametrlari</h2>
                <div style={S.card}>
                    <input style={S.input} type="number" placeholder="Uzunlik (sm)" value={nastilForm.length} onChange={e => setNastilForm({ ...nastilForm, length: e.target.value })} />
                    <input style={S.input} type="number" placeholder="Qavatlar" value={nastilForm.layers} onChange={e => setNastilForm({ ...nastilForm, layers: e.target.value })} />
                    <input style={S.input} type="number" placeholder="Dona/Qavat" value={nastilForm.piecesPerLayer} onChange={e => setNastilForm({ ...nastilForm, piecesPerLayer: e.target.value })} />
                    <button style={{ ...S.btn, background: '#00e676', color: '#000' }} onClick={handleFinishNastil}>YAKUNLASH</button>
                </div>
            </div>
        );
    }

    if (tab === 'history') {
        return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 25 }}>Tarix</h2>
                {cutRolls.map(r => (
                    <div key={r.id} style={S.card}>{r.fabric_name} • {r.neto} kg • BICHILDI</div>
                ))}
            </div>
        );
    }

    // --- DASHBOARD (ASOSIY) ---
    return (
        <div style={{ padding: '20px 20px 120px 20px' }}>
            {renderProductionDetail()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: '900', letterSpacing: '-1.5px' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h1>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Ishlab chiqarish va xodimlar nazorati</div>
                </div>
                <div style={{ background: 'rgba(240, 98, 146, 0.1)', padding: 12, borderRadius: 18 }}>
                    <Scissors color="#F06292" size={24} />
                </div>
            </div>

            {/* XODIMLAR SECTION */}
            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Users size={18} color="#4FC3F7" />
                    <span style={{ fontWeight: '800', fontSize: 13, color: '#4FC3F7' }}>XODIMLAR (DATING)</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={S.statBox}>
                        <div style={{ fontSize: 10, color: '#888' }}>JAMI</div>
                        <div style={{ fontSize: 22, fontWeight: '900' }}>{employees.length}</div>
                    </div>
                    <div style={{ ...S.statBox, background: 'rgba(0, 230, 118, 0.05)' }}>
                        <div style={{ fontSize: 10, color: '#00e676' }}>KELGAN</div>
                        <div style={{ fontSize: 22, fontWeight: '900', color: '#00e676' }}>{employees.filter(e => e.present).length}</div>
                    </div>
                    <div style={{ ...S.statBox, background: 'rgba(255, 82, 82, 0.05)' }}>
                        <div style={{ fontSize: 10, color: '#ff5252' }}>KELMAGAN</div>
                        <div style={{ fontSize: 22, fontWeight: '900', color: '#ff5252' }}>{employees.filter(e => !e.present).length}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 15, flexWrap: 'wrap' }}>
                    {employees.map(e => (
                        <div key={e.id} style={{ width: 8, height: 8, borderRadius: '50%', background: e.present ? '#00e676' : '#ff5252' }} />
                    ))}
                </div>
            </div>

            {/* BICHUV STATISTIKASI SECTION */}
            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Activity size={18} color="#00e676" />
                    <span style={{ fontWeight: '800', fontSize: 13, color: '#00e676' }}>UNUMDORLIK (PROD)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div onClick={() => setShowProdDetail('day')} style={{ ...S.statBox, cursor: 'pointer' }}>
                        <div style={{ fontSize: 10, color: '#888' }}>BUGUN</div>
                        <div style={{ fontSize: 16, fontWeight: '900' }}>{dayStats.pieces} <small style={{ fontSize: 9 }}>dona</small></div>
                    </div>
                    <div onClick={() => setShowProdDetail('week')} style={{ ...S.statBox, cursor: 'pointer' }}>
                        <div style={{ fontSize: 10, color: '#888' }}>HAFTA</div>
                        <div style={{ fontSize: 16, fontWeight: '900' }}>{weekStats.pieces} <small style={{ fontSize: 9 }}>dona</small></div>
                    </div>
                    <div onClick={() => setShowProdDetail('month')} style={{ ...S.statBox, cursor: 'pointer' }}>
                        <div style={{ fontSize: 10, color: '#888' }}>OY</div>
                        <div style={{ fontSize: 16, fontWeight: '900' }}>{monthStats.pieces} <small style={{ fontSize: 9 }}>dona</small></div>
                    </div>
                </div>
            </div>

            {/* PLAN & REJA SECTION */}
            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Calendar size={18} color="#FFD700" />
                    <span style={{ fontWeight: '800', fontSize: 13, color: '#FFD700' }}>STRATEGIK REJA</span>
                </div>
                <div style={{ background: 'rgba(255, 215, 0, 0.05)', padding: 15, borderRadius: 18, border: '1px solid rgba(255,215,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 'bold' }}>NAVBATDAGI ZAKAZLAR</span>
                        <span style={S.badge('#FFD700')}>PLAN</span>
                    </div>
                    {orders.slice(0, 2).map((o, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD700' }} />
                            <span>{o.customer_name} — {o.fabric_type} ({o.total_quantity} ta)</span>
                        </div>
                    ))}
                    <div style={{ fontSize: 11, color: '#888', marginTop: 10, borderTop: '1px solid rgba(255,215,0,0.1)', paddingTop: 10 }}>
                        Ertangi kun uchun: <b>3 ta nastil kutilmoqda 🚀</b>
                    </div>
                </div>
            </div>

            {/* OMBOR QOLDIG'I (Quick View) */}
            <h3 style={{ fontSize: 16, fontWeight: '800', margin: '25px 0 15px 5px' }}>Tayyor Matolar</h3>
            {fabricList.map(f => (
                <div key={f.id} onClick={() => setSelectedGroup(f)} style={{ ...S.card, borderLeft: `6px solid ${f.allReady ? '#00e676' : '#ff9800'}`, padding: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{f.name}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{f.color} • {f.totalNeto.toFixed(0)} kg</div>
                        </div>
                        <ChevronRight size={18} color="#333" />
                    </div>
                </div>
            ))}
        </div>
    );

    function processScan(t) {
        let id = t.replace('NETO-', '').replace('ROLL-', '');
        const r = rolls.find(x => String(x.id) === String(id));
        if (!r) return;
        setActiveRoll(r);
    }
}
