import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  Settings, Palette, Ruler, Scale, QrCode, Scan, X, Printer, Clock, Coffee, Search, Filter as FilterIcon,
  Download, Upload, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255xwygwwnhnghqihuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "8.1 SPEED_PRO";

const DEPARTMENTS = [
  { id: 'ombor', name: 'Ombor Bo\'limi', actions: ['Kirim', 'Chiqim'] },
  { id: 'matolar', name: 'Matolar Bo\'limi', actions: ['Kirim', 'Chiqim'] },
  { id: 'bichuv', name: 'Bichuv Bo\'limi', actions: ['Bichildi'] },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', actions: ['Ishga berildi'] },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', actions: ['Tikuv bitdi'] },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', actions: ['Upakovka bitdi'] },
  { id: 'tayyor', name: 'Tayyor mahsulot', actions: ['Qabul qilindi'] },
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
      const s = localStorage.getItem('qu');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ heads: [], history: [], attendance: [], models: [], whItems: [], whLog: [], whOrders: [], whBatches: [] });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 3000); }, []);

  // Ma'lumotlarni aqlli yuklash (faqat kerak bo'lganda)
  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [h, hi, md, wi, wl, wb] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('models').select('*'),
        supabase.from('warehouse_items').select('*'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('warehouse_batches').select('*').order('arrival_date', { ascending: false })
      ]);
      setData(prev => ({
        ...prev,
        heads: h.data || [], history: hi.data || [], models: md.data || [],
        whItems: wi.data || [], whLog: wl.data || [], whBatches: wb.data || []
      }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const sub = supabase.channel('fast-sync').on('postgres_changes', { event: '*', schema: 'public' }, () => load(true)).subscribe();
    return () => sub.unsubscribe();
  }, [load]);

  useEffect(() => { if (user) localStorage.setItem('qu', JSON.stringify(user)); else localStorage.removeItem('qu'); }, [user]);

  if (!user) return <Login data={data} setUser={setUser} setTab={setTab} showMsg={showMsg} />;

  const isOmbor = user.role === 'dept' && user.deptId === 'ombor';

  return (
    <div style={S.root}>
      <AnimatePresence>
        {msg && (<motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676' }}>{msg.t}</motion.div>)}
        {loading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={S.loaderBar} />}
      </AnimatePresence>

      <header style={S.header}>
        <div><div style={{ fontSize: 16, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 9, color: '#00e676' }}>⚡ SPEED PRO {APP_VERSION}</div></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => load()} style={S.ib}><RefreshCcw size={18} className={loading ? 'spin' : ''} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={S.content}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}>
            {user.role === 'admin' && tab === 'dashboard' && <AdminDashboard data={data} />}
            {isOmbor && tab === 'dashboard' && <OmborXulosa data={data} />}
            {isOmbor && tab === 'kirim' && <OmborKirim user={user} data={data} showMsg={showMsg} load={load} />}
            {isOmbor && tab === 'ombor' && <OmborQoldiq user={user} data={data} showMsg={showMsg} load={load} />}
            {isOmbor && tab === 'chiqim' && <OmborChiqim user={user} data={data} showMsg={showMsg} load={load} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav style={S.nav}>
        {(isOmbor ? [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Stat' },
          { id: 'kirim', icon: Download, l: 'Kirim' },
          { id: 'ombor', icon: Package, l: 'Stock' },
          { id: 'chiqim', icon: Upload, l: 'Chiqim' }
        ] : [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' },
          { id: 'heads', icon: Users, l: 'Xodim' },
          { id: 'history', icon: HistoryIcon, l: 'Log' }
        ]).map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}>
            <x.icon size={20} strokeWidth={tab === x.id ? 2.5 : 2} />
            <span style={{ fontSize: 9, fontWeight: tab === x.id ? 'bold' : 'normal' }}>{x.l}</span>
          </button>
        ))}
      </nav>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function Login({ data, setUser, setTab, showMsg }) {
  const [auth, setAuth] = useState({ login: '', password: '' });
  return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={S.loginBox}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}><Zap color="#00e676" size={48} className="spin-slow" /></div>
        <h1 style={{ ...S.title, fontSize: 28 }}>QTTuz FAST</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (auth.login === '123' && auth.password === '123') { setUser({ role: 'admin', name: 'Rahbar' }); return; }
          const h = data.heads.find(x => x.login === auth.login && x.password === auth.password);
          if (h) { setUser({ role: 'dept', ...h }); setTab('dashboard'); } else showMsg('Xato!', 'err');
        }} style={S.form}>
          <input style={S.input} placeholder="Login" required onChange={e => setAuth({ ...auth, login: e.target.value })} autoFocus />
          <input style={S.input} type="password" placeholder="Parol" required onChange={e => setAuth({ ...auth, password: e.target.value })} />
          <button type="submit" style={S.btnG}>KIRISH</button>
        </form>
      </motion.div>
    </div>
  );
}

