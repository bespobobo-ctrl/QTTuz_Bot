import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  Settings, Palette, Ruler, Scale, QrCode, Scan, X, Printer, Clock, Coffee, Search, Filter as FilterIcon,
  Download, Upload, ChevronRight, Maximize, RulerIcon, Info, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255xwygwwnhnghqihuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "10.0 WAREHOUSE-ULTRA";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('qu');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ heads: [], history: [], whItems: [], whLog: [], whBatches: [], whRolls: [] });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 3000); }, []);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [h, hi, wi, wl, wb, wr, ver] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('warehouse_items').select('*'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('warehouse_batches').select('*').order('arrival_date', { ascending: false }),
        supabase.from('warehouse_rolls').select('*').order('created_at', { ascending: false }),
        supabase.from('system_config').select('*').eq('key', 'app_version').single()
      ]);

      if (ver.data && ver.data.value !== APP_VERSION) setNeedsUpdate(true);
      else setNeedsUpdate(false);

      setData({ heads: h.data || [], history: hi.data || [], whItems: wi.data || [], whLog: wl.data || [], whBatches: wb.data || [], whRolls: wr.data || [] });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const sub = supabase.channel('ultra-sync').on('postgres_changes', { event: '*', schema: 'public' }, () => load(true)).subscribe();
    return () => sub.unsubscribe();
  }, [load]);

  if (needsUpdate) return (
    <div style={{ ...S.root, justifyContent: 'center', alignItems: 'center', padding: 40, textAlign: 'center' }}>
      <Zap size={60} color="#00e676" style={{ marginBottom: 20 }} />
      <h1 style={{ fontSize: 22, fontWeight: 'bold' }}>YANGI VERSIYA: 10.0</h1>
      <button onClick={() => window.location.reload(true)} style={{ ...S.btnG, width: '100%', marginTop: 30 }}> YANGILASH 🚀</button>
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
        <div><div style={{ fontSize: 16, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 9, color: '#00e676' }}>{APP_VERSION} PRO</div></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => load()} style={S.ib}><RefreshCcw size={18} className={loading ? 'spin' : ''} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={S.content}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isOmbor ? <OmborUltra tab={tab} user={user} data={data} showMsg={showMsg} load={load} /> : <div style={S.card}>Admin bo'limi...</div>}
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
      <style>{` @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; } `}</style>
    </div>
  );
}

function Login({ data, setUser, setTab, showMsg }) {
  const [auth, setAuth] = useState({ login: '', password: '' });
  return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={S.loginBox}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}><Warehouse color="#00e676" size={50} style={{ margin: '0 auto' }} /></div>
        <h1 style={{ ...S.title, fontSize: 26 }}>QTTuz PRO</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (auth.login === '0068' && auth.password === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); return; }
          if (auth.login === '1234' && auth.password === '1234') { setUser({ role: 'dept', deptId: 'ombor', name: 'Omborchi' }); return; }
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

