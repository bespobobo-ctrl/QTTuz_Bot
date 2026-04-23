import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import {
    Package, Calendar, ChevronRight,
    Printer, AlertCircle, PlusCircle, Download, CheckCircle2,
    Users, Palette, AlertTriangle, TrendingUp, Info
} from 'lucide-react';

export default function MatoOmboriPanel({ tab, data, load, showMsg }) {
    const [activeBatch, setActiveBatch] = useState(null);
    const [newRollWeight, setNewRollWeight] = useState('');
    const [printBatchRolls, setPrintBatchRolls] = useState(null);

    // Kirim (Yangi Partiya) Formasi uchun state
    const [f, setF] = useState({ bn: '', eC: '', eW: '', sup: '', c: '', type: '2 IPPL', unit: 'kg' });
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
        if (!str) return { c: '', type: '', unit: 'kg' };
        if (str.includes('|')) {
            const [type, col, unit] = str.split('|').map(x => x.trim());
            return { type, c: col, unit: unit || 'kg' };
        }
        return { type: '', c: str, unit: 'kg' };
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        try {
            // Store type, color, unit together in color field
            const combinedColor = `${f.type} | ${f.c} | ${f.unit}`;
            const { error } = await supabase.from('warehouse_batches').insert([{
                batch_number: f.bn, supplier_name: f.sup, color: combinedColor,
                expected_count: Number(f.eC), expected_weight: Number(f.eW), status: 'IN_PROGRESS'
            }]);
            if (error) throw error;
            showMsg('Yangi kirim muvaffaqiyatli saqlandi!');
            setF({ ...f, bn: '', eC: '', eW: '', sup: '', c: '' });
            load(true);
        } catch (err) {
            showMsg('Saqlashda xatolik!', 'err');
        }
    };

    const handleAddRoll = async () => {
        if (!newRollWeight || isNaN(newRollWeight) || Number(newRollWeight) <= 0) {
            return showMsg('Noto\'g\'ri qiymat kiritildi!', 'err');
        }
        const { type, c, unit } = parseColor(activeBatch.color);
        try {
            const payload = {
                batch_id: activeBatch.id,
                batch_number: activeBatch.batch_number,
                bruto: Number(newRollWeight),
                status: 'BRUTO',
                fabric_name: type,
                color: c,
                color_code: unit // Reuse color_code to store unit for the roll
            };
            const { error } = await supabase.from('warehouse_rolls').insert([payload]);
            if (error) throw error;
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
                <Download size={24} /> Yangi Partiya Kirimi
            </h2>
            <div style={S.card}>
                <form onSubmit={handleCreateBatch}>
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

                    <input style={S.input} placeholder="Rangi (masalan: Qora, Oq)" value={f.c} onChange={e => setF({ ...f, c: e.target.value })} required />

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
                    <button style={S.primaryBtn} type="submit">OMBORGA QO'SHISH</button>
                </form>
            </div>
        </motion.div>
    );

    const renderSummaryDashboard = () => {
        // Group data by Supplier + Color
        const summary = {};
        batches.forEach(b => {
            const { type, c, unit } = parseColor(b.color);
            const key = `${b.supplier_name}_${type}_${c}`;
            if (!summary[key]) {
                summary[key] = { sup: b.supplier_name, type, col: c, unit, bruto: 0, neto: 0, brak: 0, batches: 0 };
            }
            summary[key].batches += 1;

            const batchRolls = rolls.filter(r => r.batch_id === b.id);
            batchRolls.forEach(r => {
                summary[key].bruto += (Number(r.bruto) || 0);
                summary[key].neto += (Number(r.neto) || 0);
                if (r.status === 'BRAK') summary[key].brak += 1;
            });
        });

        const stats = Object.values(summary);

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TrendingUp color="#81C784" /> Umumiy Analitika
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    <div style={{ ...S.card, marginBottom: 0, padding: 15, textAlign: 'center' }}>
                        <div style={{ color: '#81C784', fontSize: 11, fontWeight: 'bold' }}>JAMI BRUTO</div>
                        <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.reduce((a, b) => a + b.bruto, 0).toFixed(1)} <small>kg</small></div>
                    </div>
                    <div style={{ ...S.card, marginBottom: 0, padding: 15, textAlign: 'center' }}>
                        <div style={{ color: '#4FC3F7', fontSize: 11, fontWeight: 'bold' }}>JAMI NETO</div>
                        <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.reduce((a, b) => a + b.neto, 0).toFixed(1)} <small>kg</small></div>
                    </div>
                </div>

                {stats.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Analitika uchun ma'lumot yetarli emas</div>
                ) : (
                    stats.map((s, idx) => (
                        <div key={idx} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ background: 'rgba(129,199,132,0.1)', padding: 8, borderRadius: 10 }}>
                                        <Users size={18} color="#81C784" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{s.sup}</div>
                                        <div style={{ fontSize: 11, color: '#888' }}>Ta'minotchi</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fff', fontWeight: 'bold' }}>
                                        <Palette size={14} color="#81C784" /> {s.type}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#555' }}>MATO TURI</div>
                                    <div style={{ fontSize: 12, color: '#81C784', marginTop: 4 }}>{s.col}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 9, color: '#81C784', marginBottom: 4 }}>BRUTO {s.unit.toUpperCase()}</div>
                                    <div style={{ fontWeight: 'bold' }}>{s.bruto.toFixed(1)}</div>
                                </div>
                                <div style={{ textAlign: 'center', borderLeft: '1px solid #2a2a40' }}>
                                    <div style={{ fontSize: 9, color: '#4FC3F7', marginBottom: 4 }}>NETO {s.unit.toUpperCase()}</div>
                                    <div style={{ fontWeight: 'bold' }}>{s.neto.toFixed(1)}</div>
                                </div>
                                <div style={{ textAlign: 'center', borderLeft: '1px solid #2a2a40' }}>
                                    <div style={{ fontSize: 9, color: '#ff5252', marginBottom: 4 }}>BRAK</div>
                                    <div style={{ fontWeight: 'bold', color: s.brak > 0 ? '#ff5252' : '#fff' }}>{s.brak} <small> dona</small></div>
                                </div>
                            </div>

                            <div style={{ marginTop: 10, fontSize: 10, color: '#555', textAlign: 'center' }}>
                                Umumiy {s.batches} ta partiya birlashtirildi
                            </div>
                        </div>
                    ))
                )}
            </motion.div>
        );
    }

    const renderStock = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package color="#81C784" /> Ombor Stok
            </h2>

            {batches.map(batch => {
                const batchRolls = rolls.filter(r => r.batch_id === batch.id);
                const doneCount = batchRolls.length;
                const totalCount = batch.expected_count || 0;

                // Hisoblangan Kg lar
                const totalBrutoKg = batchRolls.reduce((sum, r) => sum + (Number(r.bruto) || 0), 0);
                const expectedWeight = batch.expected_weight || 0;

                const isComplete = doneCount >= totalCount && totalCount > 0;
                const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

                return (
                    <div key={batch.id} style={{ ...S.card, cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => setActiveBatch(batch)}>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 4, background: '#1a1a2e', width: '100%' }}>
                            <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: isComplete ? '#81C784' : '#FFAB40', transition: 'width 0.5s' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Package size={20} color="#888" />
                                <span style={{ fontSize: 18, fontWeight: 'bold' }}>{batch.batch_number}</span>
                                <span style={S.badge(isComplete)}>
                                    {isComplete ? 'KONTROLGA TAYYOR ✅' : 'CHALA ⏳'}
                                </span>
                            </div>
                            <ChevronRight color="#555" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: '#aaa', background: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 12 }}>
                            <div>Sana: <b style={{ color: '#fff' }}>{new Date(batch.arrival_date || batch.created_at).toLocaleDateString()}</b></div>
                            <div>Turi: <b style={{ color: '#fff' }}>{parseColor(batch.color).type}</b></div>
                            <div>Rangi: <b style={{ color: '#fff' }}>{parseColor(batch.color).c}</b></div>
                            <div>Birlik: <b style={{ color: '#fff' }}>{parseColor(batch.color).unit.toUpperCase()}</b></div>

                            <div style={{ borderTop: '1px solid #2a2a40', paddingTop: 10, marginTop: 5 }}>
                                <span style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{parseColor(batch.color).unit === 'kg' ? 'Vazn' : 'Metir'} (Qabul / Jami)</span>
                                <b style={{ color: isComplete ? '#81C784' : '#FFAB40', fontSize: 16 }}>{totalBrutoKg.toFixed(1)}</b> / {expectedWeight} {parseColor(batch.color).unit}
                            </div>
                            <div style={{ borderTop: '1px solid #2a2a40', paddingTop: 10, marginTop: 5 }}>
                                <span style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Rulonlar (Qabul / Jami)</span>
                                <b style={{ color: isComplete ? '#81C784' : '#FFAB40', fontSize: 16 }}>{doneCount}</b> / {totalCount} dona
                            </div>
                        </div>
                    </div>
                );
            })}
            {batches.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Omborda partiyalar mavjud emas</div>}
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

                    <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                        {isComplete ? (
                            <button onClick={() => setPrintBatchRolls(batchRolls)} style={{ ...S.primaryBtn, width: '100%', background: '#81C784', color: '#000' }}>
                                <Printer size={20} /> Barcha Rulonlarga Passport (QR) Chiqarish
                            </button>
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
                                    <div style={{ fontSize: 11, color: '#888' }}>{new Date(r.created_at).toLocaleTimeString()}</div>
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
                                    <div style={{ fontSize: 14 }}>SANA: {new Date(r.created_at).toLocaleDateString()}</div>
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
        const netoRolls = rolls.filter(r => r.status === 'KONTROLDAN_OTDI' || r.neto);

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#4FC3F7' }}>
                    <CheckCircle2 size={24} /> Neto Matolar Ro'yxati
                </h2>
                {netoRolls.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Hozircha Neto (Tayyor) matolar yo'q</div>
                ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {netoRolls.map(r => (
                            <div key={r.id} style={{ ...S.card, marginBottom: 0, padding: '15px 20px', borderLeft: '4px solid #4FC3F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#888' }}>Partiya: {r.batch_number} • Turi: {r.fabric_name} • Rangi: {r.color}</div>
                                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{r.neto ? r.neto.toFixed(2) : '---'} {r.color_code || 'kg'}</div>
                                    <div style={{ fontSize: 12, marginTop: 5 }}>
                                        Eni: <b style={{ color: '#fff' }}>{r.en || '--'} sm</b> | Gramaj: <b style={{ color: '#fff' }}>{r.gramaj || '--'}</b>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ padding: '6px 12px', background: 'rgba(79, 195, 247, 0.15)', color: '#4FC3F7', borderRadius: 8, fontSize: 11, fontWeight: 'bold' }}>
                                        NETO OLINDI
                                    </span>
                                    <div style={{ fontSize: 11, color: '#555', marginTop: 10 }}>
                                        Bruto: {r.bruto} {r.color_code || 'kg'} | Tara: {r.tara || 0} kg
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
        </div>
    );
}
