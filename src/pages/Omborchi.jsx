import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
    CheckCircle2, AlertTriangle, Scale, Ruler,
    Clock, Scissors, ChevronRight, AlertCircle,
    ClipboardCheck, Thermometer, Plus, Minus, Camera, Image as ImageIcon,
    Printer, X, Search, Scan
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function OmborchiPanel({ tab, data, load, showMsg }) {
    const [activeBatch, setActiveBatch] = useState(null);
    const [activeRoll, setActiveRoll] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerRef] = useState({ current: null });

    useEffect(() => {
        setActiveBatch(null);
        setActiveRoll(null);
        // Scanner-ni to'xtatish
        if (scannerRef.current) {
            try { scannerRef.current.stop().catch(() => { }); } catch (e) { }
            scannerRef.current = null;
            setScannerActive(false);
        }
    }, [tab]);
    const [qrRoll, setQrRoll] = useState(null);
    const [images, setImages] = useState([]);
    const [inspectForm, setInspectForm] = useState({
        neto: '',
        en: '180',
        gramaj: '160-170',
        defects: { 'Dog\'': 0, 'Teshik': 0, 'Uloq': 0, 'Sirtiq': 0, 'Polyester xatosi': 0 }
    });
    const parseColor = (str) => {
        if (!str) return { c: '', type: '', unit: 'kg' };
        if (str.includes('|')) {
            const [type, col, unit] = str.split('|').map(x => x.trim());
            return { type, col, unit: unit || 'kg' };
        }
        return { type: '', col: str, unit: 'kg' };
    };

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
        rolls.some(r => String(r.batch_id) === String(b.id) && r.status === 'BRUTO')
    );

    const handleInspect = async () => {
        if (!inspectForm.neto) return alert('Qiymatni kiriting!');

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
                neto_date: now
            };

            const { error } = await supabase.from('warehouse_rolls').update(updData).eq('id', activeRoll.id);

            if (error) {
                alert("Baza bilan ulanib bo'lmadi: " + error.message);
                throw error;
            }

            const { error: logErr } = await supabase.from('warehouse_log').insert({
                batch_id: activeRoll.batch_id,
                item_name: finalStatus === 'BRAK'
                    ? `BRAK ANIQLANDI: ${activeRoll.fabric_name} (ROLL-${activeRoll.id})`
                    : `NETO (TAYYOR): ${activeRoll.fabric_name} (ROLL-${activeRoll.id})`,
                quantity: netoValue,
                action_type: finalStatus === 'BRAK' ? 'BRAK' : 'KONTROLDAN_OTDI'
            });

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

        if (activeBatch && tab === 'ombor') {
            const batchRolls = restingRolls.filter(r => r.batch_id === activeBatch.id);
            return (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <button onClick={() => setActiveBatch(null)} style={{ background: 'none', border: 'none', color: '#00e676', fontWeight: 'bold', marginBottom: 15, cursor: 'pointer' }}>← TAYYOR PARTIYALAR</button>
                    <div style={S.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                            <div>
                                <h2 style={{ color: '#00e676', margin: 0 }}>{activeBatch.batch_number}</h2>
                                <p style={{ fontSize: 13, color: '#888', margin: '4px 0' }}>{activeBatch.fabric_name} • {activeBatch.color}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: '#555' }}>JAMI RULON</div>
                                <b style={{ fontSize: 18 }}>{batchRolls.length}</b>
                            </div>
                        </div>

                        <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            {batchRolls.map((r, i) => {
                                const insDate = new Date(r.neto_date);
                                const diffMs = new Date() - insDate;
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const remainingHours = 48 - diffHours;
                                const isReady = remainingHours <= 0;
                                const displayUnit = r.color_code === 'meter' ? 'meter' : 'kg';

                                return (
                                    <div key={r.id} style={{ ...S.card, marginBottom: 10, background: '#1a1a2e', borderLeft: `6px solid ${isReady ? '#00e676' : '#ff3b30'}` }} onClick={() => setQrRoll(r)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <b>Rulon #{i + 1}</b>
                                            <span style={{ fontSize: 12, fontWeight: 'bold', color: isReady ? '#00e676' : '#ff3b30' }}>
                                                {isReady ? 'TAYYOR ✅' : `${remainingHours}s qoldi ⏳`}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8, opacity: 0.8 }}>
                                            <span>Neto: <b>{r.neto} {displayUnit}</b></span>
                                            <span>Eni: <b>{r.en} sm</b></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            );
        }

        const groups = restingRolls.reduce((acc, r) => {
            const bid = r.batch_id;
            if (!acc[bid]) {
                const b = batches.find(x => String(x.id) === String(bid)) || {};
                acc[bid] = {
                    id: bid,
                    batch_number: r.batch_number || b.batch_number || '?',
                    supplier_name: b.supplier_name || '?',
                    fabric_name: r.fabric_name || parseColor(b.color).type || '?',
                    color: r.color || parseColor(b.color).col || '?',
                    items: []
                };
            }
            acc[bid].items.push(r);
            return acc;
        }, {});
        const groupedList = Object.values(groups);

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20 }}>Tayyor (Dam olishdagi) matolar</h2>
                {groupedList.length === 0 ? (
                    <div style={{ ...S.card, textAlign: 'center', opacity: 0.5 }}>Hali dam olgan matolar yo'q</div>
                ) : (
                    groupedList.map(b => {
                        const totalNeto = b.items.reduce((s, r) => s + (Number(r.neto) || 0), 0);
                        const totalBruto = b.items.reduce((s, r) => s + (Number(r.bruto) || 0), 0);
                        const unit = b.items[0]?.color_code === 'meter' ? 'meter' : 'kg';

                        const first = b.items[0];
                        const eni = first.en;
                        const gramaj = first.gramaj;

                        const waitHours = b.items.map(r => {
                            const diffMs = new Date() - new Date(r.neto_date);
                            const h = 48 - Math.floor(diffMs / (1000 * 60 * 60));
                            return h > 0 ? h : 0;
                        });
                        const maxWait = Math.max(...waitHours);
                        const allReady = maxWait <= 0;

                        return (
                            <div key={b.id} style={{ ...S.card, borderLeft: `6px solid ${allReady ? '#00e676' : '#ff3b30'}`, cursor: 'pointer' }} onClick={() => setActiveBatch(b)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontSize: 20, margin: 0 }}>{b.batch_number}</h3>
                                        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                                            <b>{b.fabric_name}</b> • {b.color}
                                        </div>
                                    </div>
                                    <ChevronRight color="#555" />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 15, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: '#555', fontWeight: 'bold' }}>NETO / BRUTO</div>
                                        <b style={{ fontSize: 14 }}>{totalNeto.toFixed(1)} / {totalBruto.toFixed(1)} <small>{unit}</small></b>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 10, color: '#555', fontWeight: 'bold' }}>ENI / GRAMAJ</div>
                                        <b style={{ fontSize: 14 }}>{eni} sm / {gramaj}</b>
                                    </div>
                                </div>

                                <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, fontWeight: 'bold', color: allReady ? '#00e676' : '#ff3b30', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        {allReady ? (
                                            <><CheckCircle2 size={16} /> BICHUVGA TAYYOR </>
                                        ) : (
                                            <><Clock size={16} /> DAM OLMOQDA ({maxWait}s qoldi)</>
                                        )}
                                    </span>
                                    <span style={{ fontSize: 11, color: '#888' }}>{b.items.length} ta rulon</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </motion.div>
        );
    };

    const [scanConfirm, setScanConfirm] = useState(null); // {roll, batch} — kontrolga olish so'rovi

    const handleScanSuccess = async (decodedText) => {
        let rollId = null;

        // Format 1: ROLL-{id} yoki NETO-{id}
        if (decodedText.startsWith('ROLL-')) {
            rollId = decodedText.replace('ROLL-', '');
        } else if (decodedText.startsWith('NETO-')) {
            rollId = decodedText.replace('NETO-', '');
        } else {
            // Format 2: JSON {"id":"...","batch":"..."}
            try {
                const parsed = JSON.parse(decodedText);
                if (parsed.id) rollId = String(parsed.id);
            } catch (e) { }
        }

        if (!rollId) {
            showMsg("Noma'lum QR kod!", "err");
            return;
        }

        // 1. Local ro'yxatdan qidirish
        let found = rolls.find(r => String(r.id) === String(rollId));

        if (!found) {
            // 2. Bazadan qidirish
            const { data } = await supabase
                .from('warehouse_rolls')
                .select('*')
                .eq('id', rollId)
                .single();
            if (data) found = data;
        }

        if (!found) {
            showMsg("Rulon topilmadi!", "err");
            return;
        }

        const b = batches.find(x => String(x.id) === String(found.batch_id));
        const fullRoll = { ...found, batch_number: b?.batch_number || found.batch_number };

        if (found.status === 'BRUTO') {
            // BRUTO rulon — kontrolga olishni so'rash
            setScanConfirm({ roll: fullRoll, batch: b });
            showMsg("BRUTO rulon aniqlandi ⚖️");
        } else if (found.status === 'KONTROLDAN_OTDI' || found.status === 'BRAK') {
            // NETO yoki BRAK rulon — to'liq pasport ko'rsatish
            setQrRoll(fullRoll);
            showMsg("Neto pasport aniqlandi ✅");
        } else {
            setQrRoll(fullRoll);
            showMsg("Rulon aniqlandi ✅");
        }
    };

    const startScanner = async () => {
        try {
            // Avval kamera ruxsatini so'rash
            await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });

            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                (decodedText) => {
                    // Muvaffaqiyatli skanerlash
                    html5QrCode.stop().catch(() => { });
                    scannerRef.current = null;
                    setScannerActive(false);
                    handleScanSuccess(decodedText);
                },
                () => { } // xatolarni ignoring
            );
            setScannerActive(true);
        } catch (err) {
            console.error("Scanner error:", err);
            if (err.name === 'NotAllowedError') {
                showMsg("Kameraga ruxsat berilmadi! Telegram sozlamalardan ruxsat bering.", "err");
            } else if (err.name === 'NotReadableError') {
                showMsg("Kamera band yoki ishlamayapti. Boshqa ilovalarni yoping.", "err");
            } else {
                showMsg("Kamera xatosi: " + (err.message || err.name), "err");
            }
        }
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(() => { });
            scannerRef.current = null;
            setScannerActive(false);
        }
    };

    const handleFileScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const html5QrCode = new Html5Qrcode("reader-file");
            const result = await html5QrCode.scanFile(file, true);
            handleScanSuccess(result);
        } catch (err) {
            showMsg("QR kod topilmadi yoki o'qib bo'lmadi", "err");
        }
    };

    // activeRoll — GLOBAL tekshiruv formasi, barcha tablardan oldin ko'rinadi
    if (activeRoll) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: '#0a0a14', zIndex: 10000, padding: 20, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>Rulon Tekshiruvi</h2>
                    <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16 }}>YOPISH</button>
                </div>

                <div style={S.card}>
                    <h2 style={{ marginTop: 0, color: '#00e676' }}>{activeRoll.color_code === 'meter' ? 'Metirni Tekshiring 📏' : 'Rulonni Taroziga Qo\'ying ⚖️'}</h2>
                    <p style={{ fontSize: 14, color: '#888' }}>Partiya: <b>{activeRoll.batch_number || activeBatch?.batch_number}</b> | {activeRoll.color_code === 'meter' ? 'Kelgan metir' : 'Bruto'}: <b style={{ color: '#fff' }}>{activeRoll.bruto} {activeRoll.color_code || 'kg'}</b></p>

                    <p style={{ color: '#888', fontSize: 11, fontWeight: 'bold', marginTop: 20, textTransform: 'uppercase' }}>{activeRoll.color_code === 'meter' ? 'HAQIQIY METIR' : 'O\'LCHAMLAR VA NETO VAZN'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
                        <div>
                            <span style={{ fontSize: 11, color: '#00e676', fontWeight: 'bold' }}>{activeRoll.color_code === 'meter' ? 'Haqiqiy metir' : 'Neto vazn (KG)'}</span>
                            <input style={{ ...S.input, borderColor: '#00e676' }} type="number" placeholder={activeRoll.color_code === 'meter' ? "Metitni kiriting" : "Neto kg"} value={inspectForm.neto} onChange={e => setInspectForm({ ...inspectForm, neto: e.target.value })} />
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
                        <span style={{ fontSize: 11, color: '#888' }}>{activeRoll.color_code === 'meter' ? 'FARQ:' : 'AVTOMATIK TARA:'}</span>
                        <b style={{ color: '#ff9800' }}>{(activeRoll.bruto - Number(inspectForm.neto)).toFixed(2)} {activeRoll.color_code || 'kg'}</b>
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
                </div>
            </div>
        );
    }

    if (tab === 'scan') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20 }}>Rulon Skayneri (Radar)</h2>
                <div style={S.card}>
                    <div id="reader" style={{ width: '100%', borderRadius: 15, overflow: 'hidden', minHeight: scannerActive ? 300 : 0 }}></div>
                    <div id="reader-file" style={{ display: 'none' }}></div>

                    {!scannerActive ? (
                        <div style={{ display: 'grid', gap: 12 }}>
                            <button onClick={startScanner} style={{ ...S.btn, background: '#00e676', color: '#000', padding: 16 }}>
                                <Camera size={20} /> KAMERANI OCHISH
                            </button>
                            <label style={{ ...S.btn, background: '#4FC3F7', color: '#000', padding: 16, cursor: 'pointer' }}>
                                <ImageIcon size={20} /> RASMDAN SKANERLASH
                                <input type="file" accept="image/*" onChange={handleFileScan} style={{ display: 'none' }} />
                            </label>
                        </div>
                    ) : (
                        <button onClick={stopScanner} style={{ ...S.btn, background: '#ff5252', color: '#fff', marginTop: 15, padding: 16 }}>
                            <X size={20} /> SKAYNERNI TO'XTATISH
                        </button>
                    )}
                </div>

                {/* BRUTO rulon — Kontrolga olish */}
                {scanConfirm && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                        <div style={{ ...S.card, maxWidth: 400, width: '100%', textAlign: 'center', padding: 30 }}>
                            <Scale size={48} color="#FFD700" style={{ marginBottom: 15 }} />
                            <h2 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>BRUTO Rulon Aniqlandi!</h2>
                            <div style={{ background: 'rgba(255,215,0,0.1)', padding: 15, borderRadius: 12, marginBottom: 20, textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ color: '#888' }}>Partiya:</span>
                                    <b>{scanConfirm.roll.batch_number}</b>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ color: '#888' }}>Mato:</span>
                                    <b>{scanConfirm.roll.fabric_name} ({scanConfirm.roll.color})</b>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#888' }}>Bruto:</span>
                                    <b style={{ color: '#FFD700', fontSize: 18 }}>{scanConfirm.roll.bruto} {scanConfirm.roll.color_code || 'kg'}</b>
                                </div>
                            </div>
                            <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 20px 0' }}>
                                Bu matoni <b style={{ color: '#00e676' }}>KONTROLGA</b> olasizmi?
                            </p>
                            <div style={{ display: 'grid', gap: 10 }}>
                                <button onClick={async () => {
                                    const { roll, batch } = scanConfirm;
                                    setActiveBatch(batch);
                                    setActiveRoll(roll);
                                    setScanConfirm(null);

                                    showConfirm(
                                        `Bu rulonni tekshiruvga (Kontrolga) kiritasizmi?`,
                                        async () => {
                                            await supabase.from('warehouse_log').insert({
                                                batch_id: roll.batch_id,
                                                item_name: `TEKSHIRUV: Rulon #${roll.id} kontrolga olindi`,
                                                quantity: roll.bruto,
                                                action_type: 'INSPECTION_START'
                                            });
                                        }
                                    );
                                }} style={{ ...S.btn, background: '#00e676', color: '#000', padding: 16, fontSize: 16 }}>
                                    <CheckCircle2 size={20} /> HA, KONTROLGA OLISH
                                </button>
                                <button onClick={() => {
                                    setScanConfirm(null);
                                }} style={{ ...S.btn, background: '#333', color: '#fff', padding: 14 }}>
                                    <X size={18} /> YO'Q, BEKOR QILISH
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* QR Neto Passport ko'rsatish */}
                {qrRoll && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
                        <div className="printable-passport" style={{ ...S.card, width: '100%', maxWidth: 400, background: '#fff', color: '#000', padding: 30, position: 'relative' }}>
                            <button onClick={() => setQrRoll(null)} style={{ position: 'absolute', top: 15, right: 15, background: '#eee', border: 'none', borderRadius: '50%', padding: 10, cursor: 'pointer' }}>
                                <X color="#000" size={24} />
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <b style={{ fontSize: 20, color: qrRoll.status === 'BRUTO' ? '#E65100' : (qrRoll.status === 'BRAK' ? '#c62828' : '#2e7d32') }}>
                                    {qrRoll.status === 'BRUTO' ? '⚖️ BRUTO PASPORT' : (qrRoll.status === 'BRAK' ? '❌ BRAK RULON' : '✅ NETO PASPORT')}
                                </b>
                            </div>

                            <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 15, marginBottom: 20, textAlign: 'center' }} className="qr-container">
                                <QRCodeCanvas value={qrRoll.status === 'KONTROLDAN_OTDI' ? `NETO-${qrRoll.id}` : `ROLL-${qrRoll.id}`} size={180} />
                                <div style={{ marginTop: 10, fontWeight: 'bold', fontSize: 13 }}>
                                    {qrRoll.status === 'KONTROLDAN_OTDI' ? `NETO-${qrRoll.id}` : `ROLL-${qrRoll.id}`}
                                </div>
                            </div>

                            <div style={{ textAlign: 'left', display: 'grid', gap: 10, fontSize: 14 }}>
                                <div style={P.row}><span>Partiya:</span> <b>{qrRoll.batch_number}</b></div>
                                <div style={P.row}><span>Mato:</span> <b>{qrRoll.fabric_name}</b></div>
                                <div style={P.row}><span>Rangi:</span> <b>{qrRoll.color}</b></div>
                                <div style={P.row}><span>Bruto:</span> <b>{qrRoll.bruto} {qrRoll.color_code || 'kg'}</b></div>
                                {qrRoll.neto && <div style={P.row}><span>Neto:</span> <b style={{ color: '#2e7d32' }}>{qrRoll.neto} {qrRoll.color_code || 'kg'}</b></div>}
                                {qrRoll.tara && <div style={P.row}><span>Tara:</span> <b style={{ color: '#ff5252' }}>{qrRoll.tara} {qrRoll.color_code || 'kg'}</b></div>}
                                {qrRoll.en && <div style={P.row}><span>Eni:</span> <b>{qrRoll.en} sm</b></div>}
                                {qrRoll.gramaj && <div style={P.row}><span>Gramaj:</span> <b>{qrRoll.gramaj}</b></div>}
                                {qrRoll.neto_date && <div style={P.row}><span>Sana:</span> <b>{new Date(qrRoll.neto_date).toLocaleString()}</b></div>}
                                <div style={P.row}><span>Holat:</span>
                                    <b style={{ color: qrRoll.status === 'KONTROLDAN_OTDI' ? '#2e7d32' : (qrRoll.status === 'BRAK' ? '#c62828' : '#E65100') }}>
                                        {qrRoll.status === 'KONTROLDAN_OTDI' ? 'TEKSHIRILGAN ✅' : (qrRoll.status === 'BRAK' ? 'BRAK ❌' : 'BRUTO ⚖️')}
                                    </b>
                                </div>

                                {qrRoll.defects && (() => {
                                    const defects = typeof qrRoll.defects === 'string' ? JSON.parse(qrRoll.defects) : qrRoll.defects;
                                    const hasDefects = Object.values(defects).some(v => v > 0);
                                    return (
                                        <div style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 10 }}>
                                            <span style={{ fontSize: 11, color: '#666' }}>NUQSONLAR:</span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                                                {Object.entries(defects).map(([d, c]) => c > 0 && (
                                                    <span key={d} style={{ background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: 5, fontSize: 11 }}>{d}: {c}</span>
                                                ))}
                                                {!hasDefects && <span style={{ color: '#2e7d32', fontSize: 12 }}>Nuqsonlar yo'q ✅</span>}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <button onClick={() => window.print()} style={{ ...S.btn, background: '#000', color: '#fff', marginTop: 20 }} className="hide-on-print">
                                <Printer size={18} /> PASPORTNI CHOP ETISH
                            </button>
                        </div>
                        <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                .printable-passport, .printable-passport * { visibility: visible; }
                                .hide-on-print { display: none !important; }
                                .printable-passport { position: absolute; left: 0; top: 0; width: 100% !important; box-shadow: none !important; border: none !important; }
                                .qr-container { background: none !important; padding: 0 !important; }
                            }
                        `}</style>
                    </div>
                )}
            </motion.div>
        );
    }

    if (tab === 'ombor') return renderRestingMatos();

    return (
        <div style={{ position: 'relative' }}>
            {activeBatch ? (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <button onClick={() => setActiveBatch(null)} style={{ background: 'none', border: 'none', color: '#00e676', fontWeight: 'bold', marginBottom: 15, cursor: 'pointer' }}>← PARTIYALAR RO'YXATI</button>
                    <div style={S.card}>
                        <h2 style={{ color: '#00e676', margin: 0 }}>{activeBatch.batch_number} Partiyasi</h2>
                        <p style={{ fontSize: 13, color: '#888', marginTop: 5 }}>
                            {parseColor(activeBatch.color).type} | {parseColor(activeBatch.color).col}
                        </p>
                        <div style={{ padding: '10px 0', borderTop: '1px solid #2a2a40', marginTop: 15 }}>
                            {rolls.filter(r => String(r.batch_id) === String(activeBatch.id)).map((r, i) => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1a1a2e' }}>
                                    <div>
                                        <span style={{ color: '#555', marginRight: 10 }}>{i + 1}.</span>
                                        <b>{r.bruto} {r.color_code || 'kg'}</b> (Bruto)
                                        {r.status === 'KONTROLDAN_OTDI' && <span style={{ marginLeft: 10, color: '#00e676', fontSize: 10 }}>✅ Tekshirilgan</span>}
                                        {r.status === 'BRAK' && <span style={{ marginLeft: 10, color: '#E57373', fontSize: 10 }}>❌ BRAK</span>}
                                    </div>
                                    {r.status === 'BRUTO' ? (
                                        <button onClick={() => setActiveRoll(r)} style={{ ...S.btn, width: 'auto', padding: '6px 15px', background: '#00e676', color: '#000', fontSize: 11 }}>TAROZIGA QO'YISH</button>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <button onClick={() => setQrRoll(r)} style={{ background: 'none', border: 'none', color: '#00e676' }}><Printer size={18} /></button>
                                            <CheckCircle2 size={18} color={r.status === 'BRAK' ? '#E57373' : '#00e676'} />
                                        </div>
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
                            const batchRolls = rolls.filter(r => String(r.batch_id) === String(b.id));
                            const inspectedCount = batchRolls.filter(r => r.status !== 'BRUTO').length;
                            return (
                                <div key={b.id} style={{ ...S.card, cursor: 'pointer' }} onClick={() => setActiveBatch(b)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: 22, margin: 0 }}>{b.batch_number}</h3>
                                            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                                                {b.supplier_name} • {parseColor(b.color).type} ({parseColor(b.color).col})
                                            </div>
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

            {qrRoll && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
                    <div className="printable-passport" style={{ ...S.card, width: '100%', maxWidth: 400, background: '#fff', color: '#000', padding: 30, position: 'relative' }}>
                        <button onClick={() => setQrRoll(null)} style={{ position: 'absolute', top: 15, right: 15, background: '#eee', border: 'none', borderRadius: '50%', padding: 10, cursor: 'pointer' }}>
                            <X color="#000" size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <b style={{ fontSize: 20, color: qrRoll.status === 'BRUTO' ? '#E65100' : (qrRoll.status === 'BRAK' ? '#c62828' : '#2e7d32') }}>
                                {qrRoll.status === 'BRUTO' ? '⚖️ BRUTO PASPORT' : (qrRoll.status === 'BRAK' ? '❌ BRAK RULON' : '✅ NETO PASPORT')}
                            </b>
                        </div>

                        <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 15, marginBottom: 20, textAlign: 'center' }} className="qr-container">
                            <QRCodeCanvas value={qrRoll.status === 'KONTROLDAN_OTDI' ? `NETO-${qrRoll.id}` : `ROLL-${qrRoll.id}`} size={180} />
                            <div style={{ marginTop: 10, fontWeight: 'bold', fontSize: 13 }}>
                                {qrRoll.status === 'KONTROLDAN_OTDI' ? `NETO-${qrRoll.id}` : `ROLL-${qrRoll.id}`}
                            </div>
                        </div>

                        <div className="hide-on-print" style={{ textAlign: 'left', display: 'grid', gap: 10, fontSize: 14 }}>
                            <div style={P.row}><span>Partiya:</span> <b>{qrRoll.batch_number}</b></div>
                            <div style={P.row}><span>Mato:</span> <b>{qrRoll.fabric_name}</b></div>
                            <div style={P.row}><span>Rangi:</span> <b>{qrRoll.color}</b></div>
                            <div style={P.row}><span>Bruto:</span> <b>{qrRoll.bruto} {qrRoll.color_code || 'kg'}</b></div>
                            {qrRoll.neto && <div style={P.row}><span>Neto:</span> <b style={{ color: '#2e7d32' }}>{qrRoll.neto} {qrRoll.color_code || 'kg'}</b></div>}
                            {qrRoll.tara && <div style={P.row}><span>Tara:</span> <b style={{ color: '#ff5252' }}>{qrRoll.tara} {qrRoll.color_code || 'kg'}</b></div>}
                            {qrRoll.en && <div style={P.row}><span>Eni:</span> <b>{qrRoll.en} sm</b></div>}
                            {qrRoll.gramaj && <div style={P.row}><span>Gramaj:</span> <b>{qrRoll.gramaj}</b></div>}
                            {qrRoll.neto_date && <div style={P.row}><span>Sana:</span> <b>{new Date(qrRoll.neto_date).toLocaleString()}</b></div>}
                            <div style={P.row}><span>Holat:</span>
                                <b style={{ color: qrRoll.status === 'KONTROLDAN_OTDI' ? '#2e7d32' : (qrRoll.status === 'BRAK' ? '#c62828' : '#E65100') }}>
                                    {qrRoll.status === 'KONTROLDAN_OTDI' ? 'TEKSHIRILGAN ✅' : (qrRoll.status === 'BRAK' ? 'BRAK ❌' : 'BRUTO ⚖️')}
                                </b>
                            </div>
                        </div>

                        <button onClick={() => window.print()} style={{ ...S.btn, background: '#000', color: '#fff', marginTop: 20 }} className="hide-on-print">
                            <Printer size={18} /> PASPORTNI CHOP ETISH
                        </button>
                    </div>

                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .printable-passport, .printable-passport * { visibility: visible; }
                            .hide-on-print { display: none !important; }
                            .printable-passport { position: absolute; left: 0; top: 0; width: 100% !important; box-shadow: none !important; border: none !important; }
                            .qr-container { background: none !important; padding: 0 !important; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}

const P = {
    row: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 5 }
};
