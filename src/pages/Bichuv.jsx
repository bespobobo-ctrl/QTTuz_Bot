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
    Timer, Truck, Sparkles, PlusCircle
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

    // --- NASTIL STATES ---
    const [showNastilWizard, setShowNastilWizard] = useState(false);
    const [nWiz, setNWiz] = useState({ length: '', width: '', fabrics: [] });
    const [selFabricForNastil, setSelFabricForNastil] = useState(null); // For adding to list
    const [layerInputs, setLayerInputs] = useState({ count: '', kgPerLayer: '' });

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
            const date = new Date(l.created_at);
            if (period === 'day') return date.toDateString() === now.toDateString();
            if (period === 'week') return (now - date) / (1000 * 60 * 60 * 24) <= 7;
            if (period === 'month') return (now - date) / (1000 * 60 * 60 * 24) <= 30;
            return true;
        });
        let pieces = 0;
        filtered.forEach(l => {
            try { pieces += Number(l.notes?.match(/Dona: (\d+)/)?.[1] || 0); } catch (e) { }
        });
        return { pieces, items: filtered };
    };

    // --- NASTIL HANDLERS ---
    const addFabricToNastil = () => {
        if (!selFabricForNastil || !layerInputs.count || !layerInputs.kgPerLayer) return;
        setNWiz({
            ...nWiz,
            fabrics: [...nWiz.fabrics, {
                ...selFabricForNastil,
                layers: Number(layerInputs.count),
                kgPerLayer: Number(layerInputs.kgPerLayer),
                totalKg: Number(layerInputs.count) * Number(layerInputs.kgPerLayer)
            }]
        });
        setSelFabricForNastil(null);
        setLayerInputs({ count: '', kgPerLayer: '' });
    };

    const saveNastil = async () => {
        if (!nWiz.length || nWiz.fabrics.length === 0) return showMsg("Ma'lumotlar yetarli emas", "err");
        setIsSaving(true);
        try {
            const totalKg = nWiz.fabrics.reduce((s, f) => s + f.totalKg, 0);
            const totalLayers = nWiz.fabrics.reduce((s, f) => s + f.layers, 0);
            const notes = `Uzunlik: ${nWiz.length}, Eni: ${nWiz.width}, Qavatlar: ${totalLayers}, Matolar: ${nWiz.fabrics.map(f => `${f.name}(${f.layers})`).join(', ')}`;

            await supabase.from('warehouse_log').insert({
                item_name: 'NASTIL TASHASH',
                quantity: totalKg,
                action_type: 'NASTIL',
                notes: notes
            });

            showMsg("Nastil saqlandi! ✅");
            setNWiz({ length: '', width: '', fabrics: [] });
            setShowNastilWizard(false);
            load(true);
        } catch (e) { alert(e.message); }
        setIsSaving(false);
    };

    // --- RENDERS ---

    const renderNastilTab = () => (
        <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: '1000' }}>Nastil <span style={{ color: '#F06292' }}>Bo'limi</span></h2>
                <button onClick={() => setShowNastilWizard(true)} style={{ background: '#F06292', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: 16, fontWeight: '900', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PlusCircle size={20} /> YANGI NASTIL
                </button>
            </div>

            <h3 style={{ fontSize: 14, opacity: 0.4, marginBottom: 15 }}>SO'NGI NASTILLAR</h3>
            {logs.filter(l => l.action_type === 'NASTIL').slice(0, 5).map(l => (
                <div key={l.id} style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '900', fontSize: 17 }}>Nastil #{l.id}</div>
                            <div style={{ fontSize: 11, color: '#888', marginTop: 5 }}>{l.notes}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: '1000', color: '#F06292' }}>{l.quantity} <small>kg</small></div>
                            <div style={{ fontSize: 9, opacity: 0.4 }}>{new Date(l.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            ))}

            <AnimatePresence>
                {showNastilWizard && (
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 20000, padding: 25, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                            <button onClick={() => setShowNastilWizard(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                            <h2 style={{ margin: 0 }}>Yangi Nastil 📏</h2>
                            <div style={{ width: 40 }} />
                        </div>

                        <div style={S.card}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>UZUNLIK (SM)</label><input type="number" style={S.input} value={nWiz.length} onChange={e => setNWiz({ ...nWiz, length: e.target.value })} placeholder="Masalan: 350" /></div>
                                <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>ENI (SM)</label><input type="number" style={S.input} value={nWiz.width} onChange={e => setNWiz({ ...nWiz, width: e.target.value })} placeholder="Masalan: 190" /></div>
                            </div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <h3 style={{ fontSize: 16, fontWeight: '900', marginBottom: 15 }}>Matolar Ro'yxati</h3>
                            {nWiz.fabrics.map((f, i) => (
                                <div key={i} style={{ ...S.card, padding: 15, background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{f.name} ({f.color})</div>
                                            <div style={{ fontSize: 11, color: '#888' }}>{f.layers} qavat • {f.kgPerLayer} kg/qavat</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <b style={{ color: '#00e676' }}>{f.totalKg.toFixed(1)} kg</b>
                                            <button onClick={() => setNWiz({ ...nWiz, fabrics: nWiz.fabrics.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: '#ff5252', marginLeft: 15 }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button onClick={() => setSelFabricForNastil({})} style={{ ...S.btn, background: 'none', border: '2px dashed rgba(255,255,255,0.1)', color: '#BA68C8', marginTop: 10 }}>
                                <Plus size={20} /> MATO QO'SHISH
                            </button>
                        </div>

                        <div style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 25 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <span style={{ fontSize: 18, color: '#888' }}>Jami Neto Vazn:</span>
                                <b style={{ fontSize: 24, color: '#00e676' }}>{nWiz.fabrics.reduce((s, f) => s + f.totalKg, 0).toFixed(1)} kg</b>
                            </div>
                            <button onClick={saveNastil} disabled={isSaving || nWiz.fabrics.length === 0} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>
                                {isSaving ? 'SAQLANMOQDA...' : 'NASTILNI SAQLASH'}
                            </button>
                        </div>

                        {/* Fabric Selection Overlay */}
                        <AnimatePresence>
                            {selFabricForNastil && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 21000, padding: 25 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <h3>Matoni tanlang</h3>
                                        <button onClick={() => setSelFabricForNastil(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                                    </div>
                                    {!selFabricForNastil.name ? (
                                        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                            {groupFabrics(netoRolls, 'neto').map(g => (
                                                <div key={g.id} onClick={() => setSelFabricForNastil(g)} style={S.card}>
                                                    <b>{g.name} ({g.color})</b>
                                                    <div style={{ fontSize: 11, opacity: 0.5 }}>Mavjud: {g.totalWeight.toFixed(1)} kg</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={S.card}>
                                            <h2 style={{ marginBottom: 20 }}>{selFabricForNastil.name} ({selFabricForNastil.color})</h2>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                                <div><label style={{ fontSize: 11, color: '#888' }}>QAVAT SONI</label><input type="number" style={S.input} value={layerInputs.count} onChange={e => setLayerInputs({ ...layerInputs, count: e.target.value })} placeholder="30" /></div>
                                                <div><label style={{ fontSize: 11, color: '#888' }}>1 QAVAT KG</label><input type="number" style={S.input} value={layerInputs.kgPerLayer} onChange={e => setLayerInputs({ ...layerInputs, kgPerLayer: e.target.value })} placeholder="0.25" /></div>
                                            </div>
                                            <button onClick={addFabricToNastil} style={{ ...S.btn, background: '#00e676', color: '#fff', marginTop: 10 }}>QU'SHISH</button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // --- OTHER TABS (Already implemented or simple blocks) ---

    // TAB SWITCHER
    switch (tab) {
        case 'nastil': return renderNastilTab();
        case 'ombor':
            if (tab === 'ombor') { /* Reuse existing ombor logic */ }
            // Since combined function, I'll just keep the switch structure
            return (
                <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                        <h2 style={{ margin: 0, fontSize: 26, fontWeight: '1000' }}>Ombor 🏢</h2>
                    </div>
                    <div style={S.toggle}>
                        <button onClick={() => setOmborCategory('mato')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'mato' ? '#F06292' : 'none', color: '#fff', fontWeight: 'bold' }}>MATOLAR</button>
                        <button onClick={() => setOmborCategory('aksesuvar')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: omborCategory === 'aksesuvar' ? '#BA68C8' : 'none', color: '#fff', fontWeight: 'bold' }}>AKSESUAR</button>
                    </div>
                    {omborCategory === 'mato' ? (
                        <div>
                            {groupFabrics(matoSubTab === 'neto' ? netoRolls : brutoRolls, matoSubTab === 'neto' ? 'neto' : 'bruto').map(g => (
                                <div key={g.id} onClick={() => setSelectedGroup({ ...g, category: matoSubTab })} style={S.card}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div><b>{g.name}</b><div style={{ fontSize: 12, color: '#888' }}>{g.color}</div></div>
                                        <b style={{ color: matoSubTab === 'neto' ? '#00e676' : '#fff' }}>{g.totalWeight.toFixed(1)} kg</b>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        accessories.filter(a => a.target_dept === 'Bichuv bo\'limi').map(a => (
                            <div key={a.id} style={S.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div><b>{a.name}</b></div>
                                    <b>{a.quantity} {a.unit}</b>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            );
        case 'history':
            return (
                <div style={{ padding: '20px 20px 120px 20px', minHeight: '100vh', background: '#0a0a14' }}>
                    <h2 style={{ marginBottom: 30 }}>Tarih 📜</h2>
                    {logs.slice(0, 50).map(l => (
                        <div key={l.id} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <b>{l.item_name}</b>
                                <b style={{ color: l.action_type === 'BICHUV' ? '#F06292' : '#00e676' }}>{l.quantity} kg</b>
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 5 }}>{l.notes} • {new Date(l.created_at).toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            );
        default: // Dashboard
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
                            <div style={S.statBox}><div>BUGUN</div><b>{getStatsByPeriod('day').pieces}</b></div>
                            <div style={S.statBox}><div>HAFTA</div><b>{getStatsByPeriod('week').pieces}</b></div>
                            <div style={S.statBox}><div>OY</div><b>{getStatsByPeriod('month').pieces}</b></div>
                        </div>
                    </div>
                </div>
            );
    }
}
