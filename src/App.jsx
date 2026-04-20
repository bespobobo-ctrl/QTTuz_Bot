import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  Settings, Palette, Ruler, Scale, QrCode, Scan, X, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "6.0 QR";

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
  const [data, setData] = useState({ heads: [], history: [], attendance: [], models: [], whItems: [], whLog: [], whOrders: [] });
  const [msg, setMsg] = useState(null);
  const [scannedItem, setScannedItem] = useState(null);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 4000); }, []);

  const load = useCallback(async () => {
    try {
      const [h, hi, att, md, wi, wl, wo] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('attendance').select('*'),
        supabase.from('models').select('*').order('updatedAt', { ascending: false }),
        supabase.from('warehouse_items').select('*').order('name'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('warehouse_orders').select('*').order('timestamp', { ascending: false })
      ]);
      setData({ heads: h.data || [], history: hi.data || [], attendance: att.data || [], models: md.data || [], whItems: wi.data || [], whLog: wl.data || [], whOrders: wo.data || [] });
    } catch (e) { showMsg(e.message, 'err'); }
  }, [showMsg]);

  useEffect(() => {
    localStorage.setItem('qv', APP_VERSION); load();
    const sub = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public' }, load).subscribe();
    return () => sub.unsubscribe();
  }, [load]);

  useEffect(() => { if (user) localStorage.setItem('qu', JSON.stringify(user)); else localStorage.removeItem('qu'); }, [user]);

  const handleScan = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showScanQrPopup({ text: "Mahsulot QR kodini skanerlang" }, (text) => {
        const item = data.whItems.find(i => i.id === text);
        if (item) {
          setScannedItem(item);
          setTab('wh_items'); // Mahsulotlar paneliga o'tish
          window.Telegram.WebApp.closeScanQrPopup();
        } else {
          showMsg("Noma'lum QR kod!", "err");
        }
      });
    } else {
      showMsg("Telegram kamerasi topilmadi (faqat mobilda ishlaydi)", "err");
    }
  };

  if (!user) return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={S.loginBox}>
        <QrCode color="#00e676" size={40} style={{ margin: '0 auto 15px', display: 'block' }} />
        <h1 style={S.title}>QTTuz</h1>
        <p style={{ textAlign: 'center', color: '#555', fontSize: 11, marginBottom: 30 }}>QR AUTOMATION V{APP_VERSION}</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (auth.login === '0068' && auth.password === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); return; }
          const h = data.heads.find(x => x.login === auth.login && x.password === auth.password);
          if (h) { setUser({ role: 'dept', ...h }); setTab('dept'); } else showMsg('Xato', 'err');
        }} style={S.form}>
          <input style={S.input} placeholder="Login" required value={auth.login} onChange={e => setAuth({ ...auth, login: e.target.value })} />
          <input style={S.input} type="password" placeholder="Parol" required value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} />
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
        <div><div style={{ fontSize: 14, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 9, color: '#00e676' }}>{APP_VERSION} PRO</div></div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isOmbor && <button onClick={handleScan} style={{ ...S.ib, color: '#00e676' }}><Scan size={20} /></button>}
          <button onClick={load} style={S.ib}><RefreshCcw size={16} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={16} /></button>
        </div>
      </header>

      <main style={S.content}>
        {user.role === 'admin' && tab === 'dashboard' && <AdminDashboard data={data} />}
        {user.role === 'admin' && tab === 'heads' && <Heads heads={data.heads} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'dept' && <OmborDashboard user={user} data={data} handleScan={handleScan} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'wh_items' && <OmborMahsulotlar whItems={data.whItems} user={user} showMsg={showMsg} load={load} scannedItem={scannedItem} setScannedItem={setScannedItem} />}
        {isOmbor && tab === 'wh_orders' && <OmborZakazlar whOrders={data.whOrders} user={user} showMsg={showMsg} load={load} />}
        {user.role === 'dept' && !isOmbor && <DeptPanel user={user} data={data} showMsg={showMsg} load={load} />}
      </main>

      <nav style={S.nav}>
        {user.role === 'admin' && [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' },
          { id: 'heads', icon: Users, l: 'Bo\'limlar' },
          { id: 'history', icon: HistoryIcon, l: 'Arxiv' }
        ].map(x => (<button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>))}
        {isOmbor && [
          { id: 'dept', icon: LayoutDashboard, l: 'Asosiy' },
          { id: 'wh_items', icon: Package, l: 'Ombor' },
          { id: 'wh_orders', icon: ShoppingCart, l: 'Zakazlar' },
          { id: 'scan', icon: Scan, l: 'Skaner' }
        ].map(x => (
          <button key={x.id} onClick={x.id === 'scan' ? handleScan : () => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>
        ))}
      </nav>
    </div>
  );
}

