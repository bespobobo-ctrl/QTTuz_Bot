import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Box, PlusCircle, MinusCircle, Search, History, ChevronRight, Edit3, Trash2, Scan,
    Calendar, CheckCircle2, Download, Package, Layers, MapPin, Tag, Hash, Printer, X, TrendingUp, AlertTriangle, Clock
} from 'lucide-react';

export default function AksesuarlarOmbori({ tab, data, load, showMsg }) {
    const [f, setF] = useState({ name: '', cat: 'Tugma', unit: 'dona', qty: '', dept: 'Ombor bo\'limi', status: 'OMBORDA', supplier: '' });
    const [qrData, setQrData] = useState(null);
    const [scanRes, setScanRes] = useState(null); // Skanerlangan mahsulot
    const [adjModal, setAdjModal] = useState(null); // { type: 'add'|'sub', item: obj }
    const [adjVal, setAdjVal] = useState('');
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
                party_number: f.supplier,
                notes: `${f.status === 'KUTILMOQDA' ? 'Buyurtma' : 'Kirim'}: ${f.name} - ${f.supplier} (${f.dept})`
            });

            showMsg("Muvaffaqiyatli saqlandi!");
            if (f.status === 'OMBORDA') setQrData({ ...inserted, target_dept: f.dept, supplier: f.supplier });
            setF(p => ({ ...p, name: '', qty: '', status: 'OMBORDA', supplier: '' }));
            load(true);
        } catch (e) { showMsg("Xato: " + e.message, "err"); }
        setLoading(false);
    };

    const handleAdjustment = async () => {
        if (!adjVal || isNaN(adjVal)) return showMsg("Miqdorni kiriting", "err");
        setLoading(true);
        try {
            const diff = adjModal.type === 'add' ? Number(adjVal) : -Number(adjVal);
            const newQty = (adjModal.item.quantity || 0) + diff;
            if (newQty < 0) throw new Error("Omborda yetarli mahsulot yo'q!");

            const { error: updErr } = await supabase.from('accessories').update({ quantity: newQty }).eq('id', adjModal.item.id);
            if (updErr) throw updErr;

            await supabase.from('accessory_log').insert({
                accessory_id: adjModal.item.id,
                action_type: adjModal.type === 'add' ? 'REFILL' : 'CHIQIM',
                quantity: Math.abs(diff),
                notes: `${adjModal.type === 'add' ? 'Plyus' : 'Chiqim'}: ${adjModal.item.name} (${diff > 0 ? '+' : ''}${diff} ${adjModal.item.unit})`
            });

            showMsg("Muvaffaqiyatli yangilandi!");
            setAdjModal(null);
            setAdjVal('');
            setScanRes(null);
            load(true);
        } catch (e) { showMsg(e.message, "err"); }
        setLoading(false);
    };

    const onScan = (code) => {
        if (!code.startsWith('AKSESUAR:')) return;
        const id = code.split(':')[1];
        const item = (data.accessories || []).find(it => it.id === id);
        if (item) {
            setScanRes(item);
        } else {
            showMsg("Mahsulot topilmadi!", "err");
        }
    };

    const S = {
        page: { paddingBottom: 80 },
        statBox: (color) => ({
            flex: 1,
            padding: '20px 15px',
            background: color + '11',
            borderRadius: 22,
            border: `1px solid ${color}33`,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 5
        }),
        card: {
            background: '#1a1a2e',
            padding: '24px 20px',
            borderRadius: 22,
            border: '1px solid #2a2a40',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            marginBottom: 20
        },
        input: {
            width: '100%',
            padding: '14px 16px',
            background: '#12121e',
            border: '1px solid #2a2a40',
            borderRadius: 14,
            color: '#fff',
            outline: 'none',
            fontSize: 15,
            boxSizing: 'border-box'
        },
        label: { fontSize: 11, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: '700', textTransform: 'uppercase' },
        btn: {
            padding: '16px 20px',
            background: '#BA68C8',
            color: '#fff',
            borderRadius: 14,
            border: 'none',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer',
            width: '100%',
            fontSize: 15
        },
        overlay: { position: 'fixed', inset: 0, background: '#fff', zIndex: 99999, overflow: 'auto', padding: 25, color: '#000' }
    };

    if (tab === 'kirim') {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={S.page}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
                    <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, rgba(186,104,200,0.2), rgba(186,104,200,0.05))', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Download size={28} color="#BA68C8" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 26, margin: 0, color: '#fff', fontWeight: '900' }}>Kirim Bo'limi</h1>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>Yangi aksesuarlar va buyurtmalarni ro'yxatga olish</div>
                    </div>
                </div>

                <div style={S.card}>
                    <div style={{ display: 'grid', gap: 24 }}>
                        {/* Row 1: Name & Status */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
                            <div>
                                <label style={S.label}><Box size={14} color="#BA68C8" /> Mahsulot Nomi</label>
                                <input style={S.input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Masalan: Ip 40/2 Qizil" />
                            </div>
                            <div>
                                <label style={S.label}><Clock size={14} color="#FFAB40" /> Status</label>
                                <select style={{ ...S.input, color: f.status === 'KUTILMOQDA' ? '#FFAB40' : '#00e676' }} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
                                    <option value="OMBORDA">OMBORDA ✅</option>
                                    <option value="KUTILMOQDA">KUTILMOQDA ⏳</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Category & Unit */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            <div>
                                <label style={S.label}><Tag size={14} color="#BA68C8" /> Mahsulot Toifasi</label>
                                <input list="cats" style={S.input} value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })} placeholder="Toifani yozing..." />
                                <datalist id="cats">
                                    {CATS_SUGGEST.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                            <div>
                                <label style={S.label}><Hash size={14} color="#BA68C8" /> O'lchov Birligi</label>
                                <select style={S.input} value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })}>
                                    {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Row 3: Supplier (Taminochi) - NEW */}
                        <div>
                            <label style={S.label}><MapPin size={14} color="#BA68C8" /> Taminochi (Yetkazib beruvchi)</label>
                            <input style={S.input} value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} placeholder="Kompaniya yoki shaxs nomi..." />
                        </div>

                        {/* Row 4: Qty & Dept */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 18 }}>
                            <div>
                                <label style={S.label}><Package size={14} color="#BA68C8" /> Miqdori</label>
                                <input style={S.input} type="number" value={f.qty} onChange={e => setF({ ...f, qty: e.target.value })} placeholder="0" />
                            </div>
                            <div>
                                <label style={S.label}><ChevronRight size={14} color="#BA68C8" /> Qaysi Bo'limga?</label>
                                <select style={S.input} value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })}>
                                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleKirim} disabled={loading}
                            style={{
                                ...S.btn, background: f.status === 'KUTILMOQDA' ? 'linear-gradient(135deg, #FF9100, #F57C00)' : S.btn.background,
                                boxShadow: f.status === 'KUTILMOQDA' ? '0 10px 30px rgba(255, 145, 0, 0.3)' : S.btn.boxShadow
                            }}>
                            {loading ? 'YUKLANMOQDA...' : f.status === 'KUTILMOQDA' ? 'BUYURTMANI RO\'YXATGA OLISH' : 'KIRIM QILISH VA PASPORT'}
                        </motion.button>
                    </div>
                </div>

                <AnimatePresence>
                    {qrData && (
                        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} style={S.overlay}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.print()} style={{ ...S.btn, width: 'auto', background: '#111', padding: '16px 32px' }}><Printer size={22} /> CHOP ETISH</motion.button>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setQrData(null)} style={{ background: '#f0f0f0', border: 'none', width: 50, height: 50, borderRadius: 25, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={28} color="#000" /></motion.button>
                            </div>
                            <div className="printable-passport" style={{ border: '4px solid #000', padding: 50, borderRadius: 40, textAlign: 'center', maxWidth: 450, margin: '0 auto', background: '#fff' }}>
                                <div style={{ fontSize: 36, fontWeight: '1000', letterSpacing: 4, marginBottom: 5 }}>AKSESUAR</div>
                                <div style={{ fontSize: 16, color: '#000', borderBottom: '3px solid #000', display: 'inline-block', paddingBottom: 5, marginBottom: 35, fontWeight: '800' }}>PASPORTI</div>

                                <div style={{ textAlign: 'left', background: '#f5f5f5', padding: 30, borderRadius: 25, marginBottom: 40, border: '1px solid #ddd' }}>
                                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}><b>NOMI:</b> <span>{qrData.name}</span></div>
                                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}><b>TAMINOCHI:</b> <span>{qrData.supplier || '-'}</span></div>
                                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}><b>MIQDORI:</b> <span style={{ fontSize: 28, fontWeight: '900' }}>{qrData.quantity} {qrData.unit}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d32f2f', borderTop: '2px dashed #ccc', paddingTop: 15, marginTop: 10 }}><b>MANZIL:</b> <b style={{ fontSize: 18 }}>{qrData.target_dept}</b></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <QRCodeCanvas value={`AKSESUAR:${qrData.id}`} size={240} level="H" includeMargin={true} />
                                </div>
                                <div style={{ marginTop: 25, fontSize: 13, color: '#666', fontWeight: 'bold' }}>QTTURBINA AUTOMATION SYSTEM</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    if (tab === 'scan') {
        return (
            <div style={S.page}>
                <div style={{ ...S.card, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <ScanUI onScan={onScan} />
                    {!scanRes && <div style={{ marginTop: 20, color: '#888' }}>Mahsulot QR kodini skanerlang...</div>}
                </div>

                <AnimatePresence>
                    {scanRes && (
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ ...S.card, marginTop: 20, border: '1.5px solid #BA68C8' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 20 }}>{scanRes.name}</h2>
                                    <div style={{ fontSize: 13, color: '#888' }}>{scanRes.category} • {scanRes.target_dept}</div>
                                </div>
                                <button onClick={() => setScanRes(null)} style={{ background: 'none', border: 'none', color: '#888' }}><X size={24} /></button>
                            </div>

                            <div style={{ background: '#12121e', padding: 20, borderRadius: 18, textAlign: 'center', marginBottom: 25 }}>
                                <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>JORIY QOLDIQ</div>
                                <div style={{ fontSize: 32, fontWeight: '900', color: '#00e676' }}>{scanRes.quantity} <span style={{ fontSize: 16, opacity: 0.6 }}>{scanRes.unit}</span></div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setAdjModal({ type: 'add', item: scanRes })} style={{ ...S.btn, background: '#00e676', flex: 1 }}><PlusCircle size={18} /> PLYUS</button>
                                <button onClick={() => setAdjModal({ type: 'sub', item: scanRes })} style={{ ...S.btn, background: '#ff5252', flex: 1 }}><MinusCircle size={18} /> CHIQIM</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {adjModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                        <div style={{ ...S.card, width: '100%', maxWidth: 400, border: `2px solid ${adjModal.type === 'add' ? '#00e676' : '#ff5252'}` }}>
                            <h3 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>
                                {adjModal.type === 'add' ? 'MIQDOR QO\'SHISH' : 'CHIQIM QILISH'}
                            </h3>
                            <label style={S.label}>Miqdorni kiriting ({adjModal.item.unit})</label>
                            <input autoFocus style={{ ...S.input, fontSize: 24, textAlign: 'center' }} type="number" value={adjVal} onChange={e => setAdjVal(e.target.value)} placeholder="0" />

                            <div style={{ display: 'flex', gap: 12, marginTop: 25 }}>
                                <button onClick={() => { setAdjModal(null); setAdjVal(''); }} style={{ ...S.btn, background: '#333', flex: 1 }}>BEKOR</button>
                                <button onClick={handleAdjustment} disabled={loading} style={{ ...S.btn, background: adjModal.type === 'add' ? '#00e676' : '#ff5252', flex: 2 }}>
                                    {loading ? 'YUKLANMOQDA...' : 'TASDIQLASH'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
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

// Minimal Scanner Component
function ScanUI({ onScan }) {
    const [scanned, setScanned] = React.useState(false);

    React.useEffect(() => {
        let scanner = null;
        const start = async () => {
            const { Html5QrcodeScanner } = await import('html5-qrcode');
            scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
            scanner.render((text) => {
                onScan(text);
                setScanned(true);
            }, (err) => { });
        };
        start();
        return () => { if (scanner) scanner.clear().catch(e => { }); };
    }, []);

    return (
        <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', overflow: 'hidden', borderRadius: 20 }}>
            <div id="reader" style={{ border: 'none', background: '#000' }}></div>
            {scanned && <button onClick={() => setScanned(false)} style={{ marginTop: 15, padding: '10px 20px', background: '#333', border: 'none', borderRadius: 10, color: '#fff' }}>Qaytadan skanerlash</button>}
        </div>
    );
}
