import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
    Scissors, CheckCircle2, Clock, Scan,
    History, Package, ChevronRight, X,
    Search, Camera, Image as ImageIcon, Trash2,
    Info, AlertTriangle, Ruler, Shirt
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function BichuvPanel({ tab, data, load, showMsg }) {
    const [activeRoll, setActiveRoll] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerRef] = useState({ current: null });
    const [cutForm, setCutForm] = useState({
        model: '',
        pieces: '',
        waste: '0',
        notes: ''
    });

    useEffect(() => {
        setActiveRoll(null);
        if (scannerRef.current) {
            try { scannerRef.current.stop().catch(() => { }); } catch (e) { }
            scannerRef.current = null;
            setScannerActive(false);
        }
    }, [tab]);

    const S = {
        card: { background: '#12121e', padding: 18, borderRadius: 20, border: '1px solid #2a2a40', marginBottom: 15 },
        input: { width: '100%', padding: 15, background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 12, color: '#fff', marginBottom: 10, outline: 'none' },
        btn: { width: '100%', padding: 14, borderRadius: 12, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
        badge: (c) => ({ padding: '4px 10px', background: `${c}1A`, color: c, borderRadius: 8, fontSize: 11, fontWeight: 'bold' }),
    };

    const rolls = data.whRolls || [];
    const batches = data.whBatches || [];

    // Bichuvga tayyor bo'lgan rulonlarni saralash (status: KONTROLDAN_OTDI va 48 soat o'tgan)
    const getIsReady = (roll) => {
        if (!roll.neto_date) return false;
        const diffMs = new Date() - new Date(roll.neto_date);
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        return diffHours >= 48;
    };

    const readyRolls = rolls.filter(r => r.status === 'KONTROLDAN_OTDI');
    const cutRolls = rolls.filter(r => r.status === 'BICHILDI');

    const handleCut = async () => {
        if (!cutForm.model || !cutForm.pieces) return alert('Model va dona sonini kiriting!');

        setIsSaving(true);
        const now = new Date().toISOString();

        try {
            // Rulon holatini yangilash
            const { error: updErr } = await supabase
                .from('warehouse_rolls')
                .update({
                    status: 'BICHILDI',
                    // Bizda hozircha bichuv_info deb atalgan ustun yo'q, 
                    // shuning uchun logga yozamiz va statusni o'zgartiramiz.
                })
                .eq('id', activeRoll.id);

            if (updErr) throw updErr;

            // Logga yozish
            const { error: logErr } = await supabase.from('warehouse_log').insert({
                item_name: `BICHUV: ${activeRoll.fabric_name} (ROLL-${activeRoll.id})`,
                quantity: activeRoll.neto,
                action_type: 'BICHUV',
                notes: `Model: ${cutForm.model}, Dona: ${cutForm.pieces}, Chiqindi: ${cutForm.waste}kg`
            });

            if (logErr) throw logErr;

            showMsg('Bichuv muvaffaqiyatli saqlandi! ✂️');
            setActiveRoll(null);
            setCutForm({ model: '', pieces: '', waste: '0', notes: '' });
            load(true);
        } catch (e) {
            alert('Xato yuz berdi: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const startScanner = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            const html5QrCode = new Html5Qrcode("bichuv-reader");
            scannerRef.current = html5QrCode;
            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (text) => {
                    html5QrCode.stop().catch(() => { });
                    scannerRef.current = null;
                    setScannerActive(false);
                    processScan(text);
                },
                () => { }
            );
            setScannerActive(true);
        } catch (e) {
            showMsg("Kamera ochilmadi!", "err");
        }
    };

    const processScan = (text) => {
        let id = text.replace('NETO-', '').replace('ROLL-', '');
        const found = rolls.find(r => String(r.id) === String(id));
        if (!found) return showMsg("Rulon topilmadi!", "err");

        if (found.status === 'BICHILDI') return showMsg("Bu rulon allaqachon bichilgan!", "err");
        if (found.status === 'BRUTO') return showMsg("Rulon hali kontroldan o'tmagan!", "err");

        if (!getIsReady(found)) {
            if (!window.confirm("Bu rulon hali 48 soat dam olmadi. Shunda ham bichishni davom ettirasizmi?")) return;
        }

        setActiveRoll(found);
    };

    if (activeRoll) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>Bichuv Operatsiyasi</h2>
                    <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                </div>

                <div style={S.card}>
                    <div style={{ color: '#F06292', fontWeight: 'bold', fontSize: 13, marginBottom: 10 }}>RULON MA'LUMOTI</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{activeRoll.fabric_name}</div>
                    <div style={{ color: '#888', fontSize: 14 }}>{activeRoll.color} • {activeRoll.neto} kg</div>

                    {!getIsReady(activeRoll) && (
                        <div style={{ marginTop: 10, background: 'rgba(255, 152, 0, 0.1)', padding: 10, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                            <AlertTriangle color="#ff9800" size={18} />
                            <span style={{ fontSize: 12, color: '#ff9800' }}>Diqqat! Rulon dam olish muddati tugamagan.</span>
                        </div>
                    )}
                </div>

                <div style={S.card}>
                    <div style={{ color: '#F06292', fontWeight: 'bold', fontSize: 13, marginBottom: 15 }}>BICHUV MA'LUMOTLARI</div>

                    <span style={{ fontSize: 12, color: '#555', marginLeft: 5 }}>Model Nomi</span>
                    <input style={S.input} placeholder="Masalan: T-Shirt Premium V1" value={cutForm.model} onChange={e => setCutForm({ ...cutForm, model: e.target.value })} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <span style={{ fontSize: 12, color: '#555', marginLeft: 5 }}>Dona Soni (Tayyor)</span>
                            <input type="number" style={S.input} placeholder="0" value={cutForm.pieces} onChange={e => setCutForm({ ...cutForm, pieces: e.target.value })} />
                        </div>
                        <div>
                            <span style={{ fontSize: 12, color: '#555', marginLeft: 5 }}>Chiqindi (kg)</span>
                            <input type="number" style={S.input} placeholder="0.0" value={cutForm.waste} onChange={e => setCutForm({ ...cutForm, waste: e.target.value })} />
                        </div>
                    </div>

                    <span style={{ fontSize: 12, color: '#555', marginLeft: 5 }}>Izoh</span>
                    <textarea style={{ ...S.input, height: 80, resize: 'none' }} placeholder="Qo'shimcha ma'lumotlar..." value={cutForm.notes} onChange={e => setCutForm({ ...cutForm, notes: e.target.value })} />

                    <button
                        disabled={isSaving}
                        onClick={handleCut}
                        style={{ ...S.btn, background: '#F06292', color: '#fff', marginTop: 10, opacity: isSaving ? 0.7 : 1 }}
                    >
                        <Scissors size={20} /> {isSaving ? 'SAQLANMOQDA...' : 'BICHUVNI YAKUNLASH'}
                    </button>
                </div>
            </motion.div>
        );
    }

    if (tab === 'scan') {
        return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 20 }}>Rulonni Skanerlash ✂️</h2>
                <div style={S.card}>
                    <div id="bichuv-reader" style={{ width: '100%', borderRadius: 15, overflow: 'hidden' }}></div>
                    {!scannerActive ? (
                        <button onClick={startScanner} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>
                            <Camera size={20} /> KAMERANI OCHISH
                        </button>
                    ) : (
                        <button onClick={() => { scannerRef.current?.stop(); setScannerActive(false); }} style={{ ...S.btn, background: '#333', color: '#fff', marginTop: 15 }}>
                            <X size={20} /> TO'XTATISH
                        </button>
                    )}
                </div>

                <div style={{ marginTop: 20, opacity: 0.6, textAlign: 'center', fontSize: 12 }}>
                    Rulon pasportidagi QR kodni skanerlang
                </div>
            </div>
        );
    }

    if (tab === 'history') {
        return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 20 }}>Bichish Tarixi</h2>
                {cutRolls.length === 0 ? (
                    <div style={{ ...S.card, textAlign: 'center', opacity: 0.5 }}>Hali bichilgan rulonlar yo'q</div>
                ) : (
                    cutRolls.map(r => (
                        <div key={r.id} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{r.fabric_name}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>{r.color} • {r.neto} kg</div>
                                </div>
                                <div style={S.badge('#00e676')}>BICHILDI</div>
                            </div>
                            <div style={{ marginTop: 10, fontSize: 13, borderTop: '1px solid #2a2a40', paddingTop: 10, display: 'flex', gap: 20 }}>
                                <span>ID: <b>#{r.id}</b></span>
                                <span>Sana: <b>{new Date(r.neto_date).toLocaleDateString()}</b></span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    // Dashboard (Default / ombor)
    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                <div style={{ background: '#F06292', width: 45, height: 45, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Scissors color="#fff" size={24} />
                </div>
                <h2 style={{ margin: 0 }}>Bichuv Bo'limi <br /><span style={{ color: '#F06292', fontSize: 14 }}>Tayyor matolar nazorati</span></h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 25 }}>
                <div style={{ ...S.card, marginBottom: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#888' }}>TAYYOR MATOLAR</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#00e676' }}>{readyRolls.filter(getIsReady).length}</div>
                </div>
                <div style={{ ...S.card, marginBottom: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#888' }}>DAM OLMOQDA</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff9800' }}>{readyRolls.filter(r => !getIsReady(r)).length}</div>
                </div>
            </div>

            <h3 style={{ fontSize: 16, marginBottom: 15 }}>Rulonlar Ro'yxati</h3>
            {readyRolls.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', opacity: 0.5 }}>Hozircha matolar mavjud emas</div>
            ) : (
                readyRolls.map(r => {
                    const isReady = getIsReady(r);
                    const diffMs = new Date() - new Date(r.neto_date);
                    const remaining = 48 - Math.floor(diffMs / (1000 * 60 * 60));

                    return (
                        <div key={r.id} style={{ ...S.card, borderLeft: `5px solid ${isReady ? '#00e676' : '#ff9800'}` }} onClick={() => setActiveRoll(r)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{r.fabric_name}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>{r.color} • {r.neto} kg</div>
                                </div>
                                <ChevronRight size={20} color="#555" />
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: isReady ? '#00e676' : '#ff9800' }}>
                                    {isReady ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                    {isReady ? "BICHUVGA TAYYOR" : `DAM OLISHDA (${remaining}s qoldi)`}
                                </div>
                                <div style={{ fontSize: 11, color: '#555' }}>ID: #{r.id}</div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
