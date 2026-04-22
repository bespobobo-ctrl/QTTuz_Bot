import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import {
    Package, Calendar, ChevronRight,
    Printer, AlertCircle, PlusCircle, Download, CheckCircle2
} from 'lucide-react';

export default function MatoOmboriPanel({ tab, data, load, showMsg }) {
    const [activeBatch, setActiveBatch] = useState(null);
    const [newRollWeight, setNewRollWeight] = useState('');
    const [printBatchRolls, setPrintBatchRolls] = useState(null);

    // Kirim (Yangi Partiya) Formasi uchun state
    const [f, setF] = useState({ bn: '', eC: '', eW: '', sup: '', c: '' });

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

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('warehouse_batches').insert([{
                batch_number: f.bn, supplier_name: f.sup, color: f.c,
                expected_count: Number(f.eC), expected_weight: Number(f.eW), status: 'IN_PROGRESS'
            }]);
            if (error) throw error;
            showMsg('Yangi kirim muvaffaqiyatli saqlandi!');
            setF({ bn: '', eC: '', eW: '', sup: '', c: '' });
            load(true);
        } catch (err) {
            showMsg('Saqlashda xatolik!', 'err');
        }
    };

    const handleAddRoll = async () => {
        if (!newRollWeight || isNaN(newRollWeight) || Number(newRollWeight) <= 0) {
            return showMsg('Noto\'g\'ri vazn kiritildi!', 'err');
        }
        try {
            const payload = {
                batch_id: activeBatch.id,
                batch_number: activeBatch.batch_number,
                bruto: Number(newRollWeight),
                status: 'BRUTO',
                fabric_name: activeBatch.color,
                color: activeBatch.color
            };
            const { error } = await supabase.from('warehouse_rolls').insert([payload]);
            if (error) throw error;
            setNewRollWeight('');
            showMsg('Rulon (bruto) omborga qo\'shildi!');
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
                    <input style={S.input} placeholder="Rangi (masalan: Qora, Oq)" value={f.c} onChange={e => setF({ ...f, c: e.target.value })} required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input style={S.input} type="number" placeholder="Jami Rulon (dona)" value={f.eC} onChange={e => setF({ ...f, eC: e.target.value })} required />
                        <input style={S.input} type="number" placeholder="Jami Vazn (KG)" value={f.eW} onChange={e => setF({ ...f, eW: e.target.value })} required />
                    </div>
                    <button style={S.primaryBtn} type="submit">OMBORGA QO'SHISH</button>
                </form>
            </div>
        </motion.div>
    );

    const renderDashboard = () => (
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
                            <div>Rangi: <b style={{ color: '#fff' }}>{batch.color}</b></div>

                            <div style={{ borderTop: '1px solid #2a2a40', paddingTop: 10, marginTop: 5 }}>
                                <span style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Vazn (Qabul / Jami)</span>
                                <b style={{ color: isComplete ? '#81C784' : '#FFAB40', fontSize: 16 }}>{totalBrutoKg.toFixed(1)}</b> / {expectedWeight} kg
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
                            <p style={{ margin: '5px 0 0 0', opacity: 0.7 }}>{activeBatch.supplier_name} • {activeBatch.color}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{doneCount} / {activeBatch.expected_count}</div>
                            <div style={{ fontSize: 11, color: '#aaa' }}>Rulon yig'ildi</div>
                            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#81C784', marginTop: 5 }}>{totalBrutoKg.toFixed(1)} kg jami</div>
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
                        <h3 style={{ marginBottom: 15, marginTop: 30 }}>Yangi Rulon Qo'shish (Bruto kg)</h3>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
                            <input
                                type="number"
                                placeholder="Masanlan: 24.5"
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
                                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{r.bruto} kg</div>
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
                                        <div style={{ fontSize: 16, marginBottom: 10 }}>{r.fabric_name}</div>

                                        <div style={{ fontSize: 12, fontWeight: 'bold' }}>Vazni (BRUTO):</div>
                                        <div style={{ fontSize: 28, fontWeight: '900' }}>{r.bruto} kg</div>
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
                                    <div style={{ fontSize: 12, color: '#888' }}>Partiya: {r.batch_number} • Rangi: {r.fabric_name}</div>
                                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{r.neto ? r.neto.toFixed(2) : '---'} kg</div>
                                    <div style={{ fontSize: 12, marginTop: 5 }}>
                                        Eni: <b style={{ color: '#fff' }}>{r.en || '--'} sm</b> | Gramaj: <b style={{ color: '#fff' }}>{r.gramaj || '--'}</b>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ padding: '6px 12px', background: 'rgba(79, 195, 247, 0.15)', color: '#4FC3F7', borderRadius: 8, fontSize: 11, fontWeight: 'bold' }}>
                                        NETO OLINDI
                                    </span>
                                    <div style={{ fontSize: 11, color: '#555', marginTop: 10 }}>
                                        Bruto: {r.bruto} kg | Tara: {r.tara || 0} kg
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

            {tab === 'kirim' && !activeBatch && renderKirim()}

            {tab === 'ombor' && (
                activeBatch ? renderActiveBatch() : renderDashboard()
            )}

            {tab === 'neto' && !activeBatch && renderNeto()}
        </div>
    );
}
