import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
    ShoppingCart, ShoppingBag, TrendingUp, History, Package, Search, Plus, Filter,
    ChevronRight, ArrowLeft, X, CheckCircle2, Clock, MapPin, User, Phone,
    FileText, Tag, BarChart3, PieChart, Activity, RefreshCcw, DollarSign,
    Box, Truck, ClipboardList, Briefcase, Zap, Star
} from 'lucide-react';

export default function SotuvPanel({ tab, data, load, showMsg }) {
    // States
    const [isSaving, setIsSaving] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderForm, setOrderForm] = useState({
        customer: '',
        phone: '',
        model: '',
        color: '',
        qty: '',
        deadline: '',
        notes: ''
    });

    const S = {
        card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)', padding: 22, borderRadius: 30, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 15 },
        input: { width: '100%', padding: '16px 20px', background: '#121225', border: '1px solid #2a2a45', borderRadius: 16, color: '#fff', marginBottom: 15, outline: 'none' },
        btn: { width: '100%', padding: 18, borderRadius: 20, border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: '0.3s' },
        badge: (c) => ({ padding: '6px 12px', background: `${c}20`, color: c, borderRadius: 12, fontSize: 11, fontWeight: '800' }),
        statCard: (color) => ({ flex: 1, padding: 20, borderRadius: 24, background: `${color}10`, border: `1px solid ${color}20` }),
        floatingBtn: { position: 'fixed', bottom: 100, right: 25, width: 65, height: 65, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7043, #F4511E)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(244, 81, 30, 0.4)', zIndex: 1000 }
    };

    const orders = data.whOrders || [];
    const products = data.whRolls.filter(r => r.status === 'BICHILDI' || r.status === 'READY'); // Example mapping

    const handleCreateOrder = async () => {
        if (!orderForm.customer || !orderForm.model) return showMsg("Ma'lumotlarni to'ldiring", "err");
        setIsSaving(true);
        try {
            await supabase.from('warehouse_orders').insert({
                customer_name: orderForm.customer,
                fabric_type: orderForm.model,
                total_quantity: Number(orderForm.qty),
                status: 'PENDING',
                details: JSON.stringify(orderForm)
            });
            showMsg("Zakaz muvaffaqiyatli qabul qilindi! 🚀");
            setShowOrderModal(false);
            setOrderForm({ customer: '', phone: '', model: '', color: '', qty: '', deadline: '', notes: '' });
            load(true);
        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
    };

    // --- SUB-PANELS ---

    const renderDashboard = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: '1000' }}>Sotuv <span style={{ color: '#FF7043' }}>Hub</span></h1>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Boshqaruv va Kpi nazorati</div>
                </div>
                <div style={{ background: 'rgba(255, 112, 67, 0.1)', padding: 14, borderRadius: 20 }}><TrendingUp color="#FF7043" size={28} /></div>
            </div>

            <div style={{ display: 'flex', gap: 15, marginBottom: 25 }}>
                <div style={S.statCard('#4FC3F7')}>
                    <div style={{ fontSize: 10, color: '#4FC3F7', fontWeight: '800' }}>YANGI ZAKAZLAR</div>
                    <div style={{ fontSize: 28, fontWeight: '1000', marginTop: 5 }}>{orders.filter(o => o.status === 'PENDING').length}</div>
                </div>
                <div style={S.statCard('#00e676')}>
                    <div style={{ fontSize: 10, color: '#00e676', fontWeight: '800' }}>TAYYORLAR</div>
                    <div style={{ fontSize: 28, fontWeight: '1000', marginTop: 5 }}>124</div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><Zap size={20} color="#FFD700" /><span style={{ fontWeight: '800', fontSize: 14 }}>BUGUNGI KPI</span></div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 15 }}>
                    <div style={{ width: '70%', height: '100%', background: 'linear-gradient(90deg, #FF7043, #FFD700)', borderRadius: 10 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.6 }}>
                    <span>Planga nisbatan: 70%</span>
                    <span>14,500,000 UZS</span>
                </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: '900', marginBottom: 15, opacity: 0.5 }}>ACTIVE ZAKAZLAR</h3>
            {orders.slice(0, 5).map(o => (
                <div key={o.id} style={{ ...S.card, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '900', fontSize: 17 }}>{o.customer_name}</div>
                            <div style={{ fontSize: 12, color: '#FF7043', marginTop: 4 }}>{o.fabric_type} • {o.total_quantity} dona</div>
                        </div>
                        <div style={S.badge(o.status === 'PENDING' ? '#FFD700' : '#00e676')}>{o.status}</div>
                    </div>
                </div>
            ))}
        </motion.div>
    );

    const renderProducts = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: 26, fontWeight: '1000' }}>Mahsulotlar 👗</h2>
                <div style={{ position: 'relative', marginTop: 20 }}>
                    <Search style={{ position: 'absolute', left: 15, top: 15, opacity: 0.3 }} size={20} />
                    <input style={{ ...S.input, paddingLeft: 50, marginBottom: 0 }} placeholder="Model yoki rang bo'yicha qidiruv..." />
                </div>
            </div>
            {/* Mock Products for now */}
            {[
                { name: 'T-Shirt Classic', stock: 450, color: 'Qora', price: '45,000' },
                { name: 'Polo Premium', stock: 120, color: 'To\'q Ko\'k', price: '85,000' },
                { name: 'Hoodie Oversize', stock: 85, color: 'Melanj', price: '120,000' }
            ].map((p, i) => (
                <div key={i} style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '900', fontSize: 18 }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{p.color} • {p.price} UZS</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: '1000', color: p.stock < 100 ? '#FF7043' : '#00e676' }}>{p.stock}</div>
                            <div style={{ fontSize: 10, opacity: 0.4 }}>OMBORDA</div>
                        </div>
                    </div>
                </div>
            ))}
        </motion.div>
    );

    const renderReadyStock = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 30, fontSize: 26, fontWeight: '1000' }}>Tayyor Ombor 📦</h2>
            <div style={{ ...S.card, background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.1)' }}>
                <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                    <Box size={40} color="#00e676" />
                    <div>
                        <div style={{ fontWeight: '900', fontSize: 20 }}>1,240 <small>Dona</small></div>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>SOTUVGA TAYYOR JAMI MAHSULOT</div>
                    </div>
                </div>
            </div>
            {/* List items ... */}
        </motion.div>
    );

    const renderHistory = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 30, fontSize: 26, fontWeight: '1000' }}>Sotuv Tarixi 📜</h2>
            {data.whLog.filter(l => l.action_type === 'SOTUV' || l.action_type === 'SHIPPED').map(l => (
                <div key={l.id} style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <b>{l.item_name}</b>
                        <b style={{ color: '#00e676' }}>{l.quantity} dona</b>
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.4, marginTop: 5 }}>{new Date(l.created_at).toLocaleString()}</div>
                </div>
            ))}
        </motion.div>
    );

    // --- MAIN RENDER ---

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a14', padding: '20px 20px 120px 20px' }}>
            {tab === 'dashboard' && renderDashboard()}
            {tab === 'products' && renderProducts()}
            {tab === 'orders' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                        <h2 style={{ margin: 0, fontSize: 26, fontWeight: '1000' }}>Zakazlar 📑</h2>
                        <button onClick={() => setShowOrderModal(true)} style={{ background: '#FF7043', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 14, fontWeight: 'bold' }}>+ YANGI ZAKAZ</button>
                    </div>
                    {orders.map(o => (
                        <div key={o.id} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <b>{o.customer_name}</b>
                                <div style={S.badge('#FF7043')}>{o.status}</div>
                            </div>
                            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>{o.fabric_type} | {o.total_quantity} dona</div>
                        </div>
                    ))}
                </div>
            )}
            {tab === 'ombor' && renderReadyStock()}
            {tab === 'history' && renderHistory()}

            {/* Float Action Button */}
            {tab === 'dashboard' && (
                <button onClick={() => setShowOrderModal(true)} style={S.floatingBtn}><Plus size={32} /></button>
            )}

            {/* Order Modal */}
            <AnimatePresence>
                {showOrderModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, padding: 25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} style={{ ...S.card, width: '100%', maxWidth: 450, background: '#12121e' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
                                <h2 style={{ margin: 0 }}>Yangi Zakaz 📝</h2>
                                <button onClick={() => setShowOrderModal(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                            </div>

                            <input style={S.input} placeholder="Mijoz ismi" value={orderForm.customer} onChange={e => setOrderForm({ ...orderForm, customer: e.target.value })} />
                            <input style={S.input} placeholder="Telefon raqami" value={orderForm.phone} onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <input style={S.input} placeholder="Model (Masalan: Polo)" value={orderForm.model} onChange={e => setOrderForm({ ...orderForm, model: e.target.value })} />
                                <input style={S.input} placeholder="Rang" value={orderForm.color} onChange={e => setOrderForm({ ...orderForm, color: e.target.value })} />
                            </div>

                            <input style={S.input} type="number" placeholder="Soni (Dona)" value={orderForm.qty} onChange={e => setOrderForm({ ...orderForm, qty: e.target.value })} />
                            <input style={S.input} type="date" value={orderForm.deadline} onChange={e => setOrderForm({ ...orderForm, deadline: e.target.value })} />

                            <button onClick={handleCreateOrder} disabled={isSaving} style={{ ...S.btn, background: '#00e676', color: '#fff', marginTop: 10 }}>
                                {isSaving ? 'SAQLANMOQDA...' : 'ZAKAZNI TASDIQLASH'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
