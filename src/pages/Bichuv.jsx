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
    ArrowRight, Save, Plus, Minus, Users, Briefcase, Calendar, Box, ShoppingBag, Database
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function BichuvPanel({ tab, data, load, showMsg }) {
    // States for various actions
    const [activeRoll, setActiveRoll] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerRef] = useState({ current: null });

    // Ombor & Cart State
    const [omborCategory, setOmborCategory] = useState('mato');
    const [matoSubTab, setMatoSubTab] = useState('neto');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);

    // Form States
    const [cutForm, setCutForm] = useState({ model: '', pieces: '' });
    const [nastilForm, setNastilForm] = useState({ length: '', layers: '', piecesPerLayer: '', waste: '0', models: [] });

    // Stats Modal State
    const [showProdDetail, setShowProdDetail] = useState(null);

    // Mock HR (until table created)
    const [employees] = useState([
        { id: 1, name: 'Anvar', present: true },
        { id: 2, name: 'Sardor', present: true },
        { id: 3, name: 'Malika', present: false },
        { id: 4, name: 'Javohir', present: true },
        { id: 5, name: 'Olim', present: true }
    ]);

    useEffect(() => {
        if (scannerRef.current) { try { scannerRef.current.stop().catch(() => { }); } catch (e) { } scannerRef.current = null; setScannerActive(false); }
    }, [tab]);

    const S = {
        card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', padding: 20, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 15 },
        input: { width: '100%', padding: '15px 20px', background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
        btn: { width: '100%', padding: 15, borderRadius: 16, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' },
        badge: (c) => ({ padding: '5px 12px', background: `${c}20`, color: c, borderRadius: 10, fontSize: 11, fontWeight: '800' }),
        glass: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 20, padding: 15, border: '1px solid rgba(255,255,255,0.05)' },
        statBox: { flex: 1, padding: 15, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' },
        toggle: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 5, marginBottom: 20 }
    };

    const rolls = data.whRolls || [];
    const orders = data.whOrders || [];
    const accessories = data.accessories || [];
    const logs = data.whLog || [];

    const brutoRolls = rolls.filter(r => r.status === 'BRUTO');
    const netoRolls = rolls.filter(r => r.status === 'KONTROLDAN_OTDI');
    const cutRolls = rolls.filter(r => r.status === 'BICHILDI');

    const totalBrutoKg = brutoRolls.reduce((s, r) => s + (Number(r.bruto) || 0), 0);
    const totalNetoKg = netoRolls.reduce((s, r) => s + (Number(r.neto) || 0), 0);

    const getIsReady = (roll) => {
        if (!roll.neto_date) return false;
        const diffMs = new Date() - new Date(roll.neto_date);
        return Math.floor(diffMs / (1000 * 60 * 60)) >= 48;
    };

    const groupFabrics = (list, weightField) => {
        return Object.values(list.reduce((acc, r) => {
            const key = `${r.fabric_name}_${r.color}_${r.gramaj}`;
            if (!acc[key]) acc[key] = { id: key, name: r.fabric_name, color: r.color, gramaj: r.gramaj, rolls: [] };
            acc[key].rolls.push(r);
            return acc;
        }, {})).map(g => {
            const totalWeight = g.rolls.reduce((s, r) => s + (Number(r[weightField]) || 0), 0);
            const avgEn = g.rolls.reduce((s, r) => s + (Number(r.en) || 0), 0) / g.rolls.length;
            const readyCount = g.rolls.filter(getIsReady).length;
            return { ...g, totalWeight, avgEn, readyCount, allReady: readyCount === g.rolls.length };
        });
    };

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

    const isOrderTime = () => {
        const now = new Date();
        const t = now.getHours() * 60 + now.getMinutes();
        return (t >= 7.5 * 60 && t <= 11 * 60) || (t >= 17.5 * 60 && t <= 18.5 * 60);
    };

    const addToCart = (item) => {
        const exist = cart.find(x => x.id === item.id);
        if (exist) setCart(cart.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
        else setCart([...cart, { ...item, qty: 1 }]);
        showMsg(`${item.name} qo'shildi`);
    };

    // --- RENDER FUNCTIONS ---

    const renderMatoOmbor = () => {
        const groups = matoSubTab === 'neto' ? groupFabrics(netoRolls, 'neto') : groupFabrics(brutoRolls, 'bruto');
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 25 }}>
                    <div onClick={() => setMatoSubTab('bruto')} style={{ ...S.card, marginBottom: 0, border: matoSubTab === 'bruto' ? '2px solid #BA68C8' : '1px solid rgba(255,255,255,0.05)', background: matoSubTab === 'bruto' ? 'rgba(186,104,200,0.1)' : 'none' }}>
                        <div style={{ fontSize: 10, color: '#BA68C8' }}>BRUTO</div>
                        <div style={{ fontSize: 24, fontWeight: '900' }}>{totalBrutoKg.toFixed(0)} <small>kg</small></div>
                    </div>
                    <div onClick={() => setMatoSubTab('neto')} style={{ ...S.card, marginBottom: 0, border: matoSubTab === 'neto' ? '2px solid #00e676' : '1px solid rgba(255,255,255,0.05)', background: matoSubTab === 'neto' ? 'rgba(0,230,118,0.1)' : 'none' }}>
                        <div style={{ fontSize: 10, color: '#00e676' }}>NETO</div>
                        <div style={{ fontSize: 24, fontWeight: '900' }}>{totalNetoKg.toFixed(0)} <small>kg</small></div>
                    </div>
                </div>
                {groups.map(g => (
                    <div key={g.id} onClick={() => setSelectedGroup({ ...g, category: matoSubTab })} style={{ ...S.card, borderLeft: `6px solid ${matoSubTab === 'neto' ? (g.allReady ? '#00e676' : '#FFAB40') : '#BA68C8'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: 18 }}>{g.name}</div>
                                <div style={{ fontSize: 12, color: '#888' }}>{g.color} • {g.rolls.length} ta</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 20, fontWeight: '900' }}>{g.totalWeight.toFixed(1)} <small>kg</small></div>
                                {matoSubTab === 'neto' && <div style={{ fontSize: 10, color: g.allReady ? '#00e676' : '#FFAB40' }}>{g.allReady ? 'TAYYOR' : 'DAM'}</div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderAccessories = () => (
        <div>
            {cart.length > 0 && <button onClick={() => setShowCart(true)} style={S.btn}>SAVATNI KO'RISH ({cart.length})</button>}
            <div style={{ marginTop: 20 }}>
                {accessories.filter(a => a.target_dept === 'Bichuv bo\'limi').map(a => (
                    <div key={a.id} style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><div style={{ fontWeight: 'bold' }}>{a.name}</div><div style={{ fontSize: 11, opacity: 0.5 }}>{a.category}</div></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <b>{a.quantity} {a.unit}</b>
                                <button onClick={() => addToCart(a)} style={{ background: '#BA68C8', border: 'none', color: '#fff', borderRadius: 8, padding: 8 }}><Plus size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- MAIN ---

    if (selectedGroup && tab === 'ombor') {
        const isNeto = selectedGroup.category === 'neto';
        return (
            <div style={{ padding: 20 }}>
                <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', color: '#fff', marginBottom: 20 }}><ArrowLeft /></button>
                <div style={S.card}>
                    <h1 style={{ margin: 0 }}>{selectedGroup.name}</h1>
                    <p>{selectedGroup.color} • {selectedGroup.totalWeight.toFixed(1)} kg</p>
                </div>
                {selectedGroup.rolls.map(r => (
                    <div key={r.id} onClick={() => isNeto && setActiveRoll(r)} style={{ ...S.card, display: 'flex', justifyContent: 'space-between' }}>
                        <div>#{r.id} | {isNeto ? r.neto : r.bruto} kg</div>
                        {isNeto && <ChevronRight size={18} />}
                    </div>
                ))}
                {activeRoll && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 12000, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ ...S.card, width: '100%', maxWidth: 400 }}>
                            <h2 style={{ marginBottom: 20 }}>Bichish: {activeRoll.fabric_name}</h2>
                            <input style={S.input} placeholder="Model" value={cutForm.model} onChange={e => setCutForm({ ...cutForm, model: e.target.value })} />
                            <input style={S.input} type="number" placeholder="Dona" value={cutForm.pieces} onChange={e => setCutForm({ ...cutForm, pieces: e.target.value })} />
                            <button onClick={async () => {
                                setIsSaving(true);
                                try {
                                    await supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', activeRoll.id);
                                    await supabase.from('warehouse_log').insert({ item_name: `BICHUV: ${activeRoll.fabric_name}`, quantity: activeRoll.neto, action_type: 'BICHUV', notes: `Model: ${cutForm.model}, Dona: ${cutForm.pieces}` });
                                    showMsg('Bajarildi!'); setActiveRoll(null); setSelectedGroup(null); load(true);
                                } catch (e) { alert(e.message); } finally { setIsSaving(false); }
                            }} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>TASDIQLASH</button>
                            <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#888', marginTop: 15, width: '100%' }}>BEKOR</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (tab === 'ombor') {
        return (
            <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
                <h2 style={{ marginBottom: 25, fontSize: 24, fontWeight: '900' }}>Ombor 🏢</h2>
                <div style={S.toggle}>
                    <button onClick={() => setOmborCategory('mato')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'mato' ? '#F06292' : 'none', color: '#fff', fontWeight: 'bold' }}>MATO</button>
                    <button onClick={() => setOmborCategory('aksesuvar')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'aksesuvar' ? '#BA68C8' : 'none', color: '#fff', fontWeight: 'bold' }}>AKSESUVAR</button>
                </div>
                {omborCategory === 'mato' ? renderMatoOmbor() : renderAccessories()}

                {/* Cart Modal Simple */}
                <AnimatePresence>
                    {showCart && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 11000, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ ...S.card, width: '100%', maxWidth: 400, background: '#12121e' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <h2>Savat 🛒</h2>
                                    <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                                </div>
                                {cart.map(x => (<div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span>{x.name}</span><b>{x.qty} ta</b></div>))}
                                <button disabled={isSaving || !isOrderTime()} onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        await supabase.from('warehouse_orders').insert({ customer_name: 'BICHUV', fabric_type: 'AKSESUVAR', total_quantity: cart.reduce((s, x) => s + x.qty, 0), status: 'PENDING', details: JSON.stringify(cart) });
                                        showMsg('Yuborildi!'); setCart([]); setShowCart(false);
                                    } catch (e) { alert(e.message); } finally { setIsSaving(false); }
                                }} style={{ ...S.btn, background: '#F06292', color: '#fff', marginTop: 20 }}>BUYURTMA BERISH</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // --- DASHBOARD (ASOSIY) ---
    const dayStats = getStatsByPeriod('day');
    const weekStats = getStatsByPeriod('week');
    const monthStats = getStatsByPeriod('month');

    return (
        <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: '900' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h1>
                <Scissors color="#F06292" />
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={S.statBox}>
                        <div style={{ fontSize: 10, color: '#BA68C8' }}>BRUTO</div>
                        <div style={{ fontSize: 22, fontWeight: '900' }}>{totalBrutoKg.toFixed(0)}</div>
                    </div>
                    <div style={{ ...S.statBox, background: 'rgba(0, 230, 118, 0.05)' }}>
                        <div style={{ fontSize: 10, color: '#00e676' }}>NETO</div>
                        <div style={{ fontSize: 22, fontWeight: '900', color: '#00e676' }}>{totalNetoKg.toFixed(0)}</div>
                    </div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}><Users size={16} color="#4FC3F7" /><b>XODIMLAR</b></div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={S.statBox}><div>JAMI</div><b>{employees.length}</b></div>
                    <div style={{ ...S.statBox, background: 'rgba(0,230,118,0.05)' }}><div>KELGAN</div><b style={{ color: '#00e676' }}>{employees.filter(e => e.present).length}</b></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}><Activity size={16} color="#00e676" /><b>UNUMDORLIK</b></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div onClick={() => setShowProdDetail('day')} style={S.statBox}><div>BUGUN</div><b>{dayStats.pieces}</b></div>
                    <div onClick={() => setShowProdDetail('week')} style={S.statBox}><div>HAFTA</div><b>{weekStats.pieces}</b></div>
                    <div onClick={() => setShowProdDetail('month')} style={S.statBox}><div>OY</div><b>{monthStats.pieces}</b></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}><Calendar size={16} color="#FFD700" /><b>REJA</b></div>
                {orders.slice(0, 1).map((o, i) => (<div key={i} style={{ fontSize: 13 }}>• {o.customer_name} ({o.total_quantity})</div>))}
            </div>

            {/* Prod Detail Overlay */}
            <AnimatePresence>
                {showProdDetail && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 13000, padding: 20, overflowY: 'auto' }}>
                        <button onClick={() => setShowProdDetail(null)} style={{ background: 'none', border: 'none', color: '#fff', marginBottom: 20 }}><ArrowLeft /></button>
                        <h2 style={{ marginBottom: 25 }}>{showProdDetail} Hisobot</h2>
                        {getStatsByPeriod(showProdDetail).items.map((l, i) => (
                            <div key={i} style={S.card}><b>{l.item_name}</b><div>{l.quantity} kg • {l.notes}</div></div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    function processScan(t) {
        let id = t.replace('NETO-', '').replace('ROLL-', '');
        const r = rolls.find(x => String(x.id) === String(id));
        if (r) setActiveRoll(r);
    }
}
