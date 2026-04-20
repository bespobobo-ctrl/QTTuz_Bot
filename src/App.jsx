import React, { useState, useEffect } from 'react';
import {
  Users, History, LayoutDashboard, LogOut, Plus, Trash2, ChevronRight, Package, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, Clock, UserCheck, UserX, UserMinus,
  AlertTriangle, Send, Activity, Layers, Edit3, ShoppingBag, ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp, setDoc, updateDoc
} from 'firebase/firestore';

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

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "heads"), (s) => {
      setHeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setDbStatus('ready');
    }, () => setDbStatus('error'));

    onSnapshot(query(collection(db, "history"), orderBy("timestamp", "desc")), s => setHistory(s.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate()?.toLocaleString('uz-UZ') || 'Hozirgina' }))));
    onSnapshot(collection(db, "attendance"), s => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, "models"), s => setModels(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsub(); };
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

    if (dbStatus !== 'ready') return alert('Baza yuklanmoqda...');

    const head = heads.find(h => String(h.login).trim() === l && String(h.password).trim() === p);
    if (head) {
      setUser({ role: 'dept', ...head });
      setActiveTab('dept_panel');
    } else { alert('Xato!'); }
  };

  const addLog = async (deptName, action, details, extraData = {}) => {
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
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px' }}>QTTuz Production</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={authData.login} onChange={e => setAuthData({ ...authData, login: e.target.value })} />
            <input type="password" placeholder="Parol" className="input-field" required value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })} />
            <button type="submit" className="btn-primary" style={{ height: '50px' }}>Kirish</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div><h2 style={{ fontSize: '16px' }}>{user.name}</h2><p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Rahbar Panel' : 'Xodim Panel'}</p></div>
        <button onClick={() => setUser(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}><LogOut size={18} /></button>
      </header>

      <main style={{ flex: 1, padding: '15px', paddingBottom: '90px', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {user.role === 'admin' && activeTab === 'dashboard' && <AdminDashboard heads={heads} attendance={attendance} today={today} models={models} />}
          {user.role === 'admin' && activeTab === 'heads' && <ManageHeads heads={heads} />}
          {user.role === 'admin' && activeTab === 'models' && <ModelTracker models={models} />}
          {user.role === 'admin' && activeTab === 'history' && <HistoryView history={history} />}
          {(user.role === 'dept' || (user.role === 'admin' && activeTab === 'dept_panel')) && <DeptPanel user={user} addLog={addLog} attendance={attendance} today={today} history={history} heads={heads} />}
        </AnimatePresence>
      </main>

      {user.role === 'admin' && (
        <nav className="footer-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}><LayoutDashboard size={20} /><span>Xulosa</span></button>
          <button onClick={() => setActiveTab('models')} className={`nav-item ${activeTab === 'models' ? 'active' : ''}`}><Layers size={20} /><span>Modellar</span></button>
          <button onClick={() => setActiveTab('heads')} className={`nav-item ${activeTab === 'heads' ? 'active' : ''}`}><Users size={20} /><span>Xodimlar</span></button>
          <button onClick={() => setActiveTab('history')} className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}><History size={20} /><span>Tarix</span></button>
        </nav>
      )}
    </div>
  );
}

