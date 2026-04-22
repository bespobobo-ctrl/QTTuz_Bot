import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard, Package, Calendar, CheckCircle2, ChevronRight,
    Printer, AlertCircle, PlusCircle, ScanLine, X
} from 'lucide-react';

export default function MatoOmboriPanel({ data, load, showMsg }) {
    const [tab, setTab] = useState('dashboard');
    const [activeBatch, setActiveBatch] = useState(null);
    const [newRollWeight, setNewRollWeight] = useState('');
    const [printBatchRolls, setPrintBatchRolls] = useState(null);

    // Styles
    const S = {
        card: { background: '#12121e', padding: 18, borderRadius: 20, border: '1px solid #2a2a40', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: 20 },
        btnGroup: { display: 'flex', gap: 5, background: '#1a1a2e', padding: 6, borderRadius: 18, marginBottom: 20, overflowX: 'auto' },
        tabBtn: (active) => ({ flex: 1, padding: '12px 20px', borderRadius: 14, background: active ? '#81C784' : 'transparent', color: active ? '#000' : '#888', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', whiteSpace: 'nowrap' }),
        input: { width: '100%', padding: '15px 20px', background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', outline: 'none', fontSize: 16 },
        primaryBtn: { padding: '14px 24px', background: '#81C784', color: '#000', borderRadius: 14, border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(129, 199, 132, 0.3)' },
        badge: (ok) => ({ padding: '4px 10px', background: ok ? 'rgba(129,199,132,0.1)' : 'rgba(255,171,64,0.1)', color: ok ? '#81C784' : '#FFAB40', borderRadius: 8, fontSize: 11, fontWeight: 'bold' }),
        printOverlay: { position: 'fixed', inset: 0, background: '#fff', zIndex: 99999, overflowY: 'auto', padding: 20, color: '#000' }
    };

    const batches = data.whBatches || [];
    const rolls = data.whRolls || [];

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

    const renderDashboard = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <LayoutDashboard color="#81C784" /> Partiyalar Tarixi & Holat
            </h2>

            {batches.map(batch => {
                const batchRolls = rolls.filter(r => r.batch_id === batch.id);
                const doneCount = batchRolls.length;
                const totalCount = batch.expected_count || 0;
                const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
                const isComplete = doneCount >= totalCount && totalCount > 0;

                return (
                    <div key={batch.id} style={{ ...S.card, cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => setActiveBatch(batch)}>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 4, background: '#1a1a2e', width: '100%' }}>
                            <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: isComplete ? '#81C784' : '#FFAB40', transition: 'width 0.5s' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Package size={20} color="#888" />
                                <span style={{ fontSize: 18, fontWeight: 'bold' }}>{batch.batch_number}</span>
                                <span style={S.badge(isComplete)}>
                                    {isComplete ? 'KONTROLGA TAYYOR ✅' : 'CHALA ⏳'}
                                </span>
                            </div>
                            <ChevronRight color="#555" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: '#aaa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={14} /> Sana: {new Date(batch.arrival_date || batch.created_at).toLocaleDateString()}</div>
                            <div>Rangi: <b style={{ color: '#fff' }}>{batch.color}</b></div>
                            <div>Ta'minotchi: {batch.supplier_name}</div>
                            <div>
                                Rulonlar: <b style={{ color: isComplete ? '#81C784' : '#FFAB40' }}>{doneCount}</b> / {totalCount}
                            </div>
                        </div>
                    </div>
                );
            })}
            {batches.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Partiyalar mavjud emas</div>}
        </motion.div>
    );

    const renderActiveBatch = () => {
        const batchRolls = rolls.filter(r => r.batch_id === activeBatch.id);
        const doneCount = batchRolls.length;
        const isComplete = doneCount >= activeBatch.expected_count;

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
                        </div>
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                        {isComplete ? (
                            <button onClick={() => setPrintBatchRolls(batchRolls)} style={{ ...S.primaryBtn, width: '100%', background: '#81C784', color: '#000' }}>
                                <Printer size={20} /> Barcha Rulonlarga Passport (QR) Chiqarish
                            </button>
                        ) : (
                            <div style={{ width: '100%', background: 'rgba(255,171,64,0.1)', padding: 15, borderRadius: 12, color: '#FFAB40', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                <AlertCircle size={18} /> Rulonlar to'liq kiritilgandan so'ng QR pechat ochiladi.
                            </div>
                        )}
                    </div>
                </div>

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
                    <button onClick={handleAddRoll} style={{ ...S.primaryBtn, padding: '0 25px' }}>
                        <PlusCircle size={24} />
                    </button>
                </div>

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

    // The hidden Print View using pure CSS for printing
    const renderPrintOverlay = () => {
        if (!printBatchRolls) return null;
        return (
            <div style={S.printOverlay}>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2>Print Preview</h2>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => window.print()} style={{ ...S.primaryBtn, padding: '10px 20px' }}>
                            <Printer size={18} /> Chop etish (Ctrl+P)
                        </button>
                        <button onClick={() => setPrintBatchRolls(null)} style={{ ...S.primaryBtn, background: '#eee', color: '#000' }}>
                            Chiqish
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
                                    ID: {r.id} • #{index + 1}
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
            .print-ticket { page-break-inside: avoid; border: 1px dashed #ccc !important; box-shadow: none !important; margin-bottom: 20mm; }
          }
        `}} />
            </div>
        );
    };

    return (
        <div style={{ position: 'relative' }}>
            {renderPrintOverlay()}

            {!activeBatch && (
                <div style={S.btnGroup}>
                    <button style={S.tabBtn(tab === 'dashboard')} onClick={() => setTab('dashboard')}>
                        <LayoutDashboard size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Holatlar
                    </button>
                    {/* Kelajakda qo'shish mumkin bo'lgan sahifalar uchun joy */}
                </div>
            )}

            {activeBatch ? renderActiveBatch() : (
                tab === 'dashboard' && renderDashboard()
            )}
        </div>
    );
}
