import React, { useState, useEffect } from 'react';
import {
  Users, History, LayoutDashboard, LogOut, Plus, Trash2, ChevronRight, Package, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, Clock, UserCheck, UserX, UserMinus,
  AlertTriangle, Send, Activity, Layers, Edit3, ShoppingBag, ScrollText, RefreshCcw, Loader2,
  Zap, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase';
import {
  collection, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';

const APP_VERSION = "2.0 REST";
const PROJECT_ID = "qttuz-df432";
const API_KEY = "AIzaSyAsaHRcl_peeIVjmItexaBt3NnGkJqGaBg";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const DEPARTMENTS = [
  { id: 'matolar', name: 'Matolar Bo\'limi', icon: ScrollText, actions: ['Kirim', 'Chiqim'], step: 0.5 },
  { id: 'bichuv', name: 'Bichuv Bo\'limi', icon: Scissors, actions: ['Bichildi'], step: 1 },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', icon: Truck, actions: ['Ishga berildi', 'Kraskaga yuborildi', 'Vishivkaga yuborildi', 'Pressga yuborildi', 'Natija qaytdi'], step: 2 },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', icon: Activity, actions: ['Tikuv bitdi'], step: 3 },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', icon: Box, actions: ['Upakovka bitdi', 'Tayyorga topshirildi'], step: 4 },
  { id: 'ombor', name: 'Ombor Bo\'limi', icon: Warehouse, actions: ['Kirim', 'Chiqim'], step: 0.2 },
  { id: 'tayyor', name: 'Tayyor mahsulot', icon: CheckCircle2, actions: ['Qabul qilindi'], step: 5 },
  { id: 'xo\'jalik', name: 'Xo\'jalik Bo\'limi', icon: Home, actions: ['Xarajat', 'Kirim'], step: 0 },
  { id: 'ekspremetal', name: 'Ekspremetal', icon: Wrench, actions: ['Namuna tayyor'], step: 0 },
  { id: 'kadirlar', name: 'Kadirlar Bo\'limi', icon: Users, actions: ['Hujjatlash'], step: 0 },
];

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const v = localStorage.getItem('qtt_version');
      if (v !== APP_VERSION) { localStorage.clear(); return null; }
      const s = localStorage.getItem('qtt_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [authData, setAuthData] = useState({ login: '', password: '' });
  const [heads, setHeads] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [models, setModels] = useState([]);
  const [msg, setMsg] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  };

  useEffect(() => {
    localStorage.setItem('qtt_version', APP_VERSION);
    const unsubs = [
      onSnapshot(collection(db, "heads"), s => setHeads(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "history"), orderBy("timestamp", "desc")), s => setHistory(s.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate()?.toLocaleString('uz-UZ') || 'Hozirgina' })))),
      onSnapshot(collection(db, "attendance"), s => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, "models"), s => setModels(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const restWrite = async (collectionName, data, documentId = null) => {
    const fields = {};
    Object.keys(data).forEach(key => {
      const val = data[key];
      if (typeof val === 'string') fields[key] = { stringValue: val };
      else if (typeof val === 'number') fields[key] = { doubleValue: val };
      else if (val === null) fields[key] = { timestampValue: new Date().toISOString() };
    });

    const url = documentId
      ? `${BASE_URL}/${collectionName}/${documentId}?key=${API_KEY}`
      : `${BASE_URL}/${collectionName}?key=${API_KEY}`;

    const response = await fetch(url, {
      method: documentId ? 'PATCH' : 'POST',
      body: JSON.stringify({ fields }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error("REST Xatolik: " + response.statusText);
    return response.json();
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (authData.login === '0068' && authData.password === '0068') {
      setUser({ role: 'admin', name: 'Rahbar' });
      return;
    }
    const head = heads.find(h => String(h.login) === authData.login && String(h.password) === authData.password);
    if (head) setUser({ role: 'dept', ...head });
    else showMsg('Login yoki parol xato!', 'error');
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}><Zap color="var(--accent-color)" size={40} style={{ margin: 'auto' }} /></div>
          <h1 style={{ textAlign: 'center', color: '#fff', marginBottom: '30px' }}>QTTuz Production</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={authData.login} onChange={e => setAuthData({ ...authData, login: e.target.value })} />
            <input type="password" placeholder="Parol" className="input-field" required value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })} />
            <button type="submit" className="btn-primary">TEZKOR KIRISH</button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-dim)', marginTop: '20px' }}>PROTOCOL: ULTRA-FAST REST API</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            style={{ position: 'fixed', top: '10px', left: '10px', right: '10px', background: msg.type === 'error' ? '#ff3b30' : '#34c759', color: '#fff', padding: '15px', borderRadius: '14px', zIndex: 10000, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="header" style={{ borderBottom: '1px solid rgba(0,200,81,0.2)' }}>
        <div><h2 style={{ fontSize: '15px' }}>{user.name}</h2><p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Rahbar' : 'Xodim'}</p></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.location.reload()}><RefreshCcw size={16} /></button>
          <button onClick={() => setUser(null)} style={{ color: '#ff3b30' }}><LogOut size={16} /></button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '15px', paddingBottom: '90px', overflowY: 'auto' }}>
        {user.role === 'admin' && activeTab === 'dashboard' && <AdminDashboard heads={heads} attendance={attendance} today={today} models={models} />}
        {user.role === 'admin' && activeTab === 'heads' && <ManageHeads heads={heads} showMsg={showMsg} restWrite={restWrite} />}
        {user.role === 'admin' && activeTab === 'models' && <ModelTracker models={models} />}
        {user.role === 'admin' && activeTab === 'history' && <HistoryView history={history} />}
        {(user.role === 'dept' || (user.role === 'admin' && activeTab === 'dept_panel')) && <DeptPanel user={user} restWrite={restWrite} attendance={attendance} today={today} heads={heads} showMsg={showMsg} />}
      </main>

      {user.role === 'admin' && (
        <nav className="footer-nav">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}><LayoutDashboard size={18} /><span>Xulosa</span></button>
          <button onClick={() => setActiveTab('models')} className={activeTab === 'models' ? 'active' : ''}><Layers size={18} /><span>Modellar</span></button>
          <button onClick={() => setActiveTab('heads')} className={activeTab === 'heads' ? 'active' : ''}><Users size={18} /><span>Xodimlar</span></button>
          <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}><History size={18} /><span>Tarix</span></button>
        </nav>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (<div className="glass-card" style={{ textAlign: 'center', padding: '12px' }}><Icon size={18} color={color} style={{ margin: '0 auto 4px' }} /><div style={{ fontSize: '18px', fontWeight: 'bold' }}>{value}</div><div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{label}</div></div>);
}

