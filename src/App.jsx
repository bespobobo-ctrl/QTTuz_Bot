import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  Settings, Palette, Ruler, Scale, QrCode, Scan, X, Printer, Clock, Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "7.0 WORKFLOW";

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
  const [scannedItem, setScannedItem] = useState(null);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 5000); }, []);

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={S.loginBox}>
        <Coffee color="#00e676" size={40} style={{ margin: '0 auto 15px', display: 'block' }} />
        <h1 style={S.title}>QTTuz</h1>
        <p style={{ textAlign: 'center', color: '#555', fontSize: 11, marginBottom: 30 }}>V{APP_VERSION} PRO</p>
        <form onSubmit={(e) => { e.preventDefault(); if (auth.login === '0068' && auth.password === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); return; } const h = data.heads.find(x => x.login === auth.login && x.password === auth.password); if (h) { setUser({ role: 'dept', ...h }); setTab('dept'); } else showMsg('Xato', 'err'); }} style={S.form}>
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
        <div><div style={{ fontSize: 14, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 9, color: '#00e676' }}>{APP_VERSION}</div></div>
        <div style={{ display: 'flex', gap: 10 }}><button onClick={load} style={S.ib}><RefreshCcw size={16} /></button><button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={16} /></button></div>
      </header>

      <main style={S.content}>
        {user.role === 'admin' && tab === 'dashboard' && <AdminDashboard data={data} />}
        {isOmbor && tab === 'dept' && <OmborStats data={data} />}
        {isOmbor && (tab === 'dept' || tab === 'wh_items') && <OmborWorkflow user={user} data={data} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'wh_log' && <OmborTarix whLog={data.whLog} />}
      </main>

      <nav style={S.nav}>
        {user.role === 'admin' && [{ id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' }, { id: 'heads', icon: Users, l: 'Xodimlar' }, { id: 'history', icon: HistoryIcon, l: 'Arxiv' }].map(x => (<button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>))}
        {isOmbor && [
          { id: 'dept', icon: LayoutDashboard, l: 'Asosiy' },
          { id: 'wh_items', icon: Package, l: 'Matolar' },
          { id: 'wh_log', icon: HistoryIcon, l: 'Tarix' }
        ].map(x => (<button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>))}
      </nav>
    </div>
  );
}

function AdminDashboard({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[{ i: Users, l: 'Xodimlar', v: data.heads.length, c: '#00e676' }, { i: Activity, l: 'Modellar', v: data.models.length, c: '#40c4ff' }, { i: ScrollText, l: 'Mato Partiyalari', v: data.whBatches.length, c: '#ff9800' }, { i: Package, l: 'I/Ch mahsulot', v: data.whItems.filter(i => !i.is_fabric).length, c: '#00e676' }].map(x => <div key={x.l} style={S.card}><x.i size={18} color={x.c} style={{ margin: '0 auto 5px' }} /><div style={{ fontSize: 22, fontWeight: 'bold' }}>{x.v}</div><div style={{ fontSize: 9, color: '#555' }}>{x.l}</div></div>)}
    </div>
  );
}

function OmborStats({ data }) {
  const ready = data.whBatches.filter(b => b.status === 'Tayyor').length;
  const resting = data.whBatches.filter(b => b.status === 'Dam_olyapti').length;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
      <div style={S.card}><CheckCircle size={18} color="#00e676" /><div style={{ fontSize: 18, fontWeight: 'bold' }}>{ready}</div><div style={{ fontSize: 9, color: '#555' }}>Tayyor matolar</div></div>
      <div style={S.card}><Clock size={18} color="#ff9800" /><div style={{ fontSize: 18, fontWeight: 'bold' }}>{resting}</div><div style={{ fontSize: 9, color: '#555' }}>Dam olmoqda</div></div>
    </div>
  );
}

