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

    // Nastil State
    const [nastilStep, setNastilStep] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedRolls, setSelectedRolls] = useState([]);
    const [nastilForm, setNastilForm] = useState({ length: '', layers: '', piecesPerLayer: '', waste: '0', models: [] });

    const S = {
        card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', padding: 20, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 15 },
        input: { width: '100%', padding: 15, background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', marginBottom: 10, outline: 'none' },
        btn: { width: '100%', padding: 15, borderRadius: 16, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' },
        badge: (c) => ({ padding: '5px 12px', background: `${c}20`, color: c, borderRadius: 10, fontSize: 11, fontWeight: '800', letterSpacing: '0.5px' }),
        glass: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 20, padding: 15, border: '1px solid rgba(255,255,255,0.05)' },
        toggle: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 5, marginBottom: 20 }
    };

    const rolls = data.whRolls || [];
    const orders = data.whOrders || [];
    const accessories = data.accessories || [];

    const isOrderTime = () => {
        const now = new Date();
        const t = now.getHours() * 60 + now.getMinutes();
        return (t >= 7.5 * 60 && t <= 11 * 60) || (t >= 17.5 * 60 && t <= 18.5 * 60);
    };

    const addToCart = (item) => {
        const exist = cart.find(x => x.id === item.id);
        if (exist) {
            setCart(cart.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
        } else {
            setCart([...cart, { ...item, qty: 1 }]);
        }
        showMsg(`${item.name} qo'shildi!`);
    };

    const handlePlaceAccOrder = async () => {
        if (!isOrderTime()) return alert("Hozir buyurtma berish vaqti emas! (v: 07:30-11:00 va 17:30-18:30)");
        if (cart.length === 0) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('warehouse_orders').insert({
                customer_name: 'BICHUV BO\'LIMI',
                fabric_type: 'AKSESUVAR',
                total_quantity: cart.reduce((s, x) => s + x.qty, 0),
                status: 'PENDING',
                details: JSON.stringify(cart),
                created_at: new Date().toISOString()
            });
            if (error) throw error;
            showMsg('Aksesuvar buyurtmasi yuborildi! 📦');
            setCart([]); setShowCart(false); load(true);
        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
    };

    // --- RENDER ---

    const renderCart = () => (
        <AnimatePresence>
            {showCart && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 11000, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ ...S.card, width: '100%', maxWidth: 400, background: '#12121e' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ margin: 0 }}>Savat 🛒</h2>
                            <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                        </div>
                        {cart.length === 0 ? <p style={{ opacity: 0.5, textAlign: 'center' }}>Savat bo'sh</p> : (
                            <div>
                                {cart.map(x => (
                                    <div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{x.name}</div>
                                            <div style={{ fontSize: 11, color: '#888' }}>{x.unit}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <button style={{ background: '#333', border: 'none', color: '#fff', width: 25, height: 25, borderRadius: 5 }} onClick={() => setCart(cart.map(i => i.id === x.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}>-</button>
                                            <b style={{ minWidth: 30, textAlign: 'center' }}>{x.qty}</b>
                                            <button style={{ background: '#333', border: 'none', color: '#fff', width: 25, height: 25, borderRadius: 5 }} onClick={() => setCart(cart.map(i => i.id === x.id ? { ...i, qty: i.qty + 1 } : i))}>+</button>
                                            <button style={{ color: '#ff5252', marginLeft: 10, background: 'none', border: 'none' }} onClick={() => setCart(cart.filter(i => i.id !== x.id))}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                <div style={{ marginTop: 25, borderTop: '1px solid #2a2a40', paddingTop: 15 }}>
                                    {!isOrderTime() && <div style={{ color: '#ff9800', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>⚠️ Hozir buyurtma olish yopiq</div>}
                                    <button disabled={!isOrderTime() || isSaving} onClick={handlePlaceAccOrder} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>BUYURTMA BERISH</button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const renderOmbor = () => (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: '900' }}>Ombor 📦</h2>
                {cart.length > 0 && <button onClick={() => setShowCart(true)} style={{ position: 'relative', background: '#F06292', border: 'none', padding: 10, borderRadius: 12, color: '#fff' }}><ShoppingBag size={20} /><span style={{ position: 'absolute', top: -5, right: -5, background: '#fff', color: '#F06292', width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.length}</span></button>}
            </div>

            <div style={S.toggle}>
                <button onClick={() => setOmborCategory('mato')} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: omborCategory === 'mato' ? '#F06292' : 'none', color: '#fff', fontWeight: 'bold' }}>MATO</button>
                <button onClick={() => setOmborCategory('aksesuvar')} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: omborCategory === 'aksesuvar' ? '#BA68C8' : 'none', color: '#fff', fontWeight: 'bold' }}>AKSESUVAR</button>
            </div>

            {omborCategory === 'mato' ? (
                fabricList.map(f => (
                    <div key={f.id} onClick={() => setSelectedGroup(f)} style={{ ...S.card, borderLeft: `6px solid ${f.allReady ? '#00e676' : '#ff9800'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div><div style={{ fontWeight: 'bold', fontSize: 18 }}>{f.name}</div><div style={{ color: '#888', fontSize: 13 }}>{f.color} • {f.totalNeto.toFixed(0)} kg</div></div>
                            <ChevronRight size={18} color="#555" />
                        </div>
                    </div>
                ))
            ) : (
                accessories.map(a => (
                    <div key={a.id} style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{a.name}</div>
                                <div style={{ fontSize: 11, opacity: 0.6 }}>{a.category} • {a.size || '-'}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 16, fontWeight: 'bold', color: Number(a.quantity) < 10 ? '#ff5252' : '#00e676' }}>{a.quantity} {a.unit}</div>
                                </div>
                                <button onClick={() => addToCart(a)} style={{ background: '#BA68C8', border: 'none', padding: 8, borderRadius: 10, color: '#fff' }}><Plus size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    // Filter dashboard stats logic (reuse from previous push)
    const logs = data.whLog || [];
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

    if (tab === 'ombor') return (<div style={{ position: 'relative' }}>{renderOmbor()}{renderCart()}</div>);
    if (tab === 'orders') return (<div style={{ padding: 20 }}><h2>Buyurtmalar</h2> {orders.map(o => (<div key={o.id} style={S.card}>{o.customer_name} ({o.total_quantity})</div>))} </div>);
    if (tab === 'nastil') return (<div style={{ padding: 20 }}><h2>Nastil</h2> <button style={{ ...S.btn, background: '#F06292', color: '#fff' }} onClick={() => setNastilStep(2)}>BOSHLASH</button> </div>);
    if (tab === 'scan') return (<div style={{ padding: 20 }}><div id="bichuv-reader"></div><button style={{ ...S.btn, background: '#F06292', color: '#fff', marginTop: 20 }}>SKANER</button></div>);
    if (tab === 'history') return (<div style={{ padding: 20 }}><h2>Tarix</h2> {cutRolls.map(r => (<div key={r.id} style={S.card}>{r.fabric_name} • {r.neto}kg</div>))} </div>);

    // Quick Dashboard Render
    return (
        <div style={{ padding: '20px 20px 120px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: '900' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h1>
                <Scissors color="#F06292" />
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}><Activity size={18} color="#00e676" /><span style={{ fontWeight: '800', fontSize: 13, color: '#00e676' }}>LOGISTIKA</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#ccc' }}>Aksesuvar Buyurtmasi:</div>
                    <div style={S.badge(isOrderTime() ? '#00e676' : '#ff5252')}>{isOrderTime() ? 'OCHIQ ✅' : 'YOPIQ ❌'}</div>
                </div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 10 }}>Vaqt: 07:30-11:00 va 17:30-18:30</div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={S.statBox}><div>BUGUN</div><b>{getStatsByPeriod('day').pieces}</b></div>
                    <div style={S.statBox}><div>HAFTA</div><b>{getStatsByPeriod('week').pieces}</b></div>
                </div>
            </div>
        </div>
    );
}
