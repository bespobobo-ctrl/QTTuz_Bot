import React, { useState, useEffect } from 'react';
import {
  Users, History, LayoutDashboard, LogOut, Plus, Trash2, ChevronRight, Package, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, Clock, UserCheck, UserX, UserMinus,
  AlertTriangle, Send, Activity, Layers, Edit3, ShoppingBag, ScrollText, RefreshCcw, Loader2,
  WifiOff, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp, setDoc, updateDoc, getDocs, limit
} from 'firebase/firestore';

const APP_VERSION = "1.5";

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
  const [dbStatus, setDbStatus] = useState('connecting');
  const [msg, setMsg] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  };

  useEffect(() => {
    localStorage.setItem('qtt_version', APP_VERSION);
    const unsubs = [];

    const setupListeners = () => {
      try {
        unsubs.push(onSnapshot(collection(db, "heads"), s => {
          setHeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
          setDbStatus('ready');
        }, e => {
          console.error(e);
          setDbStatus('error');
          showMsg("Baza bilan aloqa yo'q! (Permission Denied)", "error");
        }));

        unsubs.push(onSnapshot(query(collection(db, "history"), orderBy("timestamp", "desc")), s => setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })))));
        unsubs.push(onSnapshot(collection(db, "attendance"), s => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() })))));
        unsubs.push(onSnapshot(collection(db, "models"), s => setModels(s.docs.map(d => ({ id: d.id, ...d.data() })))));
      } catch (err) { setDbStatus('error'); }
    };

    setupListeners();
    return () => unsubs.forEach(u => u());
  }, []);

  const testDB = async () => {
    setDbStatus('testing');
    try {
      const q = query(collection(db, "heads"), limit(1));
      await getDocs(q);
      showMsg("Baza ishlayapti! ✅");
      setDbStatus('ready');
    } catch (e) {
      showMsg("Baza ulanmagan! ❌ " + e.message, "error");
      setDbStatus('error');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (authData.login === '0068' && authData.password === '0068') {
      setUser({ role: 'admin', name: 'Rahbar' });
      setActiveTab('dashboard');
      return;
    }
    const head = heads.find(h => String(h.login) === authData.login && String(h.password) === authData.password);
    if (head) { setUser({ role: 'dept', ...head }); setActiveTab('dept_panel'); }
    else showMsg('Login yoki parol xato!', 'error');
  };

  const addLog = async (deptName, action, details, extraData = {}) => {
    try {
      await addDoc(collection(db, "history"), { dept: deptName, action, details, model: extraData.model || '', user: user.name, timestamp: serverTimestamp() });
      if (extraData.model) {
        await setDoc(doc(db, "models", extraData.model.toLowerCase()), { modelName: extraData.model, currentDept: deptName, updatedAt: serverTimestamp(), progress: DEPARTMENTS.find(d => d.name === deptName)?.step || 0 }, { merge: true });
      }
      showMsg('Saqlandi! ✅');
    } catch (e) { showMsg('Xato: Saqlanmadi!', 'error'); }
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px' }}>QTTuz V{APP_VERSION}</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={authData.login} onChange={e => setAuthData({ ...authData, login: e.target.value })} />
            <input type="password" placeholder="Parol" className="input-field" required value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })} />
            <button type="submit" className="btn-primary">Kirish</button>
          </form>
          <button onClick={testDB} style={{ marginTop: '20px', width: '100%', background: 'none', border: '1px solid #333', color: '#666', fontSize: '10px', padding: '10px', borderRadius: '10px' }}>
            {dbStatus === 'testing' ? 'Tekshirilmoqda...' : 'Bazani tekshirish'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            style={{ position: 'fixed', top: '10px', left: '10px', right: '10px', background: msg.type === 'error' ? '#ff4444' : '#00C851', color: '#fff', padding: '15px', borderRadius: '12px', zIndex: 10000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="header">
        <div><h2 style={{ fontSize: '16px' }}>{user.name}</h2><p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Rahbar' : 'Xodim'}</p></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={testDB}><Database size={16} color={dbStatus === 'ready' ? '#4caf50' : '#ff4444'} /></button>
          <button onClick={() => window.location.reload()}><RefreshCcw size={16} /></button>
          <button onClick={() => setUser(null)} style={{ color: '#ff4444' }}><LogOut size={18} /></button>
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
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}><LayoutDashboard size={18} /><span>Dashboard</span></button>
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
      <div className="glass-card" style={{ marginBottom: '15px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Xulosa</h2>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Bugun: {new Date().toLocaleDateString()}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <StatCard icon={Users} label="Xodimlar" value={heads.length} color="var(--accent-color)" />
        <StatCard icon={Activity} label="Modellar" value={models.length} color="#00C851" />
        <StatCard icon={UserCheck} label="Ishda" value={todayAtt.length} color="#00C851" />
        <StatCard icon={AlertTriangle} label="Yo'q" value={heads.length - todayAtt.length} color="#ff4444" />
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (<div className="glass-card" style={{ textAlign: 'center', padding: '15px' }}><Icon size={18} color={color} style={{ margin: '0 auto 5px' }} /><div style={{ fontSize: '20px', fontWeight: 'bold' }}>{value}</div><div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{label}</div></div>);
}

function ManageHeads({ heads, showMsg }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Timeout funksiyasi
    const timeout = setTimeout(() => {
      if (saving) {
        setSaving(false);
        showMsg("Xato: Baza javob bermayapti! Internetni tekshiring.", "error");
      }
    }, 8000);

    try {
      await addDoc(collection(db, "heads"), { ...formData, createdAt: serverTimestamp() });
      clearTimeout(timeout);
      showMsg("Muvaffaqiyatli saqlandi! ✅");
      setShowAdd(false);
      setFormData({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });
    } catch (err) {
      clearTimeout(timeout);
      showMsg("Baza xatosi: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3>Xodimlar</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary" style={{ padding: '8px 12px' }}>{showAdd ? 'Yopish' : '+ Qo\'shish'}</button>
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
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Bazaga yozilmoqda...' : 'Saqlash'}</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {heads.map(h => (
          <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: '14px', fontWeight: 'bold' }}>{h.name}</div><div style={{ fontSize: '10px', color: 'var(--accent-color)' }}>{DEPARTMENTS.find(d => d.id === h.deptId)?.name || 'Noma\'lum'}</div><div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>L: {h.login} | P: {h.password}</div></div>
            <button onClick={async () => { if (window.confirm("O'chirilsinmi?")) { await deleteDoc(doc(db, "heads", h.id)); showMsg("O'chirildi!"); } }} style={{ color: '#ff4444' }}><Trash2 size={18} /></button>
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
  const handle = async (e) => { e.preventDefault(); await addLog(dept.name, formData.action, `${formData.details} ta`, formData); setFormData({ ...formData, model: '', details: '', toWhom: '' }); };
  const mark = async () => {
    const s = new Date().getHours() < 8 || (new Date().getHours() === 8 && new Date().getMinutes() <= 30) ? 'Keldi' : 'Kechikdi';
    await setDoc(doc(db, "attendance", `${today}_${user.id}`), { headId: user.id, status: s, date: today, timestamp: serverTimestamp() });
  };
  return (
    <motion.div initial={{ opacity: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}><h3 style={{ fontSize: '20px', color: 'var(--accent-color)' }}>{dept.name}</h3>{!att ? <button onClick={mark} className="btn-primary" style={{ marginTop: '10px', background: '#00C851' }}>Ishga keldim</button> : <div style={{ marginTop: '8px', color: '#00C851' }}>🟢 {att.status}</div>}</div>
      <form onSubmit={handle} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input type="text" placeholder="Model" className="input-field" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>{dept.actions.map(act => (
          <button key={act} type="button" onClick={() => setFormData({ ...formData, action: act })}
            style={{ flex: '1 0 45%', padding: '10px', fontSize: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: formData.action === act ? 'var(--accent-color)' : 'transparent', color: formData.action === act ? '#000' : '#fff' }}>{act}</button>
        ))}</div>
        <input type="number" placeholder="Soni" className="input-field" required value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
        <button type="submit" className="btn-primary">Yuborish</button>
      </form>
    </motion.div>
  );
}

function ModelTracker({ models }) {
  const steps = [{ n: 'Ombor', s: 0.2 }, { n: 'Mato', s: 0.5 }, { n: 'Bichuv', s: 1 }, { n: 'Taqsim', s: 2 }, { n: 'Tikuv', s: 3 }, { n: 'Upak', s: 4 }, { n: 'Tayyor', s: 5 }];
  return (
    <motion.div initial={{ opacity: 0 }}>
      <h3 style={{ marginBottom: '15px' }}>Jarayon</h3>
      {models.sort((a, b) => b.updatedAt - a.updatedAt).map(m => (
        <div key={m.id} className="glass-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><b>{m.modelName}</b> <span>{m.quantity}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', height: '16px', alignItems: 'center' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: 0, width: `${(m.progress / 5) * 100}%`, height: '2px', background: '#00C851' }}></div>
            {steps.map(s => (<div key={s.n} style={{ zIndex: 3 }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.progress >= s.s ? '#00C851' : '#333' }}></div></div>))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function HistoryView({ history }) {
  return (
    <motion.div initial={{ opacity: 0 }}><h3 style={{ marginBottom: '15px' }}>Tarix</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{history.map(item => (<div key={item.id} className="glass-card" style={{ fontSize: '11px' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--accent-color)' }}>{item.dept}</span><span>{item.timestamp}</span></div><div>{item.model}: {item.action} - {item.details}</div></div>))}</div></motion.div>
  );
}
