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
const APP_VERSION = "8.0 OMBOR PRO";

const DEPARTMENTS = [
  { id: 'ombor', name: 'Ombor Bo\'limi', icon: Warehouse, actions: ['Kirim', 'Chiqim'], step: 0.2 },
  { id: 'matolar', name: 'Matolar Bo\'limi', icon: ScrollText, actions: ['Kirim', 'Chiqim'], step: 0.5 },
  { id: 'bichuv', name: 'Bichuv Bo\'limi', icon: Scissors, actions: ['Bichildi'], step: 1 },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', icon: Truck, actions: ['Ishga berildi', 'Kraskaga yuborildi', 'Vishivkaga yuborildi', 'Pressga yuborildi', 'Natija qaytdi'], step: 2 },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', icon: Activity, actions: ['Tikuv bitdi'], step: 3 },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', icon: Box, actions: ['Upakovka bitdi', 'Tayyorga topshirildi'], step: 4 },
  { id: 'tayyor', name: 'Tayyor mahsulot', icon: CheckCircle2, actions: ['Qabul qilindi'], step: 5 },
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
  const [data, setData] = useState({ heads: [], history: [], attendance: [], models: [], whItems: [], whLog: [], whOrders: [], whBatches: [] });
  const [msg, setMsg] = useState(null);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 4000); }, []);

  const load = useCallback(async () => {
    try {
      const [h, hi, att, md, wi, wl, wo, wb] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('attendance').select('*'),
        supabase.from('models').select('*'),
        supabase.from('warehouse_items').select('*'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(40),
        supabase.from('warehouse_orders').select('*'),
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

  if (!user) return <Login data={data} setUser={setUser} setTab={setTab} showMsg={showMsg} />;

  const isOmbor = user.role === 'dept' && user.deptId === 'ombor';

  return (
    <div style={S.root}>
      <AnimatePresence>{msg && (<motion.div initial={{ y: -80 }} animate={{ y: 0 }} exit={{ y: -80 }} style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676' }}>{msg.t}</motion.div>)}</AnimatePresence>
      <header style={S.header}>
        <div><div style={{ fontSize: 16, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 10, color: '#00e676' }}>{APP_VERSION} PRO</div></div>
        <div style={{ display: 'flex', gap: 10 }}><button onClick={load} style={S.ib}><RefreshCcw size={16} /></button><button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={16} /></button></div>
      </header>

      <main style={S.content}>
        {user.role === 'admin' && tab === 'dashboard' && <AdminDashboard data={data} />}
        {isOmbor && tab === 'dashboard' && <OmborXulosa data={data} />}
        {isOmbor && tab === 'kirim' && <OmborKirim user={user} data={data} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'ombor' && <OmborQoldiq user={user} data={data} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'chiqim' && <OmborChiqim user={user} data={data} showMsg={showMsg} load={load} />}
      </main>

      <nav style={S.nav}>
        {isOmbor ? [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' },
          { id: 'kirim', icon: Download, l: 'Kirim' },
          { id: 'ombor', icon: Package, l: 'Ombor' },
          { id: 'chiqim', icon: Upload, l: 'Chiqim' }
        ].map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={20} /><span style={{ fontSize: 9 }}>{x.l}</span></button>
        )) : [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' },
          { id: 'heads', icon: Users, l: 'Xodimlar' },
          { id: 'history', icon: HistoryIcon, l: 'Arxiv' }
        ].map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={20} /><span style={{ fontSize: 9 }}>{x.l}</span></button>
        ))}
      </nav>
    </div>
  );
}

function Login({ data, setUser, setTab, showMsg }) {
  const [auth, setAuth] = useState({ login: '', password: '' });
  return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={S.loginBox}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}><Warehouse color="#00e676" size={48} /></div>
        <h1 style={S.title}>QTTuz PRO</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (auth.login === '123' && auth.password === '123') { setUser({ role: 'admin', name: 'Rahbar' }); setTab('dashboard'); return; }
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

function OmborXulosa({ data }) {
  const low = data.whItems.filter(i => i.quantity <= i.min_quantity);
  const resting = data.whBatches.filter(b => b.status === 'Dam_olyapti');
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={S.card}><ScrollText size={20} color="#ff9800" /><div style={{ fontSize: 20, fontWeight: 'bold' }}>{data.whBatches.length}</div><div style={{ fontSize: 10, color: '#555' }}>Mato Partiyalari</div></div>
        <div style={S.card}><Clock size={20} color="#40c4ff" /><div style={{ fontSize: 20, fontWeight: 'bold' }}>{resting.length}</div><div style={{ fontSize: 10, color: '#555' }}>Dam olayotgan</div></div>
        <div style={S.card}><Package size={20} color="#00e676" /><div style={{ fontSize: 20, fontWeight: 'bold' }}>{data.whItems.length}</div><div style={{ fontSize: 10, color: '#555' }}>Aksessuarlar</div></div>
        <div style={{ ...S.card, border: low.length ? '1px solid #ff3b30' : 'none' }}><AlertTriangle size={20} color="#ff3b30" /><div style={{ fontSize: 20, fontWeight: 'bold' }}>{low.length}</div><div style={{ fontSize: 10, color: '#555' }}>Tugayotganlar</div></div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 'bold', fontSize: 12, color: '#00e676', textAlign: 'left', marginBottom: 12 }}>SO'NGGI AMALLAR</div>
        {data.whLog.slice(0, 8).map(l => (
          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
            <span style={{ textAlign: 'left' }}>{l.item_name}<br /><small style={{ color: '#444' }}>{l.type}</small></span>
            <b style={{ color: l.type.includes('Kirim') ? '#00e676' : '#ff9800' }}>{l.quantity}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function OmborKirim({ user, data, showMsg, load }) {
  const [mode, setMode] = useState('fabric');
  const [f, setF] = useState({ name: '', color: '', bruto: '', dept: 'bichuv', unit: 'dona', quantity: '0' });

  const kirim = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'fabric') {
        await supabase.from('warehouse_batches').insert([{ name: f.name, color: f.color, bruto: Number(f.bruto), status: 'Qabul_qilindi', user: user.name }]);
        await supabase.from('warehouse_log').insert([{ item_name: f.name, type: 'Mato Kirim (Bruto)', quantity: Number(f.bruto), note: f.color, user: user.name }]);
      } else {
        await supabase.from('warehouse_items').insert([{ name: f.name, is_fabric: false, dept: f.dept, unit: f.unit, quantity: Number(f.quantity), min_quantity: 5 }]);
        await supabase.from('warehouse_log').insert([{
          item_name: f.name, type: 'Aks'esuvar Kirim', quantity: Number(f.quantity), user: user.name }]);
      }
      showMsg('Muvaffaqiyatli qabul qilindi! ✅'); load();
      } catch (e) { showMsg(e.message, 'err'); }
    };

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={() => setMode('fabric')} style={{ ...S.subTab, background: mode === 'fabric' ? '#00e676' : '#12121e', color: mode === 'fabric' ? '#000' : '#888' }}>Mato Qabuli</button>
          <button onClick={() => setMode('aks')} style={{ ...S.subTab, background: mode === 'aks' ? '#00e676' : '#12121e', color: mode === 'aks' ? '#000' : '#888' }}>Aksessuar Qabuli</button>
        </div>
        <form onSubmit={kirim} style={S.addForm}>
          <input style={S.input} placeholder={mode === 'fabric' ? 'Mato nomi (masalan: Ikkilik)' : 'Nomi (masalan: Tugma)'} required onChange={e => setF({ ...f, name: e.target.value })} />
          {mode === 'fabric' ? (
            <>
              <input style={S.input} placeholder="Rangi" required onChange={e => setF({ ...f, color: e.target.value })} />
              <input style={S.input} type="number" step="0.01" placeholder="Bruto og'irligi (kg)" required onChange={e => setF({ ...f, bruto: e.target.value })} />
            </>
          ) : (
            <>
              <select style={S.input} onChange={e => setF({ ...f, dept: e.target.value })}>{OMBOR_CATEGORIES.map(c => <option key={c.id} value={c.dept}>{c.name}</option>)}</select>
              <div style={{ display: 'flex', gap: 5 }}><input style={S.input} placeholder="Soni" required onChange={e => setF({ ...f, quantity: e.target.value })} /><input style={S.input} placeholder="Birlik" required onChange={e => setF({ ...f, unit: e.target.value })} /></div>
            </>
          )}
          <button type="submit" style={S.btnG}>BAZAGA QO'SHISH</button>
        </form>
      </motion.div>
    );
  }

  function OmborQoldiq({ user, data, showMsg, load }) {
    const [mode, setMode] = useState('fabric');
    const [q, setQ] = useState('');
    const [actionId, setActionId] = useState(null);
    const [tara, setTara] = useState('');

    const list = useMemo(() => {
      if (mode === 'fabric') return data.whBatches.filter(b => b.name.toLowerCase().includes(q.toLowerCase()) || b.color.toLowerCase().includes(q.toLowerCase()));
      return data.whItems.filter(i => !i.is_fabric && i.name.toLowerCase().includes(q.toLowerCase()));
    }, [data, mode, q]);

    const damBerish = async (b) => {
      if (!tara) return;
      const neto = b.bruto - Number(tara);
      await supabase.from('warehouse_batches').update({ tara: Number(tara), neto: neto, status: 'Dam_olyapti' }).eq('id', b.id);
      await supabase.from('warehouse_log').insert([{ item_name: b.name, type: 'Ko\'rik/Dam', quantity: neto, note: `N:${neto}`, user: user.name }]);
      setActionId(null); setTara(''); load(); showMsg('Neto hisoblandi!');
    };

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <button onClick={() => setMode('fabric')} style={{ ...S.subTab, background: mode === 'fabric' ? '#40c4ff' : '#12121e', color: mode === 'fabric' ? '#000' : '#888' }}>Matolar</button>
          <button onClick={() => setMode('aks')} style={{ ...S.subTab, background: mode === 'aks' ? '#40c4ff' : '#12121e', color: mode === 'aks' ? '#000' : '#888' }}>Aksessuarlar</button>
        </div>
        <div style={{ position: 'relative', marginBottom: 15 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#444' }} />
          <input style={{ ...S.input, paddingLeft: 40 }} placeholder="Qidiruv..." onChange={e => setQ(e.target.value)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(i => (
            <div key={i.id} style={{ ...S.card, textAlign: 'left', borderLeft: `4px solid ${mode === 'fabric' ? (i.status === 'Tayyor' ? '#00e676' : i.status === 'Dam_olyapti' ? '#ff9800' : '#40c4ff') : '#1a1a2e'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div><b>{i.name}</b> {i.color && <div style={{ fontSize: 11, color: '#00e676' }}>{i.color}</div>}</div>
                <div style={{ textAlign: 'right' }}><b>{mode === 'fabric' ? (i.status === 'Qabul_qilindi' ? i.bruto : i.neto.toFixed(1)) : i.quantity}</b> <small>{i.unit || 'kg'}</small></div>
              </div>
              {mode === 'fabric' && (
                <div style={{ marginTop: 10 }}>
                  {i.status === 'Qabul_qilindi' && <button onClick={() => setActionId(i.id)} style={{ ...S.smBtn, background: '#40c4ff' }}>📥 Ko'rikka berish (Neto)</button>}
                  {i.status === 'Dam_olyapti' && <button onClick={async () => { await supabase.from('warehouse_batches').update({ status: 'Tayyor' }).eq('id', i.id); load(); }} style={{ ...S.smBtn, background: '#ff9800' }}>⏰ Dam olib bo'ldimi?</button>}
                  {i.status === 'Tayyor' && <div style={{ fontSize: 10, color: '#00e676' }}>✅ Tayyor (Chiqim panelidan bering)</div>}
                </div>
              )}
              {actionId === i.id && (
                <div style={{ display: 'flex', gap: 5, marginTop: 10 }}><input style={S.input} type="number" placeholder="Ftulka og'irligi" onChange={e => setTara(e.target.value)} /><button onClick={() => damBerish(i)} style={S.btnG}>OK</button></div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  function OmborChiqim({ user, data, showMsg, load }) {
    const [mode, setMode] = useState('fabric');
    const [q, setQ] = useState('');

    const list = useMemo(() => {
      if (mode === 'fabric') return data.whBatches.filter(b => b.status === 'Tayyor' && (b.name.toLowerCase().includes(q.toLowerCase())));
      return data.whItems.filter(i => !i.is_fabric && i.name.toLowerCase().includes(q.toLowerCase()));
    }, [data, mode, q]);

    const chiqim = async (item) => {
      if (mode === 'fabric') {
        if (!confirm('Bichuvga berilsinmi?')) return;
        await supabase.from('warehouse_batches').delete().eq('id', item.id);
        await supabase.from('warehouse_log').insert([{ item_name: item.name, type: 'Bichuvga Chiqim', quantity: item.neto, note: item.color, user: user.name }]);
      } else {
        const q = prompt('Chiqim miqdorini yozing:');
        if (!q) return;
        if (item.quantity < Number(q)) { showMsg('Yetarli emas!', 'err'); return; }
        await supabase.from('warehouse_items').update({ quantity: item.quantity - Number(q) }).eq('id', item.id);
        await supabase.from('warehouse_log').insert([{ item_name: item.name, type: 'Aks. Chiqim', quantity: Number(q), user: user.name }]);
      }
      load(); showMsg('Muvaffaqiyatli chiqim! 🚀');
    };

    return (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <button onClick={() => setMode('fabric')} style={{ ...S.subTab, background: mode === 'fabric' ? '#00e676' : '#12121e', color: mode === 'fabric' ? '#000' : '#888' }}>Mato Chiqimi</button>
          <button onClick={() => setMode('aks')} style={{ ...S.subTab, background: mode === 'aks' ? '#00e676' : '#12121e', color: mode === 'aks' ? '#000' : '#888' }}>Aks. Chiqimi</button>
        </div>
        <div style={{ textAlign: 'left', padding: 10, background: '#1a1a2e', borderRadius: 10, marginBottom: 15, fontSize: 10, color: '#888' }}>DIQQAT: Matolarni faqat "Tayyor" holiga kelgandan keyin shu yerdan chiqarishingiz mumkin.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(i => (
            <div key={i.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ textAlign: 'left' }}><b>{i.name}</b><br /><small style={{ color: '#888' }}>{i.color || i.dept}</small></div>
                <b style={{ fontSize: 18 }}>{mode === 'fabric' ? i.neto.toFixed(1) : i.quantity}</b>
              </div>
              <button onClick={() => chiqim(i)} style={{ ...S.btnG, width: '100%', padding: 10, background: '#ff9800' }}>CHIQIM QILISH 📤</button>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  function AdminDashboard({ data }) { return <div style={S.card}>Rahbar Dashboard</div> }
  function Heads() { return null; }

  const S = {
    root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13, fontFamily: '-apple-system, system-ui, sans-serif' },
    loginBox: { margin: 'auto', width: '100%', maxWidth: 360, padding: 30, background: '#12121e', borderRadius: 28, border: '1px solid #1a1a2e' },
    title: { textAlign: 'center', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    form: { display: 'flex', flexDirection: 'column', gap: 15 },
    input: { width: '100%', padding: '14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 14, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    btnG: { padding: '14px', background: '#00e676', color: '#000', border: 'none', borderRadius: 14, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
    header: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #1a1a2e' },
    content: { flex: 1, padding: 15, paddingBottom: 100, overflowY: 'auto' },
    card: { background: '#12121e', borderRadius: 20, padding: 15, border: '1px solid #1a1a2e', textAlign: 'center' },
    nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 10px', background: 'rgba(10,10,20,0.95)', borderTop: '1px solid #1a1a2e', zIndex: 1000 },
    nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', flex: 1 },
    ib: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
    smBtn: { width: '100%', padding: '10px', border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 'bold', cursor: 'pointer', color: '#000' },
    subTab: { flex: 1, padding: '10px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' },
    addForm: { background: '#12121e', padding: 20, borderRadius: 22, border: '1px solid #00e676', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 },
    toast: { position: 'fixed', top: 15, left: 15, right: 15, padding: 16, borderRadius: 16, zIndex: 10000, textAlign: 'center', fontWeight: 'bold', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }
  };