function OmborWorkflow({ user, data, showMsg, load }) {
  const [showAdd, setShowAdd] = useState(false);
  const [actionBatch, setActionBatch] = useState(null); // { id, type: 'ko'rik' | 'chiqim' }
  const [f, setF] = useState({ name: '', color: '', bruto: '', tara: '', note: '' });

  const startKirim = async (e) => {
    e.preventDefault();
    try {
      await supabase.from('warehouse_batches').insert([{ name: f.name, color: f.color, bruto: Number(f.bruto), status: 'Qabul_qilindi', user: user.name }]);
      await supabase.from('warehouse_log').insert([{ item_name: f.name, type: 'Kirim (Bruto)', quantity: Number(f.bruto), note: `Rang: ${f.color}`, user: user.name }]);
      showMsg('Partiya qabul qilindi! ✅'); setShowAdd(false); setF({ name: '', color: '', bruto: '', tara: '', note: '' }); load();
    } catch (e) { showMsg(e.message, 'err'); }
  };

  const startDam = async (batch) => {
    if (!f.tara) { showMsg('Ftulka og\'irligini kiriting!', 'err'); return; }
    const neto = batch.bruto - Number(f.tara);
    const rDate = new Date(); rDate.setDate(rDate.getDate() + 3); // 3 kun keyin tayyor bo'ladi
    await supabase.from('warehouse_batches').update({ tara: Number(f.tara), neto: neto, status: 'Dam_olyapti', ready_date: rDate.toISOString() }).eq('id', batch.id);
    await supabase.from('warehouse_log').insert([{ item_name: batch.name, type: 'Ko\'rik/Dam berish', quantity: neto, bruto: batch.bruto, tara: Number(f.tara), note: 'Dam olish boshlandi', user: user.name }]);
    showMsg('Neto hisoblandi. Matoga dam berildi! 🛌'); setActionBatch(null); setF({ ...f, tara: '' }); load();
  };

  const finalizeReady = async (batch) => {
    await supabase.from('warehouse_batches').update({ status: 'Tayyor' }).eq('id', batch.id);
    showMsg('Mato tayyor holatga o\'tdi! ✅'); load();
  };

  const giveToBichuv = async (batch) => {
    if (!confirm('Bichuvga berilsinmi?')) return;
    await supabase.from('warehouse_batches').delete().eq('id', batch.id); // Ombor qoldig'idan chiqib ketadi
    await supabase.from('history').insert([{ dept: 'Ombor', action: 'Bichuvga berildi', details: `${batch.neto}kg mato`, model: batch.name, user: user.name }]);
    await supabase.from('warehouse_log').insert([{ item_name: batch.name, type: 'Chiqim (Bichuv)', quantity: batch.neto, note: 'Bichuvga yuborildi', user: user.name }]);
    showMsg('Bichuvga topshirildi! 🚀'); load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <h3 style={{ fontSize: 14 }}>🏢 Mato Partiyalari</h3>
        <button onClick={() => setShowAdd(!showAdd)} style={S.btnG}>{showAdd ? 'Yopish' : '+ Yangi Kirim'}</button>
      </div>

      {showAdd && (
        <form onSubmit={startKirim} style={S.addForm}>
          <input style={S.input} placeholder="Mato nomi" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <input style={S.input} placeholder="Rangi" required value={f.color} onChange={e => setF({ ...f, color: e.target.value })} />
          <input style={S.input} type="number" step="0.01" placeholder="Bruto (kg)" required value={f.bruto} onChange={e => setF({ ...f, bruto: e.target.value })} />
          <button type="submit" style={S.btnG}>QABUL QILISH</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.whBatches.map(b => {
          const isReady = b.status === 'Tayyor';
          const isDam = b.status === 'Dam_olyapti';
          const isNew = b.status === 'Qabul_qilindi';

          return (
            <div key={b.id} style={{ ...S.card, textAlign: 'left', borderLeft: `5px solid ${isReady ? '#00e676' : isDam ? '#ff9800' : '#40c4ff'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{b.name} <span style={{ color: '#00e676' }}>({b.color})</span></div>
                  <div style={{ fontSize: 9, color: '#555' }}>Sana: {new Date(b.arrival_date).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{isNew ? b.bruto : b.neto} <span style={{ fontSize: 9 }}>kg</span></div>
                  <div style={{ fontSize: 9, color: isReady ? '#00e676' : isDam ? '#ff9800' : '#40c4ff', fontWeight: 'bold' }}>{b.status.replace('_', ' ')}</div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                {isNew && <button onClick={() => setActionBatch({ id: b.id, type: 'ko' })} style={{ ...S.smBtn, background: '#40c4ff' }}>📥 Ko'rikka berish</button>}
                {isDam && <button onClick={() => finalizeReady(b)} style={{ ...S.smBtn, background: '#ff9800' }}>⏰ Dam olib bo'ldimi?</button>}
                {isReady && <button onClick={() => giveToBichuv(b)} style={{ ...S.smBtn, background: '#00e676' }}>✂️ Bichuvga berish</button>}
                <button onClick={async () => { if (confirm('?')) { await supabase.from('warehouse_batches').delete().eq('id', b.id); load(); } }} style={{ ...S.smBtn, background: '#111', width: 30 }}><Trash2 size={12} color="#ff3b30" /></button>
              </div>

              {/* KO'RIK FORMASI */}
              {actionBatch?.id === b.id && actionBatch.type === 'ko' && (
                <div style={{ marginTop: 10, background: '#111', padding: 10, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, marginBottom: 8, color: '#777' }}>Bruto: {b.bruto}kg. Ftulka (tara) vaznini kiriting:</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <input style={S.input} type="number" step="0.01" placeholder="Ftulka kg" onChange={e => setF({ ...f, tara: e.target.value })} />
                    <button onClick={() => startDam(b)} style={S.btnG}>OK</button>
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

function OmborTarix({ whLog }) {
  return (
    <div>
      <h3 style={{ fontSize: 14, marginBottom: 15 }}>📑 Tarix</h3>
      {whLog.map(l => (
        <div key={l.id} style={{ ...S.card, marginBottom: 8, textAlign: 'left', fontSize: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{l.item_name}</b> <span style={{ fontSize: 9, color: '#444' }}>{new Date(l.timestamp).toLocaleTimeString()}</span></div>
          <div style={{ color: '#00e676', marginTop: 3 }}>{l.type}: {l.quantity}kg</div>
          {l.note && <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>💬 {l.note}</div>}
        </div>
      ))}
    </div>
  );
}

const S = {
  root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13, fontFamily: 'sans-serif' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 350, padding: 30, background: '#12121e', borderRadius: 24, border: '1px solid rgba(0,230,118,0.1)' },
  title: { textAlign: 'center', fontSize: 32, fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { width: '100%', padding: '12px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btnG: { padding: '12px', background: '#00e676', color: '#000', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #1a1a2e' },
  content: { flex: 1, padding: 15, paddingBottom: 85, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 16, padding: 15, border: '1px solid #1a1a2e', textAlign: 'center' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 0', background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid #1a1a2e' },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' },
  ib: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  smBtn: { flex: 1, padding: '8px', border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 'bold', cursor: 'pointer', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  subTab: { flex: 1, padding: '9px', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' },
  addForm: { background: '#12121e', padding: 15, borderRadius: 16, border: '1px solid #00e676', marginBottom: 15, display: 'flex', flexDirection: 'column', gap: 10 },
  toast: { position: 'fixed', top: 10, left: 10, right: 10, padding: 15, borderRadius: 14, zIndex: 10000, textAlign: 'center', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }
};
