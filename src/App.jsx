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
const APP_VERSION = "7.5 DUAL-WAREHOUSE";

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

const OMBOR_CATEGORIES = [
  { id: 'bichuv', name: 'Bichuv uchun', dept: 'bichuv' },
  { id: 'tikuv', name: 'Tikuv uchun', dept: 'tikuv' },
  { id: 'taqsimot', name: 'Taqsimot uchun', dept: 'taqsimot' },
  { id: 'upakovka', name: 'Upakovka uchun', dept: 'upakovka' },
  { id: 'xojalik', name: 'Xo\'jalik uchun', dept: 'xojalik' },
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
        <p style={{ textAlign: 'center', color: '#555', fontSize: 11, marginBottom: 30 }}>V{APP_VERSION}</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (auth.login === '123' && auth.password === '123') { setUser({ role: 'admin', name: 'Rahbar' }); return; }
          const h = data.heads.find(x => x.login === auth.login && x.password === auth.password);
          if (h) { setUser({ role: 'dept', ...h }); setTab('dept'); } else showMsg('Xato', 'err');
        }} style={S.form}>
          <input style={S.input} placeholder="Login" required onChange={e => setAuth({ ...auth, login: e.target.value })} />
          <input style={S.input} type="password" placeholder="Parol" required onChange={e => setAuth({ ...auth, password: e.target.value })} />
          <button type="submit" style={S.btnG}>KIRISH</button>
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
        {isOmbor && (tab === 'dept' || tab === 'wh_items') && <OmborDualWarehouse user={user} data={data} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'wh_log' && <OmborTarix whLog={data.whLog} />}
        {user.role === 'dept' && !isOmbor && <DeptPanel user={user} data={data} showMsg={showMsg} load={load} />}
      </main>
      <nav style={S.nav}>
        {user.role === 'admin' && [{ id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' }, { id: 'heads', icon: Users, l: 'Xodimlar' }, { id: 'history', icon: HistoryIcon, l: 'Arxiv' }].map(x => (<button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>))}
        {isOmbor && [{ id: 'dept', icon: LayoutDashboard, l: 'Asosiy' }, { id: 'wh_items', icon: Package, l: 'Ombor' }, { id: 'wh_log', icon: HistoryIcon, l: 'Tarix' }].map(x => (<button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>))}
      </nav>
    </div>
  );
}

function AdminDashboard({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[{ i: Users, l: 'Bo\'limlar', v: data.heads.length, c: '#00e676' }, { i: Activity, l: 'Modellar', v: data.models.length, c: '#40c4ff' }, { i: ScrollText, l: 'Matolar', v: data.whBatches.length, c: '#ff9800' }, { i: Package, l: 'I/Ch mahsulot', v: data.whItems.filter(i => !i.is_fabric).length, c: '#00e676' }].map(x => <div key={x.l} style={S.card}><x.i size={20} color={x.c} style={{ marginBottom: 8 }} /><div style={{ fontSize: 24, fontWeight: 'bold' }}>{x.v}</div><div style={{ fontSize: 10, color: '#555' }}>{x.l}</div></div>)}
    </div>
  );
}

