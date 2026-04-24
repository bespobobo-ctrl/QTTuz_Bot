import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Box, PlusCircle, Search, History, ChevronRight, Edit3, Trash2,
    Calendar, CheckCircle2, Download, Package, Layers, MapPin, Tag, Hash, Printer, X
} from 'lucide-react';

export default function AksesuarlarOmbori({ tab, data, load, showMsg }) {
    const [f, setF] = useState({ name: '', cat: 'Tugma', unit: 'dona', qty: '', dept: 'Bichuv bo\'limi' });
    const [qrData, setQrData] = useState(null); // qachonki generatsiya bo'lsa
    const [loading, setLoading] = useState(false);

    const DEPTS = ['Bichuv bo\'limi', 'Tikuv bo\'limi', 'Taqsimot', 'Dazmol', 'Qadoqlov'];
    const UNITS = ['dona', 'pachka', 'kg', 'metr', 'rulon', 'quti'];
    const CATS = ['Tugma', 'Zamok', 'Ip', 'Yorliq (Etiketka)', 'Frezilin', 'Qadoq xaltasi', 'Boshqa'];

    const handleKirim = async () => {
        if (!f.name || !f.qty) return showMsg("Barcha maydonlarni to'ldiring", "err");
        setLoading(true);
        try {
            // 액세서리 패키지 등록
            const { data: inserted, error } = await supabase.from('accessories').insert({
                name: f.name,
                category: f.cat,
                unit: f.unit,
                quantity: Number(f.qty)
            }).select().single();

            if (error) throw error;

            // Qo'shimcha ma'lumotlarni update qilish (bazaga ustun qo'shilgach ishlaydi, hozircha error bermaydi)
            await supabase.from('accessories').update({
                target_dept: f.dept,
                status: 'OMBORDA'
            }).eq('id', inserted.id).catch(e => console.log('Ustunlar endi qo\'shiladi'));

            // Logga yozish
            await supabase.from('accessory_log').insert({
                accessory_id: inserted.id,
                action_type: 'KIRIM',
                quantity: Number(f.qty),
                notes: `Yangi: ${f.name} (${f.dept} uchun)`
            });

            showMsg("Muvaffaqiyatli qabul qilindi!");

            // Qr kod uchun stateni to'ldirish
            setQrData({ ...inserted, target_dept: f.dept });

            setF(p => ({ ...p, name: '', qty: '' }));
            load(true);
        } catch (e) {
            console.error(e);
            showMsg("Xato yuz berdi: " + e.message, "err");
        }
        setLoading(false);
    };

    const S = {
        card: { background: '#12121e', padding: 25, borderRadius: 20, border: '1px solid #2a2a40', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: 20 },
        primaryBtn: { padding: '16px 24px', background: '#BA68C8', color: '#fff', borderRadius: 14, border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 20px rgba(186, 104, 200, 0.4)', width: '100%' },
        input: { width: '100%', padding: '15px 20px', background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', outline: 'none', fontSize: 16, boxSizing: 'border-box' },
        label: { fontSize: 13, color: '#999', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5, fontWeight: '500' },
        printOverlay: { position: 'fixed', inset: 0, background: '#fff', zIndex: 99999, overflowY: 'auto', padding: 20, color: '#000' }
    };

    if (tab === 'kirim') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, color: '#BA68C8', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Download size={26} /> Yangi Aksesuar Kirim
                </h2>

                <div style={S.card}>
                    <div style={{ display: 'grid', gap: 20 }}>
                        <div>
                            <label style={S.label}><Box size={16} /> Mahsulot Nomi</label>
                            <input style={S.input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Masalan: Zamok 20sm qora..." />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div>
                                <label style={S.label}><Tag size={16} /> Turku (Kategoriya)</label>
                                <select style={S.input} value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>
                                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={S.label}><Hash size={16} /> O'lchov</label>
                                <select style={S.input} value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })}>
                                    {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div>
                                <label style={S.label}><Package size={16} /> Miqdori</label>
                                <input style={S.input} type="number" placeholder="0" value={f.qty} onChange={e => setF({ ...f, qty: e.target.value })} />
                            </div>
                            <div>
                                <label style={S.label}><MapPin size={16} /> Qaysi Bo'limga?</label>
                                <select style={S.input} value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })}>
                                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <button onClick={handleKirim} disabled={loading} style={{ ...S.primaryBtn, marginTop: 10 }}>
                            {loading ? 'SAQLANMOQDA...' : <><PlusCircle size={20} /> KIRIM QILISH VA QR KOD </>}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {qrData && (
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={S.printOverlay}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <button onClick={() => window.print()} style={{ ...S.primaryBtn, width: 'auto', background: '#000', color: '#fff' }}><Printer /> CHOP ETISH</button>
                                <button onClick={() => setQrData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={30} /></button>
                            </div>

                            {/* Passport Design */}
                            <div style={{ border: '2px dashed #000', padding: 30, borderRadius: 20, textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
                                <div style={{ fontSize: 28, fontWeight: '900', marginBottom: 10, textTransform: 'uppercase' }}>AKSESUAR PASPORTI</div>
                                <div style={{ fontSize: 18, marginBottom: 20, color: '#555' }}>Kod: {qrData.id.split('-')[0].toUpperCase()}</div>

                                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: 10, marginBottom: 20, textAlign: 'left', display: 'grid', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>NOMI:</b> <span>{qrData.name}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>TOIFA (TURI):</b> <span>{qrData.category}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>MIQDORI:</b> <span style={{ fontSize: 20, fontWeight: 'bold' }}>{qrData.quantity} {qrData.unit}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d32f2f' }}><b>MANZIL (QAYERGA):</b> <b>{qrData.target_dept}</b></div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                    <QRCodeCanvas value={`AKSESUAR:${qrData.id}`} size={200} level="H" includeMargin={true} />
                                </div>
                                <div style={{ fontSize: 12, color: '#888' }}>QR KODNI SKAYNERDAGI «RADAR» ORQALI O'QING</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    if (tab === 'dashboard' || tab === 'baza') {
        const list = data.accessories || []; // assuming load will put it here
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                    <h2 style={{ margin: 0, color: '#BA68C8', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Box size={28} /> Aksesuarlar (Baza)
                    </h2>
                </div>

                <div style={S.card}>
                    <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>
                        Bu yerda barcha qabul qilingan aksesuarlar turadi (Kirim qilinganlar).
                    </p>
                </div>
            </motion.div>
        );
    }

    if (tab === 'history') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, color: '#BA68C8', display: 'flex', gap: 10 }}>
                    <History size={24} /> Amallar Tarixi
                </h2>
                <div style={S.card}>
                    <p style={{ color: '#888', textAlign: 'center' }}>Hamma kirim va chiqim operatsiyalari shu yerda ko'rinadi.</p>
                </div>
            </motion.div>
        );
    }

    return null;
}
