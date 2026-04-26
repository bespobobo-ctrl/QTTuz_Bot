import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
    Scissors, CheckCircle2, Clock, Scan,
    History, Package, ChevronRight, X,
    Search, Camera, Image as ImageIcon, Trash2,
    Info, AlertTriangle, Ruler, Shirt, Layers,
    TrendingUp, BarChart3, Activity, ArrowLeft
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function BichuvPanel({ tab, data, load, showMsg }) {
    const [activeRoll, setActiveRoll] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerRef] = useState({ current: null });
    const [cutForm, setCutForm] = useState({ model: '', pieces: '', waste: '0', notes: '' });

    useEffect(() => {
        setActiveRoll(null);
        if (scannerRef.current) {
            try { scannerRef.current.stop().catch(() => { }); } catch (e) { }
            scannerRef.current = null;
            setScannerActive(false);
        }
    }, [tab]);

    const S = {
        card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', padding: 20, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 15 },
        input: { width: '100%', padding: 15, background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', marginBottom: 10, outline: 'none' },
        btn: { width: '100%', padding: 15, borderRadius: 16, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' },
        badge: (c) => ({ padding: '5px 12px', background: `${c}20`, color: c, borderRadius: 10, fontSize: 11, fontWeight: '800', letterSpacing: '0.5px' }),
        glass: { background: 'rgba(255, 255, 255, 0.02)', borderRadius: 20, padding: 15, border: '1px solid rgba(255,255,255,0.05)' }
    };

    const rolls = data.whRolls || [];
    const getIsReady = (roll) => {
        if (!roll.neto_date) return false;
        const diffMs = new Date() - new Date(roll.neto_date);
        return Math.floor(diffMs / (1000 * 60 * 60)) >= 48;
    };

    const readyRolls = rolls.filter(r => r.status === 'KONTROLDAN_OTDI');
    const cutRolls = rolls.filter(r => r.status === 'BICHILDI');

    // Gruplash operatsiyasi
    const groupedFabrics = readyRolls.reduce((acc, r) => {
        const key = `${r.fabric_name}_${r.color}_${r.gramaj}`;
        if (!acc[key]) {
            acc[key] = {
                id: key,
                name: r.fabric_name,
                color: r.color,
                gramaj: r.gramaj,
                rolls: []
            };
        }
        acc[key].rolls.push(r);
        return acc;
    }, {});

    const fabricList = Object.values(groupedFabrics).map(g => {
        const totalNeto = g.rolls.reduce((sum, r) => sum + (Number(r.neto) || 0), 0);
        const avgEn = g.rolls.reduce((sum, r) => sum + (Number(r.en) || 0), 0) / g.rolls.length;

        let totalDefects = 0;
        g.rolls.forEach(r => {
            try {
                const def = typeof r.defects === 'string' ? JSON.parse(r.defects) : r.defects;
                totalDefects += Object.values(def || {}).reduce((a, b) => a + b, 0);
            } catch (e) { }
        });
        const avgDefects = totalDefects / g.rolls.length;

        const readyCount = g.rolls.filter(getIsReady).length;
        const allReady = readyCount === g.rolls.length;

        return { ...g, totalNeto, avgEn, avgDefects, readyCount, allReady };
    });

    const handleCut = async () => {
        if (!cutForm.model || !cutForm.pieces) return alert('Model va dona sonini kiriting!');
        setIsSaving(true);
        try {
            await supabase.from('warehouse_rolls').update({ status: 'BICHILDI' }).eq('id', activeRoll.id);
            await supabase.from('warehouse_log').insert({
                item_name: `BICHUV: ${activeRoll.fabric_name} (ROLL-${activeRoll.id})`,
                quantity: activeRoll.neto,
                action_type: 'BICHUV',
                notes: `Model: ${cutForm.model}, Dona: ${cutForm.pieces}, Chiqindi: ${cutForm.waste}kg`
            });
            showMsg('Bichuv yakunlandi! ✂️');
            setActiveRoll(null);
            setCutForm({ model: '', pieces: '', waste: '0', notes: '' });
            load(true);
        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
    };

    if (activeRoll) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                    <button onClick={() => setActiveRoll(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                    <h2 style={{ margin: 0, fontSize: 18 }}>Bichish Formasi</h2>
                    <div style={{ width: 24 }} />
                </div>

                <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(240, 98, 146, 0.15), rgba(240, 98, 146, 0.05))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>{activeRoll.fabric_name}</div>
                            <div style={{ color: '#F06292', fontWeight: 'bold', fontSize: 14, marginTop: 5 }}>{activeRoll.color}</div>
                        </div>
                        <div style={S.badge('#F06292')}>ID: #{activeRoll.id}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 20 }}>
                        <div style={S.glass}>
                            <div style={{ fontSize: 11, color: '#888' }}>NETO VAZN</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{activeRoll.neto} kg</div>
                        </div>
                        <div style={S.glass}>
                            <div style={{ fontSize: 11, color: '#888' }}>ENI / GRAMAJ</div>
                            <div style={{ fontSize: 15, fontWeight: 'bold' }}>{activeRoll.en}sm / {activeRoll.gramaj}</div>
                        </div>
                    </div>
                </div>

                <div style={S.card}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 12, color: '#888', marginLeft: 5 }}>MODEL NOMI</label>
                        <input style={S.input} placeholder="Modelni kiriting..." value={cutForm.model} onChange={e => setCutForm({ ...cutForm, model: e.target.value })} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#888', marginLeft: 5 }}>DONA SONI</label>
                                <input type="number" style={S.input} placeholder="0" value={cutForm.pieces} onChange={e => setCutForm({ ...cutForm, pieces: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#888', marginLeft: 5 }}>CHIQINDI (KG)</label>
                                <input type="number" style={S.input} placeholder="0.0" value={cutForm.waste} onChange={e => setCutForm({ ...cutForm, waste: e.target.value })} />
                            </div>
                        </div>

                        <label style={{ fontSize: 12, color: '#888', marginLeft: 5 }}>IZOH</label>
                        <textarea style={{ ...S.input, height: 80, resize: 'none' }} placeholder="Qo'shimcha izohlar..." value={cutForm.notes} onChange={e => setCutForm({ ...cutForm, notes: e.target.value })} />
                    </div>

                    <button disabled={isSaving} onClick={handleCut} style={{ ...S.btn, background: '#F06292', color: '#fff', fontSize: 16 }}>
                        <Scissors size={20} /> {isSaving ? 'SAQLANMOQDA...' : 'BICHUVNI TASDIQLASH'}
                    </button>
                </div>
            </motion.div>
        );
    }

    if (selectedGroup) {
        return (
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                    <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                    <h2 style={{ margin: 0, fontSize: 18 }}>Guruh Tafsilotlari</h2>
                    <div style={{ width: 24 }} />
                </div>

                <div style={{ ...S.card, borderLeft: `8px solid ${selectedGroup.allReady ? '#00e676' : '#ff9800'}` }}>
                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: '900' }}>{selectedGroup.name}</h1>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <div style={S.badge(selectedGroup.allReady ? '#00e676' : '#ff9800')}>
                            {selectedGroup.allReady ? 'TAYYOR' : 'DAM OLMOQDA'}
                        </div>
                        <div style={S.badge('#4FC3F7')}>{selectedGroup.color}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 25 }}>
                        <div style={S.glass}>
                            <div style={{ fontSize: 10, color: '#888' }}>JAMI NETO</div>
                            <div style={{ fontSize: 16, fontWeight: '800', color: '#00e676' }}>{selectedGroup.totalNeto.toFixed(1)} kg</div>
                        </div>
                        <div style={S.glass}>
                            <div style={{ fontSize: 10, color: '#888' }}>RULON SONI</div>
                            <div style={{ fontSize: 16, fontWeight: '800' }}>{selectedGroup.rolls.length} ta</div>
                        </div>
                        <div style={S.glass}>
                            <div style={{ fontSize: 10, color: '#888' }}>O'RTACHA ENI</div>
                            <div style={{ fontSize: 16, fontWeight: '800' }}>{selectedGroup.avgEn.toFixed(1)} sm</div>
                        </div>
                        <div style={S.glass}>
                            <div style={{ fontSize: 10, color: '#888' }}>O'RT. KAMCHILLIK</div>
                            <div style={{ fontSize: 16, fontWeight: '800', color: '#ff5252' }}>{selectedGroup.avgDefects.toFixed(1)} ta</div>
                        </div>
                    </div>
                </div>

                <h3 style={{ fontSize: 16, margin: '25px 0 15px 5px' }}>Rulonlar Ro'yxati</h3>
                {selectedGroup.rolls.map((r, i) => {
                    const isR = getIsReady(r);
                    return (
                        <div key={r.id} style={{ ...S.card, padding: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setActiveRoll(r)}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 'bold' }}>Rulon #{r.id}</div>
                                <div style={{ fontSize: 12, color: '#888' }}>{r.neto} kg • {r.en} sm</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {!isR && <Clock size={16} color="#ff9800" />}
                                <ChevronRight size={18} color="#555" />
                            </div>
                        </div>
                    );
                })}
            </motion.div>
        );
    }

    if (tab === 'scan') {
        return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 25, fontSize: 24, fontWeight: '900' }}>Skayner ⚡</h2>
                <div style={{ ...S.card, padding: 10, overflow: 'hidden' }}>
                    <div id="bichuv-reader" style={{ width: '100%', borderRadius: 15, overflow: 'hidden' }}></div>
                    <div style={{ padding: 15 }}>
                        {!scannerActive ? (
                            <button onClick={async () => {
                                try {
                                    await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                                    const h = new Html5Qrcode("bichuv-reader");
                                    scannerRef.current = h;
                                    await h.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
                                        (t) => { h.stop(); setScannerActive(false); processScan(t); }, () => { });
                                    setScannerActive(true);
                                } catch (e) { showMsg("Kamera xatosi!", "err"); }
                            }} style={{ ...S.btn, background: '#F06292', color: '#fff' }}>
                                <Camera size={20} /> KAMERANI OCHISH
                            </button>
                        ) : (
                            <button onClick={() => { scannerRef.current?.stop(); setScannerActive(false); }} style={{ ...S.btn, background: '#333', color: '#fff' }}>
                                <X size={20} /> TO'XTATISH
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (tab === 'history') {
        return (
            <div style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 25, fontSize: 24, fontWeight: '900' }}>Bichuv Tarixi 📋</h2>
                {cutRolls.length === 0 ? (
                    <div style={{ ...S.card, textAlign: 'center', opacity: 0.5, padding: 50 }}>Hali ma'lumot yo'q</div>
                ) : (
                    cutRolls.map(r => (
                        <div key={r.id} style={S.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: 16 }}>{r.fabric_name}</div>
                                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{r.color} • {r.neto} kg</div>
                                </div>
                                <div style={S.badge('#00e676')}>BICHILDI</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    // Dashboard
    return (
        <div style={{ padding: '20px 20px 100px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: '900', letterSpacing: '-1px' }}>Bichuv <span style={{ color: '#F06292' }}>Hub</span></h1>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 5 }}>Operatsion boshqaruv paneli</div>
                </div>
                <div style={{ background: 'rgba(240, 98, 146, 0.1)', padding: 12, borderRadius: 18 }}>
                    <Scissors color="#F06292" size={28} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 30 }}>
                <div style={{ ...S.card, marginBottom: 0, background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1), rgba(0, 0, 0, 0))' }}>
                    <div style={{ color: '#00e676', fontSize: 11, fontWeight: 'bold' }}>TAYYOR</div>
                    <div style={{ fontSize: 28, fontWeight: '900', marginTop: 5 }}>{fabricList.filter(f => f.allReady).length} <span style={{ fontSize: 14, fontWeight: '400', color: '#555' }}>tur</span></div>
                </div>
                <div style={{ ...S.card, marginBottom: 0, background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(0, 0, 0, 0))' }}>
                    <div style={{ color: '#ff9800', fontSize: 11, fontWeight: 'bold' }}>DAM OLMOQDA</div>
                    <div style={{ fontSize: 28, fontWeight: '900', marginTop: 5 }}>{fabricList.filter(f => !f.allReady).length} <span style={{ fontSize: 14, fontWeight: '400', color: '#555' }}>tur</span></div>
                </div>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: '800', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Layers size={20} color="#F06292" /> Ombor qoldig'i
            </h3>

            {fabricList.length === 0 ? (
                <div style={{ ...S.card, textAlign: 'center', opacity: 0.5, padding: 60 }}>
                    <Package size={40} style={{ margin: '0 auto 15px', opacity: 0.3 }} />
                    Omborda matolar yo'q
                </div>
            ) : (
                fabricList.map(f => (
                    <motion.div
                        key={f.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedGroup(f)}
                        style={{ ...S.card, position: 'relative', overflow: 'hidden' }}
                    >
                        {/* Progress Bar background for resting status */}
                        {!f.allReady && (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, height: 4, background: '#ff9800', width: `${(f.readyCount / f.rolls.length) * 100}%`, transition: 'width 1s' }} />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <h3 style={{ margin: 0, fontSize: 19, fontWeight: '800' }}>{f.name}</h3>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.allReady ? '#00e676' : '#ff9800' }} />
                                </div>
                                <div style={{ color: '#888', fontSize: 13, marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: '#F06292', fontWeight: 'bold' }}>{f.color}</span>
                                    <span>•</span>
                                    <span>{f.gramaj}</span>
                                </div>
                            </div>
                            <ChevronRight size={20} color="#333" />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
                            <div style={{ display: 'flex', gap: 15 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: '#555', fontWeight: 'bold' }}>RULON</div>
                                    <div style={{ fontSize: 15, fontWeight: '800' }}>{f.rolls.length}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: '#555', fontWeight: 'bold' }}>VAZN (KG)</div>
                                    <div style={{ fontSize: 15, fontWeight: '800', color: '#00e676' }}>{f.totalNeto.toFixed(0)}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 'bold', color: f.allReady ? '#00e676' : '#ff9800' }}>
                                {f.allReady ? 'BICHUVGA TAYYOR' : 'JARAYONDA...'}
                            </div>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
    );

    function processScan(t) {
        let id = t.replace('NETO-', '').replace('ROLL-', '');
        const r = rolls.find(x => String(x.id) === String(id));
        if (!r) return showMsg("Topilmadi", "err");
        if (r.status === 'BICHILDI') return showMsg("Bichilgan!", "err");
        if (r.status === 'BRUTO') return showMsg("Kontrol qilinmagan", "err");
        if (!getIsReady(r) && !window.confirm("Dam olmagan! Baribir kirasizmi?")) return;
        setActiveRoll(r);
    }
}