function AdminDashboard({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[
        { i: Users, l: 'Bo\'limlar', v: data.heads.length, c: '#00e676' },
        { i: Activity, l: 'Modellar', v: data.models.length, c: '#40c4ff' },
        { i: Warehouse, l: 'Matolar', v: data.whItems.filter(i => i.is_fabric).length, c: '#ff9800' },
        { i: Package, l: 'Mahsulotlar', v: data.whItems.filter(i => !i.is_fabric).length, c: '#00e676' }
      ].map(x => <div key={x.l} style={S.card}><x.i size={18} color={x.c} style={{ margin: '0 auto 5px' }} /><div style={{ fontSize: 22, fontWeight: 'bold' }}>{x.v}</div><div style={{ fontSize: 9, color: '#555' }}>{x.l}</div></div>)}
    </div>
  );
}

function Heads({ heads, showMsg, load }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', login: '', password: '', deptId: 'ombor' });
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}><h3>Bo'limlar</h3><button onClick={() => setOpen(!open)} style={S.btnG}>{open ? 'Yopish' : '+'}</button></div>
      {open && <form onSubmit={async (e) => { e.preventDefault(); await supabase.from('heads').insert([f]); setOpen(false); load(); }} style={S.addForm}><input style={S.input} placeholder="Ism" required onChange={e => setF({ ...f, name: e.target.value })} /><div style={{ display: 'flex', gap: 5 }}><input style={S.input} placeholder="L" onChange={e => setF({ ...f, login: e.target.value })} /><input style={S.input} placeholder="P" onChange={e => setF({ ...f, password: e.target.value })} /></div><select style={S.input} onChange={e => setF({ ...f, deptId: e.target.value })}>{DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select><button type="submit" style={S.btnG}>SAQLASH</button></form>}
      {heads.map(h => <div key={h.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', marginBottom: 8, textAlign: 'left' }}><div>{h.name} <span style={{ fontSize: 9, color: '#00e676' }}>{h.deptId}</span></div><button onClick={async () => { if (confirm('?')) { await supabase.from('heads').delete().eq('id', h.id); load(); } }} style={{ ...S.ib, color: '#ff3b30' }}><Trash2 size={16} /></button></div>)}
    </div>
  );
}

function OmborDashboard({ user, data, handleScan, showMsg, load }) {
  const low = data.whItems.filter(i => i.quantity <= i.min_quantity);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={handleScan} style={{ ...S.btnG, width: '100%', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#00e676', color: '#000', padding: 20, borderRadius: 20 }}>
        <Scan size={24} /> <b>QR SKANERLASH</b>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
        <div style={S.card}><Package size={18} color="#00e676" style={{ margin: '0 auto 5px' }} /><div style={{ fontSize: 20, fontWeight: 'bold' }}>{data.whItems.length}</div><div style={{ fontSize: 9, color: '#555' }}>Mahsulotlar</div></div>
        <div style={{ ...S.card, border: low.length > 0 ? '1px solid #ff3b30' : 'none' }}>
          <AlertTriangle size={18} color={low.length > 0 ? '#ff3b30' : '#555'} style={{ margin: '0 auto 5px' }} />
          <div style={{ fontSize: 20, fontWeight: 'bold', color: low.length > 0 ? '#ff3b30' : '#fff' }}>{low.length}</div>
          <div style={{ fontSize: 9, color: '#555' }}>Tugayotgan</div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 10, color: '#00e676' }}>OXIRGI HARAKATLAR</div>
        {data.whLog.slice(0, 5).map(l => (
          <div key={l.id} style={{ fontSize: 10, padding: '6px 0', borderBottom: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between' }}>
            <span>{l.item_name} ({l.type})</span>
            <b style={{ color: l.type === 'Kirim' ? '#00e676' : '#ff9800' }}>{l.type === 'Kirim' ? '+' : '-'}{l.quantity}</b>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function OmborMahsulotlar({ whItems, user, showMsg, load, scannedItem, setScannedItem }) {
  const [subTab, setSubTab] = useState('fabric');
  const [showAdd, setShowAdd] = useState(false);
  const [showMove, setShowMove] = useState(null);
  const [qrItem, setQrItem] = useState(null);
  const [move, setMove] = useState({ qty: '', type: 'Kirim', note: '' });
  const [f, setF] = useState({ name: '', is_fabric: true, category: 'bichuv', dept: 'bichuv', quantity: '', min_quantity: '5', unit: 'kg', color: '', gramaj: '', width: '' });

  useEffect(() => {
    if (scannedItem) {
      setShowMove(scannedItem.id);
      setSubTab(scannedItem.is_fabric ? 'fabric' : 'production');
      setScannedItem(null);
    }
  }, [scannedItem]);

  const filtered = whItems.filter(i => subTab === 'fabric' ? i.is_fabric : !i.is_fabric);

  const updateQty = async (item) => {
    const q = Number(move.qty); if (q <= 0) return;
    const n = move.type === 'Kirim' ? item.quantity + q : item.quantity - q;
    if (n < 0) { showMsg('Yetarli emas!', 'err'); return; }
    await supabase.from('warehouse_items').update({ quantity: n, updatedAt: new Date().toISOString() }).eq('id', item.id);
    await supabase.from('warehouse_log').insert([{ item_id: item.id, item_name: item.name, type: move.type, quantity: q, note: move.note, user: user.name }]);
    showMsg('OK! ✅'); setShowMove(null); setMove({ qty: '', type: 'Kirim', note: '' }); load();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
        <button onClick={() => setSubTab('fabric')} style={{ ...S.subTab, background: subTab === 'fabric' ? '#00e676' : '#12121e', color: subTab === 'fabric' ? '#000' : '#555' }}>Matolar</button>
        <button onClick={() => setSubTab('production')} style={{ ...S.subTab, background: subTab === 'production' ? '#00e676' : '#12121e', color: subTab === 'production' ? '#000' : '#555' }}>I/Ch Ombori</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <h3 style={{ fontSize: 14 }}>{subTab === 'fabric' ? 'Mato Ombori' : 'I/Ch Mahsulotlari'}</h3>
        <button onClick={() => setShowAdd(!showAdd)} style={{ ...S.btnG, padding: '5px 12px', fontSize: 11 }}>{showAdd ? 'Yopish' : '+ Qo\'shish'}</button>
      </div>

      {showAdd && (
        <form onSubmit={async (e) => { e.preventDefault(); await supabase.from('warehouse_items').insert([{ ...f, is_fabric: subTab === 'fabric', quantity: Number(f.quantity), min_quantity: Number(f.min_quantity) }]); setShowAdd(false); load(); }} style={S.addForm}>
          <input style={S.input} placeholder="Nomi" required onChange={e => setF({ ...f, name: e.target.value })} />
          {subTab === 'fabric' && <div style={{ display: 'flex', gap: 5 }}><input style={S.input} placeholder="Rangi" onChange={e => setF({ ...f, color: e.target.value })} /><input style={S.input} placeholder="G" onChange={e => setF({ ...f, gramaj: e.target.value })} /></div>}
          <div style={{ display: 'flex', gap: 5 }}><input style={S.input} type="number" placeholder="Soni" onChange={e => setF({ ...f, quantity: e.target.value })} /><input style={S.input} placeholder="Birlik" onChange={e => setF({ ...f, unit: e.target.value })} /></div>
          <button type="submit" style={S.btnG}>QO'SHISH</button>
        </form>
      )}

      {filtered.map(i => (
        <div key={i.id} style={{ ...S.card, textAlign: 'left', marginBottom: 10, borderLeft: i.quantity <= i.min_quantity ? '4px solid #ff3b30' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div onClick={() => setQrItem(qrItem === i.id ? null : i.id)}>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>{i.name} {i.color && <span style={{ color: '#00e676' }}>— {i.color}</span>}</div>
              <div style={{ fontSize: 9, color: '#555' }}>ID: {i.id.slice(0, 8)} | S: {i.supplier || '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: i.quantity <= i.min_quantity ? '#ff3b30' : '#fff' }}>{i.quantity} <span style={{ fontSize: 10 }}>{i.unit}</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => { setShowMove(showMove === i.id ? null : i.id); setMove({ ...move, type: 'Kirim' }); }} style={{ ...S.smBtn, background: '#00e676' }}>Kirim</button>
            <button onClick={() => { setShowMove(showMove === i.id ? null : i.id); setMove({ ...move, type: 'Chiqim' }); }} style={{ ...S.smBtn, background: '#ff9800' }}>Chiqim</button>
            <button onClick={() => setQrItem(qrItem === i.id ? null : i.id)} style={{ ...S.smBtn, background: '#1a1a2e', color: '#888' }}><QrCode size={14} /></button>
          </div>

          <AnimatePresence>
            {qrItem === i.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ textAlign: 'center', padding: 20, background: '#fff', borderRadius: 12, marginTop: 10 }}>
                <QRCodeCanvas value={i.id} size={150} level="H" />
                <div style={{ color: '#000', fontSize: 12, fontWeight: 'bold', marginTop: 10 }}>{i.name} {i.color || ''}</div>
                <div style={{ color: '#888', fontSize: 9 }}>QTTuz WAREHOUSE QR</div>
                <button onClick={() => window.print()} style={{ marginTop: 10, background: '#eee', border: 'none', padding: '5px 10px', borderRadius: 5, fontSize: 10 }}><Printer size={12} /> Print</button>
              </motion.div>
            )}
          </AnimatePresence>

          {showMove === i.id && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><b>{move.type}</b> <X size={14} onClick={() => setShowMove(null)} /></div>
              <input style={S.input} type="number" placeholder="Soni" autoFocus value={move.qty} onChange={e => setMove({ ...move, qty: e.target.value })} />
              <input style={S.input} placeholder="Izoh (kimga/kimdan)" value={move.note} onChange={e => setMove({ ...move, note: e.target.value })} />
              <button onClick={() => updateQty(i)} style={S.btnG}>{move.type.toUpperCase()}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OmborZakazlar({ whOrders, user, showMsg, load }) { return <div style={S.card}>ZAKAZLAR PANELI (V6.0)<p style={{ fontSize: 10, color: '#555', marginTop: 10 }}>QR Control integratsiya qilindi</p></div> }
function DeptPanel({ user, data, showMsg, load }) { return <div style={S.card}>BO'LIM PANELI (V6.0)<p style={{ fontSize: 10, color: '#555', marginTop: 10 }}>Skanerlash xodimlar uchun ham mavjud</p></div> }

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
  smBtn: { flex: 1, padding: '7px', border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 'bold', cursor: 'pointer', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  subTab: { flex: 1, padding: '9px', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' },
  addForm: { background: '#12121e', padding: 15, borderRadius: 16, border: '1px solid #00e676', marginBottom: 15, display: 'flex', flexDirection: 'column', gap: 10 },
  toast: { position: 'fixed', top: 10, left: 10, right: 10, padding: 15, borderRadius: 14, zIndex: 10000, textAlign: 'center', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }
};
