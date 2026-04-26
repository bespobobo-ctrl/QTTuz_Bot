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
    ArrowRight, Save, Plus, Minus
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function BichuvPanel({ tab, data, load, showMsg }) {
    const [activeRoll, setActiveRoll] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerRef] = useState({ current: null });

    // Nastil State
    const [nastilStep, setNastilStep] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedRolls, setSelectedRolls] = useState([]);
    const [nastilForm, setNastilForm] = useState({
        length: '',
        layers: '',
        piecesPerLayer: '',
        waste: '0',
        models: []
    });

    useEffect(() => {
        if (tab !== 'nastil') {
            setNastilStep(1);
            setSelectedOrder(null);
            setSelectedRolls([]);
        }
        if (scannerRef.current) {
            try { scannerRef.current.stop().catch(() => { }); } catch (e) { }
            scannerRef.current = null;
            setScannerActive(false);
        }
    }, [tab]);

    const S = {
        card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', padding: 20, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 15 },
        input: { width: '100%', padding: 15, background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', marginBottom: 10, outline: 'none' },
        btn: { width: '100%', padding: 15, borderRadius: 16, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' },
        badge: (c) => ({ padding: '5px 12px', background: `${c}20`, color: c, borderRadius: 10, fontSize: 11, fontWeight: '800', letterSpacing: '0.5px' }),
        glass: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 20, padding: 15, border: '1px solid rgba(255,255,255,0.05)' }
    };

    const rolls = data.whRolls || [];
    const orders = data.whOrders || [];

    const getIsReady = (roll) => {
        if (!roll.neto_date) return false;
        const diffMs = new Date() - new Date(roll.neto_date);
        return Math.floor(diffMs / (1000 * 60 * 60)) >= 48;
    };

    const readyRollsList = rolls.filter(r => r.status === 'KONTROLDAN_OTDI');
    const cutRolls = rolls.filter(r => r.status === 'BICHILDI');

    // Dashboard grouping
    const fabricList = Object.values(readyRollsList.reduce((acc, r) => {
        const key = `${r.fabric_name}_${r.color}_${r.gramaj}`;
        if (!acc[key]) acc[key] = { id: key, name: r.fabric_name, color: r.color, gramaj: r.gramaj, rolls: [] };
        acc[key].rolls.push(r);
        return acc;
    }, {})).map(g => {
        const totalNeto = g.rolls.reduce((s, r) => s + (Number(r.neto) || 0), 0);
        const avgEn = g.rolls.reduce((s, r) => s + (Number(r.en) || 0), 0) / g.rolls.length;
        let totalDefects = 0;
        g.rolls.forEach(r => { try { const d = typeof r.defects === 'string' ? JSON.parse(r.defects) : r.defects; totalDefects += Object.values(d || {}).reduce((a, b) => a + b, 0); } catch (e) { } });
        return { ...g, totalNeto, avgEn, avgDefects: totalDefects / g.rolls.length, readyCount: g.rolls.filter(getIsReady).length, allReady: g.rolls.every(getIsReady) };
    });

    const handleFinishNastil = async () => {
        if (!nastilForm.length || !nastilForm.layers || !nastilForm.piecesPerLayer) return alert('Barcha maydonlarni to\'ldiring!');
        setIsSaving(true);
        try {
            const totalKg = selectedRolls.reduce((s, r) => s + r.neto, 0);
            const totalPieces = Number(nastilForm.layers) * Number(nastilForm.piecesPerLayer);

            // 1. Rollarni statusini yangilash
            await Promise.all(selectedRolls.map(r =>
                supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', r.id)
            ));

            // 2. Nastil logini saqlash
            await supabase.from('warehouse_log').insert({
                item_name: `NASTIL: ${selectedOrder.customer_name} uchun (${totalPieces} dona)`,
                quantity: totalKg,
                action_type: 'NASTIL',
                notes: JSON.stringify({
                    order_id: selectedOrder.id,
                    length: nastilForm.length,
                    layers: nastilForm.layers,
                    pieces: totalPieces,
                    waste: nastilForm.waste,
                    rolls: selectedRolls.map(r => r.id),
                    fabrics: [...new Set(selectedRolls.map(r => r.fabric_name))]
                })
            });

            showMsg('Nastil muvaffaqiyatli yakunlandi! ✅');
            setNastilStep(1);
            setSelectedOrder(null);
            setSelectedRolls([]);
            load(true);
        } catch (e) {
            alert(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRoll = (roll) => {
        if (selectedRolls.find(r => r.id === roll.id)) {
            setSelectedRolls(selectedRolls.filter(r => r.id !== roll.id));
        } else {
            setSelectedRolls([...selectedRolls, roll]);
        }
    };

    // --- RENDER FUNCTIONS ---

    const renderOrders = () => (
        <div style={{ padding: 20 }}>
            <h2 style={{ marginBottom: 25, fontSize: 24, fontWeight: '900' }}>Buyurtmalar monitoringi 📋</h2>
            {orders.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', opacity: 0.5, padding: 50 }}>
                    <ClipboardList size={40} style={{ margin: '0 auto 15px', opacity: 0.3 }} />
                    Hozircha buyurtmalar mavjud emas
                </div>
            ) : (
                orders.map(o => {
                    const details = typeof o.details === 'string' ? JSON.parse(o.details) : (o.details || []);
                    return (
                        <div key={o.id} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: '900' }}>{o.customer_name}</div>
                                    <div style={{ color: '#F06292', fontSize: 13, fontWeight: 'bold' }}>{o.fabric_type} • {o.total_quantity} dona</div>
                                </div>
                                <div style={S.badge(o.status === 'COMPLETED' ? '#00e676' : '#4FC3F7')}>{o.status}</div>
                            </div>
                            <div style={{ marginTop: 15, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 15 }}>
                                {details.map((d, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, opacity: 0.8 }}>
                                        <span>{d.model} ({d.color})</span>
                                        <b>{d.qty} dona</b>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    const renderNastilWizard = () => {
        if (nastilStep === 1) {
            return (
                <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
                        <div style={{ background: '#F06292', width: 45, height: 45, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PenTool color="#fff" size={24} />
                        </div>
                        <h2 style={{ margin: 0 }}>Yangi Nastil <br /><span style={{ color: '#888', fontSize: 13 }}>Bosqich 1: Buyurtmani tanlang</span></h2>
                    </div>
                    {orders.filter(o => o.status !== 'COMPLETED').map(o => (
                        <div key={o.id} style={S.card} onClick={() => { setSelectedOrder(o); setNastilStep(2); }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: 18 }}>{o.customer_name}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>{o.fabric_type} • {o.total_quantity} dona</div>
                                </div>
                                <ArrowRight size={20} color="#F06292" />
                            </div>
                        </div>
                    ))}
                    {orders.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center' }}>Buyurtmalar yo'q</div>}
                </div>
            );
        }

        if (nastilStep === 2) {
            const compatibleRolls = readyRollsList.filter(r => r.fabric_name.includes(selectedOrder.fabric_type) || selectedOrder.fabric_type.includes(r.fabric_name));
            return (
                <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                        <button onClick={() => setNastilStep(1)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                        <h2 style={{ margin: 0 }}>Bosqich 2 <br /><span style={{ color: '#888', fontSize: 13 }}>Rulonlarni tanlang ({selectedRolls.length} ta)</span></h2>
                    </div>

                    <div style={{ ...S.card, background: 'rgba(240, 98, 146, 0.05)', borderColor: '#F06292' }}>
                        <div style={{ fontSize: 12, color: '#F06292', fontWeight: 'bold' }}>TANLANGAN VAZN</div>
                        <div style={{ fontSize: 24, fontWeight: '900' }}>{selectedRolls.reduce((s, r) => s + r.neto, 0).toFixed(1)} kg</div>
                    </div>

                    {compatibleRolls.map(r => (
                        <div key={r.id} style={{ ...S.card, border: selectedRolls.find(x => x.id === r.id) ? '2px solid #F06292' : '1px solid rgba(255,255,255,0.08)' }} onClick={() => toggleRoll(r)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{r.fabric_name} • {r.color}</div>
                                    <div style={{ fontSize: 12, color: '#ccc' }}>{r.neto} kg • {r.en} sm</div>
                                </div>
                                {selectedRolls.find(x => x.id === r.id) && <CheckCircle2 color="#F06292" />}
                            </div>
                        </div>
                    ))}

                    <button disabled={selectedRolls.length === 0} onClick={() => setNastilStep(3)} style={{ ...S.btn, background: '#F06292', color: '#fff', marginTop: 10 }}>
                        DAVOM ETISH <ArrowRight size={18} />
                    </button>
                </div>
            );
        }

        if (nastilStep === 3) {
            return (
                <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                        <button onClick={() => setNastilStep(2)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                        <h2 style={{ margin: 0 }}>Bosqich 3 <br /><span style={{ color: '#888', fontSize: 13 }}>Nastil parametrlarini kiriting</span></h2>
                    </div>

                    <div style={S.card}>
                        <div style={{ marginBottom: 15 }}>
                            <label style={{ fontSize: 11, color: '#888', marginLeft: 5 }}>NASTIL UZUNLIGI (SM)</label>
                            <input style={S.input} type="number" placeholder="Masalan: 450" value={nastilForm.length} onChange={e => setNastilForm({ ...nastilForm, length: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                            <div>
                                <label style={{ fontSize: 11, color: '#888', marginLeft: 5 }}>QAVATLAR SONI</label>
                                <input style={S.input} type="number" placeholder="50" value={nastilForm.layers} onChange={e => setNastilForm({ ...nastilForm, layers: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: '#888', marginLeft: 5 }}>QAVATDAGI DONA</label>
                                <input style={S.input} type="number" placeholder="4" value={nastilForm.piecesPerLayer} onChange={e => setNastilForm({ ...nastilForm, piecesPerLayer: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: '#888', marginLeft: 5 }}>CHIQINDI / QOLDIQ (KG)</label>
                            <input style={S.input} type="number" placeholder="0.5" value={nastilForm.waste} onChange={e => setNastilForm({ ...nastilForm, waste: e.target.value })} />
                        </div>

                        <div style={{ ...S.glass, marginTop: 10, background: 'rgba(0, 230, 118, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13 }}>HISOBLANGAN JAMI DONA:</span>
                                <b style={{ fontSize: 20, color: '#00e676' }}>{(Number(nastilForm.layers) * Number(nastilForm.piecesPerLayer)) || 0} ta</b>
                            </div>
                        </div>

                        <button disabled={isSaving} onClick={handleFinishNastil} style={{ ...S.btn, background: '#00e676', color: '#000', marginTop: 25 }}>
                            <Save size={20} /> {isSaving ? 'SAQLANMOQDA...' : 'NASTILNI YAKUNLASH VA BICHISH'}
                        </button>
                    </div>
                </div>
            );
        }
    };

    // --- MAIN RENDER ---

    if (activeRoll) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                    <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                    <h2 style={{ margin: 0, fontSize: 18 }}>Yakka Bichish</h2>
                    <div style={{ width: 24 }} />
                </div>
                <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(240, 98, 146, 0.15), rgba(240, 98, 146, 0.05))' }}>
                    <h2 style={{ margin: 0 }}>{activeRoll.fabric_name}</h2>
                    <div style={{ color: '#F06292', fontWeight: 'bold', marginTop: 5 }}>{activeRoll.color} • {activeRoll.neto} kg</div>
                </div>
                <div style={S.card}>
                    <label style={{ fontSize: 12, color: '#888' }}>Model Nomi</label>
                    <input style={S.input} value={cutForm.model} onChange={e => setCutForm({ ...cutForm, model: e.target.value })} />
                    <label style={{ fontSize: 12, color: '#888' }}>Dona</label>
                    <input style={S.input} type="number" value={cutForm.pieces} onChange={e => setCutForm({ ...cutForm, pieces: e.target.value })} />
                    <button onClick={handleCut} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>TASDIQLASH</button>
                </div>
            </motion.div>
        );
    }

    if (selectedGroup) {
        // Group Detail View (as requested)
        return (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                    <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                    <h2 style={{ margin: 0, fontSize: 18 }}>Guruh Analitikasi</h2>
                    <div style={{ width: 24 }} />
                </div>

                <div style={{ ...S.card, borderLeft: `10px solid ${selectedGroup.allReady ? '#00e676' : '#ff9800'}` }}>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: '900', letterSpacing: '-1.5px' }}>{selectedGroup.name}</h1>
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        <div style={S.badge(selectedGroup.allReady ? '#00e676' : '#ff9800')}>{selectedGroup.allReady ? 'BICHUVGA TAYYOR' : 'DAM OLMOQDA'}</div>
                        <div style={S.badge('#F06292')}>{selectedGroup.color}</div>
                        <div style={S.badge('#4FC3F7')}>{selectedGroup.gramaj}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 30 }}>
                        <div style={S.glass}>
                            <div style={{ fontSize: 10, color: '#888', fontWeight: 'bold' }}>JAMI NETO</div>
                            <div style={{ fontSize: 20, fontWeight: '900', color: '#00e676' }}>{selectedGroup.totalNeto.toFixed(1)} <small style={{ fontSize: 12 }}>kg</small></div>
                        </div>
                        <div style={S.glass}>
                            <div style={{ fontSize: 10, color: '#888', fontWeight: 'bold' }}>RULON SONI</div>
                            <div style={{ fontSize: 20, fontWeight: '900' }}>{selectedGroup.rolls.length} <small style={{ fontSize: 12 }}>ta</small></div>
                        </div>
                        <div style={S.glass}>
                            <div style={{ fontSize: 10, color: '#888', fontWeight: 'bold' }}>O'RTACHA ENI</div>
                            <div style={{ fontSize: 20, fontWeight: '900' }}>{selectedGroup.avgEn.toFixed(1)} <small style={{ fontSize: 12 }}>sm</small></div>
                        </div>
                        <div style={S.glass}>
                            <div style={{ fontSize: 10, color: '#888', fontWeight: 'bold' }}>O'RT. KAMCHILLIK</div>
                            <div style={{ fontSize: 20, fontWeight: '900', color: '#ff5252' }}>{selectedGroup.avgDefects.toFixed(1)} <small style={{ fontSize: 12 }}>ta</small></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button onClick={() => { setNastilStep(2); setSelectedOrder({ customer_name: 'Maxsus', fabric_type: selectedGroup.name, id: 'manual' }); setSelectedRolls([]); setTab('nastil'); }} style={{ ...S.btn, background: '#F06292', color: '#fff', flex: 1 }}>
                        <Layers size={18} /> NASTIL QILISH
                    </button>
                </div>

                <h3 style={{ fontSize: 16, margin: '30px 0 15px 5px' }}>Rulonlar Ro'yxati</h3>
                {selectedGroup.rolls.map(r => (
                    <div key={r.id} style={{ ...S.card, padding: 15 }} onClick={() => setActiveRoll(r)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>Rulon #{r.id}</div>
                                <div style={{ fontSize: 12, color: '#888' }}>{r.neto} kg • {r.en} sm • {r.gramaj}</div>
                            </div>
                            <ChevronRight size={18} color="#444" />
                        </div>
                    </div>
                ))}
            </motion.div>
        );
    }

    if (tab === 'scan') {
        return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 25, fontSize: 24, fontWeight: '900' }}>Smart Skayner ⚡</h2>
                <div style={{ ...S.card, padding: 10 }}>
                    <div id="bichuv-reader" style={{ width: '100%', borderRadius: 20, overflow: 'hidden' }}></div>
                    <div style={{ padding: 20 }}>
                        {!scannerActive ? (
                            <button onClick={async () => {
                                try {
                                    await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                                    const h = new Html5Qrcode("bichuv-reader");
                                    scannerRef.current = h;
                                    await h.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
                                        (t) => { h.stop(); setScannerActive(false); processScan(t); }, () => { });
                                    setScannerActive(true);
                                } catch (e) { showMsg("Kamera xatosi!", "err"); }
                            }} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>
                                <Camera size={20} /> SKANERNI BOSHLASH
                            </button>
                        ) : (
                            <button onClick={() => { scannerRef.current?.stop(); setScannerActive(false); }} style={{ ...S.btn, background: '#333', color: '#fff' }}>
                                <X size={20} /> TO'XTATISH
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (tab === 'history') {
        return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 25, fontSize: 24, fontWeight: '900' }}>Bichuv Tarixi 📋</h2>
                {cutRolls.length === 0 ? (
                    <div style={{ ...S.card, textAlign: 'center', opacity: 0.5, padding: 50 }}>Hozircha ma'lumot yo'q</div>
                ) : (
                    cutRolls.map(r => (
                        <div key={r.id} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div><div style={{ fontWeight: '800', fontSize: 16 }}>{r.fabric_name}</div><div style={{ fontSize: 12, color: '#888' }}>{r.color} • {r.neto} kg</div></div>
                                <div style={S.badge('#00e676')}>BICHILDI</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    if (tab === 'orders') return renderOrders();
    if (tab === 'nastil') return renderNastilWizard();

    // Default Dashboard
    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: '900', letterSpacing: '-1px' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h1>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 5 }}>Strategik boshqaruv</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setTab('orders')} style={{ ...S.ib, background: 'rgba(255,255,255,0.05)', border: 'none', padding: 12, borderRadius: 15, color: '#fff' }}><ShoppingCart size={22} /></button>
                    <button onClick={() => setTab('nastil')} style={{ ...S.ib, background: '#F06292', border: 'none', padding: 12, borderRadius: 15, color: '#fff' }}><Plus size={22} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 30 }}>
                <div style={{ ...S.card, marginBottom: 0, background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1), rgba(0, 0, 0, 0))' }}>
                    <div style={{ color: '#00e676', fontSize: 10, fontWeight: '800' }}>TAYYOR TUR</div>
                    <div style={{ fontSize: 28, fontWeight: '900', marginTop: 5 }}>{fabricList.filter(f => f.allReady).length}</div>
                </div>
                <div style={{ ...S.card, marginBottom: 0, background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(0, 0, 0, 0))' }}>
                    <div style={{ color: '#ff9800', fontSize: 10, fontWeight: '800' }}>DAM OLMOQDA</div>
                    <div style={{ fontSize: 28, fontWeight: '900', marginTop: 5 }}>{fabricList.filter(f => !f.allReady).length}</div>
                </div>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: '800', marginBottom: 20 }}>Ombor Qoldig'i</h3>
            {fabricList.map(f => (
                <motion.div key={f.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedGroup(f)} style={{ ...S.card, borderBottom: f.allReady ? '4px solid #00e676' : '4px solid #ff9800' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 19, fontWeight: '800' }}>{f.name}</h3>
                            <div style={{ color: '#888', fontSize: 13, marginTop: 5 }}>{f.color} • {f.gramaj}</div>
                        </div>
                        <ChevronRight size={20} color="#333" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: '800' }}>{f.rolls.length} rulon / {f.totalNeto.toFixed(0)} kg</div>
                        <div style={{ fontSize: 11, fontWeight: 'bold', color: f.allReady ? '#00e676' : '#ff9800' }}>{f.allReady ? 'TAYYOR' : 'DAMDA'}</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    function processScan(t) {
        let id = t.replace('NETO-', '').replace('ROLL-', '');
        const r = rolls.find(x => String(x.id) === String(id));
        if (!r) return showMsg("Topilmadi", "err");
        if (r.status === 'BICHILDI') return showMsg("Bichilgan!", "err");
        if (!getIsReady(r) && !window.confirm("Dam olmagan! Baribir kirasizmi?")) return;
        setActiveRoll(r);
    }
}
