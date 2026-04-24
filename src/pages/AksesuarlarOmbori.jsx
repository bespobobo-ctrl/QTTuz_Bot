import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Box, PlusCircle, MinusCircle, Search, History, ChevronRight, Edit3, Trash2, Scan,
    Calendar, CheckCircle2, Download, Package, Layers, MapPin, Tag, Hash, Printer, X, TrendingUp, AlertTriangle, Clock
} from 'lucide-react';

export default function AksesuarlarOmbori({ tab, data, load, showMsg }) {
    const [f, setF] = useState({
        name: '', cat: 'Tugma', unit: 'dona', qty: '', dept: '', status: 'OMBORDA', supplier: '', supplier_phone: '',
        color: '', size: '', description: '',
        order_date: new Date().toISOString().split('T')[0], expected_date: ''
    });
    const [kStep, setKStep] = useState('dept'); // dept, mode, form
    const [kMode, setKMode] = useState('new'); // new, existing
    const [kItem, setKItem] = useState(null);
    const [selDept, setSelDept] = useState('HAMMASI');
    const [searchTerm, setSearchTerm] = useState('');
    const [editItem, setEditItem] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [scanRes, setScanRes] = useState(null);
    const [adjModal, setAdjModal] = useState(null);
    const [adjVal, setAdjVal] = useState('');
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hFilter, setHFilter] = useState('HAMMASI'); // HAMMASI, KIRIM, UPDATE, DELETE, ADJUSTMENT

    const DEPTS = [
        'Ombor bo\'limi', 'Bichuv bo\'limi', 'Tasnif', 'Taqsimot',
        'Kraska', 'Vishivka', 'Pechat', 'Tikuv bo\'limi',
        'Eksperimental', 'Dizayn', 'Kadrlar bo\'limi', 'Xo\'jalik bo\'limi'
    ];
    const UNITS = ['dona', 'pachka', 'kg', 'metr', 'rulon', 'quti'];

    const handleKirim = async () => {
        if (kMode === 'new' && (!f.name || !f.qty)) return showMsg("Barcha maydonlarni to'ldiring", "err");
        if (kMode === 'existing' && (!f.qty)) return showMsg("Miqdorni kiriting", "err");

        setLoading(true);
        try {
            if (kMode === 'existing') {
                const newQty = (kItem.quantity || 0) + Number(f.qty);
                const { error: updErr } = await supabase.from('accessories').update({ quantity: newQty }).eq('id', kItem.id);
                if (updErr) throw updErr;

                await supabase.from('accessory_log').insert({
                    accessory_id: kItem.id,
                    action_type: 'KIRIM',
                    quantity: Number(f.qty),
                    notes: `Mavjud mahsulot to'ldirildi: ${kItem.name} (${f.supplier} tel: ${f.supplier_phone})`
                });

                showMsg("Muvaffaqiyatli yangilandi!");
                setQrData({ ...kItem, quantity: f.qty, supplier: f.supplier });
            } else {
                const insertData = {
                    name: f.name,
                    category: f.cat,
                    unit: f.unit,
                    quantity: Number(f.qty),
                    status: f.status,
                    target_dept: f.dept,
                    description: f.description,
                    order_date: f.order_date,
                    expected_date: f.expected_date
                };

                // Faqat bazada bo'lsa qo'shamiz (yoki hozircha olib tashlaymiz)
                // if (f.color) insertData.color = f.color;
                // if (f.size) insertData.size = f.size;

                const { data: inserted, error } = await supabase.from('accessories').insert(insertData).select().single();

                if (error) throw error;

                await supabase.from('accessory_log').insert({
                    accessory_id: inserted.id,
                    action_type: f.status === 'KUTILMOQDA' ? 'ORDER' : 'KIRIM',
                    quantity: Number(f.qty),
                    notes: f.status === 'KUTILMOQDA'
                        ? `Buyurtma qilindi: ${f.name} (Kutilmoqda: ${f.expected_date})`
                        : `Yangi kirim: ${f.name} - ${f.supplier} (${f.supplier_phone}) (${f.dept})`
                });

                showMsg("Yangi mahsulot saqlandi!");
                if (f.status === 'OMBORDA') setQrData({ ...inserted, supplier: f.supplier });
            }

            setF(p => ({ ...p, name: '', qty: '', supplier: '', supplier_phone: '', color: '', size: '', description: '' }));
            setKStep('dept');
            load(true);
        } catch (e) { showMsg("Xato: " + e.message, "err"); }
        setLoading(false);
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const updateData = {
                name: editItem.name,
                category: editItem.category,
                unit: editItem.unit,
                quantity: Number(editItem.quantity),
                target_dept: editItem.target_dept
            };

            // if (editItem.color) updateData.color = editItem.color;
            // if (editItem.size) updateData.size = editItem.size;

            const { error } = await supabase.from('accessories').update(updateData).eq('id', editItem.id);

            if (error) throw error;

            await supabase.from('accessory_log').insert({
                accessory_id: editItem.id,
                action_type: 'UPDATE',
                quantity: Number(editItem.quantity),
                notes: `Ma'lumotlar tahrirlandi: ${editItem.name}`
            });

            showMsg("Yangilandi!");
            setEditItem(null);
            load(true);
        } catch (e) { showMsg(e.message, "err"); }
        setLoading(false);
    };

    const handleDelete = async (item) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('accessories').delete().eq('id', item.id);
            if (error) throw error;
            showMsg("O'chirildi!");
            setConfirmDelete(null);
            load(true);
        } catch (e) { showMsg(e.message, "err"); }
        setLoading(false);
    };

    const handleAdjustment = async () => {
        setLoading(true);
        try {
            const diff = adjModal.type === 'add' ? Number(adjVal) : -Number(adjVal);
            const newQty = (adjModal.item.quantity || 0) + diff;
            await supabase.from('accessories').update({ quantity: newQty }).eq('id', adjModal.item.id);
            setAdjModal(null); setAdjVal(''); setScanRes(null); load(true);
        } catch (e) { showMsg(e.message, "err"); }
        setLoading(false);
    };

    const S = {
        page: { paddingBottom: 100 },
        card: { background: '#12121e', padding: 20, borderRadius: 20, border: '1px solid #2a2a40', marginBottom: 20 },
        input: { width: '100%', padding: '14px 16px', background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 12, color: '#fff', fontSize: 16, boxSizing: 'border-box' },
        label: { fontSize: 11, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontWeight: '700' },
        btn: { padding: '16px', background: '#BA68C8', color: '#fff', borderRadius: 14, border: 'none', fontWeight: '900', cursor: 'pointer', width: '100%' },
        overlay: { position: 'fixed', inset: 0, background: '#fff', zIndex: 99999, overflow: 'auto', padding: 25, color: '#000' }
    };

    const renderTab = () => {
        switch (tab) {
            case 'dashboard':
                const list = data.accessories || [];
                const critical = list.filter(i => i.status === 'OMBORDA' && i.quantity < (i.min_quantity || 5));
                const expected = list.filter(i => i.status === 'KUTILMOQDA');
                const available = list.filter(i => i.status === 'OMBORDA');
                const deptStats = DEPTS.map(d => {
                    const items = available.filter(it => it.target_dept === d);
                    return { name: d, count: items.length, totalQty: items.reduce((a, b) => a + (b.quantity || 0), 0) };
                }).filter(d => d.count > 0);

                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.page}>
                        <div style={{ position: 'relative', overflow: 'hidden', padding: '30px 25px', borderRadius: 30, background: 'linear-gradient(135deg, #6A11CB 0%, #2575FC 100%)', marginBottom: 25, boxShadow: '0 20px 40px rgba(106,17,203,0.3)' }}>
                            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}><Package size={180} /></div>
                            <h2 style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: '800' }}>OMBOR HOLATI</h2>
                            <div style={{ fontSize: 42, fontWeight: '900', color: '#fff', margin: '10px 0' }}>{available.length} <span style={{ fontSize: 16 }}>xil mahsulot</span></div>
                            <div style={{ display: 'flex', gap: 20, fontSize: 12, marginTop: 15 }}>
                                <div><div style={{ opacity: 0.6 }}>BO'LIMLAR</div><div style={{ fontWeight: '800' }}>{deptStats.length} ta</div></div>
                                <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }}></div>
                                <div><div style={{ opacity: 0.6 }}>JAMI QOLDIQ</div><div style={{ fontWeight: '800' }}>{available.reduce((a, b) => a + (b.quantity || 0), 0)} ta</div></div>
                            </div>
                        </div>

                        {critical.length > 0 && (
                            <div style={{ marginBottom: 30 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                                    <AlertTriangle color="#ff5252" size={20} />
                                    <h3 style={{ fontSize: 14, fontWeight: '900', margin: 0, color: '#ff5252' }}>KRITIK HOLAT (ZAKAZ!!!)</h3>
                                </div>
                                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10 }}>
                                    {critical.map(it => (
                                        <div key={it.id} style={{ minWidth: 160, padding: 18, background: 'rgba(255,82,82,0.1)', border: '1.5px solid rgba(255,82,82,0.3)', borderRadius: 22 }}>
                                            <div style={{ fontSize: 14, fontWeight: '800' }}>{it.name}</div>
                                            <div style={{ fontSize: 24, fontWeight: '900', color: '#ff5252', marginTop: 5 }}>{it.quantity} <span style={{ fontSize: 10 }}>{it.unit}</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 30 }}>
                            <div style={{ ...S.card, background: 'rgba(0,230,118,0.05)', textAlign: 'left', padding: 20, border: '1px solid rgba(0,230,118,0.2)' }}>
                                <Package size={20} color="#00e676" />
                                <div style={{ fontSize: 22, fontWeight: '900', color: '#00e676', marginTop: 10 }}>{available.length}</div>
                                <div style={{ fontSize: 10, opacity: 0.5, fontWeight: '800' }}>MAVJUD</div>
                            </div>
                            <div style={{ ...S.card, background: 'rgba(255,171,64,0.05)', textAlign: 'left', padding: 20, border: '1px solid rgba(255,171,64,0.2)' }}>
                                <Clock size={20} color="#FFAB40" />
                                <div style={{ fontSize: 22, fontWeight: '900', color: '#FFAB40', marginTop: 10 }}>{expected.length}</div>
                                <div style={{ fontSize: 10, opacity: 0.5, fontWeight: '800' }}>KUTILMOQDA</div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><Layers size={18} /> BO'LIMLAR KESIMIDA</h3>
                            <div style={{ display: 'grid', gap: 12 }}>
                                {deptStats.map(ds => (
                                    <div key={ds.name} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                                        <div><div style={{ fontSize: 14, fontWeight: '800' }}>{ds.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{ds.count} xil</div></div>
                                        <div style={{ fontSize: 18, fontWeight: '900', color: '#BA68C8' }}>{ds.totalQty}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            case 'ombor':
                const allItems = (data.accessories || []).filter(i => i.status === 'OMBORDA');
                const filt = allItems.filter(it => {
                    const matchesDept = selDept === 'HAMMASI' || it.target_dept === selDept;
                    const matchesSearch = it.name?.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchesDept && matchesSearch;
                });
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.page}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                            <div style={{ width: 45, height: 45, background: 'rgba(186,104,200,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={22} color="#BA68C8" /></div>
                            <h2 style={{ margin: 0, fontSize: 24, fontWeight: '900' }}>Ombor Ro'yxati</h2>
                        </div>
                        <div style={{ position: 'relative', marginBottom: 15 }}>
                            <Search style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} size={18} />
                            <input style={{ ...S.input, paddingLeft: 45 }} placeholder="Qidiruv..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 25, paddingBottom: 5 }}>
                            {['HAMMASI', ...DEPTS].map(d => (
                                <button key={d} onClick={() => setSelDept(d)} style={{
                                    padding: '10px 16px', borderRadius: 12, border: 'none', background: selDept === d ? '#BA68C8' : '#1a1a2e', color: selDept === d ? '#fff' : '#888', whiteSpace: 'nowrap', fontSize: 11, fontWeight: '800'
                                }}>{d}</button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gap: 15 }}>
                            {filt.map(it => (
                                <div key={it.id} style={{ ...S.card, marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div><div style={{ fontWeight: '900', fontSize: 18 }}>{it.name}</div><div style={{ fontSize: 11, color: '#888' }}>{it.target_dept}</div></div>
                                        <div style={{ fontSize: 22, fontWeight: '1000', color: '#00e676' }}>{it.quantity} <span style={{ fontSize: 12 }}>{it.unit}</span></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, marginTop: 15, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 15 }}>
                                        <button onClick={() => setEditItem(it)} style={{ ...S.btn, height: 40, background: '#1a1a2e', border: '1px solid #2a2a40', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Edit3 size={14} /> TAHRIR</button>
                                        <button onClick={() => setConfirmDelete(it)} style={{ ...S.btn, height: 40, background: 'rgba(255,82,82,0.1)', color: '#ff5252', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Trash2 size={14} /> O'CHIRISH</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'kirim':
                const renderKirimStep = () => {
                    if (kStep === 'dept') {
                        return (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <h2 style={{ gridColumn: '1/-1', fontSize: 16, color: '#BA68C8', marginBottom: 10 }}>1. BO'LIMNI TANLANG</h2>
                                {DEPTS.map(d => (
                                    <motion.button key={d} whileTap={{ scale: 0.95 }} onClick={() => { setF({ ...f, dept: d }); setKStep('mode'); }}
                                        style={{ ...S.card, marginBottom: 0, padding: 20, textAlign: 'center', border: '1px solid rgba(186,104,200,0.2)', cursor: 'pointer' }}>
                                        <div style={{ fontSize: 13, fontWeight: '800' }}>{d.toUpperCase()}</div>
                                    </motion.button>
                                ))}
                            </div>
                        );
                    }

                    if (kStep === 'mode') {
                        const existingItems = (data.accessories || []).filter(it => it.target_dept === f.dept);
                        return (
                            <div style={{ display: 'grid', gap: 20 }}>
                                <h2 style={{ fontSize: 16, color: '#BA68C8' }}>2. MAHSULOT TURINI TANLANG ({f.dept})</h2>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setKMode('new'); setKStep('form'); }}
                                        style={{ ...S.btn, background: 'linear-gradient(90deg, #BA68C8, #9C27B0)' }}>
                                        <PlusCircle size={20} /> YANGI MAHSULOT QO'SHISH
                                    </motion.button>
                                    {existingItems.length > 0 && (
                                        <>
                                            <div style={{ textAlign: 'center', color: '#555', fontSize: 12, margin: '10px 0' }}>YOKI MAHSULOTNI TANLANG</div>
                                            <div style={{ display: 'grid', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                                                {existingItems.map(it => (
                                                    <div key={it.id} onClick={() => { setKItem(it); setKMode('existing'); setKStep('form'); }}
                                                        style={{ ...S.card, marginBottom: 0, padding: 15, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ fontWeight: 'bold' }}>{it.name}</div>
                                                        <div style={{ fontSize: 11, color: '#888' }}>Qoldiq: {it.quantity} {it.unit}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button onClick={() => setKStep('dept')} style={{ background: 'none', border: 'none', color: '#555', fontSize: 12 }}>← BO'LIMLARGA QAYTISH</button>
                            </div>
                        );
                    }

                    return (
                        <div style={S.card}>
                            <h2 style={{ fontSize: 18, marginBottom: 25, color: '#00e676', textAlign: 'center' }}>
                                {kMode === 'new' ? 'YANGI MAHSULOT REGISTRATSIYASI' : `KIRIM: ${kItem.name}`}
                            </h2>
                            <div style={{ display: 'grid', gap: 24 }}>
                                {kMode === 'new' && (
                                    <>
                                        <div>
                                            <label style={S.label}><Box size={14} color="#BA68C8" /> Mahsulot Nomi</label>
                                            <input style={S.input} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Masalan: Ip 40/2" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                            <div>
                                                <label style={S.label}><Tag size={14} color="#BA68C8" /> Toifasi</label>
                                                <input style={S.input} list="cats" value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })} placeholder="Toifa..." />
                                                <datalist id="cats">
                                                    {['Tugma', 'Zamok', 'Ip', 'Yorliq', 'Frezilin', 'Xalta', 'Boshqa'].map(c => <option key={c} value={c} />)}
                                                </datalist>
                                            </div>
                                            <div>
                                                <label style={S.label}><Hash size={14} color="#BA68C8" /> Birligi</label>
                                                <select style={S.input} value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })}>
                                                    {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                            <div>
                                                <label style={S.label}><Edit3 size={14} color="#BA68C8" /> Rangi</label>
                                                <input style={S.input} value={f.color} onChange={e => setF({ ...f, color: e.target.value })} placeholder="Qora..." />
                                            </div>
                                            <div>
                                                <label style={S.label}><Layers size={14} color="#BA68C8" /> Size / Hajm</label>
                                                <input style={S.input} value={f.size} onChange={e => setF({ ...f, size: e.target.value })} placeholder="XL..." />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                    <div>
                                        <label style={S.label}><MapPin size={14} color="#BA68C8" /> Taminochi</label>
                                        <input style={S.input} value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} placeholder="Nomi..." />
                                    </div>
                                    <div>
                                        <label style={S.label}><Clock size={14} color="#BA68C8" /> Tel</label>
                                        <input style={S.input} type="tel" value={f.supplier_phone} onChange={e => setF({ ...f, supplier_phone: e.target.value })} placeholder="+998..." />
                                    </div>
                                </div>
                                <div>
                                    <label style={S.label}><Package size={14} color="#00e676" /> Miqdori</label>
                                    <input style={S.input} type="number" value={f.qty} onChange={e => setF({ ...f, qty: e.target.value })} placeholder="0" />
                                </div>
                                {kMode === 'new' && (
                                    <div>
                                        <label style={S.label}><Clock size={14} color="#FFAB40" /> Status</label>
                                        <select style={{ ...S.input, color: f.status === 'KUTILMOQDA' ? '#FFAB40' : '#00e676' }} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
                                            <option value="OMBORDA">OMBORDA ✅</option>
                                            <option value="KUTILMOQDA">KUTILMOQDA ⏳</option>
                                        </select>
                                    </div>
                                )}
                                {f.status === 'KUTILMOQDA' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                        <div><label style={S.label}>Zakaz sanasi</label><input style={S.input} type="date" value={f.order_date} onChange={e => setF({ ...f, order_date: e.target.value })} /></div>
                                        <div><label style={S.label}>Kelish sanasi</label><input style={S.input} type="date" value={f.expected_date} onChange={e => setF({ ...f, expected_date: e.target.value })} /></div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button onClick={() => setKStep('mode')} style={{ ...S.btn, background: '#333', flex: 1 }}>BEKOR</button>
                                    <button onClick={handleKirim} disabled={loading} style={{ ...S.btn, background: '#00e676', flex: 2 }}>{loading ? '...' : 'SAQLASH'}</button>
                                </div>
                            </div>
                        </div>
                    );
                };
                return (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={S.page}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
                            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, rgba(82,255,118,0.2), rgba(82,255,118,0.05))', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Download size={28} color="#00e676" /></div>
                            <div>
                                <h1 style={{ fontSize: 26, margin: 0, color: '#fff', fontWeight: '900' }}>Kirim Qilish</h1>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>Bo'lim va mahsulotni tanlash orqali kirim</div>
                            </div>
                        </div>
                        {renderKirimStep()}
                    </motion.div>
                );
            case 'scan':
                return (
                    <div style={S.page}>
                        <div style={S.card}>
                            <ScanUI onScan={(id) => {
                                const item = (data.accessories || []).find(it => it.id === id);
                                if (item) setScanRes(item); else showMsg("Topilmadi", "err");
                            }} />
                        </div>
                        {scanRes && (
                            <div style={S.card}>
                                <h3>{scanRes.name}</h3>
                                <div style={{ fontSize: 32, fontWeight: '900' }}>{scanRes.quantity} {scanRes.unit}</div>
                                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                    <button onClick={() => setAdjModal({ type: 'add', item: scanRes })} style={{ ...S.btn, background: '#00e676' }}>+ QO'SHISH</button>
                                    <button onClick={() => setAdjModal({ type: 'sub', item: scanRes })} style={{ ...S.btn, background: '#ff5252' }}>- CHIQIM</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'history':
                const logs = data.accessoryLog || [];
                const filteredLogs = logs.filter(l => hFilter === 'HAMMASI' || l.action_type === hFilter);

                const stats = {
                    kirim: logs.filter(l => l.action_type === 'KIRIM').reduce((a, b) => a + (b.quantity || 0), 0),
                    chiqim: logs.filter(l => l.action_type === 'ADJUSTMENT' && l.quantity < 0).reduce((a, b) => a + Math.abs(b.quantity || 0), 0)
                };

                const getActionStyle = (type) => {
                    switch (type) {
                        case 'KIRIM': return { color: '#00e676', bg: 'rgba(0,230,118,0.1)', icon: <Download size={16} /> };
                        case 'UPDATE': return { color: '#2575FC', bg: 'rgba(37,117,252,0.1)', icon: <RefreshCcw size={16} /> };
                        case 'DELETE': return { color: '#ff5252', bg: 'rgba(255,82,82,0.1)', icon: <Trash2 size={16} /> };
                        case 'ADJUSTMENT': return { color: '#FFAB40', bg: 'rgba(255,171,64,0.1)', icon: <TrendingUp size={16} /> };
                        default: return { color: '#888', bg: 'rgba(255,255,255,0.05)', icon: <History size={16} /> };
                    }
                };

                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.page}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                            <div style={{ width: 45, height: 45, background: 'rgba(186,104,200,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><History size={22} color="#BA68C8" /></div>
                            <h2 style={{ margin: 0, fontSize: 24, fontWeight: '900' }}>Amallar Tarixi</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 25 }}>
                            <div style={{ ...S.card, marginBottom: 0, padding: '15px 20px', border: '1px solid rgba(0,230,118,0.2)', background: 'rgba(0,230,118,0.02)' }}>
                                <div style={{ fontSize: 10, color: '#00e676', fontWeight: '800', marginBottom: 5 }}>JAMI KIRIM</div>
                                <div style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>+{stats.kirim} <span style={{ fontSize: 11, opacity: 0.5 }}>dona</span></div>
                            </div>
                            <div style={{ ...S.card, marginBottom: 0, padding: '15px 20px', border: '1px solid rgba(255,82,82,0.2)', background: 'rgba(255,82,82,0.02)' }}>
                                <div style={{ fontSize: 10, color: '#ff5252', fontWeight: '800', marginBottom: 5 }}>JAMI CHIQUV</div>
                                <div style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>-{stats.chiqim} <span style={{ fontSize: 11, opacity: 0.5 }}>dona</span></div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 5 }}>
                            {['HAMMASI', 'KIRIM', 'ADJUSTMENT', 'UPDATE', 'DELETE'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setHFilter(type)}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: hFilter === type ? '#BA68C8' : '#1a1a2e',
                                        color: hFilter === type ? '#fff' : '#888',
                                        whiteSpace: 'nowrap',
                                        fontSize: 11,
                                        fontWeight: '800',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {type === 'ADJUSTMENT' ? 'O\'ZGARISH' : type}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gap: 12 }}>
                            {filteredLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
                                    <Clock size={40} style={{ marginBottom: 10 }} />
                                    <div>Hozircha ma'lumot yo'q</div>
                                </div>
                            ) : (
                                filteredLogs.map(l => {
                                    const style = getActionStyle(l.action_type);
                                    return (
                                        <div key={l.id} style={{ ...S.card, marginBottom: 0, padding: 18, border: `1px solid ${style.bg}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {style.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>{l.action_type}</div>
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Clock size={10} /> {new Date(l.created_at).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 18, fontWeight: '900', color: style.color }}>
                                                        {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
                                                    </div>
                                                    <div style={{ fontSize: 9, opacity: 0.5, fontWeight: '800' }}>MIQDOR</div>
                                                </div>
                                            </div>
                                            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', borderLeft: `3px solid ${style.color}` }}>
                                                {l.notes}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                );
            default: return null;
        }
    };

    return (
        <div style={S.page}>
            {renderTab()}

            <AnimatePresence>
                {qrData && (
                    <div style={S.overlay} key="qr-modal">
                        <button onClick={() => setQrData(null)} style={{ position: 'absolute', top: 20, right: 20, background: '#eee', border: 'none', borderRadius: '50%', padding: 10 }}><X color="#000" /></button>
                        <center style={{ marginTop: 50 }}>
                            <h1 style={{ color: '#000' }}>PASPORT</h1>
                            <h2 style={{ color: '#333' }}>{qrData.name}</h2>
                            <h3 style={{ color: '#666' }}>{qrData.quantity} {qrData.unit}</h3>
                            <div style={{ background: '#fff', padding: 20, borderRadius: 20, marginTop: 20, display: 'inline-block' }}>
                                <QRCodeCanvas value={`AKSESUAR:${qrData.id}`} size={200} />
                            </div>
                        </center>
                    </div>
                )}

                {confirmDelete && (
                    <motion.div
                        key="delete-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    >
                        <div style={{ background: '#fff', color: '#000', width: '100%', maxWidth: 350, padding: 30, borderRadius: 25, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                            <div style={{ width: 60, height: 60, background: 'rgba(255,82,82,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Trash2 color="#ff5252" size={30} />
                            </div>
                            <h2 style={{ fontSize: 22, marginBottom: 10, fontWeight: '900' }}>O'chirishni tasdiqlang</h2>
                            <p style={{ color: '#666', marginBottom: 25 }}>Ushbu mahsulotni (<span style={{ color: '#000', fontWeight: 'bold' }}>{confirmDelete.name}</span>) ombordan butunlay o'chirib yuborasizmi?</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 15 }}>
                                <button onClick={() => setConfirmDelete(null)} style={{ padding: '15px', borderRadius: 15, border: '1px solid #ddd', background: '#f5f5f5', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>BEKOR</button>
                                <button onClick={() => handleDelete(confirmDelete)} disabled={loading} style={{ padding: '15px', borderRadius: 15, border: 'none', background: '#ff5252', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? '...' : "O'CHIRISH"}</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {editItem && (
                    <motion.div
                        key="edit-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    >
                        <div style={{ background: '#fff', color: '#000', width: '100%', maxWidth: 450, padding: '25px 20px', borderRadius: 25, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '0 10px' }}>
                                <h2 style={{ fontSize: 22, fontWeight: '900', margin: 0 }}>Tahrirlash</h2>
                                <button onClick={() => setEditItem(null)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} color="#000" /></button>
                            </div>

                            <div style={{ display: 'grid', gap: 15, padding: '0 10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 'bold' }}>MAHSULOT NOMI</label>
                                    <input
                                        style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #eee', fontSize: 16, outline: 'none', color: '#000', background: '#fafafa', boxSizing: 'border-box' }}
                                        value={editItem.name}
                                        onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 'bold' }}>TOIFA</label>
                                        <input
                                            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #eee', fontSize: 16, outline: 'none', color: '#000', background: '#fafafa', boxSizing: 'border-box' }}
                                            value={editItem.category}
                                            onChange={e => setEditItem({ ...editItem, category: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 'bold' }}>BIRLIK</label>
                                        <select
                                            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #eee', fontSize: 16, outline: 'none', color: '#000', background: '#fafafa', boxSizing: 'border-box' }}
                                            value={editItem.unit}
                                            onChange={e => setEditItem({ ...editItem, unit: e.target.value })}
                                        >
                                            {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 'bold' }}>MIQDORI</label>
                                        <input
                                            type="number"
                                            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #eee', fontSize: 16, outline: 'none', color: '#000', background: '#fafafa', boxSizing: 'border-box' }}
                                            value={editItem.quantity}
                                            onChange={e => setEditItem({ ...editItem, quantity: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 'bold' }}>BO'LIM</label>
                                        <select
                                            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #eee', fontSize: 16, outline: 'none', color: '#000', background: '#fafafa', boxSizing: 'border-box' }}
                                            value={editItem.target_dept}
                                            onChange={e => setEditItem({ ...editItem, target_dept: e.target.value })}
                                        >
                                            {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 'bold' }}>RANGI</label>
                                        <input
                                            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #eee', fontSize: 16, outline: 'none', color: '#000', background: '#fafafa', boxSizing: 'border-box' }}
                                            value={editItem.color || ''}
                                            onChange={e => setEditItem({ ...editItem, color: e.target.value })}
                                            placeholder="Qora..."
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 'bold' }}>SIZE</label>
                                        <input
                                            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #eee', fontSize: 16, outline: 'none', color: '#000', background: '#fafafa', boxSizing: 'border-box' }}
                                            value={editItem.size || ''}
                                            onChange={e => setEditItem({ ...editItem, size: e.target.value })}
                                            placeholder="Hajm..."
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 15, marginTop: 10 }}>
                                    <button onClick={() => setEditItem(null)} style={{ padding: '16px', borderRadius: 14, border: '1.5px solid #ddd', background: '#f5f5f5', color: '#000', fontWeight: '900', cursor: 'pointer' }}>BEKOR</button>
                                    <button onClick={handleUpdate} disabled={loading} style={{ padding: '16px', borderRadius: 14, border: 'none', background: '#BA68C8', color: '#fff', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(186,104,200,0.3)' }}>{loading ? '...' : 'SAQLASH'}</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {adjModal && (
                    <motion.div
                        key="adj-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    >
                        <div style={{ background: '#fff', color: '#000', width: '100%', maxWidth: 350, padding: 30, borderRadius: 25, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                            <h2 style={{ fontSize: 20, marginBottom: 10 }}>Miqdorni o'zgartirish</h2>
                            <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>{adjModal.item.name}</p>
                            <input
                                type="number"
                                autoFocus
                                style={{ width: '100%', padding: '20px', borderRadius: 15, border: '2px solid #BA68C8', fontSize: 32, textAlign: 'center', fontWeight: 'bold', color: '#000', marginBottom: 25 }}
                                value={adjVal}
                                onChange={e => setAdjVal(e.target.value)}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 15 }}>
                                <button onClick={() => setAdjModal(null)} style={{ padding: '15px', borderRadius: 15, border: '1px solid #ddd', background: '#f5f5f5', color: '#000', fontWeight: 'bold' }}>BEKOR</button>
                                <button onClick={handleAdjustment} style={{ padding: '15px', borderRadius: 15, border: 'none', background: '#00e676', color: '#000', fontWeight: 'bold' }}>TASDIQLASH</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ScanUI({ onScan }) {
    const [scanned, setScanned] = React.useState(false);
    React.useEffect(() => {
        let scanner = null;
        const start = async () => {
            const { Html5QrcodeScanner } = await import('html5-qrcode');
            scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
            scanner.render((text) => {
                if (text.startsWith('AKSESUAR:')) {
                    onScan(text.split(':')[1]);
                    setScanned(true);
                }
            }, (err) => { });
        };
        start();
        return () => { if (scanner) scanner.clear().catch(e => { }); };
    }, [onScan]);

    return (
        <div>
            <div id="reader" style={{ borderRadius: 20 }}></div>
            {scanned && <button onClick={() => setScanned(false)}>Qayta skanerlash</button>}
        </div>
    );
}
