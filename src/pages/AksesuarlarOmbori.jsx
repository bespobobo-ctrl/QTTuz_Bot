import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Box, PlusCircle, Search, History, ChevronRight, Edit3, Trash2,
    Calendar, CheckCircle2, Download, Package, Layers, MapPin, Tag, Hash, Printer, X, TrendingUp, AlertTriangle, Clock
} from 'lucide-react';

export default function AksesuarlarOmbori({ tab, data, load, showMsg }) {
    const [f, setF] = useState({ name: '', cat: 'Tugma', unit: 'dona', qty: '', dept: 'Ombor bo\'limi', status: 'OMBORDA' });
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selDept, setSelDept] = useState('HAMMASI');

    const DEPTS = [
        'Ombor bo\'limi', 'Bichuv bo\'limi', 'Tasnif', 'Taqsimot',
        'Kraska', 'Vishivka', 'Pechat', 'Tikuv bo\'limi',
        'Eksperimental', 'Dizayn', 'Kadrlar bo\'limi', 'Xo\'jalik bo\'limi'
    ];
    const UNITS = ['dona', 'pachka', 'kg', 'metr', 'rulon', 'quti'];
    const CATS_SUGGEST = ['Tugma', 'Zamok', 'Ip', 'Yorliq (Etiketka)', 'Frezilin', 'Qadoq xaltasi', 'Boshqa'];

    const handleKirim = async () => {
        if (!f.name || !f.qty) return showMsg("Barcha maydonlarni to'ldiring", "err");
        setLoading(true);
        try {
            const { data: inserted, error } = await supabase.from('accessories').insert({
                name: f.name,
                category: f.cat,
                unit: f.unit,
                quantity: Number(f.qty),
                status: f.status
            }).select().single();

            if (error) throw error;

            await supabase.from('accessories').update({ target_dept: f.dept }).eq('id', inserted.id);

            await supabase.from('accessory_log').insert({
                accessory_id: inserted.id,
                action_type: f.status === 'KUTILMOQDA' ? 'ORDER' : 'KIRIM',
                quantity: Number(f.qty),
                notes: `${f.status === 'KUTILMOQDA' ? 'Buyurtma' : 'Kirim'}: ${f.name} (${f.dept})`
            });

            showMsg("Muvaffaqiyatli saqlandi!");
            if (f.status === 'OMBORDA') setQrData({ ...inserted, target_dept: f.dept });
            setF(p => ({ ...p, name: '', qty: '', status: 'OMBORDA' }));
            load(true);
        } catch (e) {
            showMsg("Xata: " + e.message, "err");
        }
        setLoading(false);
    };

    const S = {
        page: { paddingBottom: 80 },
        card: {
            background: 'rgba(30, 30, 50, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: 24,
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            marginBottom: 20
        },
        statBox: (color) => ({
            flex: 1,
            padding: '20px 15px',
            background: `linear-gradient(135deg, ${color}22, ${color}05)`,
            borderRadius: 22,
            border: `1px solid ${color}33`,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 5
        }),
        inputGroup: { display: 'grid', gap: 18 },
        input: {
            width: '100%',
            padding: '16px 20px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            color: '#fff',
            outline: 'none',
            fontSize: 16,
            transition: 'all 0.3s ease',
            boxSizing: 'border-box'
        },
        label: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
        btn: {
            padding: '18px 24px',
            background: 'linear-gradient(90deg, #BA68C8, #9C27B0)',
            color: '#fff',
            borderRadius: 18,
            border: 'none',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(186, 104, 200, 0.4)',
            width: '100%',
            fontSize: 16,
            textTransform: 'uppercase'
        },
        overlay: { position: 'fixed', inset: 0, background: '#fff', zIndex: 9999, overflow: 'auto', padding: 25, color: '#000' }
    };

    if (tab === 'kirim') {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={S.page}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                    <div style={{ padding: 12, background: 'rgba(186, 104, 200, 0.15)', borderRadius: 15 }}>
                        <Download size={28} color="#BA68C8" />
                    </div>
                    <h1 style={{ fontSize: 24, margin: 0, color: '#fff', fontWeight: '800' }}>Yangi Kirim</h1>
                </div>

                <div style={S.card}>
                    <div style={S.inputGroup}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 15 }}>
                            <div>
                                <label style={S.label}><Box size={14} /> Mahsulot Nomi</label>
                                <input style={S.input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Masalan: Ip 40/2 Qizil" />
                            </div>
                            <div>
                                <label style={S.label}><Clock size={14} /> Status</label>
                                <select style={{ ...S.input, border: f.status === 'KUTILMOQDA' ? '1px solid #FFAB40' : '1px solid rgba(255,255,255,0.1)' }}
                                    value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
                                    <option value="OMBORDA">OMBORDA ✅</option>
                                    <option value="KUTILMOQDA">KUTILMOQDA ⏳</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div>
                                <label style={S.label}><Tag size={14} /> Toifa (Qo'lda yozish mumkin)</label>
                                <input list="cats" style={S.input} value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })} placeholder="Toifani yozing..." />
                                <datalist id="cats">
                                    {CATS_SUGGEST.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                            <div>
                                <label style={S.label}><Hash size={14} /> O'lchov Birligi</label>
                                <select style={S.input} value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })}>
                                    {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 15 }}>
                            <div>
                                <label style={S.label}><Package size={14} /> Miqdori</label>
                                <input style={S.input} type="number" value={f.qty} onChange={e => setF({ ...f, qty: e.target.value })} placeholder="0" />
                            </div>
                            <div>
                                <label style={S.label}><MapPin size={14} /> Qaysi Bo'limga?</label>
                                <select style={S.input} value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })}>
                                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleKirim} disabled={loading}
                            style={{
                                ...S.btn, background: f.status === 'KUTILMOQDA' ? 'linear-gradient(90deg, #FF9100, #FF6D00)' : S.btn.background,
                                boxShadow: f.status === 'KUTILMOQDA' ? '0 8px 25px rgba(255, 145, 0, 0.4)' : S.btn.boxShadow
                            }}>
                            {loading ? 'YUKLANMOQDA...' : f.status === 'KUTILMOQDA' ? 'BUYURTMANI SAQLASH' : 'KIRIM QILISH'}
                        </motion.button>
                    </div>
                </div>

                <AnimatePresence>
                    {qrData && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={S.overlay}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                                <button onClick={() => window.print()} style={{ ...S.btn, width: 'auto', background: '#000' }}><Printer size={20} /> CHOP ETISH</button>
                                <button onClick={() => setQrData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={32} /></button>
                            </div>
                            <div style={{ border: '3px solid #000', padding: 40, borderRadius: 30, textAlign: 'center', maxWidth: 450, margin: '0 auto', fontFamily: 'sans-serif' }}>
                                <div style={{ fontSize: 32, fontWeight: '900', letterSpacing: 2, marginBottom: 10 }}>AKSESUAR</div>
                                <div style={{ fontSize: 18, color: '#666', borderBottom: '2px solid #000', display: 'inline-block', paddingBottom: 5, marginBottom: 25 }}>PASPORTI</div>

                                <div style={{ textAlign: 'left', background: '#f9f9f9', padding: 25, borderRadius: 15, marginBottom: 30, fontSize: 18 }}>
                                    <div style={{ marginBottom: 10 }}><b>NOMI:</b> {qrData.name}</div>
                                    <div style={{ marginBottom: 10 }}><b>MIQDORI:</b> <span style={{ fontSize: 24 }}>{qrData.quantity} {qrData.unit}</span></div>
                                    <div style={{ color: '#d32f2f' }}><b>BO'LIM:</b> {qrData.target_dept}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <QRCodeCanvas value={`AKSESUAR:${qrData.id}`} size={220} level="H" includeMargin={true} />
                                </div>
                                <div style={{ marginTop: 20, fontSize: 12, color: '#aaa' }}>RADAR ORQALI SKANERLANG</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    if (tab === 'dashboard' || tab === 'baza' || tab === 'ombor') {
        const list = data.accessories || [];
        const lowStock = list.filter(i => i.quantity > 0 && i.quantity < (i.min_quantity || 10));
        const expected = list.filter(i => i.status === 'KUTILMOQDA');
        const available = list.filter(i => i.status === 'OMBORDA');
        const filtered = selDept === 'HAMMASI' ? available : available.filter(i => i.target_dept === selDept);

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.page}>
                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 30 }}>
                    <div style={S.statBox('#BA68C8')}>
                        <TrendingUp size={18} color="#BA68C8" style={{ alignSelf: 'center' }} />
                        <span style={{ fontSize: 24, fontWeight: '900', color: '#BA68C8' }}>{available.length}</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>BAZA JAMI</span>
                    </div>
                    <div style={S.statBox('#ff5252')}>
                        <AlertTriangle size={18} color="#ff5252" style={{ alignSelf: 'center' }} />
                        <span style={{ fontSize: 24, fontWeight: '900', color: '#ff5252' }}>{lowStock.length}</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>TUGAYOTGAN</span>
                    </div>
                    <div style={S.statBox('#FFAB40')}>
                        <Clock size={18} color="#FFAB40" style={{ alignSelf: 'center' }} />
                        <span style={{ fontSize: 24, fontWeight: '900', color: '#FFAB40' }}>{expected.length}</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>KUTILMOQDA</span>
                    </div>
                </div>

                {/* Dept Filter */}
                <div style={{ marginBottom: 25 }}>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 15, scrollbarWidth: 'none' }}>
                        {['HAMMASI', ...DEPTS].map(d => (
                            <motion.button key={d} whileTap={{ scale: 0.95 }} onClick={() => setSelDept(d)}
                                style={{
                                    padding: '12px 20px',
                                    background: selDept === d ? 'linear-gradient(90deg, #BA68C8, #9C27B0)' : 'rgba(255,255,255,0.05)',
                                    color: selDept === d ? '#fff' : 'rgba(255,255,255,0.4)',
                                    borderRadius: 16,
                                    border: 'none',
                                    fontSize: 12,
                                    fontWeight: '800',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    boxShadow: selDept === d ? '0 5px 15px rgba(186,104,200,0.3)' : 'none'
                                }}>
                                {d.toUpperCase()}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Items */}
                {filtered.length === 0 ? (
                    <div style={{ ...S.card, textAlign: 'center', padding: '60px 0', borderStyle: 'dashed' }}>
                        <Package size={48} color="rgba(255,255,255,0.05)" />
                        <div style={{ color: 'rgba(255,255,255,0.2)', marginTop: 15, fontWeight: '600' }}>Bu bo'limda mahsulot topilmadi</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 15 }}>
                        {filtered.map(item => {
                            const isLow = item.quantity < (item.min_quantity || 10);
                            return (
                                <motion.div key={item.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ ...S.card, padding: 18, marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                            <div style={{ width: 45, height: 45, background: 'rgba(186,104,200,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Layers size={20} color="#BA68C8" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: 17, color: '#fff' }}>{item.name}</div>
                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', gap: 10 }}>
                                                    <span>{item.category}</span>
                                                    <span>•</span>
                                                    <span>ID: {item.id.split('-')[0].toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 22, fontWeight: '900', color: isLow ? '#ff5252' : '#00e676' }}>
                                                {item.quantity} <span style={{ fontSize: 12, fontWeight: '500', opacity: 0.6 }}>{item.unit}</span>
                                            </div>
                                            {isLow && <div style={{ fontSize: 9, color: '#ff5252', fontWeight: '900', textTransform: 'uppercase' }}>Kam qolgan!</div>}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Expected */}
                {selDept === 'HAMMASI' && expected.length > 0 && (
                    <div style={{ marginTop: 40 }}>
                        <h3 style={{ fontSize: 14, color: '#FFAB40', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <Clock size={16} /> KUTILAYOTGAN BUYURTMALAR
                        </h3>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {expected.map(it => (
                                <div key={it.id} style={{ ...S.card, padding: 16, border: '1px solid rgba(255,171,64,0.2)', background: 'rgba(255,171,64,0.05)', marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#fff' }}>{it.name}</div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,171,64,0.6)' }}>{it.target_dept} uchun kutilmoqda</div>
                                        </div>
                                        <div style={{ fontSize: 18, fontWeight: '900', color: '#FFAB40' }}>{it.quantity} {it.unit}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        );
    }

    if (tab === 'history') {
        const logs = data.accessoryLog || [];
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.page}>
                <h2 style={{ marginBottom: 25, color: '#fff', fontSize: 26, fontWeight: '900' }}>Amallar Tarixi</h2>
                {logs.length === 0 ? <div style={{ ...S.card, textAlign: 'center' }}>Tarix bo'sh</div> : (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {logs.map(l => (
                            <div key={l.id} style={{ ...S.card, padding: 16, marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        background: l.action_type === 'KIRIM' ? 'rgba(0,230,118,0.1)' : 'rgba(186,104,200,0.1)',
                                        color: l.action_type === 'KIRIM' ? '#00e676' : '#BA68C8',
                                        borderRadius: 8, fontSize: 10, fontWeight: '900'
                                    }}>{l.action_type}</span>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(l.created_at).toLocaleString()}</span>
                                </div>
                                <div style={{ fontSize: 15, color: '#fff', fontWeight: '600' }}>{l.notes}</div>
                                <div style={{ textAlign: 'right', fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 10 }}>
                                    {l.quantity} <span style={{ fontSize: 12, opacity: 0.5 }}>dona</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        );
    }
    return null;
}