function AdminDashboard({ heads, attendance, today, models }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const todayAtt = attendance.filter(a => a.date === today);
  const onTime = todayAtt.filter(a => a.status === 'Keldi').length;
  const late = todayAtt.filter(a => a.status === 'Kechikdi').length;
  const perm = todayAtt.filter(a => a.status === 'Sababli' || a.status === 'Ruhsatli').length;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="glass-card" style={{ marginBottom: '15px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{time.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h2 style={{ fontSize: '26px', color: 'var(--accent-color)', fontWeight: 'bold' }}>{time.toLocaleTimeString('uz-UZ')}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <StatCard icon={Users} label="Jami ishchi" value={heads.length} color="var(--accent-color)" />
        <StatCard icon={Activity} label="Ishdagi Modellar" value={models.length} color="var(--success)" />
        <StatCard icon={Clock} label="Kechikkan" value={late} color="#ff9800" />
        <StatCard icon={AlertTriangle} label="Kelmagan" value={Math.max(0, heads.length - (onTime + late + perm))} color="var(--danger)" />
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (<div className="glass-card" style={{ textAlign: 'center', padding: '12px' }}><Icon size={18} color={color} style={{ marginBottom: '4px' }} /><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{value}</div><div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{label}</div></div>);
}

function DeptPanel({ user, addLog, attendance, today, history, heads }) {
  const [formData, setFormData] = useState({ model: '', action: '', details: '', toWhom: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || DEPARTMENTS[5];
  const att = attendance.find(a => a.headId === user.id && a.date === today);

  // Bo'lim statistikasi
  const deptHeads = heads.filter(h => h.deptId === user.deptId);
  const deptAtt = attendance.filter(a => a.date === today && deptHeads.find(h => h.id === a.headId));
  const present = deptAtt.filter(a => a.status === 'Keldi' || a.status === 'Kechikdi').length;

  const deptHistory = history.filter(h => h.dept === dept.name).slice(0, 5);

  useEffect(() => { if (dept.actions.length > 0) setFormData(p => ({ ...p, action: dept.actions[0] })); }, [dept]);

  const handle = (e) => { e.preventDefault(); addLog(dept.name, formData.action, `${formData.details} ta`, formData); setFormData({ ...formData, model: '', details: '', toWhom: '' }); alert('Saqlandi!'); };

  const mark = async () => {
    const s = new Date().getHours() < 8 || (new Date().getHours() === 8 && new Date().getMinutes() <= 30) ? 'Keldi' : 'Kechikdi';
    await setDoc(doc(db, "attendance", `${today}_${user.id}`), { headId: user.id, status: s, date: today, timestamp: serverTimestamp() });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '20px', color: 'var(--accent-color)' }}>{dept.name}</h3>
        {!att ? <button onClick={mark} className="btn-primary" style={{ marginTop: '10px', background: 'var(--success)' }}>Ishga keldim (8:30)</button> :
          <div style={{ marginTop: '5px', color: 'var(--success)', fontSize: '12px' }}>🟢 Davomat qayd etilgan ({att.status})</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
        <div className="glass-card" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Bo'lim ishchilari</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{deptHeads.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Kelganlar</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success)' }}>{present}</div>
        </div>
      </div>

      <form onSubmit={handle} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
        <input type="text" placeholder="Model nomi" className="input-field" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
        <div style={{ display: 'flex', gap: '5px' }}>
          {dept.actions.map(act => (
            <button key={act} type="button" onClick={() => setFormData({ ...formData, action: act })}
              style={{ flex: 1, padding: '10px', fontSize: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: formData.action === act ? 'var(--accent-color)' : 'transparent', color: formData.action === act ? '#000' : '#fff' }}>{act}</button>
          ))}
        </div>
        <input type="number" placeholder="Soni" className="input-field" required value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Send size={16} /> Saqlash</button>
      </form>

      <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>Bo'lim Tarixi (Oxirgi 5 ta)</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {deptHistory.map(h => (
          <div key={h.id} className="glass-card" style={{ fontSize: '11px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{h.model}</b> <span>{h.timestamp}</span></div>
            <div style={{ color: h.action === 'Kirim' ? 'var(--success)' : 'var(--danger)' }}>{h.action}: {h.details}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ManageHeads({ heads }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });
  const save = async (e) => {
    e.preventDefault();
    if (editingId) await updateDoc(doc(db, "heads", editingId), formData);
    else await addDoc(collection(db, "heads"), formData);
    setShowAdd(false); setEditingId(null); setFormData({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h3>Xodimlar</h3><button onClick={() => { setShowAdd(!showAdd); setEditingId(null); }} className="btn-primary" style={{ padding: '6px 12px' }}>{showAdd ? 'Yopish' : '+ Yangi'}</button></div>
      {showAdd && (
        <form onSubmit={save} className="glass-card" style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Ism" className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <div style={{ display: 'flex', gap: '8px' }}><input type="text" placeholder="Login" className="input-field" required value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} />
            <input type="text" placeholder="Parol" className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
          <select className="input-field" value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value })} style={{ background: '#1a2a3a' }}>{DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <button type="submit" className="btn-primary">{editingId ? 'Saqlash' : 'Qo\'shish'}</button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {heads.map(h => (
          <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
            <div><div style={{ fontSize: '13px', fontWeight: 'bold' }}>{h.name}</div><div style={{ fontSize: '10px', color: 'var(--accent-color)' }}>{DEPARTMENTS.find(d => d.id === h.deptId)?.name}</div></div>
            <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => { setFormData(h); setEditingId(h.id); setShowAdd(true); }} style={{ color: 'var(--accent-color)', background: 'none' }}><Edit3 size={16} /></button>
              <button onClick={() => deleteDoc(doc(db, "heads", h.id))} style={{ color: 'var(--danger)', background: 'none' }}><Trash2 size={16} /></button></div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ModelTracker({ models }) {
  const steps = [{ n: 'Ombor', s: 0.2 }, { n: 'Mato', s: 0.5 }, { n: 'Bichuv', s: 1 }, { n: 'Taqsim', s: 2 }, { n: 'Tikuv', s: 3 }, { n: 'Upak', s: 4 }, { n: 'Tayyor', s: 5 }];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 style={{ marginBottom: '15px' }}>Modellar Nazorati (Live)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {models.map(m => (
          <div key={m.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><b>{m.modelName}</b> <span>{m.quantity}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', height: '24px', alignItems: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ position: 'absolute', top: '50%', left: 0, width: `${(m.progress / 5) * 100}%`, height: '2px', background: 'var(--success)' }}></div>
              {steps.map(s => (<div key={s.n} style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.progress >= s.s ? 'var(--success)' : '#333' }}></div><span style={{ fontSize: '6px', color: 'var(--text-dim)' }}>{s.n}</span></div>))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function HistoryView({ history }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 style={{ marginBottom: '15px' }}>Batafsil Tarix</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {history.map(item => (
          <div key={item.id} className="glass-card" style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{item.dept}</span><span>{item.timestamp}</span></div>
            <div><b>{item.model}</b>: {item.action} - {item.details}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
