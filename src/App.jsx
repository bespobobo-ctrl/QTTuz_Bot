import React, { useState, useEffect } from 'react';
import {
  Users, History, LayoutDashboard, LogOut, Plus, Trash2, ChevronRight, Package, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, Clock, UserCheck, UserX, UserMinus,
  AlertTriangle, Send, Activity, Layers, Edit3, ShoppingBag, ScrollText, RefreshCcw, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp, setDoc, updateDoc
} from 'firebase/firestore';

const APP_VERSION = "1.3";

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
      const version = localStorage.getItem('qtt_version');
      if (version !== APP_VERSION) {
        localStorage.clear();
        return null;
      }
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
  const [online, setOnline] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    localStorage.setItem('qtt_version', APP_VERSION);

    const checkOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    const unsubs = [];
    try {
      unsubs.push(onSnapshot(collection(db, "heads"), s => {
        setHeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
        setDbStatus('ready');
      }, (err) => {
        console.error("Heads load error:", err);
        setDbStatus('error');
      }));

      unsubs.push(onSnapshot(query(collection(db, "history"), orderBy("timestamp", "desc")), s => {
        setHistory(s.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate()?.toLocaleString('uz-UZ') || 'Hozirgina' })));
      }));

      unsubs.push(onSnapshot(collection(db, "attendance"), s => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() })))));
      unsubs.push(onSnapshot(collection(db, "models"), s => setModels(s.docs.map(d => ({ id: d.id, ...d.data() })))));
    } catch (e) {
      console.error("Snapshot error:", e);
    }

    return () => {
      unsubs.forEach(u => u());
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
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
      alert(dbStatus === 'loading' ? 'Yuklanmoqda...' : 'Ma\'lumot topilmadi!');
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
    } catch (e) {
      alert("Xato: Ma'lumot saqlanmadi! Internetni tekshiring.");
    }
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px' }}>QTTuz Production</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={authData.login} onChange={e => setAuthData({ ...authData, login: e.target.value })} />
            <input type="password" placeholder="Parol" className="input-field" required value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })} />
            <button type="submit" className="btn-primary" style={{ height: '50px' }}>Kirish</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {dbStatus === 'loading' && <Loader2 className="animate-spin" style={{ margin: 'auto' }} size={20} />}
            <p style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '5px' }}>V{APP_VERSION} | {online ? '🟢 Online' : '🔴 Offline'}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div><h2 style={{ fontSize: '16px' }}>{user.name}</h2><p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Rahbar' : 'Xodim'}</p></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!online && <AlertTriangle color="var(--danger)" size={18} />}
          <button onClick={() => window.location.reload()}><RefreshCcw size={16} /></button>
          <button onClick={() => setUser(null)} style={{ color: 'var(--danger)' }}><LogOut size={18} /></button>
        </div>
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
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const todayAtt = attendance.filter(a => a.date === today);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="glass-card" style={{ marginBottom: '15px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{time.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}</p>
        <h2 style={{ fontSize: '26px', color: 'var(--accent-color)', fontWeight: '700' }}>{time.toLocaleTimeString('uz-UZ')}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <StatCard icon={Users} label="Xodimlar" value={heads.length} color="var(--accent-color)" />
        <StatCard icon={Activity} label="Modellar" value={models.length} color="var(--success)" />
        <StatCard icon={UserCheck} label="Ishda" value={todayAtt.filter(a => a.status === 'Keldi' || a.status === 'Kechikdi').length} color="#4caf50" />
        <StatCard icon={AlertTriangle} label="Yo'q" value={Math.max(0, heads.length - todayAtt.length)} color="var(--danger)" />
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (<div className="glass-card" style={{ textAlign: 'center', padding: '12px' }}><Icon size={18} color={color} style={{ margin: '0 auto 4px' }} /><div style={{ fontSize: '18px', fontWeight: 'bold' }}>{value}</div><div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{label}</div></div>);
}

function ManageHeads({ heads }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "heads", editingId), formData);
      } else {
        await addDoc(collection(db, "heads"), formData);
      }
      setShowAdd(false);
      setEditingId(null);
      setFormData({ name: '', login: '', password: '', deptId: DEPARTMENTS[5].id });
      alert("Muvaffaqiyatli saqlandi! ✅");
    } catch (e) {
      console.error(e);
      alert("XATO: Bazaga yozishda xatolik! " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try {
      await deleteDoc(doc(db, "heads", id));
      alert("O'chirildi! 🗑️");
    } catch (e) { alert("Xato: O'chirib bo'lmadi!"); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px' }}>Xodimlar</h3>
        <button onClick={() => { setShowAdd(!showAdd); setEditingId(null); }} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
          {showAdd ? 'Yopish' : '+ Qo\'shish'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={save} className="glass-card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Ism familiya" className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={saving} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} disabled={saving} />
            <input type="text" placeholder="Parol" className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} disabled={saving} />
          </div>
          <select className="input-field" value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value })} disabled={saving}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saqlanmoqda...' : (editingId ? 'O\'zgarishni saqlash' : 'Xodimni saqlash')}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {heads.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>Hech kim topilmadi</p> :
          heads.map(h => (
            <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{h.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--accent-color)', fontWeight: '500' }}>{DEPARTMENTS.find(d => d.id === h.deptId)?.name || 'Noma\'lum'}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '2px' }}>L: {h.login} | P: {h.password}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setFormData(h); setEditingId(h.id); setShowAdd(true); }} style={{ color: 'var(--accent-color)' }}><Edit3 size={18} /></button>
                <button onClick={() => remove(h.id)} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        }
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

  useEffect(() => { if (dept.actions.length > 0) setFormData(p => ({ ...p, action: dept.actions[0] })); }, [dept]);

  const handle = async (e) => {
    e.preventDefault();
    await addLog(dept.name, formData.action, `${formData.details} ta`, formData);
    setFormData({ ...formData, model: '', details: '', toWhom: '' });
    alert('Saqlandi! ✅');
  };

  const mark = async () => {
    const s = new Date().getHours() < 8 || (new Date().getHours() === 8 && new Date().getMinutes() <= 30) ? 'Keldi' : 'Kechikdi';
    await setDoc(doc(db, "attendance", `${today}_${user.id}`), { headId: user.id, status: s, date: today, timestamp: serverTimestamp() });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '18px', color: 'var(--accent-color)', fontWeight: '600' }}>{dept.name}</h3>
        {!att ? <button onClick={mark} className="btn-primary" style={{ marginTop: '10px', background: '#4caf50' }}>Ishga keldim (8:30)</button> :
          <div style={{ marginTop: '8px', color: '#4caf50', fontSize: '13px', fontWeight: '600' }}>🟢 Keldi: {att.status}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Xodimlar</div><div style={{ fontSize: '18px', fontWeight: '700' }}>{deptHeads.length}</div></div>
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Bugun kelgan</div><div style={{ fontSize: '18px', fontWeight: '700', color: '#4caf50' }}>{attendance.filter(a => a.date === today && deptHeads.find(h => h.id === a.headId)).length}</div></div>
      </div>

      <form onSubmit={handle} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <input type="text" placeholder="Model nomi" className="input-field" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {dept.actions.map(act => (
            <button key={act} type="button" onClick={() => setFormData({ ...formData, action: act })}
              style={{ flex: '1 0 45%', padding: '10px', fontSize: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: formData.action === act ? 'var(--accent-color)' : 'transparent', color: formData.action === act ? '#000' : '#fff', fontWeight: '500' }}>{act}</button>
          ))}
        </div>
        <input type="number" placeholder="Soni" className="input-field" required value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
        <button type="submit" className="btn-primary"><Send size={18} /> Ma'lumotni yuborish</button>
      </form>

      <h4 style={{ fontSize: '14px', marginBottom: '10px', fontWeight: '600' }}>Oxirgi harakatlar</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {deptHistory.map(h => (
          <div key={h.id} className="glass-card" style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><b>{h.model}</b> <span style={{ color: 'var(--text-dim)' }}>{h.timestamp}</span></div>
            <div style={{ color: h.action.includes('Kirim') ? '#4caf50' : '#ff5252' }}>{h.action}: {h.details}</div>
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
      <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Modellar Nazorati</h3>
      {models.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>Modellar yo'q</p> :
        models.sort((a, b) => b.updatedAt - a.updatedAt).map(m => (
          <div key={m.id} className="glass-card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-color)' }}>{m.modelName}</span>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>{m.quantity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', height: '24px', alignItems: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ position: 'absolute', top: '50%', left: 0, width: `${(m.progress / 5) * 100}%`, height: '1.5px', background: '#4caf50' }}></div>
              {steps.map(s => (<div key={s.n} style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.progress >= s.s ? '#4caf50' : '#333', border: '1px solid var(--primary-bg)' }}></div><span style={{ fontSize: '6px', color: m.progress >= s.s ? '#fff' : 'var(--text-dim)', marginTop: '2px' }}>{s.n}</span></div>))}
            </div>
          </div>
        ))}
    </motion.div>
  );
}

function HistoryView({ history }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Umumiy Tarix</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {history.map(item => (
          <div key={item.id} className="glass-card" style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: 'var(--accent-color)', fontWeight: '700' }}>{item.dept}</span><span style={{ color: 'var(--text-dim)' }}>{item.timestamp}</span></div>
            <div><b style={{ color: '#fff' }}>{item.model}</b>: {item.action} - {item.details}</div>
            <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '4px' }}>Xodim: {item.user}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
