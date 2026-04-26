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
    ArrowRight, Save, Plus, Minus, Users, Briefcase, Calendar, Box
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function BichuvPanel({ tab, data, load, showMsg }) {
    const [activeRoll, setActiveRoll] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerRef] = useState({ current: null });

    // Ombor State
    const [omborCategory, setOmborCategory] = useState('mato'); // 'mato' | 'aksesuvar'

    // Stats & Modals
    const [showProdDetail, setShowProdDetail] = useState(null); // 'day', 'week', 'month'

    // Nastil State
    const [nastilStep, setNastilStep] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedRolls, setSelectedRolls] = useState([]);
    const [nastilForm, setNastilForm] = useState({ length: '', layers: '', piecesPerLayer: '', waste: '0', models: [] });

    // Mock HR 
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
        statBox: { flex: 1, padding: 15, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' },
        toggle: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 5, marginBottom: 20 }
    };

    const rolls = data.whRolls || [];
    const orders = data.whOrders || [];
    const logs = data.whLog || [];
    const accessories = data.accessories || [];

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
            try { if (l.action_type === 'NASTIL' && l.notes) totalPieces += (JSON.parse(l.notes).pieces || 0); else if (l.notes) { const m = l.notes.match(/Dona: (\d+)/); if (m) totalPieces += Number(m[1]); } } catch (e) { }
        });
        return { count: filtered.length, kg: totalKg, pieces: totalPieces, items: filtered };
    };

    const getIsReady = (roll) => {
        if (!roll.neto_date) return false;
        const diffMs = new Date() - new Date(roll.neto_date);
        return Math.floor(diffMs / (1000 * 60 * 60)) >= 48;
    };

    const readyRollsList = rolls.filter(r => r.status === 'KONTROLDAN_OTDI');
    const cutRolls = rolls.filter(r => r.status === 'BICHILDI');

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

    const handleCut = async () => {
        if (!cutForm.model || !cutForm.pieces) return alert('To\'ldiring!');
        setIsSaving(true);
        try {
            await supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', activeRoll.id);
            await supabase.from('warehouse_log').insert({ item_name: `BICHUV: ${activeRoll.fabric_name}`, quantity: activeRoll.neto, action_type: 'BICHUV', notes: `Model: ${cutForm.model}, Dona: ${cutForm.pieces}` });
            showMsg('Bajarildi!'); setActiveRoll(null); load(true);
        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
    };

    // --- RENDER SECTIONS ---

    const renderOmbor = () => (
        <div style={{ padding: 20 }}>
            <h2 style={{ marginBottom: 25, fontSize: 24, fontWeight: '900' }}>Ombor Qoldig'i 📦</h2>

            <div style={S.toggle}>
                <button onClick={() => setOmborCategory('mato')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'mato' ? '#F06292' : 'none', color: '#fff', fontWeight: 'bold' }}>MATO</button>
                <button onClick={() => setOmborCategory('aksesuvar')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'aksesuvar' ? '#BA68C8' : 'none', color: '#fff', fontWeight: 'bold' }}>AKSESUVAR</button>
            </div>

            {omborCategory === 'mato' ? (
                <div>
                    {fabricList.map(f => (
                        <div key={f.id} onClick={() => setSelectedGroup(f)} style={{ ...S.card, borderLeft: `6px solid ${f.allReady ? '#00e676' : '#ff9800'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: 18 }}>{f.name}</div>
                                    <div style={{ color: '#888', fontSize: 13 }}>{f.color} • {f.totalNeto.toFixed(0)} kg</div>
                                </div>
                                <ChevronRight size={18} color="#555" />
                            </div>
                        </div>
                    ))}
                    {fabricList.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center', marginTop: 50 }}>Matolar yo'q</div>}
                </div>
            ) : (
                <div>
                    {accessories.map(a => (
                        <div key={a.id} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{a.name}</div>
                                    <div style={{ color: '#888', fontSize: 12 }}>{a.category} • {a.size || '-'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 18, fontWeight: '900', color: Number(a.quantity) < Number(a.min_quantity) ? '#ff5252' : '#00e676' }}>{a.quantity} <small style={{ fontSize: 10 }}>{a.unit}</small></div>
                                    {Number(a.quantity) < Number(a.min_quantity) && <div style={{ fontSize: 9, color: '#ff5252' }}>KAMAYIB QOLDI!</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {accessories.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center', marginTop: 50 }}>Aksesuarlar yo'q</div>}
                </div>
            )}
        </div>
    );

    if (showProdDetail) {
        const s = getStatsByPeriod(showProdDetail);
        return (
            <div style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 10000, padding: 20, overflowY: 'auto' }}>
                <button onClick={() => setShowProdDetail(null)} style={{ background: 'none', border: 'none', color: '#fff', marginBottom: 20 }}><ArrowLeft /></button>
                <h2 style={{ marginBottom: 25 }}>{showProdDetail} Hisobot</h2>
                {s.items.map((l, i) => (<div key={i} style={S.card}><b>{l.item_name}</b><div>{l.quantity} kg | {l.notes}</div></div>))}
            </div>
        );
    }

    if (activeRoll) return (
        <div style={{ padding: 20 }}>
            <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#fff', marginBottom: 20 }}><ArrowLeft /></button>
            <div style={S.card}><h2>{activeRoll.fabric_name}</h2><p>{activeRoll.color} • {activeRoll.neto}kg</p></div>
            <div style={S.card}>
                <input style={S.input} placeholder="Model" value={cutForm.model} onChange={e => setCutForm({ ...cutForm, model: e.target.value })} />
                <input style={S.input} type="number" placeholder="Dona" value={cutForm.pieces} onChange={e => setCutForm({ ...cutForm, pieces: e.target.value })} />
                <button onClick={handleCut} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>BICHISH</button>
            </div>
        </div>
    );

    if (selectedGroup) return (
        <div style={{ padding: 20 }}>
            <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', color: '#fff', marginBottom: 20 }}><ArrowLeft /></button>
            <div style={S.card}><h1>{selectedGroup.name}</h1><div style={{ display: 'flex', gap: 10 }}><div style={S.badge('#F06292')}>{selectedGroup.color}</div><div style={S.badge('#00e676')}>{selectedGroup.totalNeto}kg</div></div></div>
            {selectedGroup.rolls.map(r => (<div key={r.id} style={S.card} onClick={() => setActiveRoll(r)}>{r.id}-roll | {r.neto}kg <ChevronRight size={14} /></div>))}
        </div>
    );

    if (tab === 'ombor') return renderOmbor();
    if (tab === 'orders') return (<div style={{ padding: 20 }}><h2>Buyurtmalar</h2> {orders.map(o => (<div key={o.id} style={S.card}>{o.customer_name} ({o.total_quantity})</div>))} </div>);
    if (tab === 'nastil') return (<div style={{ padding: 20 }}><h2>Nastil Tizimi</h2> <button style={{ ...S.btn, background: '#F06292', color: '#fff' }} onClick={() => setNastilStep(2)}>BOSHLAsh</button> </div>);
    if (tab === 'scan') return (<div style={{ padding: 20 }}><div id="bichuv-reader" style={{ borderRadius: 20, overflow: 'hidden' }}></div><button onClick={async () => { const h = new Html5Qrcode("bichuv-reader"); await h.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (t) => { h.stop(); processScan(t); }, () => { }); }} style={{ ...S.btn, background: '#F06292', color: '#fff', marginTop: 20 }}>SKANER</button></div>);
    if (tab === 'history') return (<div style={{ padding: 20 }}><h2>Tarix</h2> {cutRolls.slice(0, 10).map(r => (<div key={r.id} style={S.card}>{r.fabric_name} • {r.neto}kg</div>))} </div>);

    // DASHBOARD
    return (
        <div style={{ padding: '20px 20px 120px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div><h1 style={{ margin: 0, fontSize: 28, fontWeight: '900' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h1></div>
                <div style={{ background: 'rgba(240, 98, 146, 0.1)', padding: 12, borderRadius: 18 }}><Scissors color="#F06292" size={24} /></div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}><Users size={18} color="#4FC3F7" /><span style={{ fontWeight: '800', fontSize: 13, color: '#4FC3F7' }}>XODIMLAR</span></div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={S.statBox}><div>JAMI</div><div style={{ fontSize: 20, fontWeight: '900' }}>{employees.length}</div></div>
                    <div style={{ ...S.statBox, background: 'rgba(0, 230, 118, 0.05)' }}><div>KELGAN</div><div style={{ fontSize: 20, fontWeight: '900', color: '#00e676' }}>{employees.filter(e => e.present).length}</div></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}><Activity size={18} color="#00e676" /><span style={{ fontWeight: '800', fontSize: 13, color: '#00e676' }}>PROD</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div onClick={() => setShowProdDetail('day')} style={S.statBox}><div>BUGUN</div><b>{getStatsByPeriod('day').pieces}</b></div>
                    <div onClick={() => setShowProdDetail('week')} style={S.statBox}><div>HAFTA</div><b>{getStatsByPeriod('week').pieces}</b></div>
                    <div onClick={() => setShowProdDetail('month')} style={S.statBox}><div>OY</div><b>{getStatsByPeriod('month').pieces}</b></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}><Calendar size={18} color="#FFD700" /><span style={{ fontWeight: '800', fontSize: 13, color: '#FFD700' }}>REJA</span></div>
                {orders.slice(0, 2).map((o, i) => (<div key={i} style={{ fontSize: 13, marginBottom: 5 }}>• {o.customer_name} ({o.total_quantity} dona)</div>))}
            </div>
        </div>
    );

    function processScan(t) {
        let id = t.replace('NETO-', '').replace('ROLL-', '');
        const r = rolls.find(x => String(x.id) === String(id));
        if (r) setActiveRoll(r);
    }
}