function OmborUltra({ tab, user, data, showMsg, load }) {
  const [m, setM] = useState('fabric');
  const [f, setF] = useState({ bn: '', n: '', c: '', b: '', en: '', gr: '', rS: 1 });
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [q, setQ] = useState('');

  if (tab === 'dashboard') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={S.card}><ScrollText color="#ff9800" /><div style={{ fontSize: 24, fontWeight: 'bold' }}>{data.whBatches.length}</div><small style={{ color: '#666' }}>Partiyalar</small></div>
        <div style={S.card}><Package color="#00e676" /><div style={{ fontSize: 24, fontWeight: 'bold' }}>{data.whRolls.length}</div><small style={{ color: '#666' }}>Rulonlar</small></div>
      </div>
      <div style={S.card}>
        <div style={{ textAlign: 'left', fontWeight: 'bold', fontSize: 11, color: '#00e676', marginBottom: 12 }}>O'ZGARISHLAR</div>
        {data.whLog.slice(0, 5).map(l => (
          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a2e', fontSize: 11 }}>
            <span style={{ textAlign: 'left' }}>{l.item_name}<br /><small style={{ color: '#444' }}>{l.type}</small></span>
            <b>{l.quantity}</b>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'kirim') return (
    <div style={S.card}>
      <h3 style={{ marginBottom: 20, color: '#00e676' }}>YANGI PARTIYA QABULI</h3>
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          const { data: bData, error: bErr } = await supabase.from('warehouse_batches').insert([{ batch_number: f.bn, user_name: user.name }]).select().single();
          if (bErr) throw bErr;
          showMsg('Partiya ochildi. Endi rulonlarni qo\'shing!'); setSelectedBatch(bData); setTab('ombor'); load(true);
        } catch (err) { showMsg(err.message, 'err'); }
      }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'left', fontSize: 11, color: '#555', marginBottom: 2 }}>Partiya raqami (masalan: P-9980):</div>
        <input style={S.input} placeholder="P-0000" required value={f.bn} onChange={e => setF({ ...f, bn: e.target.value })} />
        <button type="submit" style={S.btnG}>PARTIYA OCHISH ➕</button>
      </form>
    </div>
  );

  if (tab === 'ombor') {
    if (selectedBatch) {
      const rolls = data.whRolls.filter(r => r.batch_id === selectedBatch.id);
      return (
        <div style={{ paddingBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
            <button onClick={() => setSelectedBatch(null)} style={{ ...S.ib, color: '#00e676' }}><ArrowDown style={{ rotate: '90deg' }} /> Orqaga</button>
            <div style={{ fontWeight: 'bold' }}>PARTIYA: {selectedBatch.batch_number}</div>
          </div>

          <div style={{ ...S.card, marginBottom: 15 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 13 }}>Rulon qo'shish (Bruto o'lchov)</div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('warehouse_rolls').insert([{ batch_id: selectedBatch.id, batch_number: selectedBatch.batch_number, fabric_name: f.n, color: f.c, bruto: Number(f.b), user_name: user.name }]);
              setF({ ...f, b: '' }); load(true); showMsg('Rulon qo\'shildi!');
            }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input style={S.input} placeholder="Mato nomi" required value={f.n} onChange={e => setF({ ...f, n: e.target.value })} />
              <input style={S.input} placeholder="Rangi" required value={f.c} onChange={e => setF({ ...f, c: e.target.value })} />
              <div style={{ display: 'flex', gap: 5 }}><input style={S.input} type="number" step="0.01" placeholder="Bruto (kg)" required value={f.b} onChange={e => setF({ ...f, b: e.target.value })} /><button style={S.btnG}>+</button></div>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rolls.map((r, idx) => (
              <div key={r.id} style={{ ...S.card, textAlign: 'left', borderLeft: `4px solid ${r.status === 'Tayyor' ? '#00e676' : r.status === 'Ko\'rikda' ? '#ff9800' : '#40c4ff'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><small style={{ color: '#444' }}>Rulon #{idx + 1}</small><div>{r.fabric_name} <small style={{ color: '#666' }}>({r.color})</small></div></div>
                  <div style={{ textAlign: 'right' }}><b>{r.status === 'Kirim' ? r.bruto : r.neto.toFixed(2)}</b> <small>kg</small><div><small style={{ fontSize: 9, color: r.status === 'Tayyor' ? '#00e676' : '#ff9800' }}>{r.status.toUpperCase()}</small></div></div>
                </div>
                {r.status !== 'Tayyor' && (
                  <button onClick={() => { const t = prompt('Ftulka (kg)?'); const en = prompt('Eni (sm)?'); const gr = prompt('Gramaj?'); if (t && en && gr) { const n = r.bruto - Number(t); supabase.from('warehouse_rolls').update({ tara: Number(t), neto: n, en: Number(en), gramaj: gr, status: 'Tayyor' }).eq('id', r.id).then(() => load(true)); } }} style={{ ...S.btnG, padding: 6, fontSize: 10, width: '100%', marginTop: 8, background: '#40c4ff' }}>KONTROL (KO'RIK)</button>
                )}
                {r.status === 'Tayyor' && <div style={{ fontSize: 10, color: '#888', marginTop: 5 }}>Eni: {r.en}sm | Gr: {r.gramaj}</div>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ position: 'relative', marginBottom: 20 }}><Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#444' }} /><input style={{ ...S.input, paddingLeft: 40 }} placeholder="Partiya raqamini yozing..." onChange={e => setQ(e.target.value)} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.whBatches.filter(b => b.batch_number.toLowerCase().includes(q.toLowerCase())).map(b => (
            <div key={b.id} onClick={() => setSelectedBatch(b)} style={{ ...S.card, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 'bold', fontSize: 16 }}>{b.batch_number}</div><small style={{ color: '#555' }}>{new Date(b.arrival_date).toLocaleDateString()}</small></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 16, color: '#40c4ff' }}>{data.whRolls.filter(r => r.batch_id === b.id).length} rulon</div><ChevronRight size={18} color="#444" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'chiqim') {
    const readyRolls = data.whRolls.filter(r => r.status === 'Tayyor');
    return (
      <div>
        <h3 style={{ marginBottom: 15, color: '#ff4444' }}>TAYYOR RULONLAR (BICHUVGA)</h3>
        {readyRolls.map(r => (
          <div key={r.id} style={{ ...S.card, textAlign: 'left', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div><b>{r.fabric_name}</b><br /><small style={{ color: '#666' }}>Partiya: {r.batch_number} | Rang: {r.color}</small></div>
              <b style={{ fontSize: 20 }}>{r.neto.toFixed(2)} <small>kg</small></b>
            </div>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 10 }}>Eni: {r.en}sm | Gramaj: {r.gramaj}</div>
            <button onClick={async () => { if (confirm('Bichuvga chiqim?')) { await supabase.from('warehouse_rolls').delete().eq('id', r.id); await supabase.from('warehouse_log').insert([{ item_name: r.fabric_name, type: 'Bichuvga Chiqim', quantity: r.neto, note: r.batch_number, user: user.name }]); load(true); showMsg('Chiqim qilindi! 🚀'); } }} style={{ ...S.btnG, width: '100%', background: '#ff4444', color: '#fff' }}>BICHUVGA TOPSHIRISH 📤</button>
          </div>
        ))}
      </div>
    );
  }
}

const S = {
  root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13, fontFamily: '-apple-system, sans-serif' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 360, padding: 35, background: '#12121e', borderRadius: 32, border: '1px solid #1a1a2e' },
  title: { textAlign: 'center', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { width: '100%', padding: '15px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btnG: { padding: '15px', background: '#00e676', color: '#000', border: 'none', borderRadius: 16, fontWeight: 'bold', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1a1a2e' },
  content: { flex: 1, padding: 15, paddingBottom: 100, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 26, padding: 18, border: '1px solid #1a1a2e' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '14px 10px', background: 'rgba(10,10,20,0.95)', borderTop: '1px solid #1a1a2e', zIndex: 1000 },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', flex: 1 },
  ib: { background: 'none', border: 'none', cursor: 'pointer' },
  subTab: { flex: 1, padding: '12px', border: 'none', borderRadius: 14, fontWeight: 'bold', fontSize: 11 },
  toast: { position: 'fixed', top: 15, left: 15, right: 15, padding: 16, borderRadius: 18, zIndex: 10000, textAlign: 'center', fontWeight: 'bold' },
  loadingBar: { position: 'fixed', top: 0, left: 0, height: 3, background: '#00e676', zIndex: 11000, width: '100%', animation: 'loading 2s infinite' }
};
