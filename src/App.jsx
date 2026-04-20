import React, { useState, useEffect } from 'react';
import {
  Users, History, LayoutDashboard, LogOut, Plus, Trash2, ChevronRight, Package, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, Clock, UserCheck, UserX, UserMinus,
  AlertTriangle, Send, Activity, Layers, Edit3, ShoppingBag, ScrollText, RefreshCcw, Loader2,
  CheckCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp, setDoc, updateDoc
} from 'firebase/firestore';

const APP_VERSION = "1.4"; // Majburiy yangilash uchun

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
      const version = localStorage.getItem('qtt_version');
      if (version !== APP_VERSION) {
        localStorage.clear();
        return null;
      }
      const saved = localStorage.getItem('qtt_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [authData, setAuthData] = useState({ login: '', password: '' });
  const [heads, setHeads] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [models, setModels] = useState([]);
  const [dbStatus, setDbStatus] = useState('loading');
  const [msg, setMsg] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  useEffect(() => {
    localStorage.setItem('qtt_version', APP_VERSION);
    const unsubs = [];
    try {
      unsubs.push(onSnapshot(collection(db, "heads"), s => {
        setHeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
        setDbStatus('ready');
      }));
      unsubs.push(onSnapshot(query(collection(db, "history"), orderBy("timestamp", "desc")), s => {
        setHistory(s.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate()?.toLocaleString('uz-UZ') || 'Hozirgina' })));
      }));
      unsubs.push(onSnapshot(collection(db, "attendance"), s => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() })))));
      unsubs.push(onSnapshot(collection(db, "models"), s => setModels(s.docs.map(d => ({ id: d.id, ...d.data() })))));
    } catch (e) { setDbStatus('error'); }
    return () => unsubs.forEach(u => u());
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('qtt_user', JSON.stringify(user));
    else localStorage.removeItem('qtt_user');
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    const l = authData.login.trim();
    const p = authData.password.trim();

    if (l === '0068' && p === '0068') {
      setUser({ role: 'admin', name: 'Rahbar' });
      setActiveTab('dashboard');
      return;
    }

    const head = heads.find(h => String(h.login).trim() === l && String(h.password).trim() === p);
    if (head) {
      setUser({ role: 'dept', ...head });
      setActiveTab('dept_panel');
    } else {
      showMsg('Login yoki parol noto\'g\'ri!', 'error');
    }
  };

  const addLog = async (deptName, action, details, extraData = {}) => {
    try {
      const logData = {
        dept: deptName, action, details, model: extraData.model || '',
        toWhom: extraData.toWhom || '', user: user.name, timestamp: serverTimestamp()
      };
      await addDoc(collection(db, "history"), logData);
      if (extraData.model) {
        await setDoc(doc(db, "models", extraData.model.toLowerCase()), {
          modelName: extraData.model, currentDept: deptName, lastAction: action,
          quantity: details, updatedAt: serverTimestamp(),
          progress: DEPARTMENTS.find(d => d.name === deptName)?.step || 0
        }, { merge: true });
      }
      showMsg('Muvaffaqiyatli saqlandi! ✅');
    } catch (e) {
      showMsg('Xato: Saqlanmadi!', 'error');
    }
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px' }}>QTTuz Production</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={authData.login} onChange={e => setAuthData({ ...authData, login: e.target.value })} />
            <input type="password" placeholder="Parol" className="input-field" required value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })} />
            <button type="submit" className="btn-primary" style={{ height: '50px' }}>Kirish</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Versiya: {APP_VERSION}</p>
            {msg && <p style={{ fontSize: '12px', color: msg.type === 'error' ? 'var(--danger)' : 'var(--success)', marginTop: '5px' }}>{msg.text}</p>}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}
            style={{ position: 'fixed', top: '20px', left: '20px', right: '20px', background: msg.type === 'error' ? 'var(--danger)' : 'var(--success)', color: '#000', padding: '15px', borderRadius: '12px', zIndex: 1000, textAlign: 'center', fontWeight: 'bold' }}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="header">
        <div><h2 style={{ fontSize: '16px' }}>{user.name}</h2><p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Rahbar' : 'Xodim'}</p></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.location.reload()}><RefreshCcw size={16} /></button>
          <button onClick={() => setUser(null)} style={{ color: 'var(--danger)' }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '15px', paddingBottom: '90px', overflowY: 'auto' }}>
        {user.role === 'admin' && activeTab === 'dashboard' && <AdminDashboard heads={heads} attendance={attendance} today={today} models={models} />}
        {user.role === 'admin' && activeTab === 'heads' && <ManageHeads heads={heads} showMsg={showMsg} />}
        {user.role === 'admin' && activeTab === 'models' && <ModelTracker models={models} />}
        {user.role === 'admin' && activeTab === 'history' && <HistoryView history={history} />}
        {(user.role === 'dept' || (user.role === 'admin' && activeTab === 'dept_panel')) && <DeptPanel user={user} addLog={addLog} attendance={attendance} today={today} history={history} heads={heads} />}
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