function OmborXulosa({ data }) {
  const low = data.whItems.filter(i => i.quantity <= 5).length;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[
        { i: ScrollText, l: 'Matolar', v: data.whBatches.length, c: '#ff9800' },
        { i: Package, l: 'Aksessuar', v: data.whItems.length, c: '#00e676' },
        { i: AlertTriangle, l: 'Kamaygan', v: low, c: '#ff3b30' },
        { i: HistoryIcon, l: 'Bugun', v: data.whLog.length, c: '#40c4ff' }
      ].map(x => (
        <div key={x.l} style={{ ...S.card, padding: 20 }}>
          <x.i size={20} color={x.c} style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{x.v}</div>
          <div style={{ fontSize: 10, color: '#555' }}>{x.l}</div>
        </div>
      ))}
    </div>
  );
}

function OmborKirim({ user, data, showMsg, load }) {
  const [m, setM] = useState('fabric');
  const [f, setF] = useState({ n: '', c: '', b: '', d: 'bichuv', u: 'kg', q: '0' });

  const kirim = async (e) => {
    e.preventDefault();
    try {
      if (m === 'fabric') {
        await supabase.from('warehouse_batches').insert([{ name: f.n, color: f.c, bruto: Number(f.b), status: 'Qabul_qilindi', user: user.name }]);
      } else {
        await supabase.from('warehouse_items').insert([{ name: f.n, is_fabric: false, dept: f.d, unit: f.u, quantity: Number(f.q), min_quantity: 5 }]);
      }
      showMsg('Saqlandi! ✅'); load(true);
    } catch (e) { showMsg(e.message, 'err'); }
  };

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setM('fabric')} style={{ ...S.subTab, background: m === 'fabric' ? '#00e676' : '#12121e', color: m === 'fabric' ? '#000' : '#555' }}>Mato</button>
        <button onClick={() => setM('aks')} style={{ ...S.subTab, background: m === 'aks' ? '#00e676' : '#12121e', color: m === 'aks' ? '#000' : '#555' }}>Aksesuvar</button>
      </div>
      <form onSubmit={kirim} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={S.input} placeholder="Nomi" required onChange={e => setF({ ...f, n: e.target.value })} />
        {m === 'fabric' ? (
          <><input style={S.input} placeholder="Rang" required onChange={e => setF({ ...f, c: e.target.value })} /><input style={S.input} type="number" step="0.01" placeholder="Bruto kg" required onChange={e => setF({ ...f, b: e.target.value })} /></>
        ) : (
          <><select style={S.input} onChange={e => setF({ ...f, d: e.target.value })}>{OMBOR_CATEGORIES.map(c => <option key={c.id} value={c.dept}>{c.name}</option>)}</select><div style={{ display: 'flex', gap: 5 }}><input style={S.input} type="number" placeholder="Soni" required onChange={e => setF({ ...f, q: e.target.value })} /><input style={S.input} placeholder="Birlik" required onChange={e => setF({ ...f, u: e.target.value })} /></div></>
        )}
        <button type="submit" style={S.btnG}>QABUL QILISH</button>
      </form>
    </div>
  );
}