function OmborDualWarehouse({ user, data, showMsg, load }) {
  const [mode, setMode] = useState('fabric'); // fabric or production
  const [q, setQ] = useState('');
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [actionBatch, setActionBatch] = useState(null);
  const [f, setF] = useState({ name: '', color: '', bruto: '', tara: '', note: '', dept: 'bichuv', unit: 'dona', quantity: '0' });

  const filteredItems = useMemo(() => {
    return data.whItems.filter(i => !i.is_fabric && (i.name.toLowerCase().includes(q.toLowerCase())));
  }, [data.whItems, q]);

  const filteredBatches = useMemo(() => {
    return data.whBatches.filter(b => (b.name.toLowerCase().includes(q.toLowerCase()) || b.color.toLowerCase().includes(q.toLowerCase())));
  }, [data.whBatches, q]);

  const addBatch = async (e) => { e.preventDefault(); await supabase.from('warehouse_batches').insert([{ name: f.name, color: f.color, bruto: Number(f.bruto), status: 'Qabul_qilindi', user: user.name }]); setShowAddBatch(false); load(); showMsg('Partiya qabul qilindi'); };
  const addItem = async (e) => { e.preventDefault(); await supabase.from('warehouse_items').insert([{ name: f.name, is_fabric: false, dept: f.dept, unit: f.unit, quantity: Number(f.quantity), min_quantity: 5 }]); setShowAddItem(false); load(); showMsg('Mahsulot qo\'shildi'); };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
        <button onClick={() => setMode('fabric')} style={{ ...S.subTab, background: mode === 'fabric' ? '#00e676' : '#12121e', color: mode === 'fabric' ? '#000' : '#555' }}>Mato Ombori</button>
        <button onClick={() => setMode('production')} style={{ ...S.subTab, background: mode === 'production' ? '#00e676' : '#12121e', color: mode === 'production' ? '#000' : '#555' }}>I/Ch Ombori</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
        <div style={{ flex: 1, position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#444' }} /><input style={{ ...S.input, paddingLeft: 40 }} placeholder="Qidirish..." onChange={e => setQ(e.target.value)} /></div>
        <button onClick={() => mode === 'fabric' ? setShowAddBatch(!showAddBatch) : setShowAddItem(!showAddItem)} style={S.btnG}>+</button>
      </div>

      {showAddBatch && mode === 'fabric' && (
        <form onSubmit={addBatch} style={S.addForm}>
          <input style={S.input} placeholder="Mato nomi" required onChange={e => setF({ ...f, name: e.target.value })} />
          <input style={S.input} placeholder="Rangi" required onChange={e => setF({ ...f, color: e.target.value })} />
          <input style={S.input} type="number" placeholder="Bruto kg" required onChange={e => setF({ ...f, bruto: e.target.value })} />
          <button type="submit" style={S.btnG}>QABUL QILISH</button>
        </form>
      )}

      {showAddItem && mode === 'production' && (
        <form onSubmit={addItem} style={S.addForm}>
          <input style={S.input} placeholder="Nomi (masalan: Ip 40/2)" required onChange={e => setF({ ...f, name: e.target.value })} />
          <select style={S.input} onChange={e => setF({ ...f, dept: e.target.value })}>{OMBOR_CATEGORIES.map(c => <option key={c.id} value={c.dept}>{c.name}</option>)}</select>
          <div style={{ display: 'flex', gap: 5 }}><input style={S.input} placeholder="Soni" required onChange={e => setF({ ...f, quantity: e.target.value })} /><input style={S.input} placeholder="Birlik" onChange={e => setF({ ...f, unit: e.target.value })} /></div>
          <button type="submit" style={S.btnG}>SAQLASH</button>
        </form>
      )}

      {mode === 'fabric' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredBatches.map(b => (
            <div key={b.id} style={{ ...S.card, textAlign: 'left', borderLeft: `5px solid ${b.status === 'Tayyor' ? '#00e676' : b.status === 'Dam_olyapti' ? '#ff9800' : '#40c4ff'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><b>{b.name}</b><div style={{ fontSize: 11, color: '#00e676' }}>{b.color}</div></div>
                <div style={{ textAlign: 'right' }}><b>{b.status === 'Qabul_qilindi' ? b.bruto : b.neto.toFixed(1)} kg</b><div style={{ fontSize: 9, color: '#555' }}>{b.status.replace('_', ' ')}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {b.status === 'Qabul_qilindi' && <button onClick={() => setActionBatch({ id: b.id, type: 'ko' })} style={{ ...S.smBtn, background: '#40c4ff' }}>Ko'rikka berish</button>}
                {b.status === 'Dam_olyapti' && <button onClick={async () => { await supabase.from('warehouse_batches').update({ status: 'Tayyor' }).eq('id', b.id); load(); }} style={{ ...S.smBtn, background: '#ff9800' }}>Tayyormi?</button>}
                {b.status === 'Tayyor' && <button onClick={async () => { if (confirm('Bichuvga?')) { await supabase.from('warehouse_batches').delete().eq('id', b.id); await supabase.from('warehouse_log').insert([{ item_name: b.name, type: 'Bichuvga chiqim', quantity: b.neto, user: user.name }]); load(); } }} style={{ ...S.smBtn, background: '#00e676' }}>Bichuvga berish</button>}
                {actionBatch?.id === b.id && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 5 }}><input style={S.input} placeholder="Ftulka kg" onChange={e => setF({ ...f, tara: e.target.value })} /><button onClick={async () => { const n = b.bruto - Number(f.tara); await supabase.from('warehouse_batches').update({ tara: Number(f.tara), neto: n, status: 'Dam_olyapti' }).eq('id', b.id); setActionBatch(null); load(); }} style={S.btnG}>OK</button></div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredItems.map(i => (
            <div key={i.id} style={{ ...S.card, textAlign: 'left', borderLeft: '5px solid #1a1a2e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><b>{i.name}</b><div style={{ fontSize: 10, color: '#555' }}>{i.dept} bo'limiga</div></div>
                <div style={{ textAlign: 'center' }}><b>{i.quantity}</b><div style={{ fontSize: 9 }}>{i.unit}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={async () => { const q = prompt('Kirim?'); if (q) { await supabase.from('warehouse_items').update({ quantity: i.quantity + Number(q) }).eq('id', i.id); await supabase.from('warehouse_log').insert([{ item_name: i.name, type: 'Kirim', quantity: Number(q), user: user.name }]); load(); } }} style={{ ...S.smBtn, background: '#00e676' }}>Kirim</button>
                <button onClick={async () => { const q = prompt('Chiqim?'); if (q) { await supabase.from('warehouse_items').update({ quantity: i.quantity - Number(q) }).eq('id', i.id); await supabase.from('warehouse_log').insert([{ item_name: i.name, type: 'Chiqim', quantity: Number(q), user: user.name }]); load(); } }} style={{ ...S.smBtn, background: '#ff9800' }}>Chiqim</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Heads({ heads, load }) { return <div style={S.card}>Guruh boshliqlari: {heads.map(h => <div key={h.id}>{h.name} - {h.login}</div>)}</div> }
function OmborTarix({ whLog }) { return <div style={S.card}>Tarix: {whLog.map(l => <div key={l.id}>{l.item_name} - {l.quantity} ({l.type})</div>)}</div> }
function DeptPanel({ user, data, load }) { return <div style={S.card}>Sizning bo'limingiz...</div> }

const S = {
  root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13, fontFamily: 'sans-serif' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 360, padding: 30, background: '#12121e', borderRadius: 28, border: '1px solid rgba(0,230,118,0.1)' },
  title: { textAlign: 'center', fontSize: 30, fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { width: '100%', padding: '14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 14, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btnG: { padding: '15px', background: '#00e676', color: '#000', border: 'none', borderRadius: 14, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #1a1a2e' },
  content: { flex: 1, padding: 15, paddingBottom: 90, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 20, padding: 15, border: '1px solid #1a1a2e' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 10px', background: 'rgba(10,10,20,0.9)', borderTop: '1px solid #1a1a2e' },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' },
  ib: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  smBtn: { flex: 1, padding: '10px', border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 'bold', cursor: 'pointer', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  subTab: { flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' },
  addForm: { background: '#12121e', padding: 18, borderRadius: 22, border: '1px solid #00e676', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  toast: { position: 'fixed', top: 15, left: 15, right: 15, padding: 16, borderRadius: 16, zIndex: 10000, textAlign: 'center', fontWeight: 'bold', background: '#00e676', color: '#000' }
};
