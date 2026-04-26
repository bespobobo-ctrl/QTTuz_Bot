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
import { Html5Qrcode } from "html5-qrcode";

export default function BichuvPanel({ tab, data, load, showMsg }) {
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
    const [nastilForm, setNastilForm] = useState({ length: '', layers: '', piecesPerLayer: '', waste: '0' });
    const [showProdDetail, setShowProdDetail] = useState(null);

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
        card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)', padding: 20, borderRadius: 28, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 15 },
        input: { width: '100%', padding: '16px 20px', background: '#121225', border: '1px solid #2a2a45', borderRadius: 16, color: '#fff', marginBottom: 12, outline: 'none', boxSizing: 'border-box', fontSize: 16 },
        btn: { width: '100%', padding: 18, borderRadius: 20, border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: '0.3s' },
        badge: (c) => ({ padding: '6px 12px', background: `${c}15`, color: c, borderRadius: 12, fontSize: 11, fontWeight: '800' }),
        glass: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 22, padding: 18, border: '1px solid rgba(255,255,255,0.05)' },
        statBox: { flex: 1, padding: 15, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }
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

    const handlePlaceAccOrder = async () => {
        if (!isOrderTime()) return showMsg("Hozir yopiq!", "err");
        setIsSaving(true);
        try {
            await supabase.from('warehouse_orders').insert({
                customer_name: 'BICHUV BO\'LIMI',
                fabric_type: 'AKSESUVAR',
                total_quantity: cart.reduce((s, x) => s + x.qty, 0),
                status: 'PENDING',
                details: JSON.stringify(cart)
            });
            showMsg('Buyurtma yuborildi! 🚀');
            setCart([]); setShowCart(false); load(true);
        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
    };

    // --- PREMIUM COMPONENTS ---

    const renderCartModal = () => (
        <AnimatePresence>
            {showCart && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(5, 5, 10, 0.95)', zIndex: 20000, padding: '20px 20px 40px 20px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                        <button onClick={() => setShowCart(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: 50, height: 50, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft /></button>
                        <h2 style={{ fontSize: 24, fontWeight: '900', margin: 0 }}>Savat <span style={{ color: '#F06292' }}>({cart.length})</span></h2>
                        <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', color: '#ff5252', fontSize: 13, fontWeight: 'bold' }}>Hammasini o'chirish</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: 5 }}>
                        {cart.length === 0 ? (
                            <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                                <ShoppingBag size={80} style={{ marginBottom: 20 }} />
                                <p style={{ fontSize: 18, fontWeight: 'bold' }}>Savat bo'sh</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 15 }}>
                                {cart.map(it => (
                                    <motion.div layout key={it.id} style={{ ...S.card, marginBottom: 0, padding: 18, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: '900', fontSize: 17 }}>{it.name}</div>
                                                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{it.category} • {it.unit}</div>
                                            </div>
                                            <button onClick={() => setCart(cart.filter(x => x.id !== it.id))} style={{ background: 'none', border: 'none', color: '#ff5252' }}><Trash2 size={18} /></button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 15, background: 'rgba(255,255,255,0.03)', padding: '6px 15px', borderRadius: 14 }}>
                                                <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24 }} onClick={() => setCart(cart.map(x => x.id === it.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}>-</button>
                                                <b style={{ fontSize: 18, minWidth: 20, textAlign: 'center' }}>{it.qty}</b>
                                                <button style={{ background: 'none', border: 'none', color: '#00e676', fontSize: 24 }} onClick={() => setCart(cart.map(x => x.id === it.id ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 11, color: '#888' }}>Jami</div>
                                                <div style={{ fontSize: 18, fontWeight: '900', color: '#00e676' }}>{it.qty} <small>{it.unit}</small></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 25 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <span style={{ fontSize: 16, color: '#888' }}>Jami mahsulotlar</span>
                            <b style={{ fontSize: 20 }}>{cart.reduce((s, x) => s + x.qty, 0)} dona</b>
                        </div>

                        <div style={{ ...S.glass, background: isOrderTime() ? 'rgba(0, 230, 118, 0.05)' : 'rgba(255, 82, 82, 0.05)', marginBottom: 20, padding: 15, display: 'flex', alignItems: 'center', gap: 12 }}>
                            {isOrderTime() ? <Timer color="#00e676" /> : <AlertTriangle color="#ff5252" />}
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 'bold' }}>{isOrderTime() ? 'Buyurtma berish darchasi ochiq' : 'Buyurtma berish darchasi yopiq'}</div>
                                <div style={{ fontSize: 11, opacity: 0.6 }}>Ish vaqti: 07:30-11:00 / 17:30-18:30</div>
                            </div>
                        </div>

                        <button
                            disabled={!isOrderTime() || cart.length === 0 || isSaving}
                            onClick={handlePlaceAccOrder}
                            style={{ ...S.btn, background: isOrderTime() ? 'linear-gradient(90deg, #F06292, #E91E63)' : '#222', color: '#fff', height: 65, fontSize: 18, boxShadow: isOrderTime() ? '0 15px 30px rgba(240, 98, 146, 0.3)' : 'none' }}
                        >
                            <Sparkles size={22} /> {isSaving ? 'YUBORILMOQDA...' : 'BUYURTMANI TASDIQLASH'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const renderOmbor = () => {
        if (omborCategory === 'mato') {
            const groups = matoSubTab === 'neto' ? groupFabrics(netoRolls.filter(r => r.status === 'KONTROLDAN_OTDI'), 'neto') : groupFabrics(brutoRolls, 'bruto');
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 25 }}>
                        <div onClick={() => setMatoSubTab('bruto')} style={{ ...S.card, marginBottom: 0, border: matoSubTab === 'bruto' ? '2.5px solid #BA68C8' : '1px solid rgba(255,255,255,0.05)', background: matoSubTab === 'bruto' ? 'rgba(186,104,200,0.1)' : 'rgba(255,255,255,0.01)' }}>
                            <div style={{ fontSize: 10, color: '#BA68C8', fontWeight: '800' }}>BRUTO</div>
                            <div style={{ fontSize: 24, fontWeight: '1000' }}>{totalBrutoKg.toFixed(0)} <small style={{ fontSize: 12 }}>kg</small></div>
                        </div>
                        <div onClick={() => setMatoSubTab('neto')} style={{ ...S.card, marginBottom: 0, border: matoSubTab === 'neto' ? '2.5px solid #00e676' : '1px solid rgba(255,255,255,0.05)', background: matoSubTab === 'neto' ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.01)' }}>
                            <div style={{ fontSize: 10, color: '#00e676', fontWeight: '800' }}>NETO (READY)</div>
                            <div style={{ fontSize: 24, fontWeight: '1000' }}>{totalNetoKg.toFixed(0)} <small style={{ fontSize: 12 }}>kg</small></div>
                        </div>
                    </div>
                    {groups.map(g => (
                        <motion.div layout key={g.id} onClick={() => setSelectedGroup({ ...g, category: matoSubTab })} style={{ ...S.card, borderLeft: `6px solid ${matoSubTab === 'neto' ? (g.allReady ? '#00e676' : '#FFAB40') : '#BA68C8'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><div style={{ fontWeight: '900', fontSize: 19 }}>{g.name}</div><div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{g.color} • {g.rolls.length} ta</div></div>
                                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 20, fontWeight: '1000', color: matoSubTab === 'neto' ? '#00e676' : '#fff' }}>{g.totalWeight.toFixed(1)} <small>kg</small></div></div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            );
        } else {
            return (
                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <Search size={18} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: 13, fontWeight: '800', color: '#BA68C8' }}>AKSESUVARLAR RO'YXATI</span>
                    </div>
                    {accessories.filter(a => a.target_dept === 'Bichuv bo\'limi').map(a => (
                        <div key={a.id} style={{ ...S.card, padding: '18px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '900', fontSize: 17 }}>{a.name}</div>
                                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{a.category} • {a.size || '-'}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 18, fontWeight: '1000' }}>{a.quantity} <small style={{ fontSize: 11 }}>{a.unit}</small></div></div>
                                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => addToCart(a)} style={{ width: 45, height: 45, borderRadius: 14, background: '#BA68C8', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 15px rgba(186,104,200,0.2)' }}>
                                        <Plus size={24} />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Floating Cart Button */}
                    <AnimatePresence>
                        {cart.length > 0 && (
                            <motion.button
                                initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 50 }}
                                onClick={() => setShowCart(true)}
                                style={{ position: 'fixed', bottom: 100, right: 25, width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #F06292, #E91E63)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 40px rgba(233, 30, 99, 0.4)', zIndex: 10000 }}
                            >
                                <ShoppingCart size={28} />
                                <span style={{ position: 'absolute', top: -5, right: -5, width: 28, height: 28, background: '#fff', borderRadius: '50%', color: '#E91E63', fontWeight: 'bold', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.length}</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            );
        }
    };

    // --- MAIN RENDER ---

    if (tab === 'ombor') {
        return (
            <div style={{ padding: '20px 20px 140px 20px', minHeight: '100vh', background: '#0a0a14' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 28, fontWeight: '1000', letterSpacing: '-1px' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h2>
                        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Ombor va Logistika</div>
                    </div>
                </div>

                <div style={S.toggle}>
                    <button onClick={() => setOmborCategory('mato')} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', background: omborCategory === 'mato' ? 'linear-gradient(90deg, #F06292, #E91E63)' : 'none', color: '#fff', fontWeight: '900', fontSize: 13, transition: '0.4s' }}>MATO OMBORI</button>
                    <button onClick={() => setOmborCategory('aksesuvar')} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', background: omborCategory === 'aksesuvar' ? 'linear-gradient(90deg, #BA68C8, #9C27B0)' : 'none', color: '#fff', fontWeight: '900', fontSize: 13, transition: '0.4s' }}>AKSESUVAR</button>
                </div>

                {renderMatoOmbor()}
                {renderCartModal()}

                {/* Group Details Overlay */}
                <AnimatePresence>
                    {selectedGroup && (
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', inset: 0, background: '#08080f', zIndex: 15000, padding: 25, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                                <button onClick={() => setSelectedGroup(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: 45, height: 45, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft /></button>
                                <h2 style={{ fontSize: 20, fontWeight: '900' }}>Guruh Tafsiloti</h2>
                                <div style={{ width: 45 }} />
                            </div>

                            <div style={{ ...S.card, borderLeft: `10px solid ${selectedGroup.category === 'neto' ? '#00e676' : '#BA68C8'}` }}>
                                <h1 style={{ fontSize: 36, fontWeight: '1000', margin: 0, letterSpacing: '-1.5px' }}>{selectedGroup.name}</h1>
                                <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                                    <div style={S.badge(selectedGroup.category === 'neto' ? '#00e676' : '#BA68C8')}>{selectedGroup.category.toUpperCase()}</div>
                                    <div style={S.badge('#F06292')}>{selectedGroup.color}</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 30 }}>
                                    <div style={S.glass}>
                                        <div style={{ fontSize: 10, color: '#888' }}>JAMI VAZN</div>
                                        <div style={{ fontSize: 24, fontWeight: '1000', color: '#00e676' }}>{selectedGroup.totalWeight.toFixed(1)} <small style={{ fontSize: 11 }}>kg</small></div>
                                    </div>
                                    <div style={S.glass}>
                                        <div style={{ fontSize: 10, color: '#888' }}>RULON SONI</div>
                                        <div style={{ fontSize: 24, fontWeight: '1000' }}>{selectedGroup.rolls.length} <small style={{ fontSize: 11 }}>ta</small></div>
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: 16, fontWeight: '900', margin: '30px 0 15px 5px', color: '#555' }}>RULONLAR RO'YXATI</h3>
                            {selectedGroup.rolls.map(r => (
                                <motion.div key={r.id} onClick={() => selectedGroup.category === 'neto' && setActiveRoll(r)} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px' }}>
                                    <div>
                                        <div style={{ fontWeight: '900', fontSize: 17 }}>Rulon #{r.id}</div>
                                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{selectedGroup.category === 'neto' ? `${r.neto} kg • ${r.en} sm` : `${r.bruto} kg`}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {selectedGroup.category === 'neto' && <div style={S.badge(getIsReady(r) ? '#00e676' : '#FFAB40')}>{getIsReady(r) ? 'TAYYOR' : 'DAM'}</div>}
                                        <ChevronRight size={18} color="#444" />
                                    </div>
                                </motion.div>
                            ))}

                            <AnimatePresence>
                                {activeRoll && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 16000, padding: 25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ ...S.card, width: '100%', maxWidth: 400, background: '#12121e' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
                                                <h2 style={{ fontSize: 22, fontWeight: '900' }}>Bichish: #{activeRoll.id}</h2>
                                                <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                                            </div>
                                            <input style={S.input} placeholder="Model nomi" onChange={e => { window.cutModel = e.target.value; }} />
                                            <input style={S.input} type="number" placeholder="Dona soni" onChange={e => { window.cutQty = e.target.value; }} />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
                                                <button onClick={() => setActiveRoll(null)} style={{ ...S.btn, background: '#222', color: '#fff' }}>BEKOR</button>
                                                <button onClick={async () => {
                                                    setIsSaving(true);
                                                    try {
                                                        await supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', activeRoll.id);
                                                        await supabase.from('warehouse_log').insert({ item_name: `BICHUV: ${activeRoll.fabric_name}`, quantity: activeRoll.neto, action_type: 'BICHUV', notes: `Model: ${window.cutModel}, Dona: ${window.cutQty}` });
                                                        showMsg('Muvaffaqiyatli bichildi! ✂️'); setActiveRoll(null); setSelectedGroup(null); load(true);
                                                    } catch (e) { alert(e.message); } finally { setIsSaving(false); }
                                                }} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>BICHISH</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // DASHBOARD - Keeping previous rich dashboard logic but with updated premium styles
    return (
        <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: '1000', letterSpacing: '-1.5px' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h1>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Boshqaruv va Analitika</div>
                </div>
                <div style={{ background: 'rgba(240, 98, 146, 0.1)', padding: 14, borderRadius: 20 }}><Scissors color="#F06292" size={28} /></div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(186,104,200,0.1), rgba(0, 230, 118, 0.1))', padding: 25, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 25 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div><div style={{ fontSize: 10, color: '#BA68C8', fontWeight: '800' }}>BRUTO OMBOR</div><div style={{ fontSize: 24, fontWeight: '1000' }}>{totalBrutoKg.toFixed(0)} <small style={{ fontSize: 11 }}>kg</small></div></div>
                    <div><div style={{ fontSize: 10, color: '#00e676', fontWeight: '800' }}>NETO TAYYOR</div><div style={{ fontSize: 24, fontWeight: '1000', color: '#00e676' }}>{totalNetoKg.toFixed(0)} <small style={{ fontSize: 11 }}>kg</small></div></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><Users size={20} color="#4FC3F7" /><span style={{ fontWeight: '800', fontSize: 14, color: '#4FC3F7' }}>XODIMLAR</span></div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={S.statBox}><div>JAMI</div><div style={{ fontSize: 26, fontWeight: '1000' }}>{employees.length}</div></div>
                    <div style={{ ...S.statBox, background: 'rgba(0, 230, 118, 0.05)' }}><div>KELGAN</div><div style={{ fontSize: 26, fontWeight: '1000', color: '#00e676' }}>{employees.filter(e => e.present).length}</div></div>
                </div>
            </div>

            <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><Activity size={20} color="#F06292" /><span style={{ fontWeight: '800', fontSize: 14, color: '#F06292' }}>UNUMDORLIK</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div onClick={() => setShowProdDetail('day')} style={{ ...S.statBox, cursor: 'pointer' }}><div>BUGUN</div><b style={{ fontSize: 18 }}>{getStatsByPeriod('day').pieces}</b></div>
                    <div onClick={() => setShowProdDetail('week')} style={{ ...S.statBox, cursor: 'pointer' }}><div>HAFTA</div><b style={{ fontSize: 18 }}>{getStatsByPeriod('week').pieces}</b></div>
                    <div onClick={() => setShowProdDetail('month')} style={{ ...S.statBox, cursor: 'pointer' }}><div>OY</div><b style={{ fontSize: 18 }}>{getStatsByPeriod('month').pieces}</b></div>
                </div>
            </div>

            {/* Prod Detail Modal */}
            <AnimatePresence>
                {showProdDetail && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 18000, padding: 25, overflowY: 'auto' }}>
                        <button onClick={() => setShowProdDetail(null)} style={{ background: 'none', border: 'none', color: '#fff', marginBottom: 25 }}><ArrowLeft /></button>
                        <h2 style={{ fontSize: 24, fontWeight: '900', marginBottom: 30 }}>{showProdDetail === 'day' ? 'Bugungi' : 'Periodik'} Hisobot</h2>
                        {getStatsByPeriod(showProdDetail).items.map((l, i) => (
                            <div key={i} style={S.card}>
                                <div style={{ fontWeight: '900', fontSize: 18 }}>{l.item_name}</div>
                                <div style={{ fontSize: 12, color: '#00e676', marginTop: 8 }}>{l.quantity} kg • {l.notes}</div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
