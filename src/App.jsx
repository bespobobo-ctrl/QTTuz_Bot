import React, { useState, useEffect } from 'react';
import {
  Users, History, LayoutDashboard, LogOut, Plus, Trash2, ChevronRight, Package, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, Clock, UserCheck, UserX, UserMinus,
  AlertTriangle, Send, Activity, Layers, Edit3, ShoppingBag, ScrollText, RefreshCcw, Loader2,
  Zap, Globe, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, remove, serverTimestamp } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAsaHRcl_peeIVjmItexaBt3NnGkJqGaBg",
  authDomain: "qttuz-df432.firebaseapp.com",
  projectId: "qttuz-df432",
  storageBucket: "qttuz-df432.firebasestorage.app",
  messagingSenderId: "775390146553",
  appId: "1:775390146553:web:c17f29503feabb5f7b5728",
  databaseURL: "https://qttuz-df432-default-rtdb.firebaseio.com" // Realtime DB URL
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

const APP_VERSION = "3.0 ULTRA";

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
      if (localStorage.getItem('qtt_version') !== APP_VERSION) { localStorage.clear(); return null; }
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

    // Realtime Database Listeners
    const unsubs = [
      onValue(ref(rtdb, 'heads'), s => {
        const val = s.val() || {};
        setHeads(Object.keys(val).map(id => ({ id, ...val[id] })));
      }),
      onValue(ref(rtdb, 'history'), s => {
        const val = s.val() || {};
        const list = Object.keys(val).map(id => ({ id, ...val[id] }));
        setHistory(list.sort((a, b) => b.timestamp - a.timestamp));
      }),
      onValue(ref(rtdb, 'attendance'), s => {
        const val = s.val() || {};
        setAttendance(Object.keys(val).map(id => ({ id, ...val[id] })));
      }),
      onValue(ref(rtdb, 'models'), s => {
        const val = s.val() || {};
        setModels(Object.keys(val).map(id => ({ id, ...val[id] })));
      })
    ];
    return () => { };
  }, []);

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
            <button type="submit" className="btn-primary">KIRISH</button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-dim)', marginTop: '20px' }}>ENGINE: REALTIME ULTRA-DB</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            className="toast" style={{ background: msg.type === 'error' ? '#ff3b30' : '#34c759' }}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="header">
        <div><h2 style={{ fontSize: '15px' }}>{user.name}</h2><p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>V{APP_VERSION}</p></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.location.reload()}><RefreshCcw size={16} /></button>
          <button onClick={() => setUser(null)} style={{ color: '#ff3b30' }}><LogOut size={16} /></button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '15px', paddingBottom: '90px', overflowY: 'auto' }}>
        {user.role === 'admin' && activeTab === 'dashboard' && <AdminDashboard heads={heads} attendance={attendance} today={today} models={models} />}
        {user.role === 'admin' && activeTab === 'heads' && <ManageHeads heads={heads} showMsg={showMsg} />}
        {user.role === 'admin' && activeTab === 'models' && <ModelTracker models={models} />}
        {user.role === 'admin' && activeTab === 'history' && <HistoryView history={history} />}
        {(user.role === 'dept' || (user.role === 'admin' && activeTab === 'dept_panel')) && <DeptPanel user={user} attendance={attendance} today={today} heads={heads} showMsg={showMsg} />}
      </main>

      {user.role === 'admin' && (
        <nav className="footer-nav">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}><LayoutDashboard size={18} /><span>Dashboard</span></button>
          <button onClick={() => setActiveTab('models')} className={activeTab === 'models' ? 'active' : ''}><Layers size={18} /><span>Modellar</span></button>
          <button onClick={() => setActiveTab('heads')} className={activeTab === 'heads' ? 'active' : ''}><Users size={18} /><span>Bo'limlar</span></button>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <StatCard icon={Users} label="Xodimlar" value={heads.length} color="var(--accent-color)" />
        <StatCard icon={Activity} label="Modellar" value={models.length} color="#34c759" />
        <StatCard icon={UserCheck} label="Ishda" value={att} color="#34c759" />
        <StatCard icon={AlertTriangle} label="Yo'q" value={heads.length - att} color="#ff3b30" />
      </div>
    </motion.div>
  );
}

