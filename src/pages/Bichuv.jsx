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
    Timer, Truck, Sparkles, PlusCircle, User, FileText
} from 'lucide-react';

export default function BichuvPanel({ tab, data, load, showMsg }) {
    // Basic States
    const [isSaving, setIsSaving] = useState(false);
    const [omborCategory, setOmborCategory] = useState('mato');
    const [matoSubTab, setMatoSubTab] = useState('neto');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showProdDetail, setShowProdDetail] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [activeRoll, setActiveRoll] = useState(null);
    const [cutForm, setCutForm] = useState({ model: '', pieces: '' });

    // --- NASTIL WIZARD STATES (Improved) ---
    const [showNastilWizard, setShowNastilWizard] = useState(false);
    const [nwStep, setNwStep] = useState(1); // 1: Order, 2: Rolls, 3: Specs, 4: Summary
    const [nwData, setNwData] = useState({
        orderId: null, customer: '', model: '', orderQty: '',
        rolls: [], // { id, fabric, color, weight }
        length: '', width: '', layers: '', waste: '0'
    });

    const [employees] = useState([
        { id: 1, name: 'Anvar', present: true },
        { id: 2, name: 'Sardor', present: true },
        { id: 3, name: 'Malika', present: false },
        { id: 4, name: 'Javohir', present: true },
        { id: 5, name: 'Olim', present: true }
    ]);

    const S = {
        card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)', padding: 22, borderRadius: 30, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 15 },
        input: { width: '100%', padding: '18px 22px', background: '#121225', border: '1px solid #2a2a45', borderRadius: 18, color: '#fff', marginBottom: 15, outline: 'none', boxSizing: 'border-box', fontSize: 16 },
        btn: { width: '100%', padding: 18, borderRadius: 20, border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: '0.3s' },
        badge: (c) => ({ padding: '6px 12px', background: `${c}15`, color: c, borderRadius: 12, fontSize: 11, fontWeight: '800' }),
        statBox: { flex: 1, padding: 15, borderRadius: 22, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' },
        toggle: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 5, marginBottom: 25 },
        stepDot: (active) => ({ width: 10, height: 10, borderRadius: '50%', background: active ? '#F06292' : 'rgba(255,255,255,0.1)', transition: '0.4s' })
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

    const groupFabrics = (list, weightField) => {
        return Object.values(list.reduce((acc, r) => {
            const key = `${r.fabric_name}_${r.color}_${r.gramaj}`;
            if (!acc[key]) acc[key] = { id: key, name: r.fabric_name, color: r.color, gramaj: r.gramaj, rolls: [] };
            acc[key].rolls.push(r);
            return acc;
        }, {})).map(g => {
            const totalWeight = g.rolls.reduce((s, r) => s + (Number(r[weightField]) || 0), 0);
            return { ...g, totalWeight };
        });
    };

    const getStatsByPeriod = (period) => {
        const now = new Date();
        const filtered = logs.filter(l => (l.action_type === 'BICHUV' || l.action_type === 'NASTIL') && (new Date(l.created_at).toDateString() === now.toDateString()));
        // Simplified for now
        return { pieces: 0, items: filtered };
    };

    // --- NASTIL WIZARD STEPS ---

    const renderWizStep1 = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ marginBottom: 20 }}>1. Zakaz ma'lumotlari</h3>
            <div style={S.card}>
                <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 8 }}>ZAKAZNI TANLANG (Yoki yangi kiriting)</label>
                <select style={S.input} onChange={e => {
                    const o = orders.find(x => x.id === Number(e.target.value));
                    if (o) setNwData({ ...nwData, orderId: o.id, customer: o.customer_name, model: o.fabric_type, orderQty: o.total_quantity });
                }}>
                    <option value="">-- Zakazni tanlang --</option>
                    {orders.filter(o => o.status === 'PENDING').map(o => (
                        <option key={o.id} value={o.id}>{o.customer_name} | {o.fabric_type}</option>
                    ))}
                </select>
                <input style={S.input} placeholder="Mijoz ismi" value={nwData.customer} onChange={e => setNwData({ ...nwData, customer: e.target.value })} />
                <input style={S.input} placeholder="Model nomi" value={nwData.model} onChange={e => setNwData({ ...nwData, model: e.target.value })} />
                <input style={S.input} type="number" placeholder="Zakaz soni (Dona)" value={nwData.orderQty} onChange={e => setNwData({ ...nwData, orderQty: e.target.value })} />
            </div>
            <button onClick={() => setNwStep(2)} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>KEYINGI QADAM <ArrowRight size={18} /></button>
        </motion.div>
    );

    const renderWizStep2 = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ marginBottom: 20 }}>2. Rulonlarni tanlang</h3>
            <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: 20 }}>
                {netoRolls.map(r => {
                    const isSel = nwData.rolls.find(x => x.id === r.id);
                    return (
                        <div key={r.id} onClick={() => {
                            if (isSel) setNwData({ ...nwData, rolls: nwData.rolls.filter(x => x.id !== r.id) });
                            else setNwData({ ...nwData, rolls: [...nwData.rolls, r] });
                        }} style={{ ...S.card, padding: 15, border: isSel ? '2px solid #00e676' : '1px solid rgba(255,255,255,0.05)', background: isSel ? 'rgba(0,230,118,0.05)' : S.card.background }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <b>#{r.id} | {r.fabric_name}</b>
                                <b style={{ color: '#00e676' }}>{r.neto} kg</b>
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.5 }}>{r.color} • {r.en} sm • {r.gramaj} gr</div>
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setNwStep(1)} style={{ ...S.btn, background: '#333', color: '#fff' }}>ORQAGA</button>
                <button onClick={() => setNwStep(3)} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>KEYINGI <ArrowRight size={18} /></button>
            </div>
        </motion.div>
    );

    const renderWizStep3 = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ marginBottom: 20 }}>3. Nastil o'lchovlari</h3>
            <div style={S.card}>
                <div><label style={{ fontSize: 11, color: '#888' }}>UZUNLIK (SM)</label><input type="number" style={S.input} value={nwData.length} onChange={e => setNwData({ ...nwData, length: e.target.value })} /></div>
                <div><label style={{ fontSize: 11, color: '#888' }}>ENI (SM)</label><input type="number" style={S.input} value={nwData.width} onChange={e => setNwData({ ...nwData, width: e.target.value })} /></div>
                <div><label style={{ fontSize: 11, color: '#888' }}>QAVATLAR SONI (JAMI)</label><input type="number" style={S.input} value={nwData.layers} onChange={e => setNwData({ ...nwData, layers: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setNwStep(2)} style={{ ...S.btn, background: '#333', color: '#fff' }}>ORQAGA</button>
                <button onClick={() => setNwStep(4)} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>YAKUNIY KO'RINISH</button>
            </div>
        </motion.div>
    );

    const renderWizStep4 = () => {
        const totalKg = nwData.rolls.reduce((s, r) => s + (Number(r.neto) || 0), 0);
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 style={{ marginBottom: 20 }}>4. Tekshirish va Saqlash</h3>
                <div style={S.card}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}><User size={16} color="#BA68C8" /><b>MIJOZ: {nwData.customer}</b></div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}><Shirt size={16} color="#F06292" /><b>MODEL: {nwData.model}</b></div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}><FileText size={16} color="#00e676" /><b>ZAKAZ: {nwData.orderQty} dona</b></div>
                    <hr style={{ opacity: 0.1, margin: '10px 0' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, opacity: 0.7 }}>
                        <div>O'lchov: {nwData.length}x{nwData.width} sm</div>
                        <div>Qavat: {nwData.layers} ta</div>
                        <div>Rulon: {nwData.rolls.length} ta</div>
                        <div>Jami: {totalKg.toFixed(1)} kg</div>
                    </div>
                </div>
                <h3>Ishlatiladigan Rulonlar:</h3>
                {nwData.rolls.map(r => (
                    <div key={r.id} style={{ fontSize: 12, marginBottom: 5, padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                        #{r.id} {r.fabric_name} ({r.color}) - {r.neto} kg
                    </div>
                ))}

                <div style={{ display: 'flex', gap: 10, marginTop: 25 }}>
                    <button onClick={() => setNwStep(3)} style={{ ...S.btn, background: '#333', color: '#fff' }}>TAHRIRLASH</button>
                    <button onClick={async () => {
                        setIsSaving(true);
                        try {
                            const totalKg = nwData.rolls.reduce((s, r) => s + (Number(r.neto) || 0), 0);
                            const notes = JSON.stringify({
                                customer: nwData.customer, model: nwData.model, orderQty: nwData.orderQty,
                                dims: `${nwData.length}x${nwData.width}`, layers: nwData.layers,
                                rolls: nwData.rolls.map(r => r.id)
                            });
                            await supabase.from('warehouse_log').insert({
                                item_name: `NASTIL: ${nwData.customer} / ${nwData.model}`,
                                quantity: totalKg,
                                action_type: 'NASTIL',
                                notes: notes
                            });
                            // Update rolls status
                            await Promise.all(nwData.rolls.map(r => supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', r.id)));
                            showMsg("Nastil saqlandi! ✂️"); setShowNastilWizard(false); setNwStep(1); setNwData({ customer: '', model: '', orderQty: '', rolls: [], length: '', width: '', layers: '' }); load(true);
                        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
                    }} style={{ ...S.btn, background: '#00e676', color: '#fff' }}>TASDIQLASH VA SAQLASH</button>
                </div>
            </motion.div>
        );
    }

    const renderNastilTab = () => (
        <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: '1000' }}>Nastil <span style={{ color: '#F06292' }}>Wizard</span></h2>
                <button onClick={() => { setShowNastilWizard(true); setNwStep(1); }} style={{ background: '#F06292', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: 16, fontWeight: '900', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={20} /> YANGI NASTIL
                </button>
            </div>

            {logs.filter(l => l.action_type === 'NASTIL').slice(0, 10).map(l => {
                let n = {}; try { n = JSON.parse(l.notes); } catch (e) { }
                return (
                    <div key={l.id} style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontWeight: '900', fontSize: 17 }}>{n.customer || 'Noma\'lum'}</div>
                                <div style={{ fontSize: 12, color: '#F06292' }}>{n.model} | {n.orderQty} dona</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <b>{l.quantity} kg</b>
                                <div style={{ fontSize: 10, opacity: 0.4 }}>{new Date(l.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                );
            })}

            <AnimatePresence>
                {showNastilWizard && (
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ position: 'fixed', inset: 0, background: '#0a0a20', zIndex: 20000, padding: 25, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
                            <button onClick={() => setShowNastilWizard(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[1, 2, 3, 4].map(s => <div key={s} style={S.stepDot(nwStep >= s)} />)}
                            </div>
                            <div style={{ width: 40 }} />
                        </div>
                        {nwStep === 1 && renderWizStep1()}
                        {nwStep === 2 && renderWizStep2()}
                        {nwStep === 3 && renderWizStep3()}
                        {nwStep === 4 && renderWizStep4()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // --- OTHER TABS (Simplified) ---
    const renderOmborTab = () => (
        <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
            <h2 style={{ marginBottom: 25, fontSize: 26, fontWeight: '1000' }}>Ombor 🏢</h2>
            <div style={S.toggle}>
                <button onClick={() => setOmborCategory('mato')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'mato' ? '#F06292' : 'none', color: '#fff', fontWeight: 'bold' }}>MATO</button>
                <button onClick={() => setOmborCategory('aksesuvar')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'aksesuvar' ? '#BA68C8' : 'none', color: '#fff', fontWeight: 'bold' }}>AKSESUAR</button>
            </div>
            {omborCategory === 'mato' ? (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
                        <div onClick={() => setMatoSubTab('bruto')} style={{ ...S.card, marginBottom: 0, border: matoSubTab === 'bruto' ? '2px solid #BA68C8' : 'none' }}>BRUTO: {totalBrutoKg.toFixed(0)}</div>
                        <div onClick={() => setMatoSubTab('neto')} style={{ ...S.card, marginBottom: 0, border: matoSubTab === 'neto' ? '2px solid #00e676' : 'none' }}>NETO: {totalNetoKg.toFixed(0)}</div>
                    </div>
                    {groupFabrics(matoSubTab === 'neto' ? netoRolls : brutoRolls, matoSubTab === 'neto' ? 'neto' : 'bruto').map(g => (
                        <div key={g.id} style={S.card}><b>{g.name}</b> • {g.totalWeight.toFixed(1)} kg</div>
                    ))}
                </div>
            ) : (
                accessories.filter(a => a.target_dept === 'Bichuv bo\'limi').map(a => (
                    <div key={a.id} style={S.card}><b>{a.name}</b> • {a.quantity} {a.unit}</div>
                ))
            )}
        </div>
    );

    switch (tab) {
        case 'nastil': return renderNastilTab();
        case 'ombor': return renderOmborTab();
        case 'history': return (
            <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
                <h2 style={{ marginBottom: 30 }}>Tarix ✨</h2>
                {logs.slice(0, 50).map(l => (
                    <div key={l.id} style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{l.item_name}</b><b style={{ color: '#F06292' }}>{l.quantity} kg</b></div>
                        <div style={{ fontSize: 11, opacity: 0.4, marginTop: 5 }}>{l.notes}</div>
                    </div>
                ))}
            </div>
        );
        default: // Dashboard
            return (
                <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 35 }}>
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
                    </div>
                </div>
            );
    }
}
