import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  Settings, Palette, Ruler, Scale, QrCode, Scan, X, Printer, Clock, Coffee, Search, Filter as FilterIcon,
  Download, Upload, ChevronRight, Maximize, RulerIcon, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255xwygwwnhnghqihuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "9.1 FORCE-UPDATE";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('qu');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ heads: [], history: [], models: [], whItems: [], whLog: [], whBatches: [] });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 3000); }, []);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [h, hi, md, wi, wl, wb, ver] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('models').select('*'),
        supabase.from('warehouse_items').select('*'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('warehouse_batches').select('*').order('arrival_date', { ascending: false }),
        supabase.from('system_config').select('*').eq('key', 'app_version').single()
      ]);

      if (ver.data && ver.data.value !== APP_VERSION) {
        setNeedsUpdate(true);
      } else {
        setNeedsUpdate(false);
      }

      setData({ heads: h.data || [], history: hi.data || [], models: md.data || [], whItems: wi.data || [], whLog: wl.data || [], whBatches: wb.data || [] });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const sub = supabase.channel('ombor-sync').on('postgres_changes', { event: '*', schema: 'public' }, () => load(true)).subscribe();
    return () => sub.unsubscribe();
  }, [load]);

  if (needsUpdate) return (
    <div style={{ ...S.root, justifyContent: 'center', alignItems: 'center', padding: 40, textAlign: 'center' }}>
      <Zap size={60} color="#00e676" style={{ marginBottom: 20 }} />
      <h1 style={{ fontSize: 22, fontWeight: 'bold' }}>YANGI VERSIYA CHIQDI!</h1>
      <p style={{ color: '#666', marginTop: 10, marginBottom: 30 }}>Dastur yanada tez va muammosiz ishlashi uchun iltimos keshni tozalab yangilang.</p>
      <button onClick={() => window.location.reload(true)} style={{ ...S.btnG, width: '100%' }}>HOZIR YANGILASH 🚀</button>
      <div style={{ fontSize: 10, color: '#333', marginTop: 20 }}>Joriy versiya: {APP_VERSION}</div>
    </div>
  );

  if (!user) return <Login data={data} setUser={setUser} setTab={setTab} showMsg={showMsg} />;

  const isOmbor = user.role === 'dept' && user.deptId === 'ombor';

  return (
    <div style={S.root}>
      <AnimatePresence>
        {msg && (<motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676' }}>{msg.t}</motion.div>)}
        {loading && <div style={S.loadingBar} />}
      </AnimatePresence>

      <header style={S.header}>
        <div><div style={{ fontSize: 16, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 9, color: '#00e676' }}>⚡ {APP_VERSION} PRO</div></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => load()} style={S.ib}><RefreshCcw size={18} className={loading ? 'spin' : ''} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={S.content}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
            {isOmbor ? <OmborManager tab={tab} user={user} data={data} showMsg={showMsg} load={load} /> : <AdminPanels tab={tab} data={data} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav style={S.nav}>
        {(isOmbor ? [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Radar' },
          { id: 'kirim', icon: Download, l: 'Kirim' },
          { id: 'ombor', icon: Package, l: 'Stock' },
          { id: 'chiqim', icon: Upload, l: 'Chiqim' }
        ] : [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' },
          { id: 'heads', icon: Users, l: 'Xodim' },
          { id: 'history', icon: HistoryIcon, l: 'Log' }
        ]).map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}>
            <x.icon size={22} /><span style={{ fontSize: 9 }}>{x.l}</span>
          </button>
        ))}
      </nav>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes loading { 0% { left: -100%; } 100% { left: 100%; } }
      `}</style>
    </div>
  );
}

function Login({ data, setUser, setTab, showMsg }) {
  const [auth, setAuth] = useState({ login: '', password: '' });
  return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={S.loginBox}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}><Warehouse color="#00e676" size={50} style={{ margin: '0 auto' }} /></div>
        <h2 style={{ ...S.title, fontSize: 24, marginBottom: 5 }}>QTTuz App</h2>
        <p style={{ textAlign: 'center', color: '#444', fontSize: 10, marginBottom: 30 }}>Avtomatlashtirilgan ishlab chiqarish</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (auth.login === '0068' && auth.password === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); return; }
          if (auth.login === '1234' && auth.password === '1234') { setUser({ role: 'dept', deptId: 'ombor', name: 'Omborchi' }); return; }
          const h = data.heads.find(x => x.login === auth.login && x.password === auth.password);
          if (h) { setUser({ role: 'dept', ...h }); setTab('dashboard'); } else showMsg('Login/Parol xato', 'err');
        }} style={S.form}>
          <input style={S.input} placeholder="Login" required onChange={e => setAuth({ ...auth, login: e.target.value })} />
          <input style={S.input} type="password" placeholder="Parol" required onChange={e => setAuth({ ...auth, password: e.target.value })} />
          <button type="submit" style={S.btnG}>KIRISH</button>
        </form>
      </motion.div>
    </div>
  );
}

function OmborManager({ tab, user, data, showMsg, load }) {
  const [m, setM] = useState('fabric');
  const [f, setF] = useState({ n: '', c: '', b: '', en: '', gr: '', q: '0', u: 'dona', d: 'tikuv' });
  const [q, setQ] = useState('');
  const [id, setId] = useState(null);
  const [t, setT] = useState('');

  if (tab === 'dashboard') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={S.card}><ScrollText color="#ff9800" /><div style={{ fontSize: 24, fontWeight: 'bold' }}>{data.whBatches.length}</div><small style={{ color: '#666' }}>Matolar</small></div>
      <div style={S.card}><Package color="#00e676" /><div style={{ fontSize: 24, fontWeight: 'bold' }}>{data.whItems.length}</div><small style={{ color: '#666' }}>Aksessuar</small></div>
      <div style={{ ...S.card, gridColumn: 'span 2', textAlign: 'left' }}>
        <div style={{ fontWeight: 'bold', fontSize: 11, color: '#00e676', marginBottom: 12 }}>OMBOR TARIXI</div>
        {data.whLog.slice(0, 5).map(l => (
          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
            <span>{l.item_name}<br /><small style={{ color: '#444' }}>{l.type}</small></span>
            <b>{l.quantity}</b>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'kirim') return (
    <div style={S.card}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <button onClick={() => setM('fabric')} style={{ ...S.subTab, background: m === 'fabric' ? '#00e676' : '#12121e', color: m === 'fabric' ? '#000' : '#666' }}>Mato (Bruto)</button>
        <button onClick={() => setM('aks')} style={{ ...S.subTab, background: m === 'aks' ? '#00e676' : '#12121e', color: m === 'aks' ? '#000' : '#666' }}>Aksessuar</button>
      </div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          if (m === 'fabric') await supabase.from('warehouse_batches').insert([{ name: f.n, color: f.c, bruto: Number(f.b), en: f.en, gramaj: f.gr, status: 'Qabul_qilindi', user: user.name }]);
          else await supabase.from('warehouse_items').insert([{ name: f.n, dept: f.d, quantity: Number(f.q), unit: f.u, is_fabric: false }]);
          showMsg('Saqlandi! ✅'); load(true); setF({ n: '', c: '', b: '', en: '', gr: '', q: '0', u: 'dona', d: 'tikuv' });
        } catch (err) { showMsg(err.message, 'err'); }
      }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={S.input} placeholder="Nomi" required value={f.n} onChange={e => setF({ ...f, n: e.target.value })} />
        {m === 'fabric' ? (
          <>
            <input style={S.input} placeholder="Rangi" required value={f.c} onChange={e => setF({ ...f, c: e.target.value })} />
            <input style={S.input} type="number" step="0.01" placeholder="Bruto (kg)" required value={f.b} onChange={e => setF({ ...f, b: e.target.value })} />
            <div style={{ display: 'flex', gap: 8 }}><input style={S.input} placeholder="Eni (sm)" value={f.en} onChange={e => setF({ ...f, en: e.target.value })} /><input style={S.input} placeholder="Gramaj" value={f.gr} onChange={e => setF({ ...f, gr: e.target.value })} /></div>
          </>
        ) : (
          <>
            <input style={S.input} type="number" placeholder="Soni" required value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
            <input style={S.input} placeholder="Birlik" required value={f.u} onChange={e => setF({ ...f, u: e.target.value })} />
          </>
        )}
        <button type="submit" style={S.btnG}>TASDIQLASH</button>
      </form>
    </div>
  );

  if (tab === 'ombor') {
    const list = m === 'fabric' ? data.whBatches : data.whItems.filter(i => !i.is_fabric);
    const filtered = list.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || i.color?.toLowerCase().includes(q.toLowerCase()));
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
          <button onClick={() => setM('fabric')} style={{ ...S.subTab, background: m === 'fabric' ? '#40c4ff' : '#12121e', color: m === 'fabric' ? '#000' : '#666' }}>Mato</button>
          <button onClick={() => setM('aks')} style={{ ...S.subTab, background: m === 'aks' ? '#40c4ff' : '#12121e', color: m === 'aks' ? '#000' : '#666' }}>Aks.</button>
        </div>
        <input style={{ ...S.input, marginBottom: 15 }} placeholder="Qidirish..." onChange={e => setQ(e.target.value)} />
        {filtered.map(i => (
          <div key={i.id} style={{ ...S.card, textAlign: 'left', marginBottom: 10, borderLeft: `5px solid ${m === 'fabric' ? (i.status === 'Tayyor' ? '#00e676' : i.status === 'Dam_olyapti' ? '#ffb300' : '#40c4ff') : '#1a1a2e'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><b>{i.name}</b> {i.color && <div style={{ fontSize: 10, color: '#00e676' }}>{i.color} / {i.en}sm</div>}</div>
              <div style={{ textAlign: 'right' }}><b>{m === 'fabric' ? (i.status === 'Qabul_qilindi' ? i.bruto : i.neto.toFixed(1)) : i.quantity}</b> <small>{i.unit || 'kg'}</small></div>
            </div>
            {m === 'fabric' && (
              <div style={{ marginTop: 10 }}>
                {i.status === 'Qabul_qilindi' && <button onClick={() => setId(i.id)} style={{ ...S.btnG, padding: 8, background: '#40c4ff', width: '100%', fontSize: 10 }}>KO'RIKKA BERISH</button>}
                {i.status === 'Dam_olyapti' && <button onClick={async () => { await supabase.from('warehouse_batches').update({ status: 'Tayyor' }).eq('id', i.id); load(true); }} style={{ ...S.btnG, padding: 8, background: '#ff9800', width: '100%', fontSize: 10 }}>DAM BITDIMI?</button>}
                {i.status === 'Tayyor' && <div style={{ textAlign: 'center', color: '#00e676', border: '1px solid', padding: 5, borderRadius: 8, fontSize: 10 }}>TAYYOR ✅</div>}
              </div>
            )}
            {id === i.id && (
              <div style={{ display: 'flex', gap: 5, marginTop: 10 }}><input style={S.input} type="number" placeholder="Ftulka kg" onChange={e => setT(e.target.value)} /><button onClick={async () => { const n = i.bruto - Number(t); await supabase.from('warehouse_batches').update({ tara: Number(t), neto: n, status: 'Dam_olyapti' }).eq('id', i.id); setId(null); load(true); }} style={S.btnG}>OK</button></div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'chiqim') {
    const list = m === 'fabric' ? data.whBatches.filter(b => b.status === 'Tayyor') : data.whItems.filter(i => !i.is_fabric);
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setM('fabric')} style={{ ...S.subTab, background: m === 'fabric' ? '#ff4444' : '#12121e', color: '#fff' }}>Mato Chiqim</button>
          <button onClick={() => setM('aks')} style={{ ...S.subTab, background: m === 'aks' ? '#ff4444' : '#12121e', color: '#fff' }}>Aks. Chiqim</button>
        </div>
        {list.map(i => (
          <div key={i.id} style={{ ...S.card, textAlign: 'left', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div><b>{i.name}</b> {i.color && <div style={{ fontSize: 10, color: '#ff4444' }}>{i.color} / Eni: {i.en}</div>}</div>
              <div style={{ textAlign: 'right' }}><b>{m === 'fabric' ? i.neto.toFixed(1) : i.quantity}</b></div>
            </div>
            <button onClick={async () => {
              if (m === 'fabric') { if (confirm('Chiqim?')) { await supabase.from('warehouse_batches').delete().eq('id', i.id); await supabase.from('warehouse_log').insert([{ item_name: i.n, type: 'Mato chiqim', quantity: i.neto, user: user.name, note: i.color }]); load(true); } }
              else { const q = prompt('Soni?'); if (q) { await supabase.from('warehouse_items').update({ quantity: i.quantity - Number(q) }).eq('id', i.id); load(true); } }
            }} style={{ ...S.btnG, width: '100%', background: '#ff4444', color: '#fff' }}>CHIQIM 📤</button>
          </div>
        ))}
      </div>
    );
  }
}

function AdminPanels({ tab, data }) { return <div style={S.card}>Xulosa: {data.whBatches.length} ta mato bor.</div> }

const S = {
  root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13, fontFamily: '-apple-system, system-ui, sans-serif' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 360, padding: 35, background: '#12121e', borderRadius: 32, border: '1px solid #1a1a2e' },
  title: { textAlign: 'center', fontSize: 32, fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { width: '100%', padding: '15px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btnG: { padding: '15px', background: '#00e676', color: '#000', border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1a1a2e', background: '#0a0a14' },
  content: { flex: 1, padding: 15, paddingBottom: 100, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 26, padding: 18, border: '1px solid #1a1a2e', textAlign: 'center' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '14px 10px', background: 'rgba(10,10,20,0.95)', borderTop: '1px solid #1a1a2e', zIndex: 1000 },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', flex: 1 },
  ib: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  subTab: { flex: 1, padding: '12px', border: 'none', borderRadius: 14, fontWeight: 'bold', fontSize: 11 },
  toast: { position: 'fixed', top: 15, left: 15, right: 15, padding: 16, borderRadius: 18, zIndex: 10000, textAlign: 'center', fontWeight: 'bold' },
  loadingBar: { position: 'fixed', top: 0, left: 0, height: 3, background: '#00e676', zIndex: 11000, overflow: 'hidden', width: '100%' }
};