function ManageHeads({ heads, showMsg }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newRef = push(ref(rtdb, 'heads'));
      await set(newRef, { ...formData, timestamp: serverTimestamp() });
      showMsg("Saqlandi! ✅");
      setShowAdd(false);
      setFormData({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });
    } catch (err) {
      showMsg("Xato: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3>Bo'lim Boshliqlari</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary" style={{ padding: '8px 12px' }}>{showAdd ? 'Yopish' : '+ Qo\'shish'}</button>
      </div>
      {showAdd && (
        <form onSubmit={save} className="glass-card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Ism familiya" className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <input type="text" placeholder="Login" className="input-field" required value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} />
          <input type="text" placeholder="Parol" className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          <select className="input-field" value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value })}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'SAQLASH'}</button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {heads.map(h => (
          <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: '14px', fontWeight: 'bold' }}>{h.name}</div><div style={{ fontSize: '10px', color: 'var(--accent-color)' }}>{DEPARTMENTS.find(d => d.id === h.deptId)?.name}</div></div>
            <button onClick={async () => { if (window.confirm("O'chirilsinmi?")) { await remove(ref(rtdb, `heads/${h.id}`)); showMsg("O'chirildi!"); } }} style={{ color: '#ff3b30' }}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeptPanel({ user, attendance, today, showMsg }) {
  const [formData, setFormData] = useState({ model: '', action: '', details: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || DEPARTMENTS[5];
  const att = attendance.find(a => a.headId === user.id && a.date === today);
  const handle = async (e) => {
    e.preventDefault();
    try {
      const histRef = push(ref(rtdb, 'history'));
      await set(histRef, { dept: dept.name, action: formData.action, details: formData.details, model: formData.model, user: user.name, timestamp: serverTimestamp() });
      if (formData.model) {
        await set(ref(rtdb, `models/${formData.model.toLowerCase()}`), { modelName: formData.model, currentDept: dept.name, progress: dept.step || 0, updatedAt: serverTimestamp() });
      }
      showMsg('Saqlandi! ✅');
      setFormData({ ...formData, model: '', details: '' });
    } catch (e) { showMsg('Xato: ' + e.message, 'error'); }
  };
  const mark = async () => {
    await set(ref(rtdb, `attendance/${today}_${user.id}`), { headId: user.id, status: (new Date().getHours() < 8 || (new Date().getHours() === 8 && new Date().getMinutes() <= 30)) ? 'Keldi' : 'Kechikdi', date: today, timestamp: serverTimestamp() });
    showMsg("Davomat qilindi!");
  };
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}><h3>{dept.name}</h3>{!att ? <button onClick={mark} className="btn-primary" style={{ marginTop: '10px', background: '#34c759' }}>Ishga keldim</button> : <div style={{ color: '#34c759', fontWeight: 'bold' }}>🟢 {att.status}</div>}</div>
      <form onSubmit={handle} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input type="text" placeholder="Model" className="input-field" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>{dept.actions.map(act => (
          <button key={act} type="button" onClick={() => setFormData({ ...formData, action: act })}
            style={{ flex: '1 0 45%', padding: '10px', fontSize: '11px', borderRadius: '10px', border: '1px solid #333', background: formData.action === act ? 'var(--accent-color)' : 'transparent', color: formData.action === act ? '#000' : '#fff' }}>{act}</button>
        ))}</div>
        <input type="number" placeholder="Soni" className="input-field" required value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
        <button type="submit" className="btn-primary">TEZKOR YUBORISH</button>
      </form>
    </div>
  );
}

function ModelTracker({ models }) {
  return (
    <div>
      <h3 style={{ marginBottom: '15px' }}>Ish jarayoni</h3>
      {models.map(m => (
        <div key={m.id} className="glass-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><b>{m.modelName}</b></div>
          <div style={{ height: '3px', background: '#333', borderRadius: '2px' }}>
            <div style={{ width: `${(m.progress / 5) * 100}%`, height: '100%', background: '#34c759', borderRadius: '2px' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryView({ history }) {
  return (
    <div><h3 style={{ marginBottom: '15px' }}>Tarix</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{history.map(item => (<div key={item.id} className="glass-card" style={{ fontSize: '11px' }}><div style={{ color: 'var(--accent-color)' }}>{item.dept}</div><div>{item.model}: {item.action} - {item.details}</div></div>))}</div></div>
  );
}
