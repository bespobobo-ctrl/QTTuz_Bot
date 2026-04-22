import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
    CheckCircle2, AlertTriangle, Scale, Ruler,
    Clock, Scissors, ChevronRight, AlertCircle,
    ClipboardCheck, Thermometer, Plus, Minus, Camera, Image as ImageIcon,
    Printer, X, Search
} from 'lucide-react';

export default function OmborchiPanel({ tab, data, load, showMsg }) {
    const [activeBatch, setActiveBatch] = useState(null);
    const [activeRoll, setActiveRoll] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [qrRoll, setQrRoll] = useState(null);
    const [images, setImages] = useState([]);
    const [inspectForm, setInspectForm] = useState({
        neto: '',
        en: '180',
        gramaj: '160-170',
        defects: { 'Dog\'': 0, 'Teshik': 0, 'Uloq': 0, 'Sirtiq': 0, 'Polyester xatosi': 0 }
    });

    const S = {
        card: { background: '#12121e', padding: 18, borderRadius: 20, border: '1px solid #2a2a40', marginBottom: 15 },
        input: { width: '100%', padding: 15, background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 12, color: '#fff', marginBottom: 10, outline: 'none' },
        badge: (c) => ({ padding: '4px 10px', background: `${c}1A`, color: c, borderRadius: 8, fontSize: 11, fontWeight: 'bold' }),
        btn: { width: '100%', padding: 14, borderRadius: 12, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
        counterBtn: { background: '#1a1a2e', border: '1px solid #2a2a40', color: '#fff', width: 35, height: 35, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }
    };

    const rolls = data.whRolls || [];
    const batches = data.whBatches || [];

    const readyBatches = batches.filter(b =>
        rolls.some(r => r.batch_id === b.id && r.status === 'BRUTO')
    );

    const handleInspect = async () => {
        if (!inspectForm.neto) return alert('Neto vaznni kiriting!');

        setIsSaving(true);
        const totalDefects = Object.values(inspectForm.defects).reduce((a, b) => a + b, 0);
        const finalStatus = totalDefects >= 12 ? 'BRAK' : 'KONTROLDAN_OTDI';

        const netoValue = Number(inspectForm.neto);
        const taraValue = (activeRoll.bruto - netoValue).toFixed(2);
        const now = new Date().toISOString();

        try {
            const updData = {
                tara: Number(taraValue),
                neto: netoValue,
                en: Number(inspectForm.en),
                gramaj: inspectForm.gramaj,
                defects: JSON.stringify(inspectForm.defects),
                status: finalStatus,
                inspection_date: now
            };

            const { error } = await supabase.from('warehouse_rolls').update(updData).eq('id', activeRoll.id);

            if (error) {
                alert("Baza bilan ulanib bo'lmadi: " + error.message);
                throw error;
            }

            alert('Muvaffaqiyatli saqlandi! ✅');
            setQrRoll({ ...activeRoll, ...updData });
            setActiveRoll(null);
            setImages([]);
            setInspectForm({ neto: '', en: '180', gramaj: '160-170', defects: { 'Dog\'': 0, 'Teshik': 0, 'Uloq': 0, 'Sirtiq': 0, 'Polyester xatosi': 0 } });
            load(true);
        } catch (e) {
            alert('Tizim xatosi: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const updateDefect = (d, val) => {
        setInspectForm(prev => ({
            ...prev,
            defects: { ...prev.defects, [d]: Math.max(0, prev.defects[d] + val) }
        }));
    };

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImages(prev => [...prev, reader.result]);
            reader.readAsDataURL(file);
        }
    };

    const renderRestingMatos = () => {
        const restingRolls = rolls.filter(r => r.status === 'KONTROLDAN_OTDI');
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20 }}>Tayyor (Dam olishdagi) matolar</h2>
                {restingRolls.length === 0 ? (
                    <div style={{ ...S.card, textAlign: 'center', opacity: 0.5 }}>Hali dam olgan matolar yo'q</div>
                ) : (
                    restingRolls.map(r => {
                        const insDate = new Date(r.inspection_date);
                        const diffMs = new Date() - insDate;
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const remainingHours = 48 - diffHours;
                        const isReady = remainingHours <= 0;

                        return (
                            <div key={r.id} style={{ ...S.card, borderLeft: `6px solid ${isReady ? '#00e676' : '#ff3b30'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <b>{r.batch_number}</b>
                                    <span style={{ fontSize: 13, fontWeight: 'bold', color: isReady ? '#00e676' : '#ff3b30' }}>
                                        {isReady ? 'BICHUVGA TAYYOR ✅' : `${remainingHours} soat dam olishi kerak ⏳`}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, marginTop: 10, opacity: 0.8 }}>
                                    {r.fabric_name} • {r.neto} kg / {r.bruto} kg (Neto/Bruto)
                                </div>
                            </div>
                        );
                    })
                )}
            </motion.div>
        );
    };

    if (tab === 'ombor') return renderRestingMatos();

    return (
        <div style={{ position: 'relative' }}>
            {activeBatch ? (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <button onClick={() => setActiveBatch(null)} style={{ background: 'none', border: 'none', color: '#00e676', fontWeight: 'bold', marginBottom: 15, cursor: 'pointer' }}>← PARTIYALAR RO'YXATI</button>
                    <div style={S.card}>
                        <h2 style={{ color: '#00e676', margin: 0 }}>{activeBatch.batch_number} Partiyasi</h2>
                        <p style={{ fontSize: 13, color: '#888', marginTop: 5 }}>Barcha rulonlarni tekshiruvdan o'tkazish majburiy!</p>
                        <div style={{ padding: '10px 0', borderTop: '1px solid #2a2a40', marginTop: 15 }}>
                            {rolls.filter(r => r.batch_id === activeBatch.id).map((r, i) => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1a1a2e' }}>
                                    <div>
                                        <span style={{ color: '#555', marginRight: 10 }}>{i + 1}.</span>
                                        <b>{r.bruto} kg</b> (Bruto)
                                        {r.status === 'KONTROLDAN_OTDI' && <span style={{ marginLeft: 10, color: '#00e676', fontSize: 10 }}>✅ Tekshirilgan</span>}
                                        {r.status === 'BRAK' && <span style={{ marginLeft: 10, color: '#E57373', fontSize: 10 }}>❌ BRAK</span>}
                                    </div>
                                    {r.status === 'BRUTO' ? (
                                        <button onClick={() => setActiveRoll(r)} style={{ ...S.btn, width: 'auto', padding: '6px 15px', background: '#00e676', color: '#000', fontSize: 11 }}>TAROZIGA QO'YISH</button>
                                    ) : (
                                        <CheckCircle2 size={18} color={r.status === 'BRAK' ? '#E57373' : '#00e676'} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                        <AlertCircle color="#FFD700" size={32} />
                        <h2 style={{ lineHeight: 1.2, margin: 0 }}>Bruto Partiyalar <br /><span style={{ color: '#FFD700', fontSize: 14 }}>(Nazorat kutilmoqda)</span></h2>
                    </div>

                    {readyBatches.length === 0 ? (
                        <div style={{ ...S.card, textAlign: 'center', opacity: 0.5, padding: 50 }}>Partiyalar mavjud emas</div>
                    ) : (
                        readyBatches.map(b => {
                            const batchRolls = rolls.filter(r => r.batch_id === b.id);
                            const inspectedCount = batchRolls.filter(r => r.status !== 'BRUTO').length;
                            return (
                                <div key={b.id} style={{ ...S.card, cursor: 'pointer' }} onClick={() => setActiveBatch(b)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: 22, margin: 0 }}>{b.batch_number}</h3>
                                            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{b.supplier_name} • {b.color}</div>
                                        </div>
                                        <ChevronRight color="#555" />
                                    </div>
                                    <div style={{ marginTop: 15, background: 'rgba(255,215,0,0.1)', padding: '8px 12px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, color: '#FFD700', fontWeight: 'bold' }}>PROGRES: {inspectedCount} / {batchRolls.length} rulon</span>
                                        <div style={{ width: 80, height: 6, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${(inspectedCount / batchRolls.length) * 100}%`, height: '100%', background: '#FFD700' }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </motion.div>
            )}

            {activeRoll && (
                <div style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 10000, padding: 20, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0 }}>Rulon Tekshiruvi</h2>
                        <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16 }}>YOPISH</button>
                    </div>

                    <div style={S.card}>
                        <h2 style={{ marginTop: 0, color: '#00e676' }}>Rulonni Taroziga Qo'ying ⚖️</h2>
                        <p style={{ fontSize: 14, color: '#888' }}>Partiya: <b>{activeBatch?.batch_number}</b> | Bruto: <b style={{ color: '#fff' }}>{activeRoll.bruto} kg</b></p>

                        <p style={{ color: '#888', fontSize: 11, fontWeight: 'bold', marginTop: 20, textTransform: 'uppercase' }}>O'LCHAMLAR VA NETO VAZN</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
                            <div>
                                <span style={{ fontSize: 11, color: '#00e676', fontWeight: 'bold' }}>Neto vazn (KG)</span>
                                <input style={{ ...S.input, borderColor: '#00e676' }} type="number" placeholder="Neto kg" value={inspectForm.neto} onChange={e => setInspectForm({ ...inspectForm, neto: e.target.value })} />
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: '#555' }}>Eni (sm)</span>
                                <input style={S.input} type="number" placeholder="180" value={inspectForm.en} onChange={e => setInspectForm({ ...inspectForm, en: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: 11, color: '#555' }}>Gramaj</span>
                            <input style={S.input} placeholder="160-170" value={inspectForm.gramaj} onChange={e => setInspectForm({ ...inspectForm, gramaj: e.target.value })} />
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <span style={{ fontSize: 11, color: '#888' }}>AVTOMATIK TARA:</span>
                            <b style={{ color: '#ff9800' }}>{(activeRoll.bruto - Number(inspectForm.neto)).toFixed(2)} kg</b>
                        </div>

                        <p style={{ color: '#888', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>NUQSONLARNI SANASH (Limit: 12)</p>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {Object.entries(inspectForm.defects).map(([d, count]) => (
                                <div key={d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 12 }}>
                                    <span style={{ fontSize: 14 }}>{d}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <button onClick={() => updateDefect(d, -1)} style={S.counterBtn}><Minus size={14} /></button>
                                        <b style={{ minWidth: 20, textAlign: 'center', color: count > 0 ? '#E57373' : '#fff' }}>{count}</b>
                                        <button onClick={() => updateDefect(d, 1)} style={S.counterBtn}><Plus size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 20, padding: 12, background: 'rgba(229, 115, 115, 0.1)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 'bold' }}>JAMI AYBLAR:</span>
                            <b style={{ fontSize: 18, color: '#E57373' }}>{Object.values(inspectForm.defects).reduce((a, b) => a + b, 0)} / 12</b>
                        </div>

                        <p style={{ color: '#888', fontSize: 11, fontWeight: 'bold', marginTop: 20, textTransform: 'uppercase' }}>FOTO TASDIQ</p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                            {images.map((img, i) => (
                                <img key={i} src={img} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} alt="Defect" />
                            ))}
                            <label style={{ width: 60, height: 60, background: '#1a1a2e', border: '1px dashed #2a2a40', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <Camera size={20} color="#555" />
                                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImage} />
                            </label>
                        </div>

                        <button
                            disabled={isSaving}
                            onClick={handleInspect}
                            style={{
                                ...S.btn,
                                background: isSaving ? '#555' : (Object.values(inspectForm.defects).reduce((a, b) => a + b, 0) >= 12 ? '#E57373' : '#00e676'),
                                color: '#000',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            {isSaving ? 'SAQLANMOQDA...' : (Object.values(inspectForm.defects).reduce((a, b) => a + b, 0) >= 12 ? 'BRAK SIFATIDA SAQLASH ❌' : 'TEKSHIRUVDAN O\'TKAZISH ✅')}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: '#333' }}>v1.0.4 - Inspection Fixed</div>
                    </div>
                </div>
            )}

            {qrRoll && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ ...S.card, width: '100%', maxWidth: 400, background: '#fff', color: '#000', textAlign: 'center', padding: 30 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <b style={{ fontSize: 18 }}>MATO PASPORTI</b>
                            <button onClick={() => setQrRoll(null)} style={{ background: 'none', border: 'none' }}><X color="#000" /></button>
                        </div>

                        <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 15, marginBottom: 20 }}>
                            <QRCodeCanvas value={`ROLL-${qrRoll.id}`} size={150} />
                            <div style={{ marginTop: 10, fontWeight: 'bold', fontSize: 13 }}>ID: ROLL-{qrRoll.id}</div>
                        </div>

                        <div style={{ textAlign: 'left', display: 'grid', gap: 10, fontSize: 13 }}>
                            <div style={P.row}><span>Partiya:</span> <b>{qrRoll.batch_number}</b></div>
                            <div style={P.row}><span>Rang:</span> <b>{qrRoll.color}</b></div>
                            <div style={P.row}><span>Bruto:</span> <b>{qrRoll.bruto} kg</b></div>
                            <div style={P.row}><span>Neto:</span> <b style={{ color: '#2e7d32' }}>{qrRoll.neto} kg</b></div>
                            <div style={P.row}><span>En / Gramaj:</span> <b>{qrRoll.en} sm / {qrRoll.gramaj}</b></div>
                            <div style={P.row}><span>Tekshiruv:</span> <b>{new Date(qrRoll.inspection_date).toLocaleString()}</b></div>

                            <div style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 10 }}>
                                <span style={{ fontSize: 11, color: '#666' }}>ANIQLANGAN NUQSONLAR:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                                    {Object.entries(JSON.parse(qrRoll.defects || '{}')).map(([d, c]) => c > 0 && (
                                        <span key={d} style={{ background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: 5, fontSize: 10 }}>{d}: {c}</span>
                                    ))}
                                    {Object.values(JSON.parse(qrRoll.defects || '{}')).every(c => c === 0) && <span style={{ color: '#2e7d32', fontSize: 11 }}>Nuqsonlar yo'q ✅</span>}
                                </div>
                            </div>
                        </div>

                        <button onClick={() => window.print()} style={{ ...S.btn, background: '#000', color: '#fff', marginTop: 30 }}>
                            <Printer size={18} /> PASPORTNI CHIQARISH
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const P = {
    row: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 5 }
};
