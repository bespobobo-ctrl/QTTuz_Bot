import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
    CheckCircle2, AlertTriangle, Scale, Ruler,
    Clock, Scissors, ChevronRight, AlertCircle,
    ClipboardCheck, Thermometer
} from 'lucide-react';

export default function OmborchiPanel({ tab, data, load, showMsg }) {
    const [activeBatch, setActiveBatch] = useState(null);
    const [activeRoll, setActiveRoll] = useState(null);
    const [inspectForm, setInspectForm] = useState({
        tara: '',
        en: '',
        gramaj: '',
        defects: []
    });

    const S = {
        card: { background: '#12121e', padding: 18, borderRadius: 20, border: '1px solid #2a2a40', marginBottom: 15 },
        input: { width: '100%', padding: 15, background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 12, color: '#fff', marginBottom: 10, outline: 'none' },
        badge: (c) => ({ padding: '4px 10px', background: `${c}1A`, color: c, borderRadius: 8, fontSize: 11, fontWeight: 'bold' }),
        btn: { width: '100%', padding: 14, borderRadius: 12, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
    };

    const DEFECT_TYPES = ['Dog\'', 'Teshik', 'Uloq', 'Sirtiq', 'Polyester xatosi'];

    const rolls = data.whRolls || [];
    const batches = data.whBatches || [];

    // Filter batches that have rolls in 'BRUTO' status (ready for inspection)
    const readyBatches = batches.filter(b =>
        rolls.some(r => r.batch_id === b.id && r.status === 'BRUTO')
    );

    const handleInspect = async () => {
        if (!inspectForm.tara || !inspectForm.en || !inspectForm.gramaj) {
            return showMsg('Barcha maydonlarni to\'ldiring!', 'err');
        }

        const neto = activeRoll.bruto - Number(inspectForm.tara);
        const now = new Date().toISOString();

        try {
            const { error } = await supabase.from('warehouse_rolls').update({
                tara: Number(inspectForm.tara),
                neto: neto,
                en: Number(inspectForm.en),
                gramaj: inspectForm.gramaj,
                defects: inspectForm.defects.join(', '),
                status: 'KONTROLDAN_OTDI',
                inspection_date: now
            }).eq('id', activeRoll.id);

            if (error) throw error;

            showMsg('Tekshiruv yakunlandi, mato dam olishga yuborildi!');
            setActiveRoll(null);
            setInspectForm({ tara: '', en: '', gramaj: '', defects: [] });
            load(true);
        } catch (e) {
            showMsg('Xatolik yuz berdi!', 'err');
        }
    };

    const toggleDefect = (d) => {
        setInspectForm(prev => ({
            ...prev,
            defects: prev.defects.includes(d) ? prev.defects.filter(x => x !== d) : [...prev.defects, d]
        }));
    };

    const renderRestingMatos = () => {
        const restingRolls = rolls.filter(r => r.status === 'KONTROLDAN_OTDI');

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#BA68C8' }}>
                    <Clock size={24} /> Dam olishdagi matolar (48 soat)
                </h2>
                {restingRolls.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Hozircha dam olishga kirgan matolar yo'q</div>
                ) : (
                    restingRolls.map(r => {
                        const insDate = new Date(r.inspection_date);
                        const now = new Date();
                        const diffMs = now - insDate;
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const remainingHours = 48 - diffHours;
                        const isReady = remainingHours <= 0;

                        return (
                            <div key={r.id} style={{ ...S.card, borderLeft: `5px solid ${isReady ? '#81C784' : '#E57373'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{r.batch_number} • {r.bruto} kg</div>
                                        <div style={{ fontSize: 11, color: '#888' }}>{r.fabric_name}</div>
                                    </div>
                                    {isReady ? (
                                        <span style={S.badge('#81C784')}>BICHUVGA TAYYOR ✅</span>
                                    ) : (
                                        <span style={S.badge('#E57373')}>DAM OLMOQDA ({remainingHours}s qoldi)</span>
                                    )}
                                </div>
                                {!isReady && (
                                    <div style={{ marginTop: 10, fontSize: 11, color: '#E57373', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <AlertTriangle size={14} /> 48 soat o'tmagan, ishlatish mumkin emas!
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </motion.div>
        );
    };

    const renderBatches = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#FFD700' }}>
                <AlertCircle size={24} /> Kantrolga tayyor partiyalar
            </h2>
            {readyBatches.map(b => (
                <div key={b.id} style={S.card} onClick={() => setActiveBatch(b)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: 18 }}>{b.batch_number}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{b.supplier_name} • {b.color}</div>
                        </div>
                        <ChevronRight color="#555" />
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <span style={S.badge('#FFD700')}>{rolls.filter(r => r.batch_id === b.id && r.status === 'BRUTO').length} ta rulon kutilmoqda</span>
                    </div>
                </div>
            ))}
            {readyBatches.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>Tekshiruvga partiyalar yo'q</div>}
        </motion.div>
    );

    const renderInspection = () => {
        const batchRolls = rolls.filter(r => r.batch_id === activeBatch.id && r.status === 'BRUTO');

        return (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <button onClick={() => setActiveBatch(null)} style={{ background: 'none', border: 'none', color: '#00e676', marginBottom: 20, fontWeight: 'bold' }}>← ORQAGA</button>
                <h2 style={{ marginBottom: 15 }}>{activeBatch.batch_number} - Rulonlarni tekshirish</h2>

                {batchRolls.map((r, i) => (
                    <div key={r.id} style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 15, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{i + 1}</div>
                                <b>{r.bruto} kg</b>
                            </div>
                            <button
                                onClick={() => setActiveRoll(r)}
                                style={{ ...S.btn, width: 'auto', padding: '8px 15px', background: '#00e676', color: '#000', fontSize: 12 }}
                            >
                                TEKSHIRUVNI BOSHLASH
                            </button>
                        </div>
                    </div>
                ))}
            </motion.div>
        );
    };

    return (
        <div style={{ position: 'relative' }}>
            {tab === 'dashboard' && renderBatches()}
            {tab === 'ombor' && renderRestingMatos()}

            {activeBatch && !activeRoll && renderInspection()}

            {activeRoll && (
                <div style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 10000, padding: 20, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                        <h2 style={{ margin: 0 }}>Rulon Tekshiruvi</h2>
                        <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#fff' }}>YOPISH</button>
                    </div>

                    <div style={S.card}>
                        <div style={{ marginBottom: 20, fontSize: 18 }}>Partiya: <b>{activeRoll.batch_number}</b> | Bruto: <b>{activeRoll.bruto} kg</b></div>

                        <p style={{ color: '#888', fontSize: 13 }}>TARA VA O'LCHAMLAR</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ fontSize: 11, color: '#555' }}>Tara (kg)</label>
                                <input style={S.input} type="number" placeholder="0.40" value={inspectForm.tara} onChange={e => setInspectForm({ ...inspectForm, tara: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: '#555' }}>Eni (sm)</label>
                                <input style={S.input} type="number" placeholder="180" value={inspectForm.en} onChange={e => setInspectForm({ ...inspectForm, en: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: '#555' }}>Gramaj</label>
                            <input style={S.input} placeholder="160-170" value={inspectForm.gramaj} onChange={e => setInspectForm({ ...inspectForm, gramaj: e.target.value })} />
                        </div>

                        <p style={{ color: '#888', fontSize: 13, marginTop: 20 }}>NUQSONLAR (BRAK)</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                            {DEFECT_TYPES.map(d => (
                                <button
                                    key={d}
                                    onClick={() => toggleDefect(d)}
                                    style={{ ...S.badge(inspectForm.defects.includes(d) ? '#E57373' : '#555'), cursor: 'pointer', padding: '8px 12px', border: 'none' }}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>

                        <button onClick={handleInspect} style={{ ...S.btn, background: '#00e676', color: '#000', marginTop: 20 }}>
                            TEKSHIRUVDAN O'TKAZISH ✅
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
