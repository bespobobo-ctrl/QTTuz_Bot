import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  Settings, Palette, Ruler, Scale, QrCode, Scan, X, Printer, Clock, Coffee, Search, Filter as FilterIcon,
  Download, Upload, ChevronRight, Maximize, RulerIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255xwygwwnhnghqihuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "9.0 WAREHOUSE-MAX";

const DEPARTMENTS = [
  { id: 'ombor', name: 'Ombor Bo\'limi', actions: ['Kirim', 'Chiqim'] },
  { id: 'matolar', name: 'Matolar Bo\'limi', actions: ['Kirim', 'Chiqim'] },
  { id: 'bichuv', name: 'Bichuv Bo\'limi', actions: ['Bichildi'] },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', actions: ['Ishga berildi'] },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', actions: ['Tikuv bitdi'] },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', actions: ['Upakovka bitdi'] },
  { id: 'tayyor', name: 'Tayyor mahsulot', actions: ['Qabul qilindi'] },
];

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

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 3000); }, []);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [h, hi, md, wi, wl, wb] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('models').select('*'),
        supabase.from('warehouse_items').select('*').order('name'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('warehouse_batches').select('*').order('arrival_date', { ascending: false })
      ]);
      setData({ heads: h.data || [], history: hi.data || [], models: md.data || [], whItems: wi.data || [], whLog: wl.data || [], whBatches: wb.data || [] });
    } catch (e) { showMsg(e.message, 'err'); }
    finally { setLoading(false); }
  }, [showMsg]);

  useEffect(() => {
    load();
    const sub = supabase.channel('ombor-sync').on('postgres_changes', { event: '*', schema: 'public' }, () => load(true)).subscribe();
    return () => sub.unsubscribe();
  }, [load]);

  useEffect(() => { if (user) localStorage.setItem('qu', JSON.stringify(user)); else localStorage.removeItem('qu'); }, [user]);

  if (!user) return <Login data={data} setUser={setUser} setTab={setTab} showMsg={showMsg} />;

  const isOmbor = user.role === 'dept' && user.deptId === 'ombor';

  return (
    <div style={S.root}>
      <AnimatePresence>
        {msg && (<motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676' }}>{msg.t}</motion.div>)}
        {loading && <div style={S.loadingBar} />}
      </AnimatePresence>

      <header style={S.header}>
        <div><div style={{ fontSize: 16, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 9, color: '#00e676' }}>{APP_VERSION} PRO</div></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => load()} style={S.ib}><RefreshCcw size={18} className={loading ? 'spin' : ''} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={S.content}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {isOmbor ? <OmborManager tab={tab} user={user} data={data} showMsg={showMsg} load={load} /> : <div style={S.card}>Boshqa bo'lim/Admin paneli...</div>}
            {user.role === 'admin' && tab === 'heads' && <div style={S.card}>Xodimlar paneli...</div>}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav style={S.nav}>
        {(isOmbor ? [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Stat' },
          { id: 'kirim', icon: Download, l: 'Kirim' },
          { id: 'ombor', icon: Package, l: 'Qoldiq' },
          { id: 'chiqim', icon: Upload, l: 'Chiqim' }
        ] : [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' },
          { id: 'heads', icon: Users, l: 'Xodim' },
          { id: 'history', icon: HistoryIcon, l: 'Arxiv' }
        ]).map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}>
            <x.icon size={22} /><span style={{ fontSize: 9 }}>{x.l}</span>
          </button>
        ))}
      </nav>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .spin-slow { animation: spin 3s linear infinite; }
      `}</style>
    </div>
  );
}

function Login({ data, setUser, setTab, showMsg }) {
  const [auth, setAuth] = useState({ login: '', password: '' });
  return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={S.loginBox}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}><Warehouse color="#00e676" size={50} style={{ margin: '0 auto' }} /></div>
        <h1 style={{ ...S.title, fontSize: 26 }}>QTTuz OMOBOR</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (auth.login === '0068' && auth.password === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); setTab('dashboard'); return; }
          if (auth.login === '1234' && auth.password === '1234') { setUser({ role: 'dept', deptId: 'ombor', name: 'Omborchi' }); setTab('dashboard'); return; }
          const h = data.heads.find(x => x.login === auth.login && x.password === auth.password);
          if (h) { setUser({ role: 'dept', ...h }); setTab('dashboard'); } else showMsg('Xato!', 'err');
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
  const [mode, setMode] = useState('fabric');
  const [f, setF] = useState({ n: '', c: '', b: '', en: '', gr: '', q: '0', u: 'dona', d: 'tikuv' });
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [tara, setTara] = useState('');
  const [showQR, setShowQR] = useState(null);

  // QR SKANER FUNKSIYASI (TELEGRAM VA APP SDK)
  const scanQR = () => {
    if (window.Telegram?.WebApp?.showScanQrPopup) {
      window.Telegram.WebApp.showScanQrPopup({ text: "Mahsulot QR kodini skanerlang" }, (text) => {
        setQ(text);
        window.Telegram.WebApp.closeScanQrPopup();
        return true;
      });
    } else {
      showMsg('Skaner faqat Telegram Mini App ichida ishlaydi', 'err');
    }
  };

  if (tab === 'dashboard') {
    const lowItems = data.whItems.filter(i => i.quantity <= 5).length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={S.card}><ScrollText color="#ff9800" /><div style={{ fontSize: 24, fontWeight: 'bold' }}>{data.whBatches.length}</div><small style={{ color: '#666' }}>Matolar</small></div>
          <div style={S.card}><Package color="#00e676" /><div style={{ fontSize: 24, fontWeight: 'bold' }}>{data.whItems.length}</div><small style={{ color: '#666' }}>Aksessuarlar</small></div>
        </div>
        {lowItems > 0 && <div style={{ ...S.card, borderColor: '#ff4444', background: 'rgba(255,68,68,0.05)' }}><AlertTriangle color="#ff4444" style={{ margin: '0 auto 5px' }} /><div style={{ color: '#ff4444', fontWeight: 'bold' }}>{lowItems} ta mahsulot tugayapti!</div></div>}
        <div style={S.card}><div style={{ textAlign: 'left', fontWeight: 'bold', fontSize: 11, color: '#00e676', marginBottom: 12 }}>OMBOR TARIXI</div>
          {data.whLog.slice(0, 8).map(l => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
              <span style={{ textAlign: 'left' }}>{l.item_name}<br /><small style={{ color: '#444' }}>{l.type} - {l.user}</small></span>
              <b style={{ color: l.type.includes('Kirim') ? '#00e676' : '#ff9800' }}>{l.quantity}</b>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'kirim') return (
    <div style={S.card}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <button onClick={() => setMode('fabric')} style={{ ...S.subTab, background: mode === 'fabric' ? '#00e676' : '#12121e', color: mode === 'fabric' ? '#000' : '#666' }}>Mato (Bruto)</button>
        <button onClick={() => setMode('aks')} style={{ ...S.subTab, background: mode === 'aks' ? '#00e676' : '#12121e', color: mode === 'aks' ? '#000' : '#666' }}>Aksessuar</button>
      </div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (mode === 'fabric') await supabase.from('warehouse_batches').insert([{ name: f.n, color: f.c, bruto: Number(f.b), en: f.en, gramaj: f.gr, status: 'Qabul_qilindi', user: user.name }]);
        else await supabase.from('warehouse_items').insert([{ name: f.n, dept: f.d, quantity: Number(f.q), unit: f.u, is_fabric: false }]);
        showMsg('Dasturga qo\'shildi! ✅'); load(true); setF({ n: '', c: '', b: '', en: '', gr: '', q: '0', u: 'dona', d: 'tikuv' });
      }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={S.input} placeholder="Mahsulot nomi" required value={f.n} onChange={e => setF({ ...f, n: e.target.value })} />
        {mode === 'fabric' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input style={{ ...S.input, gridColumn: 'span 2' }} placeholder="Rangi" required value={f.c} onChange={e => setF({ ...f, c: e.target.value })} />
            <input style={S.input} type="number" step="0.01" placeholder="Bruto (kg)" required value={f.b} onChange={e => setF({ ...f, b: e.target.value })} />
            <input style={S.input} placeholder="Gramaj" value={f.gr} onChange={e => setF({ ...f, gr: e.target.value })} />
            <input style={{ ...S.input, gridColumn: 'span 2' }} placeholder="Mato eni (sm/m)" value={f.en} onChange={e => setF({ ...f, en: e.target.value })} />
          </div>
        ) : (
          <>
            <select style={S.input} onChange={e => setF({ ...f, d: e.target.value })}><option value="tikuv">Tikuv uchun</option><option value="bichuv">Bichuv uchun</option><option value="upakovka">Upakovka uchun</option></>
            <div style={{ display: 'flex', gap: 8 }}><input style={S.input} type="number" placeholder="Soni" required value={f.q} onChange={e => setF({ ...f, q: e.target.value })} /><input style={S.input} placeholder="Birlik" required value={f.u} onChange={e => setF({ ...f, u: e.target.value })} /></div>
          </>
        )}
        <button type="submit" style={S.btnG}>SAQLASH</button>
      </form>
    </div>
  );

  if (tab === 'ombor') {
    const list = mode === 'fabric' ? data.whBatches : data.whItems.filter(i => !i.is_fabric);
    const filtered = list.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || i.color?.toLowerCase().includes(q.toLowerCase()) || i.id?.includes(q));
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setMode('fabric')} style={{ ...S.subTab, background: mode === 'fabric' ? '#40c4ff' : '#12121e', color: mode === 'fabric' ? '#000' : '#666' }}>Matolar</button>
          <button onClick={() => setMode('aks')} style={{ ...S.subTab, background: mode === 'aks' ? '#40c4ff' : '#12121e', color: mode === 'aks' ? '#000' : '#666' }}>Aksessuarlar</button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: '#444' }} /><input style={{ ...S.input, paddingLeft: 42 }} placeholder="Nom yoki QR kod..." value={q} onChange={e => setQ(e.target.value)} /></div>
          <button onClick={scanQR} style={{ ...S.btnG, width: 55, padding: 0, background: '#40c4ff' }}><Scan size={22} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(i => (
            <div key={i.id} style={{ ...S.card, textAlign: 'left', borderLeft: `5px solid ${mode === 'fabric' ? (i.status === 'Tayyor' ? '#00e676' : i.status === 'Dam_olyapti' ? '#ffb300' : '#40c4ff') : '#1a1a2e'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div><div style={{ fontWeight: 'bold', fontSize: 15 }}>{i.name}</div>{i.color && <div style={{ fontSize: 11, color: '#00e676' }}>{i.color} / {i.en || 'Eni?'} sm</div>}</div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 20, fontWeight: 'bold' }}>{mode === 'fabric' ? (i.status === 'Qabul_qilindi' ? i.bruto : i.neto.toFixed(2)) : i.quantity} <small style={{ fontSize: 10, color: '#555' }}>{i.unit || 'kg'}</small></div></div>
              </div>

              {mode === 'fabric' ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {i.status === 'Qabul_qilindi' && <button onClick={() => setActiveId(i.id)} style={{ ...S.btnG, fontSize: 10, padding: 10, background: '#40c4ff' }}>📥 KO'RIKKA BERISH</button>}
                    {i.status === 'Dam_olyapti' && <button onClick={async () => { await supabase.from('warehouse_batches').update({ status: 'Tayyor' }).eq('id', i.id); load(true); }} style={{ ...S.btnG, fontSize: 10, padding: 10, background: '#ff9800' }}>⏰ DAM BITDIMI?</button>}
                    <button onClick={() => setShowQR(i)} style={{ ...S.btnG, fontSize: 10, padding: 10, background: '#111', color: '#888', border: '1px solid #1a1a2e' }}>🎨 QR KOD</button>
                    {i.status === 'Tayyor' && <div style={{ gridColumn: 'span 2', textAlign: 'center', color: '#00e676', border: '1px solid', padding: 8, borderRadius: 12, fontSize: 11, fontWeight: 'bold' }}>TAYYOR ✅</div>}
                  </div>
                  {activeId === i.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} style={{ overflow: 'hidden', display: 'flex', gap: 5 }}>
                      <input style={S.input} type="number" placeholder="Ftulka kg" onChange={e => setTara(e.target.value)} /><button onClick={async () => { const n = i.bruto - Number(tara); await supabase.from('warehouse_batches').update({ tara: Number(tara), neto: n, status: 'Dam_olyapti' }).eq('id', i.id); setActiveId(null); load(true); showMsg('Mato koringan/dam berildi'); }} style={S.btnG}>OK</button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => { const q = prompt('Kirim miqdori?'); if (q) { await supabase.from('warehouse_items').update({ quantity: i.quantity + Number(q) }).eq('id', i.id); load(true); } }} style={{ ...S.btnG, flex: 1, padding: 8, background: '#1a1a2e', color: '#00e676', border: '1px solid #00e676' }}>KIRIM</button>
                  <button onClick={async () => { const q = prompt('Chiqim miqdori?'); if (q) { await supabase.from('warehouse_items').update({ quantity: i.quantity - Number(q) }).eq('id', i.id); load(true); } }} style={{ ...S.btnG, flex: 1, padding: 8, background: '#1a1a2e', color: '#ff9800', border: '1px solid #ff9800' }}>CHIQIM</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {showQR && (
          <div style={S.overlay} onClick={() => setShowQR(null)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <h3>QR Kod: {showQR.name}</h3>
              <div style={{ background: '#fff', padding: 20, borderRadius: 20, margin: '20px 0' }}><QRCodeCanvas value={showQR.id} size={200} /></div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>{showQR.id}</div>
              <button onClick={() => setShowQR(null)} style={{ ...S.btnG, width: '100%' }}>Yopish</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (tab === 'chiqim') {
    const list = mode === 'fabric' ? data.whBatches.filter(b => b.status === 'Tayyor') : data.whItems.filter(i => !i.is_fabric);
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setMode('fabric')} style={{ ...S.subTab, background: mode === 'fabric' ? '#ff4444' : '#12121e', color: '#fff' }}>Mato Chiqimi</button>
          <button onClick={() => setMode('aks')} style={{ ...S.subTab, background: mode === 'aks' ? '#ff4444' : '#12121e', color: '#fff' }}>Aks. Chiqimi</button>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 12, marginBottom: 15, fontSize: 10, color: '#777' }}>Mato chiqimida faqat "Tayyor" bo'lgan matolar ko'rinadi.</div>
        {list.length === 0 ? <div style={{ padding: 40, color: '#444' }}>Hozircha chiqim uchun tayyor narsa yo'q</div> :
          list.map(i => (
            <div key={i.id} style={{ ...S.card, textAlign: 'left', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><b>{i.name}</b> {i.color && <div style={{ fontSize: 11, color: '#ff4444' }}>{i.color} / Eni: {i.en}</div>}</div>
                <div style={{ textAlign: 'right' }}><b>{mode === 'fabric' ? i.neto.toFixed(2) : i.quantity}</b></div>
              </div>
              <button onClick={async () => {
                if (mode === 'fabric') { if (confirm('Bichuvga chiqim?')) { await supabase.from('warehouse_batches').delete().eq('id', i.id); await supabase.from('warehouse_log').insert([{ item_name: i.name, type: 'Bichuvga chiqim', quantity: i.neto, note: i.color, user: user.name }]); load(true); showMsg('Chiqim qilindi! 🚀'); } }
                else { const q = prompt('Soni?'); if (q) { if (i.quantity < Number(q)) { showMsg('Zaxira kam!', 'err'); return; } await supabase.from('warehouse_items').update({ quantity: i.quantity - Number(q) }).eq('id', i.id); await supabase.from('warehouse_log').insert([{ item_name: i.name, type: 'Aks. chiqim', quantity: Number(q), user: user.name }]); load(true); } }
              }} style={{ ...S.btnG, width: '100%', background: '#ff4444', color: '#fff' }}>CHIQIM QILISH 📤</button>
            </div>
          ))}
      </div>
    );
  }
}

const S = {
  root: { minHeight: '100vh', background: '#07070e', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13, fontFamily: '-apple-system, system-ui, sans-serif' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 360, padding: 35, background: '#12121e', borderRadius: 32, border: '1px solid #1a1a2e' },
  title: { textAlign: 'center', fontSize: 32, fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { width: '100%', padding: '15px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btnG: { padding: '15px', background: '#00e676', color: '#000', border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #1a1a2e', background: '#0a0a14' },
  content: { flex: 1, padding: 15, paddingBottom: 100, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 26, padding: 20, border: '1px solid #1a1a2e' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '14px 10px', background: 'rgba(10,10,20,0.98)', borderTop: '1px solid #1a1a2e', zIndex: 1000 },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', flex: 1 },
  ib: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  subTab: { flex: 1, padding: '12px', border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 11 },
  toast: { position: 'fixed', top: 15, left: 15, right: 15, padding: 16, borderRadius: 18, zIndex: 10000, textAlign: 'center', fontWeight: 'bold' },
  loadingBar: { position: 'fixed', top: 0, left: 0, height: 3, background: '#00e676', zIndex: 11000, width: '100%', animation: 'loading 2s infinite' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#12121e', padding: 30, borderRadius: 32, width: '100%', maxWidth: 350, textAlign: 'center', border: '1px solid #1a1a2e' }
};
