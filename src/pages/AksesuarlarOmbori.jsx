import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Box, PlusCircle, Search, History, ChevronRight, Edit3, Trash2,
    Calendar, CheckCircle2, Download, Package, Layers, MapPin, Tag, Hash, Printer, X
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
    const CATS = ['Tugma', 'Zamok', 'Ip', 'Yorliq (Etiketka)', 'Frezilin', 'Qadoq xaltasi', 'Boshqa'];

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

            await supabase.from('accessories').update({
                target_dept: f.dept
            }).eq('id', inserted.id);

            await supabase.from('accessory_log').insert({
                accessory_id: inserted.id,
                action_type: f.status === 'KUTILMOQDA' ? 'ORDER' : 'KIRIM',
                quantity: Number(f.qty),
                notes: `${f.status === 'KUTILMOQDA' ? 'Kutilayotgan' : 'Yangi'}: ${f.name} (${f.dept} uchun)`
            });

            showMsg("Muvaffaqiyatli saqlandi!");
            if (f.status === 'OMBORDA') setQrData({ ...inserted, target_dept: f.dept });

            setF(p => ({ ...p, name: '', qty: '', status: 'OMBORDA' }));
            load(true);
        } catch (e) {
            showMsg("Xato: " + e.message, "err");
        }
        setLoading(false);
    };

    const S = {
        card: { background: '#12121e', padding: 20, borderRadius: 20, border: '1px solid #2a2a40', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: 20 },
        statCard: (bg) => ({ flex: 1, padding: 15, background: bg, borderRadius: 18, textAlign: 'center' }),
        primaryBtn: { padding: '16px 24px', background: '#BA68C8', color: '#fff', borderRadius: 14, border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 20px rgba(186, 104, 200, 0.4)', width: '100%' },
        input: { width: '100%', padding: '15px 20px', background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', outline: 'none', fontSize: 16, boxSizing: 'border-box' },
        label: { fontSize: 13, color: '#999', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 },
        printOverlay: { position: 'fixed', inset: 0, background: '#fff', zIndex: 99999, overflowY: 'auto', padding: 20, color: '#000' }
    };

    if (tab === 'kirim') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, color: '#BA68C8', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Download size={26} /> Aksesuar Kirim / Buyurtma
                </h2>

                <div style={S.card}>
                    <div style={{ display: 'grid', gap: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 15 }}>
                            <div>
                                <label style={S.label}><Box size={16} /> Mahsulot Nomi</label>
                                <input style={S.input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Masalan: Ip 40/2..." />
                            </div>
                            <div>
                                <label style={S.label}><CheckCircle2 size={16} /> Holati</label>
                                <select style={{ ...S.input, borderColor: f.status === 'KUTILMOQDA' ? '#FFAB40' : '#2a2a40' }} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
                                    <option value="OMBORDA">OMBORDA ✅</option>
                                    <option value="KUTILMOQDA">KUTILMOQDA ⏳</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div>
                                <label style={S.label}><Tag size={16} /> Toifa</label>
                                <select style={S.input} value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>
                                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={S.label}><Hash size={16} /> Birlik</label>
                                <select style={S.input} value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })}>
                                    {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div>
                                <label style={S.label}><Package size={16} /> Miqdori</label>
                                <input style={S.input} type="number" value={f.qty} onChange={e => setF({ ...f, qty: e.target.value })} />
                            </div>
                            <div>
                                <label style={S.label}><MapPin size={16} /> Qaysi Bo'limga?</label>
                                <select style={S.input} value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })}>
                                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <button onClick={handleKirim} disabled={loading} style={{ ...S.primaryBtn, background: f.status === 'KUTILMOQDA' ? '#FFAB40' : '#BA68C8' }}>
                            {loading ? 'SAQLANMOQDA...' : f.status === 'KUTILMOQDA' ? 'BUYURTMANI RO\'YXATGA OLISH' : 'KIRIM QILISH VA QR KOD'}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {qrData && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={S.printOverlay}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <button onClick={() => window.print()} style={{ ...S.primaryBtn, width: 'auto', background: '#000' }}><Printer /> CHOP ETISH</button>
                                <button onClick={() => setQrData(null)} style={{ background: 'none', border: 'none' }}><X size={30} /></button>
                            </div>
                            <div style={{ border: '2px dashed #000', padding: 30, borderRadius: 20, textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
                                <div style={{ fontSize: 24, fontWeight: '900', marginBottom: 15 }}>AKSESUAR PASPORTI</div>
                                <div style={{ background: '#f5f5f5', padding: 15, borderRadius: 10, textAlign: 'left', marginBottom: 20 }}>
                                    <div><b>NOMI:</b> {qrData.name}</div>
                                    <div><b>MIQDORI:</b> {qrData.quantity} {qrData.unit}</div>
                                    <div><b>BO'LIM:</b> {qrData.target_dept}</div>
                                </div>
                                <QRCodeCanvas value={`AKSESUAR:${qrData.id}`} size={180} />
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Stats Row */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 25 }}>
                    <div style={S.statCard('rgba(186, 104, 200, 0.1)')}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#BA68C8' }}>{available.length}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>MAHSULOTLAR</div>
                    </div>
                    <div style={S.statCard('rgba(255, 82, 82, 0.1)')}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff5252' }}>{lowStock.length}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>TUGAYOTGAN</div>
                    </div>
                    <div style={S.statCard('rgba(255, 171, 64, 0.1)')}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#FFAB40' }}>{expected.length}</div>
                        <div style={{ fontSize: 10, color: '#888' }}>KUTILMOQDA</div>
                    </div>
                </div>

                {/* Dept Filter Bar */}
                <div style={{ marginBottom: 20 }}>
                    <label style={S.label}><MapPin size={14} /> Bo'limni tanlang:</label>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
                        {['HAMMASI', ...DEPTS].map(d => (
                            <button
                                key={d}
                                onClick={() => setSelDept(d)}
                                style={{
                                    padding: '8px 16px',
                                    background: selDept === d ? '#BA68C8' : '#1a1a2e',
                                    color: selDept === d ? '#fff' : '#888',
                                    borderRadius: 12,
                                    border: '1px solid ' + (selDept === d ? '#BA68C8' : '#2a2a40'),
                                    fontSize: 11,
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer'
                                }}
                            >
                                {d.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List View */}
                {filtered.length === 0 ? (
                    <div style={{ ...S.card, textAlign: 'center', padding: '50px 0' }}>
                        <Package size={40} color="#333" style={{ marginBottom: 10 }} />
                        <div style={{ color: '#555' }}>Bu bo'limda mahsulot yo'q</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {filtered.map(item => {
                            const isLow = item.quantity < (item.min_quantity || 10);
                            return (
                                <div key={item.id} style={{ ...S.card, padding: 15, marginBottom: 0, borderLeft: '4px solid ' + (isLow ? '#ff5252' : '#BA68C8') }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
                                            <div style={{ fontSize: 11, color: '#555' }}>Toifa: {item.category} | ID: {item.id.split('-')[0]}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 20, fontWeight: 'bold', color: isLow ? '#ff5252' : '#fff' }}>
                                                {item.quantity} <span style={{ fontSize: 12, fontWeight: 'normal' }}>{item.unit}</span>
                                            </div>
                                            {isLow && <div style={{ fontSize: 9, color: '#ff5252', fontWeight: 'bold' }}>TUGAB BORMOQDA!</div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Expected section if looking at "HAMMASI" */}
                {selDept === 'HAMMASI' && expected.length > 0 && (
                    <div style={{ marginTop: 30 }}>
                        <h3 style={{ color: '#FFAB40', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={18} /> KUTILAYOTGAN BUYURTMALAR
                        </h3>
                        {expected.map(item => (
                            <div key={item.id} style={{ ...S.card, padding: 15, borderLeft: '4px solid #FFAB40', opacity: 0.8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
                                        <div style={{ fontSize: 11, color: '#555' }}>Bo'lim: {item.target_dept}</div>
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#FFAB40' }}>{item.qty_expected || item.quantity} {item.unit}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        );
    }

    if (tab === 'history') {
        const logs = data.accessoryLog || [];
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, color: '#BA68C8', display: 'flex', gap: 10 }}>
                    <History size={24} /> Amallar Tarixi
                </h2>
                {logs.length === 0 ? <p style={{ color: '#555' }}>Tarix bo'sh</p> : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {logs.map(l => (
                            <div key={l.id} style={{ ...S.card, padding: 12, marginBottom: 0, fontSize: 13 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: l.action_type === 'KIRIM' ? '#00e676' : '#BA68C8', fontWeight: 'bold' }}>{l.action_type}</span>
                                    <span style={{ color: '#555' }}>{new Date(l.created_at).toLocaleString()}</span>
                                </div>
                                <div style={{ marginTop: 5 }}>{l.notes}</div>
                                <div style={{ fontSize: 15, fontWeight: 'bold', textAlign: 'right' }}>{l.quantity} dona</div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        );
    }
    return null;
}
