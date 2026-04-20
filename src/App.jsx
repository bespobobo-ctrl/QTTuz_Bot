import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  Settings, Palette, Ruler, Scale, QrCode, Scan, X, Printer, Clock, Coffee, Search, Filter as FilterIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "7.1 SEARCH";

const DEPARTMENTS = [
  { id: 'ombor', name: 'Ombor Bo\'limi', icon: Warehouse, actions: ['Kirim', 'Chiqim'], step: 0.2 },
  { id: 'matolar', name: 'Matolar Bo\'limi', icon: ScrollText, actions: ['Kirim', 'Chiqim'], step: 0.5 },
  { id: 'bichuv', name: 'Bichuv Bo\'limi', icon: Scissors, actions: ['Bichildi'], step: 1 },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', icon: Truck, actions: ['Ishga berildi', 'Kraskaga yuborildi', 'Vishivkaga yuborildi', 'Pressga yuborildi', 'Natija qaytdi'], step: 2 },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', icon: Activity, actions: ['Tikuv bitdi'], step: 3 },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', icon: Box, actions: ['Upakovka bitdi', 'Tayyorga topshirildi'], step: 4 },
  { id: 'tayyor', name: 'Tayyor mahsulot', icon: CheckCircle2, actions: ['Qabul qilindi'], step: 5 },
  { id: 'xojalik', name: 'Xo\'jalik Bo\'limi', icon: Home, actions: ['Xarajat', 'Kirim'], step: 0 },
  { id: 'ekspremetal', name: 'Ekspremetal', icon: Wrench, actions: ['Namuna tayyor'], step: 0 },
  { id: 'kadirlar', name: 'Kadirlar Bo\'limi', icon: Users, actions: ['Hujjatlash'], step: 0 },
];

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      if (localStorage.getItem('qv') !== APP_VERSION) { localStorage.clear(); return null; }
      const s = localStorage.getItem('qu');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [tab, setTab] = useState('dashboard');
  const [auth, setAuth] = useState({ login: '', password: '' });
  const [data, setData] = useState({ heads: [], history: [], attendance: [], models: [], whItems: [], whLog: [], whOrders: [], whBatches: [] });
  const [msg, setMsg] = useState(null);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 4000); }, []);

  const load = useCallback(async () => {
    try {
      const [h, hi, att, md, wi, wl, wo, wb] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('attendance').select('*'),
        supabase.from('models').select('*').order('updatedAt', { ascending: false }),
        supabase.from('warehouse_items').select('*').order('name'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(40),
        supabase.from('warehouse_orders').select('*').order('timestamp', { ascending: false }),
        supabase.from('warehouse_batches').select('*').order('arrival_date', { ascending: false })
      ]);
      setData({ heads: h.data || [], history: hi.data || [], attendance: att.data || [], models: md.data || [], whItems: wi.data || [], whLog: wl.data || [], whOrders: wo.data || [], whBatches: wb.data || [] });
    } catch (e) { showMsg(e.message, 'err'); }
  }, [showMsg]);

  useEffect(() => {
    localStorage.setItem('qv', APP_VERSION); load();
    const sub = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public' }, load).subscribe();
    return () => sub.unsubscribe();
  }, [load]);

  useEffect(() => { if (user) localStorage.setItem('qu', JSON.stringify(user)); else localStorage.removeItem('qu'); }, [user]);

  if (!user) return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={S.loginBox}>
        <div style={{ ...S.card, background: 'none', border: 'none', marginBottom: 20 }}><Zap color="#00e676" size={50} style={{ margin: '0 auto' }} /></div>
        <h1 style={S.title}>QTTuz App</h1>
        <p style={{ textAlign: 'center', color: '#555', fontSize: 11, marginBottom: 30 }}>Kuchsiz internetda ham barqaror ishlovchi tizim</p>
        <form onSubmit={(e) => { e.preventDefault(); if (auth.login === '0068' && auth.password === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); return; } const h = data.heads.find(x => x.login === auth.login && x.password === auth.password); if (h) { setUser({ role: 'dept', ...h }); setTab('dept'); } else showMsg('Login yoki parol xato', 'err'); }} style={S.form}>
          <input style={S.input} placeholder="Login" required onChange={e => setAuth({ ...auth, login: e.target.value })} />
          <input style={S.input} type="password" placeholder="Parol" required onChange={e => setAuth({ ...auth, password: e.target.value })} />
          <button type="submit" style={S.btnG}>TIZIMGA KIRISH</button>
        </form>
      </motion.div>
    </div>
  );

  const isOmbor = user.role === 'dept' && user.deptId === 'ombor';

  return (
    <div style={S.root}>
      <AnimatePresence>{msg && (<motion.div initial={{ y: -80 }} animate={{ y: 0 }} exit={{ y: -80 }} style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676', color: msg.type === 'err' ? '#fff' : '#000' }}>{msg.t}</motion.div>)}</AnimatePresence>
      <header style={S.header}>
        <div><div style={{ fontSize: 15, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 10, color: '#00e676' }}>{APP_VERSION} PRO</div></div>
        <div style={{ display: 'flex', gap: 10 }}><button onClick={load} style={S.ib}><RefreshCcw size={16} /></button><button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={16} /></button></div>
      </header>

      <main style={S.content}>
        {user.role === 'admin' && tab === 'dashboard' && <AdminDashboard data={data} />}
        {user.role === 'admin' && tab === 'heads' && <Heads heads={data.heads} showMsg={showMsg} load={load} />}
        {isOmbor && (tab === 'dept' || tab === 'wh_items') && <OmborWorkflow user={user} data={data} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'wh_log' && <OmborTarix whLog={data.whLog} />}
        {user.role === 'dept' && !isOmbor && <DeptPanel user={user} data={data} showMsg={showMsg} load={load} />}
      </main>

      <nav style={S.nav}>
        {user.role === 'admin' && [{ id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' }, { id: 'heads', icon: Users, l: 'Xodimlar' }, { id: 'history', icon: HistoryIcon, l: 'Arxiv' }].map(x => (<button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>))}
        {isOmbor && [
          { id: 'dept', icon: LayoutDashboard, l: 'Asosiy' },
          { id: 'wh_items', icon: Package, l: 'Partiyalar' },
          { id: 'wh_log', icon: HistoryIcon, l: 'Tarix' }
        ].map(x => (<button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>))}
      </nav>
    </div>
  );
}

function AdminDashboard({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[{ i: Users, l: 'Bo\'limlar', v: data.heads.length, c: '#00e676' }, { i: Activity, l: 'Modellar', v: data.models.length, c: '#40c4ff' }, { i: ScrollText, l: 'Mato Partiyalari', v: data.whBatches.length, c: '#ff9800' }, { i: Package, l: 'I/Ch mahsulot', v: data.whItems.filter(i => !i.is_fabric).length, c: '#00e676' }].map(x => <div key={x.l} style={S.card}><x.i size={20} color={x.c} style={{ marginBottom: 8 }} /><div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 2 }}>{x.v}</div><div style={{ fontSize: 10, color: '#555' }}>{x.l}</div></div>)}
    </div>
  );
}

function OmborWorkflow({ user, data, showMsg, load }) {
  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [actionBatch, setActionBatch] = useState(null);
  const [f, setF] = useState({ name: '', color: '', bruto: '', tara: '', note: '' });

  // QIDIRUV VA FILTR LOGIKASI
  const filteredBatches = useMemo(() => {
    return data.whBatches.filter(b => {
      const matchQ = b.name.toLowerCase().includes(q.toLowerCase()) || b.color.toLowerCase().includes(q.toLowerCase());
      const matchS = filterStatus === 'all' || b.status === filterStatus;
      return matchQ && matchS;
    });
  }, [data.whBatches, q, filterStatus]);

  const startKirim = async (e) => {
    e.preventDefault();
    try {
      await supabase.from('warehouse_batches').insert([{ name: f.name, color: f.color, bruto: Number(f.bruto), status: 'Qabul_qilindi', user: user.name }]);
      await supabase.from('warehouse_log').insert([{ item_name: f.name, type: 'Kirim (Bruto)', quantity: Number(f.bruto), note: `Rangi: ${f.color}`, user: user.name }]);
      showMsg('Partiya saqlandi! ✅'); setShowAdd(false); setF({ name: '', color: '', bruto: '', tara: '', note: '' }); load();
    } catch (e) { showMsg(e.message, 'err'); }
  };

  const startDam = async (batch) => {
    if (!f.tara) return;
    const neto = batch.bruto - Number(f.tara);
    await supabase.from('warehouse_batches').update({ tara: Number(f.tara), neto: neto, status: 'Dam_olyapti', ready_date: new Date().toISOString() }).eq('id', batch.id);
    await supabase.from('warehouse_log').insert([{ item_name: batch.name, type: 'Ko\'rikka o\'tdi', quantity: neto, bruto: batch.bruto, tara: Number(f.tara), note: 'Ko\'rikdan o\'tib dam olishga qo\'yildi', user: user.name }]);
    showMsg('Dam olish boshlandi! ⏰'); setActionBatch(null); setF({ ...f, tara: '' }); load();
  };

  return (
    <div>
      {/* QIDIRUV VA FILTR BARI */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#444' }} />
            <input style={{ ...S.input, paddingLeft: 40 }} placeholder="Mato yoki rang qidirish..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button onClick={() => setShowAdd(!showAdd)} style={{ ...S.btnG, width: 50, padding: 0 }}><Plus size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 5 }}>
          {[
            { id: 'all', l: 'Hammasi', c: '#fff' },
            { id: 'Tayyor', l: 'Tayyor', c: '#00e676' },
            { id: 'Dam_olyapti', l: 'Dam olyapti', c: '#ff9800' },
            { id: 'Qabul_qilindi', l: 'Kutilmoqda', c: '#40c4ff' }
          ].map(s => (
            <button key={s.id} onClick={() => setFilterStatus(s.id)}
              style={{ ...S.chip, background: filterStatus === s.id ? s.c : '#12121e', color: filterStatus === s.id ? '#000' : '#888' }}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {showAdd && (
        <form onSubmit={startKirim} style={S.addForm}>
          <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 10, color: '#00e676' }}>Yangi Kirim (Bruto)</div>
          <input style={S.input} placeholder="Mato nomi (masalan: Futbolka matosi)" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <input style={S.input} placeholder="Rangi (masalan: To'q ko'k)" required value={f.color} onChange={e => setF({ ...f, color: e.target.value })} />
          <input style={S.input} type="number" step="0.01" placeholder="Bruto og'irligi (kg)" required value={f.bruto} onChange={e => setF({ ...f, bruto: e.target.value })} />
          <button type="submit" style={S.btnG}>PARTIYA QO'SHISH</button>
        </form>
      )}

      {/* PARTIYALAR RO'YXATI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredBatches.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#444' }}>Hech narsa topilmadi</div> :
          filteredBatches.map(b => {
            const isReady = b.status === 'Tayyor'; const isDam = b.status === 'Dam_olyapti'; const isNew = b.status === 'Qabul_qilindi';
            return (
              <div key={b.id} style={{ ...S.card, textAlign: 'left', position: 'relative', borderLeft: `5px solid ${isReady ? '#00e676' : isDam ? '#ff9800' : '#40c4ff'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: 15 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: '#00e676' }}>Rangi: {b.color}</div>
                    <div style={{ fontSize: 9, color: '#444', marginTop: 4 }}>Kelgan sana: {new Date(b.arrival_date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 'bold' }}>{isNew ? b.bruto : b.neto.toFixed(1)} <span style={{ fontSize: 10, color: '#444' }}>kg</span></div>
                    <div style={{ fontSize: 9, color: isReady ? '#00e676' : isDam ? '#ff9800' : '#40c4ff', fontWeight: 'bold' }}>{b.status.replace('_', ' ').toUpperCase()}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {isNew && <button onClick={() => setActionBatch({ id: b.id, type: 'ko' })} style={{ ...S.smBtn, background: '#40c4ff' }}>Ko'rikka berish</button>}
                  {isDam && <button onClick={async () => { await supabase.from('warehouse_batches').update({ status: 'Tayyor' }).eq('id', b.id); load(); }} style={{ ...S.smBtn, background: '#ff9800' }}>Tayyor bo'ldimi?</button>}
                  {isReady && <button onClick={async () => { if (confirm('Bichuvga berilsinmi?')) { await supabase.from('warehouse_batches').delete().eq('id', b.id); await supabase.from('warehouse_log').insert([{ item_name: b.name, type: 'Bichuvga chiqim', quantity: b.neto, note: `Bichuvga topshirildi (${b.color})`, user: user.name }]); load(); showMsg('Bichuvga ketdi! 🚀'); } }} style={{ ...S.smBtn, background: '#00e676' }}>Bichuvga berish</button>}
                  <button onClick={async () => { if (confirm('O\'chirilsinmi?')) { await supabase.from('warehouse_batches').delete().eq('id', b.id); load(); } }} style={{ ...S.smBtn, background: '#111', width: 35 }}><Trash2 size={14} color="#ff3b30" /></button>
                </div>

                {actionBatch?.id === b.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1a1a2e' }}>
                    <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>Bruto: {b.bruto}kg. Neto og'irlikni chiqarish uchun ftulka vaznini yozing:</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <input style={S.input} type="number" step="0.1" placeholder="Ftulka kg" onChange={e => setF({ ...f, tara: e.target.value })} />
                      <button onClick={() => startDam(b)} style={{ ...S.btnG, width: 80 }}>OK</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function Heads({ heads, showMsg, load }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', login: '', password: '', deptId: 'ombor' });
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}><h3>Bo'lim Boshliqlari</h3><button onClick={() => setOpen(!open)} style={{ ...S.btnG, width: 'auto', padding: '8px 15px' }}>{open ? 'Yopish' : '+ Qo\'shish'}</button></div>
      {open && (
        <form onSubmit={async (e) => { e.preventDefault(); await supabase.from('heads').insert([f]); setOpen(false); load(); showMsg('Qo\'shildi!'); }} style={S.addForm}>
          <input style={S.input} placeholder="Ism familiya" required onChange={e => setF({ ...f, name: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}><input style={S.input} placeholder="Login" onChange={e => setF({ ...f, login: e.target.value })} /><input style={S.input} placeholder="Parol" onChange={e => setF({ ...f, password: e.target.value })} /></div>
          <select style={S.input} onChange={e => setF({ ...f, deptId: e.target.value })}>{DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <button type="submit" style={S.btnG}>SAQLASH</button>
        </form>
      )}
      {heads.map(h => <div key={h.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', marginBottom: 10, textAlign: 'left' }}><div><div style={{ fontWeight: 'bold' }}>{h.name}</div><div style={{ fontSize: 10, color: '#00e676' }}>{h.deptId} bo'limi</div></div><button onClick={async () => { if (confirm('?')) { await supabase.from('heads').delete().eq('id', h.id); load(); } }} style={{ ...S.ib, color: '#ff3b30' }}><Trash2 size={18} /></button></div>)}
    </div>
  );
}

function OmborTarix({ whLog }) {
  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 15 }}>📑 Tarixiy Harakatlar</h3>
      {whLog.map(l => (
        <div key={l.id} style={{ ...S.card, marginBottom: 10, textAlign: 'left', borderBottom: '1px solid #1a1a2e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><b style={{ color: '#00e676' }}>{l.type}</b> <span style={{ fontSize: 9, color: '#444' }}>{new Date(l.timestamp).toLocaleString()}</span></div>
          <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 3 }}>{l.item_name}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{l.quantity} kg | Xodim: {l.user}</div>
          {l.note && <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic', marginTop: 4 }}>"{l.note}"</div>}
        </div>
      ))}
    </div>
  );
}

function DeptPanel({ user, data, showMsg, load }) {
  const [f, setF] = useState({ model: '', action: '', details: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || DEPARTMENTS[0];
  const today = new Date().toISOString().split('T')[0];
  const att = data.attendance.find(a => a.headId === user.id && a.date === today);

  const send = async (e) => {
    e.preventDefault();
    if (!f.action) { showMsg('Amal tanlamadi!', 'err'); return; }
    await supabase.from('history').insert([{ dept: dept.name, action: f.action, details: f.details, model: f.model, user: user.name }]);
    if (f.model) await supabase.from('models').upsert([{ id: f.model.toLowerCase(), modelName: f.model, currentDept: dept.name, progress: dept.step || 0 }]);
    showMsg('Muvaffaqiyatli! ✅'); setF({ ...f, model: '', details: '' }); load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#00e676' }}>{dept.name}</div>
        {!att ? <button onClick={async () => { await supabase.from('attendance').upsert([{ id: `${today}_${user.id}`, headId: String(user.id), status: 'Keldi', date: today }]); load(); }} style={{ ...S.btnG, marginTop: 10, width: '200px' }}>✅ Ishga keldim</button> : <div style={{ color: '#00e676', marginTop: 10 }}>🟢 Bugun ishdasiz ({att.status})</div>}
      </div>
      <form onSubmit={send} style={S.addForm}>
        <input style={S.input} placeholder="Model nomi" required value={f.model} onChange={e => setF({ ...f, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>{dept.actions.map(a => <button key={a} type="button" onClick={() => setF({ ...f, action: a })} style={{ ...S.chip, flex: '1 0 45%', padding: 12, background: f.action === a ? '#00e676' : '#12121e', color: f.action === a ? '#000' : '#555', fontSize: 11 }}>{a}</button>)}</div>
        <input style={S.input} placeholder="Soni/Izoh" value={f.details} onChange={e => setF({ ...f, details: e.target.value })} />
        <button type="submit" style={S.btnG}>TASDIQLASH</button>
      </form>
    </motion.div>
  );
}

const S = {
  root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13, fontFamily: '-apple-system, system-ui, sans-serif' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 360, padding: 30, background: '#12121e', borderRadius: 28, border: '1px solid rgba(0,230,118,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  title: { textAlign: 'center', fontSize: 30, fontWeight: 'bold', marginBottom: 5 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { width: '100%', padding: '14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 14, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: '0.3s' },
  btnG: { padding: '15px', background: '#00e676', color: '#000', border: 'none', borderRadius: 14, fontWeight: 'bold', fontSize: 14, cursor: 'pointer', transition: '0.2s' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #1a1a2e', background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(10px)', sticky: 'top' },
  content: { flex: 1, padding: 15, paddingBottom: 90, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 20, padding: 18, border: '1px solid #1a1a2e' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 10px', background: 'rgba(10,10,20,0.92)', backdropFilter: 'blur(15px)', borderTop: '1px solid #1a1a2e', zIndex: 1000 },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', flex: 1 },
  ib: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  smBtn: { flex: 1, padding: '10px', border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 'bold', cursor: 'pointer', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  addForm: { background: '#12121e', padding: 18, borderRadius: 22, border: '1px solid #1a1a2e', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  chip: { border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 'bold', cursor: 'pointer', padding: '8px 15px', transition: '0.2s', whiteSpace: 'nowrap' },
  toast: { position: 'fixed', top: 15, left: 15, right: 15, padding: 16, borderRadius: 16, zIndex: 10000, textAlign: 'center', fontWeight: 'bold', boxShadow: '0 15px 40px rgba(0,0,0,0.4)', fontSize: 13 }
};
