import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import {
    Package, Calendar, ChevronRight,
    Printer, AlertCircle, PlusCircle, Download, CheckCircle2,
    Users, Palette, AlertTriangle, TrendingUp, Info, Trash2, Edit3, History, Clock, Archive, ClipboardCheck, Scale
} from 'lucide-react';

export default function MatoOmboriPanel({ tab, data, load, showMsg }) {
    const [activeBatch, setActiveBatch] = useState(null);
    const [newRollWeight, setNewRollWeight] = useState('');
    const [printBatchRolls, setPrintBatchRolls] = useState(null);
    const [dashTab, setDashTab] = useState('season'); // 'season', 'status', 'suppliers', 'alerts', 'brak', 'orders', 'remains'
    const [selQuarter, setSelQuarter] = useState(null);
    const [selNetoGroup, setSelNetoGroup] = useState(null);
    const [verdict, setVerdict] = useState(null); // 'ombor', 'supplier'
    const [isEdit, setIsEdit] = useState(false);
    const [editID, setEditID] = useState(null);
    const [statusView, setStatusView] = useState('bruto'); // 'bruto', 'neto'
    const [unitView, setUnitView] = useState('kg'); // 'kg', 'meter'
    const [selStatusType, setSelStatusType] = useState(null);
    const [selStatusColor, setSelStatusColor] = useState(null);
    const [selSupplier, setSelSupplier] = useState(null);
    const [activeNetoBatch, setActiveNetoBatch] = useState(null);
    const [editingRoll, setEditingRoll] = useState(null);
    const [rollForm, setRollForm] = useState({ neto: '', en: '', gramaj: '' });

    // Kirim (Yangi Partiya) Formasi uchun state
    const [f, setF] = useState({ bn: '', eC: '', eW: '', sup: '', c: '', type: '2 IPPL', unit: 'kg', g: '' });
    const [fabricTypes, setFabricTypes] = useState(['2 IPPL', '3 IP Kashkors', 'Bingall', 'Rebana', 'Elastik', 'Salfetka', 'Suprem']);
    const [isAddingType, setIsAddingType] = useState(false);
    const [newType, setNewType] = useState('');

    // Fetch and sync fabric types
    React.useEffect(() => {
        const fetchTypes = async () => {
            const { data: cfg } = await supabase.from('system_config').select('value').eq('key', 'fabric_types').single();
            if (cfg && cfg.value) {
                try {
                    const parsed = JSON.parse(cfg.value);
                    if (Array.isArray(parsed)) setFabricTypes(parsed);
                } catch (e) { console.error("Parse error:", e); }
            }
        };
        fetchTypes();
    }, []);

    const saveFabricTypes = async (newList) => {
        setFabricTypes(newList);
        await supabase.from('system_config').upsert({ key: 'fabric_types', value: JSON.stringify(newList) }, { onConflict: 'key' });
    };

    const handleAddType = () => {
        if (newType && !fabricTypes.includes(newType)) {
            const newList = [...fabricTypes, newType];
            saveFabricTypes(newList);
            setF({ ...f, type: newType });
            setNewType('');
            setIsAddingType(false);
        }
    };

    // Umumiy Dizayn (Stil) moslamalari
    const S = {
        card: { background: '#12121e', padding: 18, borderRadius: 20, border: '1px solid #2a2a40', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: 20 },
        input: { width: '100%', padding: '15px 20px', background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', outline: 'none', fontSize: 16, boxSizing: 'border-box', marginBottom: 15 },
        primaryBtn: { padding: '14px 24px', background: '#81C784', color: '#000', borderRadius: 14, border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(129, 199, 132, 0.3)', width: '100%' },
        badge: (ok) => ({ padding: '4px 10px', background: ok ? 'rgba(129,199,132,0.1)' : 'rgba(255,171,64,0.1)', color: ok ? '#81C784' : '#FFAB40', borderRadius: 8, fontSize: 11, fontWeight: 'bold' }),
        printOverlay: { position: 'fixed', inset: 0, background: '#fff', zIndex: 99999, overflowY: 'auto', padding: 20, color: '#000' }
    };

    const batches = data.whBatches || [];
    const rolls = data.whRolls || [];

    const parseColor = (str) => {
        const s = String(str || '');
        if (!s) return { c: '', type: '', unit: 'kg', g: '' };
        if (s.includes('|')) {
            const [type, col, unit, gramaj] = s.split('|').map(x => x.trim());
            return { type, c: col, unit: unit || 'kg', g: gramaj || '' };
        }
        return { type: '', c: s, unit: 'kg', g: '' };
    };

    const handleKirim = async () => {
        if (!f.bn || !f.sup || !f.eW) return showMsg('Barcha maydonlarni to\'ldiring', 'err');
        try {
            if (isEdit) {
                const { error: err1 } = await supabase.from('warehouse_batches').update({
                    batch_number: f.bn,
                    supplier_name: f.sup,
                    expected_weight: Number(f.eW),
                    expected_count: Number(f.eC),
                    color: `${f.type} | ${f.c} | ${f.unit} | ${f.g}`
                }).eq('id', editID);
                if (err1) throw err1;
                showMsg('Partiya muvaffaqiyatli tahrirlandi!');
            } else {
                const { data: newBatch, error: err2 } = await supabase.from('warehouse_batches').insert({
                    batch_number: f.bn,
                    supplier_name: f.sup,
                    expected_weight: Number(f.eW),
                    expected_count: Number(f.eC),
                    color: `${f.type} | ${f.c} | ${f.unit} | ${f.g}`
                }).select().single();
                if (err2) throw err2;

                const { error: logErr } = await supabase.from('warehouse_log').insert({
                    batch_id: newBatch.id,
                    item_name: `YANGI PARTIYA: ${f.bn}`,
                    quantity: Number(f.eW),
                    action_type: 'KIRIM'
                });
                if (logErr) console.error("Kirim log error:", logErr);
                await load(true);
                showMsg('Yangi partiya muvaffaqiyatli qo\'shildi!');
            }
            setF({ bn: '', eC: '', eW: '', sup: '', c: '', type: '2 IPPL', unit: 'kg', g: '' });
            setIsEdit(false);
            setEditID(null);
        } catch (e) { showMsg('Xato yuz berdi', 'err'); }
    };

    const handleDeleteBatch = async (id, bn) => {
        if (!window.confirm(`${bn} partiyani o'chirmoqchimisiz? BU BARCHA RULONLARNI HAM O'CHIRIB YUBORADI!`)) return;
        try {
            await supabase.from('warehouse_rolls').delete().eq('batch_id', id);
            const { error } = await supabase.from('warehouse_batches').delete().eq('id', id);
            const { error: logErr } = await supabase.from('warehouse_log').insert({
                item_name: `PARTIYA O'CHIRILDI: ${bn}`,
                action_type: 'DELETE'
            });
            if (logErr) console.error("Delete batch log error:", logErr);
            showMsg('Partiya o\'chirildi');
            load(true);
        } catch (e) { showMsg('Ochirishda xato', 'err'); }
    };

    const handleDeleteRoll = async (roll) => {
        if (!window.confirm(`Rulonni (Neto: ${roll.neto}) o'chirmoqchimisiz?`)) return;
        try {
            await supabase.from('warehouse_rolls').delete().eq('id', roll.id);
            const { error: logErr } = await supabase.from('warehouse_log').insert({
                item_name: `RULON O'CHIRILDI (ID: ${roll.id})`,
                action_type: 'DELETE'
            });
            if (logErr) console.error("Delete roll log error:", logErr);
            showMsg("Rulon o'chirildi");
            load(true);
        } catch (e) { showMsg("O'chirishda xato", "err"); }
    };

    const handleSaveRollEdit = async () => {
        try {
            const { error } = await supabase.from('warehouse_rolls').update({
                neto: Number(rollForm.neto),
                en: Number(rollForm.en),
                gramaj: rollForm.gramaj
            }).eq('id', editingRoll.id);
            if (error) throw error;
            showMsg("Rulon o'zgartirildi!");
            setEditingRoll(null);
            load(true);
        } catch (e) { showMsg("Saqlashda xato", "err"); }
    };

    const handleAddRoll = async () => {
        if (!newRollWeight || isNaN(newRollWeight) || Number(newRollWeight) <= 0) {
            return showMsg('Noto\'g\'ri qiymat kiritildi!', 'err');
        }
        const { type, c, unit, g } = parseColor(activeBatch.color);
        try {
            const payload = {
                batch_id: activeBatch.id,
                batch_number: activeBatch.batch_number,
                bruto: Number(newRollWeight),
                status: 'BRUTO',
                fabric_name: type,
                color: c,
                gramaj: g,
                color_code: unit
            };
            const { data: nr, error } = await supabase.from('warehouse_rolls').insert([payload]).select().single();
            if (error) throw error;

            await supabase.from('warehouse_log').insert({
                batch_id: activeBatch.id,
                item_name: `RULON BRUTO: ${activeBatch.batch_number}`,
                quantity: Number(newRollWeight),
                action_type: 'WEIGHT_BRUTO'
            });

            setNewRollWeight('');
            showMsg('Rulon omborga qo\'shildi!');
            load(true);
        } catch (e) {
            showMsg('Saqlashda xatolik!', 'err');
        }
    };

    const renderKirim = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#81C784' }}>
                <Download size={24} /> {isEdit ? "Partiyani Tahrirlash" : "Yangi Partiya Kirimi"}
            </h2>
            <div style={S.card}>
                <input style={S.input} placeholder="Partiya raqami (masalan: P-99)" value={f.bn} onChange={e => setF({ ...f, bn: e.target.value })} required />
                <input style={S.input} placeholder="Ta'minotchi (kimdan keldi?)" value={f.sup} onChange={e => setF({ ...f, sup: e.target.value })} required />

                <div style={{ marginBottom: 15 }}>
                    <label style={{ fontSize: 12, color: '#81C784', display: 'block', marginBottom: 5 }}>Mato turi:</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <select
                            style={{ ...S.input, marginBottom: 0, flex: 1, color: '#fff', background: '#1a1a2e' }}
                            value={f.type}
                            onChange={e => setF({ ...f, type: e.target.value })}
                        >
                            {fabricTypes.map(t => <option key={t} value={t} style={{ background: '#1a1a2e' }}>{t}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={() => setIsAddingType(true)}
                            style={{ ...S.primaryBtn, width: 'auto', padding: '0 15px' }}
                        >
                            +
                        </button>
                    </div>
                </div>

                {isAddingType && (
                    <div style={{ marginBottom: 15, display: 'flex', gap: 10 }}>
                        <input
                            style={{ ...S.input, marginBottom: 0, flex: 1 }}
                            placeholder="Yangi mato turi"
                            value={newType}
                            onChange={e => setNewType(e.target.value)}
                        />
                        <button type="button" onClick={handleAddType} style={{ ...S.primaryBtn, width: 'auto' }}>QO'SHISH</button>
                        <button type="button" onClick={() => setIsAddingType(false)} style={{ ...S.primaryBtn, width: 'auto', background: '#555' }}>X</button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input style={S.input} placeholder="Rangi (masalan: Qora, Oq)" value={f.c} onChange={e => setF({ ...f, c: e.target.value })} required />
                    <input style={S.input} type="number" placeholder="Gramaj (masalan: 240)" value={f.g} onChange={e => setF({ ...f, g: e.target.value })} required />
                </div>

                <div style={{ marginBottom: 15 }}>
                    <label style={{ fontSize: 12, color: '#81C784', display: 'block', marginBottom: 5 }}>O'lchov birligi:</label>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="radio" name="unit" value="kg" checked={f.unit === 'kg'} onChange={() => setF({ ...f, unit: 'kg' })} /> KG
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="radio" name="unit" value="meter" checked={f.unit === 'meter'} onChange={() => setF({ ...f, unit: 'meter' })} /> METIR
                        </label>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input style={S.input} type="number" placeholder="Jami Rulon (dona)" value={f.eC} onChange={e => setF({ ...f, eC: e.target.value })} required />
                    <input style={S.input} type="number" placeholder={f.unit === 'kg' ? "Jami Vazn (KG)" : "Jami Metir"} value={f.eW} onChange={e => setF({ ...f, eW: e.target.value })} required />
                </div>
                <button onClick={handleKirim} style={S.primaryBtn}>
                    <PlusCircle size={20} /> {isEdit ? "O'ZGARIHLARNI SAQLASH" : "PARTIYANI QABUL QILISH"}
                </button>
                {isEdit && (
                    <button onClick={() => { setIsEdit(false); setF({ bn: '', eC: '', eW: '', sup: '', c: '', type: '2 IPPL', unit: 'kg' }); }} style={{ ...S.primaryBtn, background: '#333', marginTop: 10 }}>
                        BEKOR QILISH
                    </button>
                )}
            </div>
        </motion.div>
    );

    const getSeason = (fabricType, gramaj) => {
        const ft = (fabricType || '').toLowerCase();
        const gr = parseInt(gramaj) || 0;

        // User's specific Quarter rules:
        // 1 Chorak: Apr, May, Jun -> 180g, Bingal, Suprem
        if (ft.includes('bingal') || ft.includes('suprem') || ft.includes('180')) return '1-CHORAK (Apr-Iyun)';

        // 2 Chorak: Jul, Aug, Sep -> 240g, 260g, Elastic
        if (ft.includes('elastik') || gr === 240 || gr === 260) {
            // We'll differentiate by season/usage - if it's 240/260 and not winter type
            if (!ft.includes('3 ipli')) return '2-CHORAK (Iyul-Sent)';
        }

        // 3 Chorak: Oct, Nov, Dec -> 3-ply, Kashmir, Nachos
        if (ft.includes('3 ipli') || ft.includes('kashmir') || ft.includes('nachos')) return '3-CHORAK (Okt-Dek)';

        // 4 Chorak: Jan, Feb, Mar -> 240g, 260g (Remaining)
        return '4-CHORAK (Yan-Mar)';
    };

    const renderSummaryDashboard = () => {
        // Group data for various sections
        const seasonalStats = {};
        const supplierStats = {};
        const stockStats = {}; // To find low stock
        const brakRolls = rolls.filter(r => r.status === 'BRAK');
        const orders = data.whOrders || [];

        rolls.forEach(r => {
            const fabricType = r.fabric_name || 'Noma\'lum';
            const gramaj = r.gramaj || '---';
            const rollUnit = r.color_code || 'kg';
            const season = getSeason(fabricType, gramaj);
            const rollColor = r.color || 'Noma\'lum';

            // Seasonal calculations
            const seasonKey = `${season}_${fabricType}_${gramaj}_${rollColor}`;
            if (!seasonalStats[seasonKey]) {
                seasonalStats[seasonKey] = { season, type: fabricType, gramaj, color: rollColor, bruto: 0, neto: 0, count: 0, unit: rollUnit };
            }
            seasonalStats[seasonKey].bruto += (Number(r.bruto) || 0);
            seasonalStats[seasonKey].neto += (Number(r.neto) || 0);
            seasonalStats[seasonKey].count += 1;

            // Supplier calculations
            const batch = batches.find(b => b.id === r.batch_id);
            const supName = batch?.supplier_name || 'Noma\'lum';
            const supKey = `${supName}_${fabricType}_${rollColor}_${gramaj}`;
            if (!supplierStats[supKey]) {
                supplierStats[supKey] = { sup: supName, type: fabricType, color: rollColor, gramaj, bruto: 0, neto: 0, brak: 0, unit: rollUnit };
            }
            supplierStats[supKey].bruto += (Number(r.bruto) || 0);
            supplierStats[supKey].neto += (Number(r.neto) || 0);
            if (r.status === 'BRAK') supplierStats[supKey].brak += 1;

            // Stock tracking (only for products currently in stock - status 'KONTROLDAN_OTDI')
            if (r.status === 'KONTROLDAN_OTDI') {
                const stockKey = `${fabricType}_${rollColor}_${gramaj}`;
                if (!stockStats[stockKey]) {
                    stockStats[stockKey] = { type: fabricType, color: rollColor, gramaj, totalNeto: 0, unit: rollUnit };
                }
                stockStats[stockKey].totalNeto += (Number(r.neto) || 0);
            }
        });

        const lowStock = Object.values(stockStats).filter(s => {
            const isPopular = ['qora', 'to\'q ko\'k', 'mokriy', 'dark blue'].some(c => s.color.toLowerCase().includes(c));
            const threshold = isPopular ? 2000 : 200;
            return s.totalNeto < threshold;
        });

        const subTabs = [
            { id: 'season', l: 'Sezoniy Analiz', icon: Calendar },
            { id: 'status', l: 'Ombor Holati', icon: Package },
            { id: 'suppliers', l: 'Ta\'minotchilar', icon: Users },
            { id: 'alerts', l: 'Kamayganlar', icon: AlertTriangle, count: lowStock.length },
            { id: 'brak', l: 'Braklar', icon: AlertCircle, count: brakRolls.length },
            { id: 'orders', l: 'Zakazlar', icon: TrendingUp },
            { id: 'reports', l: 'Hisobotlar', icon: ClipboardCheck },
            { id: 'remains', l: 'Qoldiqlar', icon: Info }
        ];

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', overflowX: 'auto', gap: 10, marginBottom: 20, paddingBottom: 10, scrollbarWidth: 'none' }}>
                    {subTabs.map(t => (
                        <button key={t.id} onClick={() => setDashTab(t.id)} style={{
                            flexShrink: 0, padding: '10px 15px', borderRadius: 12, border: 'none',
                            background: dashTab === t.id ? '#81C784' : 'rgba(255,255,255,0.05)',
                            color: dashTab === t.id ? '#000' : '#888',
                            fontSize: 12, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                        }}>
                            <t.icon size={16} />
                            {t.l} {t.count > 0 && <span style={{ background: '#ff5252', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{t.count}</span>}
                        </button>
                    ))}
                </div>

                {dashTab === 'status' && (
                    <div style={{ display: 'grid', gap: 15 }}>
                        {/* Unit Toggle */}
                        <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.05)', padding: 5, borderRadius: 12 }}>
                            <button onClick={() => { setUnitView('kg'); setSelStatusType(null); setSelStatusColor(null); }} style={{ flex: 1, padding: 8, borderRadius: 10, border: 'none', background: unitView === 'kg' ? '#fff' : 'none', color: unitView === 'kg' ? '#000' : '#888', fontWeight: 'bold', fontSize: 11 }}>Vazn (KG)</button>
                            <button onClick={() => { setUnitView('meter'); setSelStatusType(null); setSelStatusColor(null); }} style={{ flex: 1, padding: 8, borderRadius: 10, border: 'none', background: unitView === 'meter' ? '#fff' : 'none', color: unitView === 'meter' ? '#000' : '#888', fontWeight: 'bold', fontSize: 11 }}>Metir (M)</button>
                        </div>

                        {/* Status Toggle */}
                        <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.05)', padding: 5, borderRadius: 12 }}>
                            <button onClick={() => { setStatusView('bruto'); setSelStatusType(null); setSelStatusColor(null); }} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: statusView === 'bruto' ? (unitView === 'kg' ? '#FFAB40' : '#4FC3F7') : 'none', color: statusView === 'bruto' ? '#000' : '#888', fontWeight: 'bold', fontSize: 12 }}>{unitView.toUpperCase()} BRUTO</button>
                            <button onClick={() => { setStatusView('neto'); setSelStatusType(null); setSelStatusColor(null); }} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: statusView === 'neto' ? '#81C784' : 'none', color: statusView === 'neto' ? '#000' : '#888', fontWeight: 'bold', fontSize: 12 }}>{unitView.toUpperCase()} NETO</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div style={{ ...S.card, textAlign: 'center', marginBottom: 0, borderColor: statusView === 'bruto' ? (unitView === 'kg' ? '#FFAB40' : '#4FC3F7') : '#81C784' }}>
                                <div style={{ color: statusView === 'bruto' ? (unitView === 'kg' ? '#FFAB40' : '#4FC3F7') : '#81C784', fontSize: 11, fontWeight: 'bold' }}>JAMI {unitView.toUpperCase()}</div>
                                <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                                    {rolls.filter(r => r && (statusView === 'bruto' ? r.status === 'BRUTO' : r.status === 'KONTROLDAN_OTDI') && (r.color_code || 'kg') === unitView).reduce((a, b) => a + (Number(statusView === 'bruto' ? b.bruto : b.neto) || 0), 0).toFixed(1)}
                                    <small style={{ fontSize: 10, opacity: 0.5 }}> {unitView === 'kg' ? 'kg' : 'm'}</small>
                                </div>
                            </div>
                            <div style={{ ...S.card, textAlign: 'center', marginBottom: 0 }}>
                                <div style={{ color: '#aaa', fontSize: 11, fontWeight: 'bold' }}>RULONLAR</div>
                                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{rolls.filter(r => r && (statusView === 'bruto' ? r.status === 'BRUTO' : r.status === 'KONTROLDAN_OTDI') && (r.color_code || 'kg') === unitView).length} <small style={{ fontSize: 10, opacity: 0.5 }}>ta</small></div>
                            </div>
                        </div>

                        {/* Hierarchical View */}
                        <div style={S.card}>
                            {!selStatusType ? (
                                <>
                                    <h3 style={{ margin: '0 0 15px 0', fontSize: 14 }}>Mato turlari ({unitView.toUpperCase()}):</h3>
                                    {Object.entries(
                                        rolls.filter(r => r && (statusView === 'bruto' ? r.status === 'BRUTO' : r.status === 'KONTROLDAN_OTDI') && (r.color_code || 'kg') === unitView)
                                            .reduce((acc, r) => {
                                                const type = r.fabric_name || 'Noma\'lum';
                                                if (!acc[type]) acc[type] = { weight: 0, rolls: 0, unit: unitView === 'kg' ? 'kg' : 'm' };
                                                acc[type].weight += (Number(statusView === 'bruto' ? r.bruto : r.neto) || 0);
                                                acc[type].rolls += 1;
                                                return acc;
                                            }, {})
                                    ).map(([type, s]) => (
                                        <div key={type} onClick={() => setSelStatusType(type)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: 15 }}>{type}</div>
                                                <div style={{ fontSize: 11, color: '#888' }}>{s.rolls} ta rulon</div>
                                            </div>
                                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ fontSize: 16, fontWeight: 'bold', color: statusView === 'bruto' ? (unitView === 'kg' ? '#FFAB40' : '#4FC3F7') : '#81C784' }}>{s.weight.toFixed(0)} <small style={{ fontSize: 10 }}>{s.unit}</small></div>
                                                <ChevronRight size={16} color="#444" />
                                            </div>
                                        </div>
                                    ))}
                                    {rolls.filter(r => r && (statusView === 'bruto' ? r.status === 'BRUTO' : r.status === 'KONTROLDAN_OTDI') && (r.color_code || 'kg') === unitView).length === 0 && <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Ma'lumot yo'q</div>}
                                </>
                            ) : !selStatusColor ? (
                                <>
                                    <button onClick={() => setSelStatusType(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                                        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> {selStatusType} (Orqaga)
                                    </button>
                                    <h3 style={{ margin: '0 0 15px 0', fontSize: 14 }}>Ranglar bo'yicha:</h3>
                                    {Object.entries(
                                        rolls.filter(r => r && (statusView === 'bruto' ? r.status === 'BRUTO' : r.status === 'KONTROLDAN_OTDI') && (r.fabric_name === selStatusType) && (r.color_code || 'kg') === unitView)
                                            .reduce((acc, r) => {
                                                const color = r.color || 'Noma\'lum';
                                                const gramaj = r.gramaj ? `${r.gramaj} gr` : '';
                                                const key = `${color} ${gramaj}`.trim();
                                                if (!acc[key]) acc[key] = { color, gramaj, weight: 0, rolls: 0, unit: unitView === 'kg' ? 'kg' : 'm' };
                                                acc[key].weight += (Number(statusView === 'bruto' ? r.bruto : r.neto) || 0);
                                                acc[key].rolls += 1;
                                                return acc;
                                            }, {})
                                    ).map(([key, s]) => (
                                        <div key={key} onClick={() => setSelStatusColor(key)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Palette size={16} color="#888" />
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{s.color} {s.gramaj && <span style={{ color: '#aaa', fontWeight: 'normal', fontSize: 11 }}>[{s.gramaj}]</span>}</div>
                                                    <div style={{ fontSize: 11, color: '#888' }}>{s.rolls} ta rulon</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{s.weight.toFixed(1)} <small style={{ fontSize: 10 }}>{s.unit}</small></div>
                                                <ChevronRight size={16} color="#444" />
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setSelStatusColor(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                                        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> {selStatusColor} (Orqaga Rangga)
                                    </button>
                                    <h3 style={{ margin: '0 0 15px 0', fontSize: 14 }}>Partiyalar tafsiloti:</h3>
                                    {Object.entries(
                                        rolls.filter(r => r && (statusView === 'bruto' ? r.status === 'BRUTO' : r.status === 'KONTROLDAN_OTDI') && (r.fabric_name === selStatusType) && (r.color_code || 'kg') === unitView)
                                            .reduce((acc, r) => {
                                                const colorKey = `${r.color || 'Noma\'lum'} ${r.gramaj ? `${r.gramaj} gr` : ''}`.trim();
                                                if (colorKey !== selStatusColor) return acc;
                                                const bn = r.batch_number || 'Noma\'lum';
                                                if (!acc[bn]) acc[bn] = { weight: 0, rolls: 0, unit: unitView === 'kg' ? 'kg' : 'm' };
                                                acc[bn].weight += (Number(statusView === 'bruto' ? r.bruto : r.neto) || 0);
                                                acc[bn].rolls += 1;
                                                return acc;
                                            }, {})
                                    ).map(([bn, s]) => (
                                        <div key={bn} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Package size={16} color="#888" />
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>Partiya: {bn}</div>
                                                    <div style={{ fontSize: 11, color: '#888' }}>{s.rolls} ta rulon</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{s.weight.toFixed(1)} <small style={{ fontSize: 10 }}>{s.unit}</small></div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}
                {dashTab === 'season' && (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {selQuarter ? (
                            <>
                                <button onClick={() => setSelQuarter(null)} style={{ background: 'none', border: 'none', color: '#81C784', fontWeight: 'bold', textAlign: 'left', marginBottom: 10, cursor: 'pointer' }}>← ORQAGA (CHORAKLAR)</button>
                                <h3 style={{ margin: '0 0 10px 0' }}>{selQuarter} tafsiloti:</h3>
                                {Object.values(seasonalStats).filter(s => s.season === selQuarter).map((s, i) => (
                                    <div key={i} style={S.card}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{s.type}</div>
                                                <div style={{ color: '#888', fontSize: 12 }}>{s.color} • {s.gramaj} gr</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#81C784' }}>{s.neto.toFixed(1)} {s.unit}</div>
                                                <div style={{ fontSize: 11, color: '#555' }}>Neto Jami</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            ['1-CHORAK (Apr-Iyun)', '2-CHORAK (Iyul-Sent)', '3-CHORAK (Okt-Dek)', '4-CHORAK (Yan-Mar)'].map(q => {
                                const qNeto = Object.values(seasonalStats).filter(s => s.season === q).reduce((a, b) => a + b.neto, 0);
                                const qCount = Object.values(seasonalStats).filter(s => s.season === q).length;
                                return (
                                    <div key={q} style={{ ...S.card, cursor: 'pointer', borderLeft: '5px solid #81C784' }} onClick={() => setSelQuarter(q)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ margin: 0 }}>{q}</h3>
                                                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{qCount} turdagi mato mavjud</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#81C784' }}>{qNeto.toFixed(0)}</div>
                                                <div style={{ fontSize: 10, color: '#555' }}>UMUMIY NETO</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
                {dashTab === 'suppliers' && (
                    <div style={{ display: 'grid', gap: 15 }}>
                        {!selSupplier ? (
                            <>
                                <h3 style={{ margin: '0 0 10px 10px', fontSize: 14, opacity: 0.7 }}>Taminotchilar hisoboti:</h3>
                                {Array.from(new Set(batches.map(b => (b.supplier_name || 'Noma\'lum').trim().toUpperCase()))).map(slug => {
                                    const supName = slug;
                                    const supBatches = batches.filter(b => (b.supplier_name || '').trim().toUpperCase() === slug);
                                    const supRolls = rolls.filter(r => r && supBatches.some(b => b.id === r.batch_id));
                                    const brutoSum = supRolls.filter(r => r.status === 'BRUTO').reduce((a, b) => a + (Number(b.bruto) || 0), 0);
                                    const netoSum = supRolls.filter(r => r.status === 'KONTROLDAN_OTDI').reduce((a, b) => a + (Number(b.neto) || 0), 0);
                                    const brakCount = supRolls.filter(r => r.status === 'BRAK').length;

                                    return (
                                        <div key={supName} onClick={() => setSelSupplier(supName)} style={{ ...S.card, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: 18, color: '#4FC3F7' }}>{supName}</div>
                                                <div style={{ fontSize: 11, color: '#888', marginTop: 5 }}>{supBatches.length} ta partiya • {supRolls.length} ta jami rulon</div>
                                                {brakCount > 0 && <div style={{ fontSize: 10, color: '#ff5252', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} /> {brakCount} ta brak aniqlangan</div>}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{brutoSum.toFixed(0)} <small style={{ fontSize: 10, opacity: 0.5 }}>bruto</small></div>
                                                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#81C784' }}>{netoSum.toFixed(0)} <small style={{ fontSize: 10, opacity: 0.5 }}>neto</small></div>
                                            </div>
                                            <ChevronRight size={20} color="#333" />
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <>
                                <button onClick={() => setSelSupplier(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                                    <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Barcha taminotchilar
                                </button>
                                <div style={{ ...S.card, background: 'rgba(79,195,247,0.05)', borderColor: '#4FC3F7' }}>
                                    <h2 style={{ color: '#4FC3F7', margin: 0 }}>{selSupplier}</h2>
                                    <p style={{ fontSize: 12, color: '#888' }}>Tafsilotli hisobot</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 20 }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 12 }}>
                                            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 'bold' }}>BRUTO JAMI</div>
                                            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{rolls.filter(r => r && (batches.find(b => b.id === r.batch_id)?.supplier_name || '').trim().toUpperCase() === selSupplier && r.status === 'BRUTO').reduce((a, b) => a + (Number(b.bruto) || 0), 0).toFixed(1)} <small style={{ fontSize: 10 }}>kg</small></div>
                                        </div>
                                        <div style={{ background: 'rgba(129,199,132,0.1)', padding: 15, borderRadius: 12 }}>
                                            <div style={{ fontSize: 11, color: '#81C784', fontWeight: 'bold' }}>NETO JAMI</div>
                                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#81C784' }}>{rolls.filter(r => r && (batches.find(b => b.id === r.batch_id)?.supplier_name || '').trim().toUpperCase() === selSupplier && r.status === 'KONTROLDAN_OTDI').reduce((a, b) => a + (Number(b.neto) || 0), 0).toFixed(1)} <small style={{ fontSize: 10 }}>kg</small></div>
                                        </div>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: 14, margin: '20px 0 10px 0' }}>Partiyalar tarixi:</h3>
                                {batches.filter(b => (b.supplier_name || '').trim().toUpperCase() === selSupplier).map(b => {
                                    const bRolls = rolls.filter(r => r.batch_id === b.id);
                                    const bBruto = bRolls.filter(r => r.status === 'BRUTO').reduce((a, x) => a + (Number(x.bruto) || 0), 0);
                                    const bNeto = bRolls.filter(r => r.status === 'KONTROLDAN_OTDI').reduce((a, x) => a + (Number(x.neto) || 0), 0);
                                    return (
                                        <div key={b.id} style={{ ...S.card, padding: 15, marginBottom: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                                <b>{b.batch_number}</b>
                                                <span style={{ fontSize: 11, color: '#888' }}>{new Date(b.arrival_date || b.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                                                <div>Bruto: <b>{bBruto.toFixed(1)}</b></div>
                                                <div style={{ color: '#81C784' }}>Neto: <b>{bNeto.toFixed(1)}</b></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}
                {dashTab === 'alerts' && (
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ ...S.card, background: 'rgba(255,171,64,0.1)', borderColor: '#FFAB40' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#FFAB40' }}>
                                <AlertTriangle size={20} />
                                <b>Zaxira kamaygan matolar</b>
                            </div>
                        </div>
                        {lowStock.map((s, i) => (
                            <div key={i} style={S.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{s.type}</div>
                                        <div style={{ fontSize: 12, color: '#888' }}>{s.color} • {s.gramaj} gr</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff5252' }}>{s.totalNeto.toFixed(1)} {s.unit}</div>
                                        <div style={{ fontSize: 10, color: '#555' }}>QOLDIQ</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {dashTab === 'brak' && (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {brakRolls.map(r => {
                            const batch = batches.find(b => b.id === r.batch_id);
                            const defects = JSON.parse(r.defects || '{}');
                            return (
                                <div key={r.id} style={S.card}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <b>{batch?.supplier_name || '---'}</b>
                                        <span style={{ fontSize: 12, color: '#ff5252' }}>{r.neto_date ? new Date(r.neto_date).toLocaleDateString() : '---'}</span>
                                    </div>
                                    <div style={{ marginTop: 10, fontSize: 13 }}>
                                        {r.fabric_name} • {r.color}
                                        <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                                            {Object.entries(defects).map(([d, c]) => c > 0 && <span key={d} style={{ background: 'rgba(255,82,82,0.1)', color: '#ff5252', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>{d}:{c}</span>)}
                                        </div>
                                    </div>
                                    <button onClick={async () => {
                                        await supabase.from('warehouse_log').insert([{
                                            item_name: `BRAK: ${batch?.supplier_name} - ${r.fabric_name}`,
                                            quantity: r.bruto,
                                            user_name: 'Omborchi',
                                            timestamp: new Date().toISOString()
                                        }]);
                                        showMsg('Rahbarga xabar yuborildi!');
                                    }} style={{ ...S.primaryBtn, background: '#ff5252', color: '#fff', marginTop: 15, fontSize: 12 }}>
                                        RAHBARGA YECHIM UCHUN YUBORISH
                                    </button>
                                </div>
                            )
                        })}
                        {brakRolls.length === 0 && <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Brak matolar yo'q</div>}
                    </div>
                )}
                {dashTab === 'orders' && (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {orders.map(o => (
                            <div key={o.id} style={S.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <b>{o.supplier_name}</b>
                                    <span style={S.badge(o.status === 'RECEIVED')}>{o.status}</span>
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    {o.fabric_type} • {o.color}
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Amaldagi zakazlar yo'q</div>}
                    </div>
                )}
                {dashTab === 'remains' && (
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Butun Rulonlar:</span>
                            <b>{rolls.filter(r => r.status === 'KONTROLDAN_OTDI').length} ta</b>
                        </div>
                        <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Qiyqimlar (Qoldiq):</span>
                            <b>{rolls.filter(r => r.status === 'KONTROLDAN_OTDI' && r.neto < 5).length} ta</b>
                        </div>
                    </div>
                )}
                {dashTab === 'reports' && (
                    <div style={{ display: 'grid', gap: 20 }}>
                        {(() => {
                            const now = new Date();
                            const isDay = d => d && new Date(d).toDateString() === now.toDateString();
                            const isWeek = d => d && (now - new Date(d)) / (1000 * 86400) < 7;
                            const isMonth = d => d && new Date(d).getMonth() === now.getMonth() && new Date(d).getFullYear() === now.getFullYear();
                            const isYear = d => d && new Date(d).getFullYear() === now.getFullYear();

                            const stats = (arr, dateField, weightField = 'bruto', statusFilter = null) => {
                                const f = arr.filter(x => !statusFilter || x.status === statusFilter);
                                return {
                                    day: f.filter(x => isDay(x[dateField])).reduce((a, b) => a + (Number(b[weightField]) || 0), 0),
                                    week: f.filter(x => isWeek(x[dateField])).reduce((a, b) => a + (Number(b[weightField]) || 0), 0),
                                    month: f.filter(x => isMonth(x[dateField])).reduce((a, b) => a + (Number(b[weightField]) || 0), 0),
                                    year: f.filter(x => isYear(x[dateField])).reduce((a, b) => a + (Number(b[weightField]) || 0), 0),
                                    dayCount: f.filter(x => isDay(x[dateField])).length,
                                    weekCount: f.filter(x => isWeek(x[dateField])).length,
                                    monthCount: f.filter(x => isMonth(x[dateField])).length,
                                    yearCount: f.filter(x => isYear(x[dateField])).length
                                };
                            };

                            const kirim = stats(batches.map(b => ({ ...b, d: b.arrival_date || b.created_at })), 'd', 'expected_weight');
                            const kontrol = stats(rolls.map(r => ({ ...r, d: r.neto_date || r.created_at })), 'd', 'neto', 'KONTROLDAN_OTDI');
                            const brak = stats(rolls.map(r => ({ ...r, d: r.neto_date || r.created_at })), 'd', 'bruto', 'BRAK');
                            const tara = stats(rolls.filter(r => r.status === 'KONTROLDAN_OTDI' || r.status === 'BRAK').map(r => ({ ...r, d: r.neto_date || r.created_at })), 'd', 'tara');

                            const ReportSection = ({ title, data, unit = 'kg', icon: Icon, color }) => (
                                <div style={{ ...S.card, borderLeft: `6px solid ${color}`, marginBottom: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, color }}>
                                        <Icon size={20} />
                                        <b style={{ fontSize: 16 }}>{title}</b>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                        <div>
                                            <div style={{ fontSize: 10, color: '#555' }}>BUGUN</div>
                                            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{data.day.toFixed(1)} <small>{unit}</small></div>
                                            {data.dayCount !== undefined && <div style={{ fontSize: 9, opacity: 0.5 }}>{data.dayCount} ta</div>}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: '#555' }}>HAFTALIK</div>
                                            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{data.week.toFixed(1)} <small>{unit}</small></div>
                                            {data.weekCount !== undefined && <div style={{ fontSize: 9, opacity: 0.5 }}>{data.weekCount} ta</div>}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: '#555' }}>OYLIK</div>
                                            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{data.month.toFixed(1)} <small>{unit}</small></div>
                                            {data.monthCount !== undefined && <div style={{ fontSize: 9, opacity: 0.5 }}>{data.monthCount} ta</div>}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, color: '#555' }}>YILLIK</div>
                                            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{data.year.toFixed(1)} <small>{unit}</small></div>
                                            {data.yearCount !== undefined && <div style={{ fontSize: 9, opacity: 0.5 }}>{data.yearCount} ta</div>}
                                        </div>
                                    </div>
                                </div>
                            );

                            return (
                                <>
                                    <ReportSection title="KIRIM (KUTILAYOTGAN)" data={kirim} icon={Download} color="#4FC3F7" />
                                    <ReportSection title="KONTROL (TAYYOR)" data={kontrol} icon={CheckCircle2} color="#81C784" />
                                    <ReportSection title="BRAK (CHIQUVCHI)" data={brak} icon={AlertCircle} color="#ff5252" />
                                    <ReportSection title="TARA (O'RAM VAZNI)" data={tara} icon={Archive} color="#FFAB40" />
                                </>
                            );
                        })()}
                    </div>
                )}
            </motion.div>
        );
    }

    const renderStock = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package color="#FFAB40" /> Bruto Matolar (Partiyalar)
            </h2>

            {batches.filter(batch => {
                const batchRolls = rolls.filter(r => String(r.batch_id) === String(batch.id));
                const hasBruto = batchRolls.some(r => r.status === 'BRUTO');
                // Yangi partiya bo'lsa (rulon = 0) yoki tugallanmagan bo'lsa ko'rsatish
                const isUnfinished = batch.expected_count === 0 || batchRolls.length < (batch.expected_count || 1);
                return batchRolls.length === 0 || hasBruto || isUnfinished;
            }).map(batch => {
                const batchRolls = rolls.filter(r => String(r.batch_id) === String(batch.id));
                const doneCount = batchRolls.length;
                const totalCount = batch.expected_count || 0;

                // Hisoblangan Kg lar
                const totalBrutoKg = batchRolls.reduce((sum, r) => sum + (Number(r.bruto) || 0), 0);
                const expectedWeight = batch.expected_weight || 0;

                const isComplete = doneCount >= totalCount && totalCount > 0;
                const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

                return (
                    <div key={batch.id} style={{ ...S.card, cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => { setVerdict(null); setActiveBatch(batch); }}>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 4, background: '#1a1a2e', width: '100%' }}>
                            <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: isComplete ? '#81C784' : '#FFAB40', transition: 'width 0.5s' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Package size={20} color="#FFAB40" />
                                <span style={{ fontSize: 18, fontWeight: 'bold' }}>{batch.batch_number}</span>
                                <span style={S.badge(isComplete)}>
                                    {isComplete ? 'TAYYOR ✅' : 'JARAYONDA ⏳'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }} onClick={e => e.stopPropagation()}>
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    const pc = parseColor(batch.color);
                                    setF({ bn: batch.batch_number, sup: batch.supplier_name, eW: batch.expected_weight, eC: batch.expected_count, type: pc.type, c: pc.c, unit: pc.unit, g: pc.g });
                                    setIsEdit(true);
                                    setEditID(batch.id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} style={{ background: 'none', border: 'none', color: '#4FC3F7', cursor: 'pointer' }}><Edit3 size={18} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteBatch(batch.id, batch.batch_number); }} style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                <ChevronRight color="#555" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: '#aaa', background: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 12 }}>
                            <div>Sana: <b style={{ color: '#fff' }}>{batch.arrival_date || batch.created_at ? new Date(batch.arrival_date || batch.created_at).toLocaleDateString() : '---'}</b></div>
                            <div>Turi: <b style={{ color: '#fff' }}>{parseColor(batch.color).type}</b></div>
                            <div>Rangi: <b style={{ color: '#fff' }}>{parseColor(batch.color).c}</b></div>
                            <div>Birlik: <b style={{ color: '#fff' }}>{parseColor(batch.color).unit.toUpperCase()}</b></div>

                            <div style={{ borderTop: '1px solid #2a2a40', paddingTop: 10, marginTop: 5 }}>
                                <span style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{parseColor(batch.color).unit === 'kg' ? 'Vazn' : 'Metir'} (Bruto)</span>
                                <b style={{ color: isComplete ? '#81C784' : '#FFAB40', fontSize: 16 }}>{totalBrutoKg.toFixed(1)}</b> / {expectedWeight} {parseColor(batch.color).unit}
                            </div>
                            <div style={{ borderTop: '1px solid #2a2a40', paddingTop: 10, marginTop: 5 }}>
                                <span style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Rulonlar</span>
                                <b style={{ color: isComplete ? '#81C784' : '#FFAB40', fontSize: 16 }}>{doneCount}</b> / {totalCount} ta
                            </div>
                        </div>

                        {isComplete && (
                            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: batch.status?.startsWith('VERDICT_') ? 'rgba(129,199,132,0.1)' : (Math.abs(totalBrutoKg - expectedWeight) < 0.5 ? 'rgba(129,199,132,0.1)' : 'rgba(255,171,64,0.1)'), border: '1px dashed' }}>
                                <div style={{ fontSize: 11, color: '#888' }}>
                                    {batch.status?.startsWith('VERDICT_') ? "YAKUNIY QAROR (TASDIQLANGAN):" : "TAQQOSLASH (OMBOR vs TAMINOTCHI):"}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                                    <b style={{ color: batch.status?.startsWith('VERDICT_') ? '#81C784' : (Math.abs(totalBrutoKg - expectedWeight) < 0.5 ? '#81C784' : '#FFAB40') }}>
                                        {batch.status === 'VERDICT_OMBOR' ? "OMBOR VAZNI QABUL QILINDI" :
                                            batch.status === 'VERDICT_SUPPLIER' ? "TAMINOTCHI VAZNI QABUL QILINDI" :
                                                Math.abs(totalBrutoKg - expectedWeight) < 0.5 ? "MA'LUMOTLAR TO'G'RI (MOS)" : `FARQ MAVJUD: ${(totalBrutoKg - expectedWeight).toFixed(1)} ${parseColor(batch.color).unit}`}
                                    </b>
                                    <div style={{ fontSize: 10, opacity: 0.6 }}>
                                        {totalBrutoKg.toFixed(1)} vs {expectedWeight}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            {batches.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Bruto partiyalar mavjud emas</div>}
        </motion.div>
    );

    const renderActiveBatch = () => {
        const batchRolls = rolls.filter(r => r.batch_id === activeBatch.id);
        const doneCount = batchRolls.length;
        const isComplete = doneCount >= activeBatch.expected_count;
        const totalBrutoKg = batchRolls.reduce((sum, r) => sum + (Number(r.bruto) || 0), 0);

        return (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <button onClick={() => setActiveBatch(null)} style={{ background: 'none', border: 'none', color: '#81C784', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 20, cursor: 'pointer', fontWeight: 'bold' }}>
                    <ChevronRight style={{ transform: 'rotate(180deg)' }} size={20} /> Orqaga
                </button>

                <div style={{ ...S.card, background: 'linear-gradient(135deg, #12121e 0%, #1a2e1e 100%)', borderColor: '#81C784' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: 0, color: '#81C784' }}>{activeBatch.batch_number}</h1>
                            <p style={{ margin: '5px 0 0 0', opacity: 0.7 }}>{activeBatch.supplier_name} • {parseColor(activeBatch.color).type} ({parseColor(activeBatch.color).c})</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{doneCount} / {activeBatch.expected_count}</div>
                            <div style={{ fontSize: 11, color: '#aaa' }}>Rulon yig'ildi</div>
                            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#81C784', marginTop: 5 }}>{totalBrutoKg.toFixed(1)} {parseColor(activeBatch.color).unit} jami</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 15, padding: '10px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 5 }}>
                            <span>TAMINOTCHI VAZNI: <b>{activeBatch.expected_weight}</b></span>
                            <span>FARQ:</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ height: 6, flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 3, marginRight: 15, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, (totalBrutoKg / activeBatch.expected_weight) * 100)}%`, height: '100%', background: '#81C784' }} />
                            </div>
                            <b style={{ color: Math.abs(totalBrutoKg - activeBatch.expected_weight) > 0.5 ? '#FFAB40' : '#81C784', fontSize: 13 }}>
                                {(totalBrutoKg - activeBatch.expected_weight).toFixed(1)} {parseColor(activeBatch.color).unit}
                            </b>
                        </div>
                        <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
                            {totalBrutoKg < activeBatch.expected_weight
                                ? `Yana ${(activeBatch.expected_weight - totalBrutoKg).toFixed(1)} ${parseColor(activeBatch.color).unit} kiritilishi kerak`
                                : `Me'yordan ${(totalBrutoKg - activeBatch.expected_weight).toFixed(1)} ${parseColor(activeBatch.color).unit} ortiqcha`}
                        </div>
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {isComplete ? (
                            <>
                                <button onClick={() => setPrintBatchRolls(batchRolls)} style={{ ...S.primaryBtn, width: '100%', background: '#81C784', color: '#000', marginBottom: 5 }}>
                                    <Printer size={20} /> Barcha Rulonlarga Passport (QR) Chiqarish
                                </button>

                                {activeBatch.status?.startsWith('VERDICT_') ? (
                                    <div style={{ width: '100%', padding: 15, background: 'rgba(129,199,132,0.1)', borderRadius: 12, border: '1px solid #81C784', marginTop: 10, textAlign: 'center' }}>
                                        <div style={{ color: '#81C784', fontWeight: 'bold' }}>
                                            <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                                            TASDIQLANGAN VAZN: {activeBatch.status === 'VERDICT_OMBOR' ? 'OMBOR (BIZNING) VAZN' : 'TAMINOTCHI VAZNI'}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>Ushbu partiya uchun yakuniy qaror qabul qilingan</div>
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid #444', marginTop: 10 }}>
                                        <div style={{ textAlign: 'center', marginBottom: 15, fontWeight: 'bold', fontSize: 14 }}>
                                            <AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: 5, color: '#FFAB40' }} />
                                            QAYSI VAZN TO'G'RI DEB QABUL QILINSIN?
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { error } = await supabase.from('warehouse_batches').update({ status: 'VERDICT_OMBOR' }).eq('id', activeBatch.id);
                                                        if (error) throw error;
                                                        await supabase.from('warehouse_log').insert({
                                                            batch_id: activeBatch.id,
                                                            item_name: `VERDICT: OMBOR VAZNI (${totalBrutoKg})`,
                                                            quantity: totalBrutoKg,
                                                            action_type: 'VERDICT_CONFIRMED'
                                                        });
                                                        showMsg("Ombor vazni tasdiqlandi!");
                                                        load(true);
                                                    } catch (e) { showMsg('Xato yuz berdi', 'err'); }
                                                }}
                                                style={{ ...S.primaryBtn, background: '#333', color: '#fff', fontSize: 11 }}
                                            >
                                                OMBOR VAZNI ({totalBrutoKg.toFixed(1)})
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { error } = await supabase.from('warehouse_batches').update({ status: 'VERDICT_SUPPLIER' }).eq('id', activeBatch.id);
                                                        if (error) throw error;
                                                        await supabase.from('warehouse_log').insert({
                                                            batch_id: activeBatch.id,
                                                            item_name: `VERDICT: TAMINOTCHI VAZNI (${activeBatch.expected_weight})`,
                                                            quantity: activeBatch.expected_weight,
                                                            action_type: 'VERDICT_CONFIRMED'
                                                        });
                                                        showMsg("Taminotchi vazni tasdiqlandi!");
                                                        load(true);
                                                    } catch (e) { showMsg('Xato yuz berdi', 'err'); }
                                                }}
                                                style={{ ...S.primaryBtn, background: '#333', color: '#fff', fontSize: 11 }}
                                            >
                                                TAMINOTCHI ({activeBatch.expected_weight})
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ width: '100%', background: 'rgba(255,171,64,0.1)', padding: 15, borderRadius: 12, color: '#FFAB40', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                <AlertCircle size={18} /> Barcha rulonlar o'lchangandan so'ng QR passport yoziladi.
                            </div>
                        )}
                    </div>
                </div>

                {!isComplete && (
                    <>
                        <h3 style={{ marginBottom: 15, marginTop: 30 }}>Yangi Rulon Qo'shish ({parseColor(activeBatch.color).unit === 'kg' ? 'Bruto kg' : 'Metir'})</h3>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
                            <input
                                type="number"
                                placeholder={parseColor(activeBatch.color).unit === 'kg' ? "Masanlan: 24.5" : "Kelgan metir"}
                                style={S.input}
                                value={newRollWeight}
                                onChange={(e) => setNewRollWeight(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddRoll()}
                            />
                            <button onClick={handleAddRoll} style={{ ...S.primaryBtn, padding: '0 25px', width: 'auto' }}>
                                <PlusCircle size={24} />
                            </button>
                        </div>
                    </>
                )}

                <h3 style={{ marginBottom: 15 }}>Kiritilgan Rulonlar ro'yxati ({doneCount} ta)</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                    {batchRolls.map((r, i) => (
                        <div key={r.id} style={{ ...S.card, marginBottom: 0, padding: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {i + 1}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{r.bruto} {parseColor(activeBatch.color).unit}</div>
                                    <div style={{ fontSize: 11, color: '#888' }}>{r.created_at ? new Date(r.created_at).toLocaleTimeString() : '---'}</div>
                                </div>
                            </div>
                            <span style={S.badge(true)}>BRUTO OLINDI</span>
                        </div>
                    ))}
                    {batchRolls.length === 0 && <p style={{ color: '#555', textAlign: 'center' }}>Hali hech qanday rulon o'lchanmadi</p>}
                </div>
            </motion.div>
        );
    };

    // QR Print overlay
    const renderPrintOverlay = () => {
        if (!printBatchRolls) return null;
        return (
            <div style={S.printOverlay}>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2>Print Preview</h2>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => window.print()} style={{ ...S.primaryBtn, padding: '10px 20px', width: 'auto' }}>
                            <Printer size={18} /> Chop etish (Ctrl+P)
                        </button>
                        <button onClick={() => setPrintBatchRolls(null)} style={{ ...S.primaryBtn, background: '#eee', color: '#000', width: 'auto' }}>
                            Yopish
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
                    {printBatchRolls.map((r, index) => {
                        const qrData = JSON.stringify({ id: r.id, batch: r.batch_number, bruto: r.bruto, date: new Date().toISOString() });
                        return (
                            <div key={r.id} style={{ width: 300, border: '2px solid #000', borderRadius: 12, padding: 20, background: '#fff', color: '#000', boxSizing: 'border-box' }} className="print-ticket">
                                <div style={{ textAlign: 'center', marginBottom: 15, borderBottom: '2px solid #000', paddingBottom: 10 }}>
                                    <h2 style={{ margin: 0, fontSize: 24, textTransform: 'uppercase' }}>BESPO MATO Ombori</h2>
                                    <div style={{ fontSize: 14 }}>SANA: {r.created_at ? new Date(r.created_at).toLocaleDateString() : '---'}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 'bold' }}>Partiya:</div>
                                        <div style={{ fontSize: 18, marginBottom: 10 }}>{r.batch_number}</div>

                                        <div style={{ fontSize: 12, fontWeight: 'bold' }}>Rangi:</div>
                                        <div style={{ fontSize: 16, marginBottom: 10 }}>{r.color}</div>

                                        <div style={{ fontSize: 12, fontWeight: 'bold' }}>{r.color_code === 'meter' ? 'Metir' : 'Vazni (BRUTO)'}:</div>
                                        <div style={{ fontSize: 28, fontWeight: '900' }}>{r.bruto} {r.color_code || 'kg'}</div>
                                    </div>
                                    <div style={{ padding: 10, background: '#fff' }}>
                                        <QRCodeCanvas value={qrData} size={100} level={"H"} />
                                    </div>
                                </div>
                                <div style={{ marginTop: 15, fontSize: 10, textAlign: 'center', opacity: 0.5 }}>
                                    ID: {r.id} • Rulon #{index + 1}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <style dangerouslySetInnerHTML={{
                    __html: `
          @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .no-print { display: none !important; }
            .print-ticket { page-break-inside: avoid; border: 2px solid #000 !important; box-shadow: none !important; margin-bottom: 20mm; }
          }
        `}} />
            </div>
        );
    };

    const renderNeto = () => {
        const stockGroups = {};

        // Group inspected rolls by type and color
        rolls.filter(r => r.status === 'KONTROLDAN_OTDI').forEach(r => {
            const key = `${r.fabric_name}_${r.color}`;
            if (!stockGroups[key]) {
                stockGroups[key] = { type: r.fabric_name, color: r.color, totalNeto: 0, rolls: [], unit: r.color_code || 'kg' };
            }
            stockGroups[key].totalNeto += (Number(r.neto) || 0);
            stockGroups[key].rolls.push(r);
        });

        if (activeNetoBatch && selNetoGroup) {
            const group = stockGroups[selNetoGroup];
            const batchRolls = group.rolls.filter(r => r.batch_number === activeNetoBatch);

            // Calculate Analytics for this batch
            const allRollsInBatch = rolls.filter(r => r.batch_number === activeNetoBatch);
            const totalBrutoBatch = allRollsInBatch.reduce((a, b) => a + (Number(b.bruto) || 0), 0);
            const inspectedRolls = allRollsInBatch.filter(r => r.status === 'KONTROLDAN_OTDI' || r.status === 'BRAK');
            const totalNetoInspected = inspectedRolls.reduce((a, b) => a + (Number(b.neto) || 0), 0);
            const totalTaraBatch = inspectedRolls.reduce((a, b) => a + (Number(b.tara) || 0), 0);
            const totalBrakBruto = allRollsInBatch.filter(r => r.status === 'BRAK').reduce((a, b) => a + (Number(b.bruto) || 0), 0);

            return (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <button onClick={() => setActiveNetoBatch(null)} style={{ background: 'none', border: 'none', color: '#4FC3F7', fontWeight: 'bold', marginBottom: 20, cursor: 'pointer' }}>← PARTIYALAR RO'YXATI</button>

                    <div style={{ ...S.card, background: 'rgba(79,195,247,0.05)', borderColor: '#4FC3F7' }}>
                        <div style={{ fontSize: 12, color: '#4FC3F7', fontWeight: 'bold' }}>PARTIYA: {activeNetoBatch}</div>
                        <h2 style={{ margin: '5px 0' }}>{group.type}</h2>
                        <div style={{ color: '#888', fontSize: 14 }}>{group.color} • {allRollsInBatch.length} ta jami rulon</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                        <div style={{ ...S.card, marginBottom: 0, padding: 15, background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ fontSize: 11, color: '#aaa' }}>JAMI BRUTO:</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{totalBrutoBatch.toFixed(1)} <small>{group.unit}</small></div>
                        </div>
                        <div style={{ ...S.card, marginBottom: 0, padding: 15, background: 'rgba(129,199,132,0.1)', borderColor: '#81C784' }}>
                            <div style={{ fontSize: 11, color: '#81C784' }}>JAMI NETO:</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#81C784' }}>{totalNetoInspected.toFixed(1)} <small>{group.unit}</small></div>
                        </div>
                        <div style={{ ...S.card, marginBottom: 0, padding: 15, background: 'rgba(255,171,64,0.1)', borderColor: '#FFAB40' }}>
                            <div style={{ fontSize: 11, color: '#FFAB40' }}>JAMI TARA:</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#FFAB40' }}>{totalTaraBatch.toFixed(1)} <small>{group.unit}</small></div>
                        </div>
                        <div style={{ ...S.card, marginBottom: 0, padding: 15, background: 'rgba(255,82,82,0.1)', borderColor: '#ff5252' }}>
                            <div style={{ fontSize: 11, color: '#ff5252' }}>BRAK (BRUTO):</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff5252' }}>{totalBrakBruto.toFixed(1)} <small>{group.unit}</small></div>
                        </div>
                    </div>

                    <h3 style={{ margin: '20px 0 10px 0', fontSize: 14, opacity: 0.7 }}>RULON PASPORTLARI:</h3>
                    {batchRolls.map(r => {
                        const defects = JSON.parse(r.defects || '{}');
                        const inspectTime = new Date(r.neto_date || r.created_at);
                        const readyTime = new Date(inspectTime.getTime() + 24 * 60 * 60 * 1000);
                        const isReady = new Date() > readyTime;
                        const timeLeft = readyTime.getTime() - new Date().getTime();
                        const hoursLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60)));

                        return (
                            <div key={r.id} style={{ ...S.card, padding: 15, position: 'relative', overflow: 'hidden' }}>
                                {isReady ? (
                                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#81C784', color: '#000', fontSize: 10, padding: '4px 10px', fontWeight: 'bold' }}>BICHUVGA TAYYOR ✅</div>
                                ) : (
                                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#FFAB40', color: '#000', fontSize: 10, padding: '4px 10px', fontWeight: 'bold' }}>DAM OLMOQDA ({hoursLeft}s) ⏳</div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: '#555' }}>ID: ROLL-{r.id}</div>
                                        <div style={{ fontSize: 18, fontWeight: 'bold', color: '#81C784' }}>{r.neto} <small>{group.unit}</small></div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 12, fontWeight: 'bold' }}>Eni: {r.en || '---'} sm</div>
                                        <div style={{ fontSize: 12, color: '#888' }}>Gramaj: {r.gramaj || '---'}</div>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 10 }}>
                                    <div style={{ fontSize: 10, color: '#555', marginBottom: 5 }}>ANIQLANGAN NUQSONLAR:</div>
                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                        {Object.entries(defects).some(([_, c]) => c > 0) ? (
                                            Object.entries(defects).map(([d, count]) => count > 0 && (
                                                <span key={d} style={{ fontSize: 11, background: 'rgba(229,115,115,0.1)', color: '#E57373', padding: '2px 8px', borderRadius: 6 }}>
                                                    {d}: {count}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: 11, color: '#81C784' }}>Sifatli (Nuqsonlar yo'q)</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#444' }}>
                                    <div>Nazorat: {inspectTime.toLocaleString()}</div>
                                    <div style={{ color: isReady ? '#81C784' : '#FFAB40' }}>Tayyor: {readyTime.toLocaleString()}</div>
                                </div>

                                <div style={{ marginTop: 15, display: 'flex', gap: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingRoll(r);
                                            setRollForm({ neto: r.neto, en: r.en || '', gramaj: r.gramaj || '' });
                                        }}
                                        style={{ ...S.primaryBtn, background: 'rgba(79,195,247,0.1)', color: '#4FC3F7', padding: '8px', fontSize: 12 }}
                                    >
                                        <Edit3 size={14} /> TAHRIRLASH
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteRoll(r); }}
                                        style={{ ...S.primaryBtn, background: 'rgba(255,82,82,0.1)', color: '#ff5252', padding: '8px', fontSize: 12 }}
                                    >
                                        <Trash2 size={14} /> O'CHIRISH
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {editingRoll && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                            <div style={{ ...S.card, width: '100%', maxWidth: 400 }}>
                                <h2 style={{ color: '#4FC3F7', marginBottom: 20 }}>Rulonni Tahrirlash</h2>
                                <label style={{ fontSize: 12, color: '#888' }}>Neto Vazn:</label>
                                <input style={S.input} type="number" value={rollForm.neto} onChange={e => setRollForm({ ...rollForm, neto: e.target.value })} />
                                <label style={{ fontSize: 12, color: '#888' }}>Eni (sm):</label>
                                <input style={S.input} type="number" value={rollForm.en} onChange={e => setRollForm({ ...rollForm, en: e.target.value })} />
                                <label style={{ fontSize: 12, color: '#888' }}>Gramaj:</label>
                                <input style={S.input} value={rollForm.gramaj} onChange={e => setRollForm({ ...rollForm, gramaj: e.target.value })} />

                                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                    <button onClick={handleSaveRollEdit} style={S.primaryBtn}>SAQLASH</button>
                                    <button onClick={() => setEditingRoll(null)} style={{ ...S.primaryBtn, background: '#333' }}>YOPISH</button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            );
        }

        if (selNetoGroup) {
            const group = stockGroups[selNetoGroup];
            const batchWise = {};
            group.rolls.forEach(r => {
                if (!batchWise[r.batch_number]) batchWise[r.batch_number] = { net: 0, count: 0 };
                batchWise[r.batch_number].net += (Number(r.neto) || 0);
                batchWise[r.batch_number].count += 1;
            });

            return (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <button onClick={() => setSelNetoGroup(null)} style={{ background: 'none', border: 'none', color: '#4FC3F7', fontWeight: 'bold', marginBottom: 20, cursor: 'pointer' }}>← ORQAGA</button>
                    <div style={{ ...S.card, borderLeft: '5px solid #4FC3F7' }}>
                        <h2 style={{ margin: 0 }}>{group.type}</h2>
                        <b style={{ color: '#888' }}>{group.color}</b>
                    </div>

                    <h3 style={{ margin: '20px 0 10px 0', fontSize: 14, color: '#555' }}>PARTIYALAR RO'YXATI (NETO)</h3>
                    <div style={{ display: 'grid', gap: 10 }}>
                        {Object.entries(batchWise).map(([bn, data]) => (
                            <div key={bn} onClick={() => setActiveNetoBatch(bn)} style={{ ...S.card, borderLeft: '3px solid #4FC3F7', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{bn} Partiya</div>
                                        <div style={{ fontSize: 12, color: '#888' }}>{data.count} dona tayyor rulon</div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#4FC3F7' }}>{data.net.toFixed(1)} {group.unit}</div>
                                            <div style={{ fontSize: 10, color: '#555' }}>NETO JAMI</div>
                                        </div>
                                        <ChevronRight size={18} color="#333" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            );
        }

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#4FC3F7' }}>
                    <CheckCircle2 size={24} /> Neto Matolar (Tayyor)
                </h2>

                <div style={{ display: 'grid', gap: 12 }}>
                    {Object.entries(stockGroups).map(([key, g]) => (
                        <div key={key} style={{ ...S.card, cursor: 'pointer', borderLeft: '5px solid #4FC3F7' }} onClick={() => setSelNetoGroup(key)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: 18 }}>{g.type}</div>
                                    <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{g.color}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 22, fontWeight: 'bold', color: '#4FC3F7' }}>{g.totalNeto.toFixed(1)}</div>
                                    <div style={{ fontSize: 10, color: '#555' }}>JAMI {g.unit.toUpperCase()}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#555' }}>
                                <ChevronRight size={14} /> Batafsil ko'rish ({g.rolls.length} ta rulon)
                            </div>
                        </div>
                    ))}
                    {Object.keys(stockGroups).length === 0 && <div style={{ textAlign: 'center', padding: 50, opacity: 0.5 }}>Tayyor (Neto) matolar hali yo'q</div>}
                </div>
            </motion.div>
        );
    };

    return (
        <div style={{ position: 'relative' }}>
            {renderPrintOverlay()}

            {tab === 'dashboard' && !activeBatch && renderSummaryDashboard()}

            {tab === 'kirim' && !activeBatch && renderKirim()}

            {tab === 'ombor' && (
                activeBatch ? renderActiveBatch() : renderStock()
            )}

            {tab === 'neto' && !activeBatch && renderNeto()}

            {tab === 'history' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#4FC3F7' }}>
                            <History size={26} /> AMALLAR TARIXI
                        </h2>
                        <div style={{ fontSize: 11, background: 'rgba(79,195,247,0.1)', color: '#4FC3F7', padding: '5px 12px', borderRadius: 20, fontWeight: 'bold' }}>
                            OXIRGI 100 TA AMAL
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 15 }}>
                        {(data.whLog || []).map((l, idx) => {
                            const date = new Date(l.timestamp || l.created_at);
                            const actionColor =
                                l.action_type === 'KIRIM' ? '#4FC3F7' :
                                    l.action_type === 'DELETE' ? '#ff5252' :
                                        l.action_type === 'VERDICT_CONFIRMED' ? '#81C784' :
                                            l.action_type === 'BRAK' ? '#ff5252' :
                                                l.action_type === 'WEIGHT_BRUTO' ? '#FFAB40' :
                                                    l.action_type === 'KONTROLDAN_OTDI' ? '#00e676' :
                                                        '#FFAB40';

                            return (
                                <motion.div
                                    key={l.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    style={{
                                        ...S.card,
                                        padding: '18px 20px',
                                        borderLeft: `5px solid ${actionColor}`,
                                        background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 100%)',
                                        marginBottom: 0
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: 15 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 12,
                                                background: `${actionColor}15`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: actionColor
                                            }}>
                                                {l.action_type === 'KIRIM' ? <Download size={20} /> :
                                                    l.action_type === 'DELETE' ? <Trash2 size={20} /> :
                                                        l.action_type === 'VERDICT_CONFIRMED' ? <CheckCircle2 size={20} /> :
                                                            l.action_type === 'BRAK' ? <AlertCircle size={20} /> :
                                                                l.action_type === 'WEIGHT_BRUTO' ? <Scale size={20} /> :
                                                                    l.action_type === 'KONTROLDAN_OTDI' ? <Package size={20} /> :
                                                                        <Clock size={20} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{l.item_name}</div>
                                                <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 15 }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {date.toLocaleTimeString()}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {date.toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            {l.quantity && (
                                                <div style={{ fontWeight: '900', fontSize: 18, color: actionColor }}>
                                                    {l.quantity} <small style={{ fontSize: 10, fontWeight: 'normal', opacity: 0.7 }}>kg/m</small>
                                                </div>
                                            )}
                                            <div style={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', color: actionColor, opacity: 0.8, marginTop: 4 }}>
                                                {l.action_type?.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {(data.whLog || []).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 20 }}>
                                <History size={48} color="#2a2a40" style={{ marginBottom: 15 }} />
                                <div style={{ color: '#555', fontSize: 16 }}>Hali hech qanday amal bajarilmagan</div>
                                <div style={{ color: '#333', fontSize: 12, marginTop: 5 }}>Tizimdagi barcha harakatlar shu yerda aks etadi</div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