function OmborQoldiq({ user, data, showMsg, load }) {
  const [m, setM] = useState('fabric');
  const [q, setQ] = useState('');
  const [id, setId] = useState(null);
  const [t, setT] = useState('');

  const list = useMemo(() => {
    const src = m === 'fabric' ? data.whBatches : data.whItems.filter(i => !i.is_fabric);
    return src.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || (i.color?.toLowerCase().includes(q.toLowerCase())));
  }, [data, m, q]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
        <button onClick={() => setM('fabric')} style={{ ...S.subTab, background: m === 'fabric' ? '#40c4ff' : '#12121e', color: m === 'fabric' ? '#000' : '#555' }}>Mato</button>
        <button onClick={() => setM('aks')} style={{ ...S.subTab, background: m === 'aks' ? '#40c4ff' : '#12121e', color: m === 'aks' ? '#000' : '#555' }}>Aksesuvar</button>
      </div>
      <input style={{ ...S.input, marginBottom: 15 }} placeholder="Qidirish..." onChange={e => setQ(e.target.value)} />
      {list.map(i => (
        <div key={i.id} style={{ ...S.card, textAlign: 'left', marginBottom: 10, borderLeft: `4px solid ${m === 'fabric' ? (i.status === 'Tayyor' ? '#00e676' : i.status === 'Dam_olyapti' ? '#ff9800' : '#40c4ff') : '#1a1a2e'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div><b>{i.name}</b> {i.color && <div style={{ fontSize: 10, color: '#00e676' }}>{i.color}</div>}</div>
            <div style={{ textAlign: 'right' }}><b>{m === 'fabric' ? (i.status === 'Qabul_qilindi' ? i.bruto : i.neto.toFixed(1)) : i.quantity}</b> <small>{i.unit || 'kg'}</small></div>
          </div>
          {m === 'fabric' && (
            <div style={{ marginTop: 10 }}>
              {i.status === 'Qabul_qilindi' && <button onClick={() => setId(i.id)} style={S.smBtnB}>📥 Ko'rikka berish</button>}
              {i.status === 'Dam_olyapti' && <button onClick={async () => { await supabase.from('warehouse_batches').update({ status: 'Tayyor' }).eq('id', i.id); load(true); }} style={S.smBtnO}>⏰ Dam bitdimi?</button>}
              {i.status === 'Tayyor' && <div style={{ fontSize: 10, color: '#00e676', textAlign: 'center' }}>✅ Tayyor</div>}
              {id === i.id && <div style={{ display: 'flex', gap: 5, marginTop: 8 }}><input style={S.input} type="number" placeholder="Tara kg" onChange={e => setT(e.target.value)} /><button onClick={async () => { const n = i.bruto - Number(t); await supabase.from('warehouse_batches').update({ tara: Number(t), neto: n, status: 'Dam_olyapti' }).eq('id', i.id); setId(null); load(true); showMsg('OK!'); }} style={{ ...S.btnG, width: 60 }}>OK</button></div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OmborChiqim({ user, data, showMsg, load }) {
  const [m, setM] = useState('fabric');
  const list = m === 'fabric' ? data.whBatches.filter(b => b.status === 'Tayyor') : data.whItems.filter(i => !i.is_fabric);
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
        <button onClick={() => setM('fabric')} style={{ ...S.subTab, background: m === 'fabric' ? '#00e676' : '#12121e', color: m === 'fabric' ? '#000' : '#555' }}>Mato Chiqim</button>
        <button onClick={() => setM('aks')} style={{ ...S.subTab, background: m === 'aks' ? '#00e676' : '#12121e', color: m === 'aks' ? '#000' : '#555' }}>Aks. Chiqim</button>
      </div>
      {list.map(i => (
        <div key={i.id} style={{ ...S.card, marginBottom: 10, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div><b>{i.name}</b><br /><small style={{ color: '#666' }}>{i.color || i.dept}</small></div>
            <b style={{ fontSize: 18 }}>{m === 'fabric' ? i.neto.toFixed(1) : i.quantity}</b>
          </div>
          <button onClick={async () => {
            if (m === 'fabric') { if (confirm('Chiqim?')) { await supabase.from('warehouse_batches').delete().eq('id', i.id); await supabase.from('warehouse_log').insert([{ item_name: i.name, type: 'Bichuvga', quantity: i.neto, user: user.name }]); load(true); } }
            else { const q = prompt('Soni?'); if (q) { await supabase.from('warehouse_items').update({ quantity: i.quantity - Number(q) }).eq('id', i.id); await supabase.from('warehouse_log').insert([{ item_name: i.name, type: 'Aks. Chiqim', quantity: Number(q), user: user.name }]); load(true); } }
          }} style={{ ...S.btnG, width: '100%', background: '#ff9800', padding: 10 }}>CHIQIM 📤</button>
        </div>
      ))}
    </div>
  );
}

function AdminDashboard({ data }) { return <div style={S.card}>ADMIN DASHBOARD</div> }

const S = {
  root: { minHeight: '100vh', background: '#07070e', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13, fontFamily: '-apple-system, blinkmacsystemfont, sans-serif' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 350, padding: 30, background: '#12121e', borderRadius: 32, border: '1px solid #1a1a2e', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  title: { textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 15 },
  input: { width: '100%', padding: '14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btnG: { padding: '14px', background: '#00e676', color: '#000', border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #1a1a2e', background: '#0a0a14' },
  content: { flex: 1, padding: 15, paddingBottom: 100, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 24, padding: 16, border: '1px solid #1a1a2e', textAlign: 'center' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 10px', background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #1a1a2e', zIndex: 1000 },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', flex: 1 },
  ib: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  smBtnB: { width: '100%', padding: '10px', background: '#40c4ff', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 10, color: '#000' },
  smBtnO: { width: '100%', padding: '10px', background: '#ff9800', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 10, color: '#000' },
  subTab: { flex: 1, padding: '10px', borderRadius: 14, border: 'none', fontWeight: 'bold', fontSize: 11 },
  addForm: { display: 'flex', flexDirection: 'column', gap: 12 },
  toast: { position: 'fixed', top: 15, left: 15, right: 15, padding: 16, borderRadius: 18, zIndex: 10000, textAlign: 'center', fontWeight: 'bold', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  loaderBar: { position: 'fixed', top: 0, left: 0, height: 3, background: '#00e676', zIndex: 11000, width: '100%', animation: 'loading 2s infinite' }
};
