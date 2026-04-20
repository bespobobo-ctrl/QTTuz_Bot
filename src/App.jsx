import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw,
  Zap, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

/* ═══════════════════════════════════════
   SUPABASE ULANISHI (TO'G'RI URL)
   ═══════════════════════════════════════ */
const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const APP_VERSION = "5.0";

/* ═══════════════════════════════════════
   BO'LIMLAR RO'YXATI
   ═══════════════════════════════════════ */
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

/* ═══════════════════════════════════════
   ASOSIY DASTUR
   ═══════════════════════════════════════ */
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
  const [heads, setHeads] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [models, setModels] = useState([]);
  const [msg, setMsg] = useState(null);
  const [dbOk, setDbOk] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const showMsg = useCallback((text, type = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  }, []);

  // Ma'lumotni yuklash
  const load = useCallback(async () => {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('attendance').select('*'),
        supabase.from('models').select('*').order('updatedAt', { ascending: false })
      ]);
      if (r1.error) throw r1.error;
      setHeads(r1.data || []);
      setHistory(r2.data || []);
      setAttendance(r3.data || []);
      setModels(r4.data || []);
      setDbOk(true);
    } catch (e) {
      console.error('DB Error:', e);
      showMsg('Baza xatosi: ' + (e.message || 'Ulanish yo\'q'), 'err');
      setDbOk(false);
    }
  }, [showMsg]);

  useEffect(() => {
    localStorage.setItem('qv', APP_VERSION);
    load();
    // Realtime
    const ch = supabase.channel('all_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'heads' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, () => load())
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [load]);

  useEffect(() => {
    if (user) localStorage.setItem('qu', JSON.stringify(user));
    else localStorage.removeItem('qu');
  }, [user]);

  const login = (e) => {
    e.preventDefault();
    const l = auth.login.trim();
    const p = auth.password.trim();
    if (l === '0068' && p === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); return; }
    const h = heads.find(x => x.login === l && x.password === p);
    if (h) { setUser({ role: 'dept', ...h }); setTab('dept'); }
    else showMsg('Login yoki parol noto\'g\'ri', 'err');
  };

  // ─── LOGIN EKRANI ───
  if (!user) {
    return (
      <div style={S.root}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={S.loginBox}>
          <Zap color="#00e676" size={36} style={{ margin: '0 auto 10px', display: 'block' }} />
          <h1 style={S.title}>QTTuz</h1>
          <p style={{ textAlign: 'center', color: '#666', fontSize: 10, marginBottom: 25 }}>V{APP_VERSION} | {dbOk ? '🟢 Baza tayyor' : '⏳ Yuklanmoqda...'}</p>
          <form onSubmit={login} style={S.form}>
            <input style={S.input} placeholder="Login" required value={auth.login} onChange={e => setAuth({ ...auth, login: e.target.value })} />
            <input style={S.input} type="password" placeholder="Parol" required value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} />
            <button type="submit" style={S.btnGreen}>KIRISH</button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ─── ASOSIY EKRAN ───
  return (
    <div style={S.root}>
      {/* XABARLAR */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: -80 }} animate={{ y: 0 }} exit={{ y: -80 }}
            style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676', color: msg.type === 'err' ? '#fff' : '#000' }}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div style={S.header}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#fff' }}>{user.name}</div>
          <div style={{ fontSize: 10, color: '#00e676' }}>V{APP_VERSION}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={S.iconBtn}><RefreshCcw size={16} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.iconBtn, color: '#ff3b30' }}><LogOut size={16} /></button>
        </div>
      </div>

      {/* KONTENT */}
      <div style={S.content}>
        {user.role === 'admin' && tab === 'dashboard' && <Dashboard heads={heads} attendance={attendance} today={today} models={models} />}
        {user.role === 'admin' && tab === 'heads' && <Heads heads={heads} showMsg={showMsg} load={load} />}
        {user.role === 'admin' && tab === 'models' && <Models models={models} />}
        {user.role === 'admin' && tab === 'history' && <Hist history={history} />}
        {(user.role === 'dept' || tab === 'dept') && <Dept user={user} attendance={attendance} today={today} showMsg={showMsg} load={load} />}
      </div>

      {/* NAV */}
      {user.role === 'admin' && (
        <div style={S.nav}>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Xulosa' },
            { id: 'models', icon: Layers, label: 'Modellar' },
            { id: 'heads', icon: Users, label: 'Bo\'limlar' },
            { id: 'history', icon: HistoryIcon, label: 'Tarix' }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.navBtn, color: tab === t.id ? '#00e676' : '#555' }}>
              <t.icon size={18} /><span style={{ fontSize: 9 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════ */
function Dashboard({ heads, attendance, today, models }) {
  const att = attendance.filter(a => a.date === today).length;
  const cards = [
    { icon: Users, label: 'Xodimlar', value: heads.length, color: '#00e676' },
    { icon: Activity, label: 'Modellar', value: models.length, color: '#40c4ff' },
    { icon: UserCheck, label: 'Keldi', value: att, color: '#00e676' },
    { icon: AlertTriangle, label: 'Yo\'q', value: Math.max(0, heads.length - att), color: '#ff3b30' }
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map(c => (
        <div key={c.label} style={S.card}>
          <c.icon size={18} color={c.color} style={{ marginBottom: 4 }} />
          <div style={{ fontSize: 22, fontWeight: 'bold' }}>{c.value}</div>
          <div style={{ fontSize: 9, color: '#666' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   BO'LIM BOSHLIQLARI
   ═══════════════════════════════════════ */
function Heads({ heads, showMsg, load }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', login: '', password: '', deptId: 'ombor' });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.from('heads').insert([{
        name: f.name,
        login: f.login,
        password: f.password,
        deptId: f.deptId
      }]).select();

      if (error) {
        showMsg('Xato: ' + error.message, 'err');
      } else {
        showMsg('Muvaffaqiyatli saqlandi! ✅');
        setOpen(false);
        setF({ name: '', login: '', password: '', deptId: 'ombor' });
        load();
      }
    } catch (err) {
      showMsg('Tarmoq xatosi: ' + err.message, 'err');
    }
    setBusy(false);
  };

  const del = async (id) => {
    if (!confirm("O'chirilsinmi?")) return;
    const { error } = await supabase.from('heads').delete().eq('id', id);
    if (error) showMsg('Xato: ' + error.message, 'err');
    else { showMsg("O'chirildi!"); load(); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, color: '#fff' }}>Bo'lim Boshliqlari</h3>
        <button onClick={() => setOpen(!open)} style={S.btnGreen}>{open ? 'Yopish' : '+ Qo\'shish'}</button>
      </div>

      {open && (
        <form onSubmit={save} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, border: '1px solid #00e676' }}>
          <input style={S.input} placeholder="Ism familiya" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={S.input} placeholder="Login" required value={f.login} onChange={e => setF({ ...f, login: e.target.value })} />
            <input style={S.input} placeholder="Parol" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
          </div>
          <select style={S.input} value={f.deptId} onChange={e => setF({ ...f, deptId: e.target.value })}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" style={S.btnGreen} disabled={busy}>{busy ? 'SAQLANMOQDA...' : 'SAQLASH'}</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {heads.length === 0 && <p style={{ textAlign: 'center', color: '#555', fontSize: 12 }}>Hali hech kim yo'q</p>}
        {heads.map(h => (
          <div key={h.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>{h.name}</div>
              <div style={{ fontSize: 10, color: '#00e676' }}>{DEPARTMENTS.find(d => d.id === h.deptId)?.name || h.deptId}</div>
              <div style={{ fontSize: 9, color: '#444' }}>L: {h.login}</div>
            </div>
            <button onClick={() => del(h.id)} style={{ ...S.iconBtn, color: '#ff3b30' }}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   BO'LIM PANELI
   ═══════════════════════════════════════ */
function Dept({ user, attendance, today, showMsg, load }) {
  const [f, setF] = useState({ model: '', action: '', details: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || DEPARTMENTS[0];
  const att = attendance.find(a => a.headId === user.id && a.date === today);

  const send = async (e) => {
    e.preventDefault();
    if (!f.action) { showMsg('Amalni tanlang!', 'err'); return; }
    try {
      const { error } = await supabase.from('history').insert([{ dept: dept.name, action: f.action, details: f.details, model: f.model, user: user.name }]);
      if (error) throw error;
      if (f.model) {
        await supabase.from('models').upsert([{ id: f.model.toLowerCase(), modelName: f.model, currentDept: dept.name, progress: dept.step || 0, updatedAt: new Date().toISOString() }]);
      }
      showMsg('Saqlandi! ✅');
      setF({ ...f, model: '', details: '' });
      load();
    } catch (e) { showMsg('Xato: ' + e.message, 'err'); }
  };

  const mark = async () => {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    const s = (h < 8 || (h === 8 && m <= 30)) ? 'Keldi' : 'Kechikdi';
    const { error } = await supabase.from('attendance').upsert([{ id: `${today}_${user.id}`, headId: String(user.id), status: s, date: today }]);
    if (error) showMsg('Xato: ' + error.message, 'err');
    else { showMsg('Davomat belgilandi!'); load(); }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h3 style={{ color: '#00e676', fontSize: 18 }}>{dept.name}</h3>
        {!att ? <button onClick={mark} style={{ ...S.btnGreen, marginTop: 10, background: '#00e676', color: '#000' }}>✅ Ishga keldim</button>
          : <div style={{ color: '#00e676', marginTop: 8, fontWeight: 'bold' }}>🟢 {att.status}</div>}
      </div>

      <form onSubmit={send} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid rgba(0,230,118,0.2)' }}>
        <input style={S.input} placeholder="Model nomi" required value={f.model} onChange={e => setF({ ...f, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {dept.actions.map(a => (
            <button key={a} type="button" onClick={() => setF({ ...f, action: a })}
              style={{ flex: '1 0 45%', padding: 10, fontSize: 11, borderRadius: 8, border: 'none', background: f.action === a ? '#00e676' : '#1a1a2e', color: f.action === a ? '#000' : '#888', fontWeight: f.action === a ? 'bold' : 'normal' }}>
              {a}
            </button>
          ))}
        </div>
        <input style={S.input} type="number" placeholder="Soni" required value={f.details} onChange={e => setF({ ...f, details: e.target.value })} />
        <button type="submit" style={S.btnGreen}>YUBORISH</button>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════
   MODELLAR
   ═══════════════════════════════════════ */
function Models({ models }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 15 }}>Modellar Progressi</h3>
      {models.length === 0 ? <p style={{ textAlign: 'center', color: '#555', fontSize: 12 }}>Hech narsa yo'q</p> :
        models.map(m => (
          <div key={m.id} style={{ ...S.card, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <b style={{ color: '#fff' }}>{m.modelName}</b>
              <span style={{ color: '#00e676', fontSize: 10 }}>{m.currentDept}</span>
            </div>
            <div style={{ height: 4, background: '#1a1a2e', borderRadius: 2 }}>
              <div style={{ width: `${Math.min(100, (m.progress / 5) * 100)}%`, height: '100%', background: '#00e676', borderRadius: 2, boxShadow: '0 0 8px #00e676' }}></div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

/* ═══════════════════════════════════════
   TARIX
   ═══════════════════════════════════════ */
function Hist({ history }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 15 }}>Tarix</h3>
      {history.length === 0 ? <p style={{ textAlign: 'center', color: '#555', fontSize: 12 }}>Bo'sh</p> :
        history.map(x => (
          <div key={x.id} style={{ ...S.card, marginBottom: 8, fontSize: 11, borderLeft: '3px solid #00e676' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#00e676', fontWeight: 'bold' }}>{x.dept}</span>
              <span style={{ color: '#444' }}>{x.timestamp ? new Date(x.timestamp).toLocaleTimeString() : ''}</span>
            </div>
            <div style={{ color: '#ccc' }}>{x.model}: {x.action} — {x.details}</div>
          </div>
        ))
      }
    </div>
  );
}

/* ═══════════════════════════════════════
   STILLAR
   ═══════════════════════════════════════ */
const S = {
  root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#fff' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 360, padding: 30, background: '#12121e', borderRadius: 20, border: '1px solid rgba(0,230,118,0.15)' },
  title: { textAlign: 'center', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { width: '100%', padding: '14px 16px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btnGreen: { padding: '14px 20px', background: '#00e676', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #1a1a2e' },
  content: { flex: 1, padding: 15, paddingBottom: 90, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 14, padding: 15, border: '1px solid #1a1a2e' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 0', background: '#0a0a14', borderTop: '1px solid #1a1a2e' },
  navBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  toast: { position: 'fixed', top: 10, left: 10, right: 10, padding: 15, borderRadius: 14, zIndex: 10000, textAlign: 'center', fontWeight: 'bold', fontSize: 13, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }
};
