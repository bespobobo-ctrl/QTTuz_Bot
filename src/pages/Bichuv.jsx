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
    ArrowRight, Save, Plus, Minus, Users, Briefcase, Calendar, Box, ShoppingBag
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function BichuvPanel({ tab, data, load, showMsg }) {
    const [activeRoll, setActiveRoll] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerRef] = useState({ current: null });

    // Ombor & Cart State
    const [omborCategory, setOmborCategory] = useState('mato');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);

    // Production Stats Modal
    const [showProdDetail, setShowProdDetail] = useState(null);

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
        input: { width: '100%', padding: '15px 20px', background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', marginBottom: 10, outline: 'none' },
        btn: { width: '100%', padding: 15, borderRadius: 16, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' },
        badge: (c) => ({ padding: '5px 12px', background: `${c}20`, color: c, borderRadius: 10, fontSize: 11, fontWeight: '800', letterSpacing: '0.5px' }),
        glass: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 20, padding: 15, border: '1px solid rgba(255,255,255,0.05)' },
        statBox: { flex: 1, padding: 15, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' },
        toggle: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 5, marginBottom: 20 }
    };

    const rolls = data.whRolls || [];
    const orders = data.whOrders || [];
    const accessories = data.accessories || [];
    const logs = data.whLog || [];

    const isOrderTime = () => {
        const now = new Date();
        const t = now.getHours() * 60 + now.getMinutes();
        return (t >= 7.5 * 60 && t <= 11 * 60) || (t >= 17.5 * 60 && t <= 18.5 * 60);
    };

    const addToCart = (item) => {
        setCart(prev => {
            const exist = prev.find(x => x.id === item.id);
            if (exist) return prev.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x);
            return [...prev, { ...item, qty: 1 }];
        });
        showMsg(`${item.name} savatga qo'shildi!`);
    };

    const handlePlaceAccOrder = async () => {
        if (!isOrderTime()) return alert("Hozir buyurtma berish vaqti emas!");
        if (cart.length === 0) return;
        setIsSaving(true);
        try {
            await supabase.from('warehouse_orders').insert({
                customer_name: 'BICHUV BO\'LIMI',
                fabric_type: 'AKSESUVAR',
                total_quantity: cart.reduce((s, x) => s + x.qty, 0),
                status: 'PENDING',
                details: JSON.stringify(cart)
            });
            showMsg('Buyurtma yuborildi! 📦');
            setCart([]); setShowCart(false); load(true);
        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
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

    // --- RENDER HELPERS ---

    const renderProductionDetail = () => {
        if (!showProdDetail) return null;
        const s = getStatsByPeriod(showProdDetail);
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 10000, padding: 20, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
                    <button onClick={() => setShowProdDetail(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                    <h2 style={{ margin: 0 }}>{showProdDetail === 'day' ? 'Kunlik' : 'Periodik'} Hisobot</h2>
                    <div style={{ width: 24 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 25 }}>
                    <div style={S.glass}><div>DONA</div><div style={{ fontSize: 20, fontWeight: '900' }}>{s.pieces} ta</div></div>
                    <div style={S.glass}><div>VAZN</div><div style={{ fontSize: 20, fontWeight: '900' }}>{s.kg.toFixed(1)} kg</div></div>
                </div>
                {s.items.map((l, i) => (
                    <div key={i} style={S.card}><b>{l.item_name}</b><div style={{ fontSize: 12, opacity: 0.7 }}>{l.quantity} kg • {l.notes}</div></div>
                ))}
            </motion.div>
        );
    };

    const renderCart = () => (
        <AnimatePresence>
            {showCart && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 11000, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ ...S.card, width: '100%', maxWidth: 420, background: '#12121e' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                            <h2 style={{ margin: 0 }}>Savat 🛒</h2>
                            <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                        </div>
                        {cart.length === 0 ? <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Savat bo'sh</div> : (
                            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {cart.map(x => (
                                    <div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 15 }}>
                                        <div><div style={{ fontWeight: 'bold' }}>{x.name}</div><div style={{ fontSize: 11, opacity: 0.5 }}>{x.unit}</div></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <button style={{ width: 28, height: 28, borderRadius: 8, background: '#333', border: 'none', color: '#fff' }} onClick={() => setCart(cart.map(i => i.id === x.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}>-</button>
                                            <b style={{ minWidth: 25, textAlign: 'center' }}>{x.qty}</b>
                                            <button style={{ width: 28, height: 28, borderRadius: 8, background: '#333', border: 'none', color: '#fff' }} onClick={() => setCart(cart.map(i => i.id === x.id ? { ...i, qty: i.qty + 1 } : i))}>+</button>
                                            <button style={{ marginLeft: 10, color: '#ff5252', background: 'none', border: 'none' }} onClick={() => setCart(cart.filter(i => i.id !== x.id))}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                <div style={{ marginTop: 25, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
                                    <button disabled={!isOrderTime() || isSaving} onClick={handlePlaceAccOrder} style={{ ...S.btn, background: isOrderTime() ? '#F06292' : '#333', color: '#fff' }}>
                                        {isOrderTime() ? 'BUYURTMANI TASDIQLASH' : 'HOZIR YOPIQ'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // --- MAIN RENDER LOGIC ---

    if (selectedGroup && tab === 'ombor') {
        return (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: 20 }}>
                <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', color: '#fff', marginBottom: 20 }}><ArrowLeft /></button>
                <div style={{ ...S.card, borderLeft: `8px solid ${selectedGroup.allReady ? '#00e676' : '#ff9800'}` }}>
                    <h1 style={{ margin: 0 }}>{selectedGroup.name}</h1>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <div style={S.badge('#F06292')}>{selectedGroup.color}</div>
                        <div style={S.badge('#00e676')}>{selectedGroup.totalNeto.toFixed(1)} kg</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
                        <div style={S.glass}><div>ENI</div><b>{selectedGroup.avgEn.toFixed(1)} sm</b></div>
                        <div style={S.glass}><div>DEFECT</div><b>{selectedGroup.avgDefects.toFixed(1)} ta</b></div>
                    </div>
                </div>
                <h3 style={{ fontSize: 16, margin: '25px 0 15px 5px' }}>Rulonlar</h3>
                {selectedGroup.rolls.map(r => (
                    <div key={r.id} onClick={() => setActiveRoll(r)} style={{ ...S.card, padding: 15, display: 'flex', justifyContent: 'space-between' }}>
                        <div>Rulon #{r.id} | {r.neto} kg</div>
                        <ChevronRight size={18} />
                    </div>
                ))}
                {activeRoll && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 12000, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={S.card}>
                            <h2>Bichish: #{activeRoll.id}</h2>
                            <input style={S.input} placeholder="Model" value={nastilForm.models[0] || ''} onChange={e => setNastilForm({ ...nastilForm, models: [e.target.value] })} />
                            <input style={S.input} type="number" placeholder="Dona" value={nastilForm.piecesPerLayer} onChange={e => setNastilForm({ ...nastilForm, piecesPerLayer: e.target.value })} />
                            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                                <button onClick={() => setActiveRoll(null)} style={{ ...S.btn, background: '#333', color: '#fff', flex: 1 }}>BEKOR</button>
                                <button onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        await supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', activeRoll.id);
                                        await supabase.from('warehouse_log').insert({ item_name: `BICHUV: ${activeRoll.fabric_name}`, quantity: activeRoll.neto, action_type: 'BICHUV', notes: `Model: ${nastilForm.models[0]}, Dona: ${nastilForm.piecesPerLayer}` });
                                        showMsg('Tayyor!'); setActiveRoll(null); setSelectedGroup(null); load(true);
                                    } catch (e) { alert(e.message); } finally { setIsSaving(false); }
                                }} style={{ ...S.btn, background: '#F06292', color: '#fff', flex: 1 }}>OK</button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        );
    }

    if (tab === 'ombor') {
        return (
            <div style={{ padding: '20px 20px 100px 20px', minHeight: '100vh', background: '#0a0a14' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: '900' }}>Ombor 📦</h2>
                    {omborCategory === 'aksesuvar' && (
                        <button onClick={() => setShowCart(true)} style={{ position: 'relative', background: cart.length > 0 ? '#F06292' : 'rgba(255,255,255,0.05)', border: 'none', padding: 12, borderRadius: 15, color: '#fff' }}>
                            <ShoppingBag size={22} />
                            {cart.length > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: '#fff', color: '#F06292', width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.length}</span>}
                        </button>
                    )}
                </div>

                <div style={S.toggle}>
                    <button onClick={() => setOmborCategory('mato')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'mato' ? '#F06292' : 'none', color: '#fff', fontWeight: 'bold', transition: '0.3s' }}>MATO</button>
                    <button onClick={() => setOmborCategory('aksesuvar')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'aksesuvar' ? '#BA68C8' : 'none', color: '#fff', fontWeight: 'bold', transition: '0.3s' }}>AKSESUVAR</button>
                </div>

                {omborCategory === 'mato' ? (
                    <div>
                        {fabricList.map(f => (
                            <div key={f.id} onClick={() => setSelectedGroup(f)} style={{ ...S.card, borderLeft: `6px solid ${f.allReady ? '#00e676' : '#ff9800'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: 18 }}>{f.name}</div>
                                        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{f.color} • {f.totalNeto.toFixed(0)} kg</div>
                                    </div>
                                    <ChevronRight size={18} color="#444" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        {accessories.map(a => (
                            <div key={a.id} style={S.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{a.name}</div>
                                        <div style={{ fontSize: 11, opacity: 0.5 }}>{a.category} • {a.size || '-'}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 18, fontWeight: '900', color: Number(a.quantity) < 10 ? '#ff5252' : '#00e676' }}>{a.quantity} <small style={{ fontSize: 10 }}>{a.unit}</small></div>
                                        </div>
                                        <button onClick={() => addToCart(a)} style={{ background: '#BA68C8', border: 'none', padding: 10, borderRadius: 12, color: '#fff' }}>
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {renderCart()}
            </div>
        );
    }

    if (tab === 'orders') return (<div style={{ padding: 20 }}><h2>Buyurtmalar</h2> {orders.map(o => (<div key={o.id} style={S.card}>{o.customer_name} ({o.total_quantity} dona)</div>))} </div>);
    if (tab === 'nastil') return (<div style={{ padding: 20 }}><h2>Nastil Wizard</h2> <button style={{ ...S.btn, background: '#F06292', color: '#fff' }} onClick={() => setNastilStep(2)}>BOSHLASH</button> </div>);
    if (tab === 'scan') return (<div style={{ padding: 20 }}><div id="bichuv-reader" style={{ borderRadius: 20, overflow: 'hidden' }}></div><button style={{ ...S.btn, background: '#F06292', color: '#fff', marginTop: 20 }}>SKANER</button></div>);
    if (tab === 'history') return (<div style={{ padding: 20 }}><h2>Tarix</h2> {cutRolls.slice(0, 20).map(r => (<div key={r.id} style={S.card}>{r.fabric_name} • {r.neto} kg</div>))} </div>);

    // --- DASHBOARD (ASOSIY) ---
    return (
        <div style={{ padding: '20px 20px 120px 20px' }}>
            {renderProductionDetail()}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: '900' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h1>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Premium Boshqaruv Paneli</div>
                </div>
                <div style={{ background: 'rgba(240, 98, 146, 0.1)', padding: 12, borderRadius: 18 }}><Scissors color="#F06292" size={24} /></div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><Users size={18} color="#4FC3F7" /><span style={{ fontWeight: '800', fontSize: 13, color: '#4FC3F7' }}>XODIMLAR</span></div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={S.statBox}><div>JAMI</div><div style={{ fontSize: 24, fontWeight: '900' }}>{employees.length}</div></div>
                    <div style={{ ...S.statBox, background: 'rgba(0, 230, 118, 0.05)' }}><div>KELGAN</div><div style={{ fontSize: 24, fontWeight: '900', color: '#00e676' }}>{employees.filter(e => e.present).length}</div></div>
                    <div style={{ ...S.statBox, background: 'rgba(255, 82, 82, 0.05)' }}><div>KELMAGAN</div><div style={{ fontSize: 24, fontWeight: '900', color: '#ff5252' }}>{employees.filter(e => !e.present).length}</div></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><Activity size={18} color="#00e676" /><span style={{ fontWeight: '800', fontSize: 13, color: '#00e676' }}>UNUMDORLIK</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div onClick={() => setShowProdDetail('day')} style={{ ...S.statBox, cursor: 'pointer' }}><div>BUGUN</div><div style={{ fontSize: 18, fontWeight: '900' }}>{getStatsByPeriod('day').pieces} <small>ta</small></div></div>
                    <div onClick={() => setShowProdDetail('week')} style={{ ...S.statBox, cursor: 'pointer' }}><div>HAFTA</div><div style={{ fontSize: 18, fontWeight: '900' }}>{getStatsByPeriod('week').pieces} <small>ta</small></div></div>
                    <div onClick={() => setShowProdDetail('month')} style={{ ...S.statBox, cursor: 'pointer' }}><div>OY</div><div style={{ fontSize: 18, fontWeight: '900' }}>{getStatsByPeriod('month').pieces} <small>ta</small></div></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><Calendar size={18} color="#FFD700" /><span style={{ fontWeight: '800', fontSize: 13, color: '#FFD700' }}>STRATEGIK REJA</span></div>
                <div style={{ background: 'rgba(255, 215, 0, 0.05)', padding: 15, borderRadius: 18 }}>
                    {orders.slice(0, 2).map((o, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD700' }} />
                            <span>{o.customer_name} — {o.total_quantity} ta</span>
                        </div>
                    ))}
                    <div style={{ fontSize: 11, color: '#888', marginTop: 10, borderTop: '1px solid rgba(255,215,0,0.1)', paddingTop: 10 }}>Navbatdagi ishlar tayyor! 🚀</div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><ShoppingBag size={18} color="#BA68C8" /><span style={{ fontWeight: '800', fontSize: 13, color: '#BA68C8' }}>AKSESUVAR BUYURTMASI</span></div>
                    <div style={S.badge(isOrderTime() ? '#00e676' : '#ff5252')}>{isOrderTime() ? 'OCHIQ' : 'YOPIQ'}</div>
                </div>
            </div>
        </div>
    );

    function processScan(t) {
        let id = t.replace('NETO-', '').replace('ROLL-', '');
        const r = rolls.find(x => String(x.id) === String(id));
        if (r) setActiveRoll(r);
    }
}