function AdminDashboard({ heads, attendance, today, models }) {
  const todayAtt = attendance.filter(a => a.date === today);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="glass-card" style={{ marginBottom: '15px', padding: '20px' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--accent-color)', fontWeight: 'bold' }}>Dashboard</h2>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Bugun: {new Date().toLocaleDateString('uz-UZ')}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <StatCard icon={Users} label="Xodimlar" value={heads.length} color="var(--accent-color)" />
        <StatCard icon={Activity} label="Modellar" value={models.length} color="var(--success)" />
        <StatCard icon={UserCheck} label="Ishda" value={todayAtt.filter(a => a.status !== 'Yo\'q').length} color="#4caf50" />
        <StatCard icon={AlertTriangle} label="Yo'q" value={Math.max(0, heads.length - todayAtt.length)} color="var(--danger)" />
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (<div className="glass-card" style={{ textAlign: 'center', padding: '15px' }}><Icon size={18} color={color} style={{ margin: '0 auto 5px' }} /><div style={{ fontSize: '18px', fontWeight: 'bold' }}>{value}</div><div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{label}</div></div>);
}

function ManageHeads({ heads, showMsg }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "heads", editingId), { ...formData, updatedAt: serverTimestamp() });
        showMsg("Muvaffaqiyatli o'zgartirildi! ✅");
      } else {
        await addDoc(collection(db, "heads"), { ...formData, createdAt: serverTimestamp() });
        showMsg("Muvaffaqiyatli saqlandi! ✅");
      }
      setShowAdd(false);
      setEditingId(null);
      setFormData({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });
    } catch (e) {
      showMsg("XATO: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px' }}>Xodimlar</h3>
        <button onClick={() => { setShowAdd(!showAdd); setEditingId(null); }} className="btn-primary" style={{ padding: '8px 16px' }}>
          {showAdd ? 'Yopish' : '+ Qo\'shish'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={save} className="glass-card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Ism familiya" className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} />
            <input type="text" placeholder="Parol" className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <select className="input-field" value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value })}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {heads.map(h => (
          <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{h.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--accent-color)' }}>{DEPARTMENTS.find(d => d.id === h.deptId)?.name || 'Noma\'lum'}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>L: {h.login} | P: {h.password}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setFormData(h); setEditingId(h.id); setShowAdd(true); }} style={{ color: 'var(--accent-color)' }}><Edit3 size={18} /></button>
              <button onClick={async () => { if (window.confirm("O'chirilsinmi?")) { await deleteDoc(doc(db, "heads", h.id)); showMsg("O'chirildi!"); } }} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DeptPanel({ user, addLog, attendance, today, history, heads }) {
  const [formData, setFormData] = useState({ model: '', action: '', details: '', toWhom: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || { name: 'Bo\'lim', actions: ['Kirim', 'Chiqim'] };
  const att = attendance.find(a => a.headId === user.id && a.date === today);
  const deptHeads = heads.filter(h => h.deptId === user.deptId);
  const deptHistory = history.filter(h => h.dept === dept.name).slice(0, 5);
  const handle = async (e) => { e.preventDefault(); await addLog(dept.name, formData.action, `${formData.details} ta`, formData); setFormData({ ...formData, model: '', details: '', toWhom: '' }); };
  const mark = async () => {
    const s = new Date().getHours() < 8 || (new Date().getHours() === 8 && new Date().getMinutes() <= 30) ? 'Keldi' : 'Kechikdi';
    await setDoc(doc(db, "attendance", `${today}_${user.id}`), { headId: user.id, status: s, date: today, timestamp: serverTimestamp() });
  };
  return (
    <motion.div initial={{ opacity: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '20px', color: 'var(--accent-color)' }}>{dept.name}</h3>
        {!att ? <button onClick={mark} className="btn-primary" style={{ marginTop: '10px', background: 'var(--success)' }}>Ishga keldim</button> : <div style={{ marginTop: '8px', color: 'var(--success)' }}>🟢 {att.status}</div>}
      </div>
      <form onSubmit={handle} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
        <input type="text" placeholder="Model" className="input-field" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>{dept.actions.map(act => (
          <button key={act} type="button" onClick={() => setFormData({ ...formData, action: act })}
            style={{ flex: '1 0 45%', padding: '10px', fontSize: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: formData.action === act ? 'var(--accent-color)' : 'transparent', color: formData.action === act ? '#000' : '#fff' }}>{act}</button>
        ))}</div>
        <input type="number" placeholder="Soni" className="input-field" required value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
        <button type="submit" className="btn-primary">Saqlash</button>
      </form>
    </motion.div>
  );
}

function ModelTracker({ models }) {
  const steps = [{ n: 'Ombor', s: 0.2 }, { n: 'Mato', s: 0.5 }, { n: 'Bichuv', s: 1 }, { n: 'Taqsim', s: 2 }, { n: 'Tikuv', s: 3 }, { n: 'Upak', s: 4 }, { n: 'Tayyor', s: 5 }];
  return (
    <motion.div initial={{ opacity: 0 }}>
      <h3 style={{ marginBottom: '15px' }}>Line Progress</h3>
      {models.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Hali boshlanmagan</p> :
        models.sort((a, b) => b.updatedAt - a.updatedAt).map(m => (
          <div key={m.id} className="glass-card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><b>{m.modelName}</b> <span>{m.quantity}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', height: '20px', alignItems: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ position: 'absolute', top: '50%', left: 0, width: `${(m.progress / 5) * 100}%`, height: '2px', background: 'var(--success)' }}></div>
              {steps.map(s => (<div key={s.n} style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.progress >= s.s ? 'var(--success)' : '#333' }}></div><span style={{ fontSize: '6px', color: 'var(--text-dim)' }}>{s.n}</span></div>))}
            </div>
          </div>
        ))}
    </motion.div>
  );
}

function HistoryView({ history }) {
  return (
    <motion.div initial={{ opacity: 0 }}>
      <h3 style={{ marginBottom: '15px' }}>Tarix</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {history.map(item => (
          <div key={item.id} className="glass-card" style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--accent-color)' }}>{item.dept}</span><span>{item.timestamp}</span></div>
            <div><b>{item.model}</b>: {item.action} - {item.details}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
