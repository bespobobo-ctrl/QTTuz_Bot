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
    ArrowRight, Save, Plus, Minus, Users, Briefcase, Calendar, Box, ShoppingBag, Database,
    Timer, Truck, Sparkles
} from 'lucide-react';

export default function BichuvPanel({ tab, data, load, showMsg }) {
    // States
    const [activeRoll, setActiveRoll] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [omborCategory, setOmborCategory] = useState('mato');
    const [matoSubTab, setMatoSubTab] = useState('neto');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);

    const [cutForm, setCutForm] = useState({ model: '', pieces: '' });
    const [showProdDetail, setShowProdDetail] = useState(null);

    const [employees] = useState([
        { id: 1, name: 'Anvar', present: true },
        { id: 2, name: 'Sardor', present: true },
        { id: 3, name: 'Malika', present: false },
        { id: 4, name: 'Javohir', present: true },
        { id: 5, name: 'Olim', present: true }
    ]);

    const S = {
        card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)', padding: 20, borderRadius: 28, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 15 },
        input: { width: '100%', padding: '16px 20px', background: '#121225', border: '1px solid #2a2a45', borderRadius: 16, color: '#fff', marginBottom: 12, outline: 'none', boxSizing: 'border-box', fontSize: 16 },
        btn: { width: '100%', padding: 18, borderRadius: 20, border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: '0.3s' },
        badge: (c) => ({ padding: '6px 12px', background: `${c}15`, color: c, borderRadius: 12, fontSize: 11, fontWeight: '800' }),
        glass: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 22, padding: 18, border: '1px solid rgba(255,255,255,0.05)' },
        statBox: { flex: 1, padding: 15, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' },
        toggle: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 5, marginBottom: 20 }
    };

    const rolls = data.whRolls || [];
    const orders = data.whOrders || [];
    const accessories = data.accessories || [];
    const logs = data.whLog || [];

    const brutoRolls = rolls.filter(r => r.status === 'BRUTO');
    const netoRolls = rolls.filter(r => r.status === 'KONTROLDAN_OTDI');
    const totalBrutoKg = brutoRolls.reduce((s, r) => s + (Number(r.bruto) || 0), 0);
    const totalNetoKg = netoRolls.reduce((s, r) => s + (Number(r.neto) || 0), 0);

    const isOrderTime = () => {
        const now = new Date();
        const t = now.getHours() * 60 + now.getMinutes();
        return (t >= 7.5 * 60 && t <= 11 * 60) || (t >= 17.5 * 60 && t <= 18.5 * 60);
    };

    const addToCart = (item) => {
        const exist = cart.find(x => x.id === item.id);
        if (exist) setCart(cart.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
        else setCart([...cart, { ...item, qty: 1 }]);
        if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        showMsg(`${item.name} +1`, 'success');
    };

    const groupFabrics = (list, weightField) => {
        return Object.values(list.reduce((acc, r) => {
            const key = `${r.fabric_name}_${r.color}_${r.gramaj}`;
            if (!acc[key]) acc[key] = { id: key, name: r.fabric_name, color: r.color, gramaj: r.gramaj, rolls: [] };
            acc[key].rolls.push(r);
            return acc;
        }, {})).map(g => {
            const totalWeight = g.rolls.reduce((s, r) => s + (Number(r[weightField]) || 0), 0);
            const readyRolls = g.rolls.filter(r => {
                if (!r.neto_date) return false;
                return (new Date() - new Date(r.neto_date)) / (1000 * 60 * 60) >= 48;
            });
            return { ...g, totalWeight, allReady: readyRolls.length === g.rolls.length };
        });
    };

    const getStatsByPeriod = (period) => {
        const now = new Date();
        const filtered = logs.filter(l => {
            if (l.action_type !== 'BICHUV' && l.action_type !== 'NASTIL') return false;
            const date = new Date(l.created_at || l.neto_date);
            if (period === 'day') return date.toDateString() === now.toDateString();
            if (period === 'week') return (now - date) / (1000 * 60 * 60 * 24) <= 7;
            if (period === 'month') return (now - date) / (1000 * 60 * 60 * 24) <= 30;
            return true;
        });
        const kg = filtered.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
        let pieces = 0;
        filtered.forEach(l => {
            try { pieces += Number(l.notes?.match(/Dona: (\d+)/)?.[1] || 0); } catch (e) { }
        });
        return { pieces, kg, items: filtered };
    };

    // --- RENDERS ---

    const renderMatoList = () => {
        const list = matoSubTab === 'neto' ? netoRolls : brutoRolls;
        const groups = groupFabrics(list, matoSubTab === 'neto' ? 'neto' : 'bruto');
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 25 }}>
                    <div onClick={() => setMatoSubTab('bruto')} style={{ ...S.card, marginBottom: 0, border: matoSubTab === 'bruto' ? '2.5px solid #BA68C8' : '1px solid rgba(255,255,255,0.05)', background: matoSubTab === 'bruto' ? 'rgba(186,104,200,0.1)' : 'none' }}>
                        <div style={{ fontSize: 10, color: '#BA68C8', fontWeight: '800' }}>BRUTO</div>
                        <div style={{ fontSize: 24, fontWeight: '1000' }}>{totalBrutoKg.toFixed(0)}</div>
                    </div>
                    <div onClick={() => setMatoSubTab('neto')} style={{ ...S.card, marginBottom: 0, border: matoSubTab === 'neto' ? '2.5px solid #00e676' : '1px solid rgba(255,255,255,0.05)', background: matoSubTab === 'neto' ? 'rgba(0,230,118,0.1)' : 'none' }}>
                        <div style={{ fontSize: 10, color: '#00e676', fontWeight: '800' }}>NETO</div>
                        <div style={{ fontSize: 24, fontWeight: '1000', color: '#00e676' }}>{totalNetoKg.toFixed(0)}</div>
                    </div>
                </div>
                {groups.map(g => (
                    <div key={g.id} onClick={() => setSelectedGroup({ ...g, category: matoSubTab })} style={{ ...S.card, borderLeft: `6px solid ${matoSubTab === 'neto' ? (g.allReady ? '#00e676' : '#FFAB40') : '#BA68C8'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><div style={{ fontWeight: '900', fontSize: 18 }}>{g.name}</div><div style={{ color: '#888', fontSize: 12 }}>{g.color} • {g.rolls.length} ta</div></div>
                            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 20, fontWeight: '1000', color: matoSubTab === 'neto' ? '#00e676' : '#fff' }}>{g.totalWeight.toFixed(1)} <small>kg</small></div></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderAccList = () => (
        <div style={{ paddingBottom: 100 }}>
            {accessories.filter(a => a.target_dept === 'Bichuv bo\'limi').map(a => (
                <div key={a.id} style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontWeight: '900', fontSize: 17 }}>{a.name}</div><div style={{ fontSize: 11, opacity: 0.5 }}>{a.category}</div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <b>{a.quantity} {a.unit}</b>
                            <button onClick={() => addToCart(a)} style={{ width: 45, height: 45, borderRadius: 14, background: '#BA68C8', border: 'none', color: '#fff' }}><Plus /></button>
                        </div>
                    </div>
                </div>
            ))}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setShowCart(true)} style={{ position: 'fixed', bottom: 100, right: 25, width: 70, height: 70, borderRadius: '50%', background: '#E91E63', border: 'none', color: '#fff', zIndex: 10000, boxShadow: '0 10px 30px rgba(233,30,99,0.3)' }}>
                        <ShoppingCart size={28} />
                        <span style={{ position: 'absolute', top: 0, right: 0, background: '#fff', color: '#E91E63', width: 25, height: 25, borderRadius: '50%', fontWeight: 'bold' }}>{cart.length}</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );

    const renderCartOverlay = () => (
        <AnimatePresence>
            {showCart && (
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 20000, padding: 25, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                        <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                        <h2 style={{ margin: 0 }}>Savat ({cart.length})</h2>
                        <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', color: '#ff5252' }}>Tozalash</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {cart.map(it => (
                            <div key={it.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><b>{it.name}</b><div style={{ fontSize: 12, opacity: 0.5 }}>{it.qty} {it.unit}</div></div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => setCart(cart.map(x => x.id === it.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} style={{ width: 35, height: 35, background: '#333', border: 'none', color: '#fff', borderRadius: 8 }}>-</button>
                                    <button onClick={() => setCart(cart.map(x => x.id === it.id ? { ...x, qty: x.qty + 1 } : x))} style={{ width: 35, height: 35, background: '#00e676', border: 'none', color: '#fff', borderRadius: 8 }}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 20 }}>
                        <button
                            disabled={!isOrderTime() || cart.length === 0}
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    await supabase.from('warehouse_orders').insert({ customer_name: 'BICHUV', fabric_type: 'AKSESUVAR', total_quantity: cart.reduce((s, x) => s + x.qty, 0), status: 'PENDING', details: JSON.stringify(cart) });
                                    showMsg('Yuborildi!'); setCart([]); setShowCart(false);
                                } catch (e) { alert(e.message); } finally { setIsSaving(false); }
                            }}
                            style={{ ...S.btn, background: isOrderTime() ? '#E91E63' : '#222', color: '#fff' }}>BUYURTMANI TASDIQLASH</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // --- MAIN ---

    if (tab === 'ombor') {
        return (
            <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: '1000' }}>Ombor 🏢</h2>
                </div>
                <div style={S.toggle}>
                    <button onClick={() => setOmborCategory('mato')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'mato' ? '#F06292' : 'none', color: '#fff', fontWeight: 'bold' }}>MATOLAR</button>
                    <button onClick={() => setOmborCategory('aksesuvar')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'aksesuvar' ? '#BA68C8' : 'none', color: '#fff', fontWeight: 'bold' }}>AKSESUAR</button>
                </div>

                {omborCategory === 'mato' ? renderMatoList() : renderAccList()}
                {renderCartOverlay()}

                {/* Group Detail */}
                <AnimatePresence>
                    {selectedGroup && (
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 15000, padding: 25, overflowY: 'auto' }}>
                            <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', color: '#fff', marginBottom: 25 }}><ArrowLeft /></button>
                            <h1 style={{ fontSize: 32, fontWeight: '1000' }}>{selectedGroup.name}</h1>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
                                <div style={S.badge(selectedGroup.category === 'neto' ? '#00e676' : '#BA68C8')}>{selectedGroup.category.toUpperCase()}</div>
                                <div style={S.badge('#F06292')}>{selectedGroup.color}</div>
                            </div>
                            {selectedGroup.rolls.map(r => (
                                <div key={r.id} onClick={() => selectedGroup.category === 'neto' && setActiveRoll(r)} style={{ ...S.card, display: 'flex', justifyContent: 'space-between' }}>
                                    <div><b>#{r.id}</b> | {selectedGroup.category === 'neto' ? r.neto : r.bruto} kg</div>
                                    {selectedGroup.category === 'neto' && <ChevronRight />}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cutting Modal */}
                <AnimatePresence>
                    {activeRoll && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 16000, padding: 25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ ...S.card, width: '100%', maxWidth: 400, background: '#12121e' }}>
                                <h2 style={{ marginBottom: 20 }}>Bichish: {activeRoll.fabric_name}</h2>
                                <input style={S.input} placeholder="Model nomi" onChange={e => setCutForm({ ...cutForm, model: e.target.value })} />
                                <input style={S.input} type="number" placeholder="Dona soni" onChange={e => setCutForm({ ...cutForm, pieces: e.target.value })} />
                                <button onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        await supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', activeRoll.id);
                                        await supabase.from('warehouse_log').insert({ item_name: `BICHUV: ${activeRoll.fabric_name}`, quantity: activeRoll.neto, action_type: 'BICHUV', notes: `Model: ${cutForm.model}, Dona: ${cutForm.pieces}` });
                                        showMsg('Bajarildi!'); setActiveRoll(null); setSelectedGroup(null); load(true);
                                    } catch (e) { alert(e.message); } finally { setIsSaving(false); }
                                }} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>BICHISH</button>
                                <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#888', marginTop: 15, width: '100%' }}>BEKOR</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // DASHBOARD
    const dStats = getStatsByPeriod('day');
    const wStats = getStatsByPeriod('week');
    const mStats = getStatsByPeriod('month');

    return (
        <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: '1000' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h1>
                <Scissors color="#F06292" size={28} />
            </div>

            <div style={S.card}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                    <div style={S.statBox}><div style={{ fontSize: 10, color: '#BA68C8' }}>BRUTO</div><div style={{ fontSize: 24, fontWeight: '1000' }}>{totalBrutoKg.toFixed(0)}</div></div>
                    <div style={{ ...S.statBox, background: 'rgba(0, 230, 118, 0.05)' }}><div style={{ fontSize: 10, color: '#00e676' }}>NETO</div><div style={{ fontSize: 24, fontWeight: '1000', color: '#00e676' }}>{totalNetoKg.toFixed(0)}</div></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}><Users size={18} color="#4FC3F7" /><b>XODIMLAR: {employees.filter(e => e.present).length}/{employees.length}</b></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div style={S.statBox} onClick={() => setShowProdDetail('day')}><div>BUGUN</div><b>{dStats.pieces}</b></div>
                    <div style={S.statBox} onClick={() => setShowProdDetail('week')}><div>HAFTA</div><b>{wStats.pieces}</b></div>
                    <div style={S.statBox} onClick={() => setShowProdDetail('month')}><div>OY</div><b>{mStats.pieces}</b></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}><Calendar size={18} color="#FFD700" /><b>NAVIBATDAGI REJA</b></div>
                {orders.slice(0, 1).map((o, i) => (<div key={i} style={{ fontSize: 13 }}>• {o.customer_name} ({o.total_quantity})</div>))}
            </div>

            <AnimatePresence>
                {showProdDetail && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 18000, padding: 25, overflowY: 'auto' }}>
                        <button onClick={() => setShowProdDetail(null)} style={{ background: 'none', border: 'none', color: '#fff', marginBottom: 25 }}><ArrowLeft /></button>
                        <h2 style={{ fontSize: 24, fontWeight: '900', marginBottom: 30 }}>Batafsil Hisobot</h2>
                        {getStatsByPeriod(showProdDetail).items.map((l, i) => (
                            <div key={i} style={S.card}><b>{l.item_name}</b><div>{l.quantity} kg • {l.notes}</div></div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