function AdminDashboard({ heads, attendance, today, models }) {
  const att = attendance.filter(a => a.date === today).length;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
        <StatCard icon={Users} label="Xodimlar" value={heads.length} color="var(--accent-color)" />
        <StatCard icon={Activity} label="Ishdagi Modellar" value={models.length} color="#34c759" />
        <StatCard icon={UserCheck} label="Bugun kelgan" value={att} color="#34c759" />
        <StatCard icon={AlertTriangle} label="Yo'qlar" value={heads.length - att} color="#ff3b30" />
      </div>
    </motion.div>
  );
}

function ManageHeads({ heads, showMsg, restWrite }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await restWrite("heads", { ...formData });
      showMsg("Muvaffaqiyatli saqlandi! ✅");
      setShowAdd(false);
      setFormData({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });
    } catch (err) {
      showMsg("Xato: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '18px' }}>Xodimlar</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary" style={{ padding: '8px 12px' }}>{showAdd ? 'Yopish' : '+ Qo\'shish'}</button>
      </div>
      {showAdd && (
        <form onSubmit={save} className="glass-card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Ism familiya" className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={saving} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} disabled={saving} />
            <input type="text" placeholder="Parol" className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} disabled={saving} />
          </div>
          <select className="input-field" value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value })} disabled={saving}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'MA\'LUMOT UCHMOQDA...' : 'TEZKOR SAQLASH'}</button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {heads.map(h => (
          <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
            <div><div style={{ fontSize: '14px', fontWeight: 'bold' }}>{h.name}</div><div style={{ fontSize: '10px', color: 'var(--accent-color)' }}>{DEPARTMENTS.find(d => d.id === h.deptId)?.name || 'Noma\'lum'}</div></div>
            <button onClick={async () => {
              if (window.confirm("O'chirilsinmi?")) {
                const url = `${BASE_URL}/heads/${h.id}?key=${API_KEY}`;
                await fetch(url, { method: 'DELETE' });
                showMsg("O'chirildi!");
              }
            }} style={{ color: '#ff3b30' }}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DeptPanel({ user, restWrite, attendance, today, showMsg }) {
  const [formData, setFormData] = useState({ model: '', action: '', details: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || DEPARTMENTS[5];
  const att = attendance.find(a => a.headId === user.id && a.date === today);

  const handle = async (e) => {
    e.preventDefault();
    try {
      await restWrite("history", { dept: dept.name, action: formData.action, details: formData.details, model: formData.model, user: user.name, timestamp: null });
      if (formData.model) {
        await restWrite("models", { modelName: formData.model, currentDept: dept.name, progress: dept.step || 0, updatedAt: null }, formData.model.toLowerCase());
      }
      showMsg('Muvaffaqiyatli saqlandi! ✅');
      setFormData({ ...formData, model: '', details: '' });
    } catch (e) { showMsg('Xato: ' + e.message, 'error'); }
  };

  const mark = async () => {
    const s = new Date().getHours() < 8 || (new Date().getHours() === 8 && new Date().getMinutes() <= 30) ? 'Keldi' : 'Kechikdi';
    await restWrite("attendance", { headId: user.id, status: s, date: today, timestamp: null }, `${today}_${user.id}`);
    showMsg("Davomat qilindi!");
  };

  return (
    <motion.div initial={{ opacity: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}><h3>{dept.name}</h3>{!att ? <button onClick={mark} className="btn-primary" style={{ marginTop: '10px', background: '#34c759' }}>Ishga keldim</button> : <div style={{ marginTop: '8px', color: '#34c759', fontWeight: 'bold' }}>🟢 {att.status}</div>}</div>
      <form onSubmit={handle} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input type="text" placeholder="Model nomi" className="input-field" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>{dept.actions.map(act => (
          <button key={act} type="button" onClick={() => setFormData({ ...formData, action: act })}
            style={{ flex: '1 0 45%', padding: '10px', fontSize: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: formData.action === act ? 'var(--accent-color)' : 'transparent', color: formData.action === act ? '#000' : '#fff' }}>{act}</button>
        ))}</div>
        <input type="number" placeholder="Soni" className="input-field" required value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
        <button type="submit" className="btn-primary">TEZKOR YUBORISH</button>
      </form>
    </motion.div>
  );
}

function ModelTracker({ models }) {
  const steps = [{ n: 'Ombor', s: 0.2 }, { n: 'Mato', s: 0.5 }, { n: 'Bichuv', s: 1 }, { n: 'Taqsim', s: 2 }, { n: 'Tikuv', s: 3 }, { n: 'Upak', s: 4 }, { n: 'Tayyor', s: 5 }];
  return (
    <motion.div initial={{ opacity: 0 }}>
      <h3 style={{ marginBottom: '15px' }}>Modellar Nazorati</h3>
      {models.map(m => (
        <div key={m.id} className="glass-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><b>{m.modelName}</b> <span>{m.quantity || ''}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', height: '16px', alignItems: 'center' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: 0, width: `${(m.progress / 5) * 100}%`, height: '2px', background: '#34c759' }}></div>
            {steps.map(s => (<div key={s.n} style={{ zIndex: 3 }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.progress >= s.s ? '#34c759' : '#333' }}></div></div>))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function HistoryView({ history }) {
  return (
    <motion.div initial={{ opacity: 0 }}><h3 style={{ marginBottom: '15px' }}>Tarix</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{history.map(item => (<div key={item.id} className="glass-card" style={{ fontSize: '11px', padding: '12px' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{item.dept}</span><span>{item.timestamp}</span></div><div>{item.model}: {item.action} - {item.details}</div></div>))}</div></motion.div>
  );
}
