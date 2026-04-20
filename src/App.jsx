import React, { useState, useEffect } from 'react';
import {
  Users,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Trash2,
  ChevronRight,
  Package,
  Scissors,
  Truck,
  Box,
  Warehouse,
  CheckCircle2,
  Home,
  Wrench,
  Clock,
  UserCheck,
  UserX,
  UserMinus,
  AlertTriangle,
  Send,
  Activity,
  Layers,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const DEPARTMENTS = [
  { id: 'bichuv', name: 'Bichuv Bo\'limi', icon: Scissors, actions: ['Bichildi'], step: 1 },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', icon: Truck, actions: ['Ishga berildi', 'Kraskaga yuborildi', 'Vishivkaga yuborildi', 'Pressga yuborildi', 'Natija qaytdi'], step: 2 },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', icon: Activity, actions: ['Tikuv bitdi'], step: 3 },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', icon: Box, actions: ['Upakovka bitdi', 'Tayyorga topshirildi'], step: 4 },
  { id: 'ombor', name: 'Ombor Bo\'limi', icon: Warehouse, actions: ['Kirim', 'Chiqim'], step: 0 },
  { id: 'tayyor', name: 'Tayyor mahsulot', icon: CheckCircle2, actions: ['Qabul qilindi'], step: 5 },
  { id: 'xo\'jalik', name: 'Xo\'jalik Bo\'limi', icon: Home, actions: ['Xarajat', 'Kirim'], step: 0 },
  { id: 'ekspremetal', name: 'Ekspremetal', icon: Wrench, actions: ['Namuna tayyor'], step: 0 },
  { id: 'kadirlar', name: 'Kadirlar Bo\'limi', icon: Users, actions: ['Hujjatlash'], step: 0 },
];

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('qtt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authData, setAuthData] = useState({ login: '', password: '' });
  const [heads, setHeads] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsubHeads = onSnapshot(collection(db, "heads"), s => {
      setHeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubHistory = onSnapshot(query(collection(db, "history"), orderBy("timestamp", "desc")), s => setHistory(s.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate()?.toLocaleString('uz-UZ') || 'Hozirgina' }))));
    const unsubAtt = onSnapshot(collection(db, "attendance"), s => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubModels = onSnapshot(collection(db, "models"), s => setModels(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubHeads(); unsubHistory(); unsubAtt(); unsubModels(); };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('qtt_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qtt_user');
    }
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loading) return alert('Ma\'lumotlar yuklanmoqda, iltimos kuting...');

    const loginTrim = authData.login.trim();
    const passTrim = authData.password.trim();

    if (loginTrim === '0068' && passTrim === '0068') {
      setUser({ role: 'admin', name: 'Rahbar' });
      setActiveTab('dashboard');
    } else {
      const head = heads.find(h =>
        h.login.toString().trim() === loginTrim &&
        h.password.toString().trim() === passTrim
      );
      if (head) {
        setUser({ role: 'dept', ...head });
        setActiveTab('dept_panel');
      } else {
        alert('Login yoki parol xato! Xodim ma\'lumotini tekshirib ko\'ring.');
      }
    }
  };

  const addLog = async (deptName, action, details, extraData = {}) => {
    const logData = {
      dept: deptName, action, details,
      model: extraData.model || '',
      toWhom: extraData.toWhom || '',
      user: user.name,
      timestamp: serverTimestamp()
    };
    await addDoc(collection(db, "history"), logData);

    if (extraData.model) {
      await setDoc(doc(db, "models", extraData.model.toLowerCase()), {
        modelName: extraData.model,
        currentDept: deptName,
        lastAction: action,
        quantity: details,
        updatedAt: serverTimestamp(),
        progress: DEPARTMENTS.find(d => d.name === deptName)?.step || 0
      }, { merge: true });
    }
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-color)' }}>QTTuz Production</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Tizimga kirish</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={authData.login} onChange={(e) => setAuthData({ ...authData, login: e.target.value })} />
            <input type="password" placeholder="Parol" className="input-field" required value={authData.password} onChange={(e) => setAuthData({ ...authData, password: e.target.value })} />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Yuklanmoqda...' : 'Kirish'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h2 style={{ fontSize: '16px' }}>{user.name}</h2>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Rahbar Panel' : 'Xodim Panel'}</p>
        </div>
        <button onClick={() => setUser(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
          <LogOut size={18} />
        </button>
      </header>

      <main style={{ flex: 1, padding: '15px', paddingBottom: '90px', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {user.role === 'admin' && activeTab === 'dashboard' && <AdminDashboard heads={heads} attendance={attendance} today={today} models={models} />}
          {user.role === 'admin' && activeTab === 'heads' && <ManageHeads heads={heads} />}
          {user.role === 'admin' && activeTab === 'models' && <ModelTracker models={models} />}
          {user.role === 'admin' && activeTab === 'history' && <HistoryView history={history} />}
          {(user.role === 'dept' || (user.role === 'admin' && activeTab === 'dept_panel')) && (
            <DeptPanel user={user} addLog={addLog} attendance={attendance} today={today} />
          )}
        </AnimatePresence>
      </main>

      {user.role === 'admin' && (
        <nav className="footer-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <LayoutDashboard size={20} />
            <span>Xulosa</span>
          </button>
          <button onClick={() => setActiveTab('models')} className={`nav-item ${activeTab === 'models' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <Layers size={20} />
            <span>Modellar</span>
          </button>
          <button onClick={() => setActiveTab('heads')} className={`nav-item ${activeTab === 'heads' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <Users size={20} />
            <span>Xodimlar</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <History size={20} />
            <span>Tarix</span>
          </button>
        </nav>
      )}
    </div>
  );
}

function AdminDashboard({ heads, attendance, today, models }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayAttendance = attendance.filter(a => a.date === today);
  const onTimeCount = todayAttendance.filter(a => a.status === 'Keldi').length;
  const lateCount = todayAttendance.filter(a => a.status === 'Kechikdi').length;
  const permissionCount = todayAttendance.filter(a => a.status === 'Sababli' || a.status === 'Ruhsatli').length;
  const notCameCount = heads.length - (onTimeCount + lateCount + permissionCount);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="glass-card" style={{ marginBottom: '15px', borderLeft: '4px solid var(--accent-color)' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{time.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h2 style={{ fontSize: '26px', color: 'var(--accent-color)', fontWeight: 'bold' }}>{time.toLocaleTimeString('uz-UZ')}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <StatCard icon={Users} label="Jami ishchi" value={heads.length} color="var(--accent-color)" />
        <StatCard icon={Activity} label="Ishdagi Modellar" value={models.length} color="var(--success)" />
        <StatCard icon={Clock} label="Kechikkanlar" value={lateCount} color="#ff9800" />
        <StatCard icon={AlertTriangle} label="Kelmaganlar" value={Math.max(0, notCameCount)} color="var(--danger)" />
      </div>

      <h3 style={{ marginBottom: '10px', fontSize: '15px' }}>Eng so'nggi harakatlar</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {models.length === 0 ? <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Modellar yo'q</p> :
          models.slice(0, 5).sort((a, b) => b.updatedAt - a.updatedAt).map(m => (
            <div key={m.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{m.modelName}</div>
                <div style={{ fontSize: '10px', color: 'var(--success)' }}>{m.currentDept} da</div>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{m.lastAction}</div>
            </div>
          ))
        }
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '12px' }}>
      <Icon size={20} color={color} style={{ marginBottom: '5px' }} />
      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{label}</div>
    </div>
  );
}

function ModelTracker({ models }) {
  const steps = [{ name: 'Bichuv', step: 1 }, { name: 'Taqsimot', step: 2 }, { name: 'Tikuv', step: 3 }, { name: 'Upakovka', step: 4 }, { name: 'Tayyor', step: 5 }];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 style={{ marginBottom: '15px' }}>Modellar Nazorati (Live)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {models.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Hali modellar kiritilmagan</p> :
          models.sort((a, b) => b.updatedAt - a.updatedAt).map(m => (
            <div key={m.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-color)' }}>{m.modelName}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{m.quantity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', height: '30px', alignItems: 'center' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', top: '50%', left: 0, width: `${(m.progress / 5) * 100}%`, height: '2px', background: 'var(--success)', zIndex: 2 }}></div>
                {steps.map(s => (
                  <div key={s.name} style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: m.progress >= s.step ? 'var(--success)' : '#333', border: '2px solid var(--primary-bg)' }}></div>
                    <span style={{ fontSize: '7px', marginTop: '4px', color: m.progress >= s.step ? '#fff' : 'var(--text-dim)' }}>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        }
      </div>
    </motion.div>
  );
}

function ManageHeads({ heads }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', login: '', password: '', deptId: DEPARTMENTS[0].id });

  const saveHead = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, "heads", editingId), formData);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "heads"), formData);
    }
    setShowAdd(false);
    setFormData({ name: '', login: '', password: '', deptId: DEPARTMENTS[0].id });
  };

  const startEdit = (head) => {
    setFormData({ name: head.name, login: head.login, password: head.password, deptId: head.deptId });
    setEditingId(head.id);
    setShowAdd(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <h3>Xodimlarni Boshqarish</h3>
        <button onClick={() => { setShowAdd(!showAdd); setEditingId(null); }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
          {showAdd ? 'Yopish' : '+ Yangi'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={saveHead} className="glass-card" style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Xodim ismi" className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} />
            <input type="text" placeholder="Parol" className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <select className="input-field" value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value })} style={{ background: '#1a2a3a' }}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" className="btn-primary">{editingId ? 'O\'zgarishni saqlash' : 'Xodimni saqlash'}</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {heads.map(head => (
          <div key={head.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{head.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--accent-color)' }}>{DEPARTMENTS.find(d => d.id === head.deptId)?.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>L: {head.login} | P: {head.password}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => startEdit(head)} style={{ color: 'var(--accent-color)', background: 'none', border: 'none' }}><Edit3 size={18} /></button>
                <button onClick={() => deleteDoc(doc(db, "heads", head.id))} style={{ color: 'var(--danger)', background: 'none', border: 'none' }}><Trash2 size={18} /></button>
              </div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map(item => (
          <div key={item.id} className="glass-card" style={{ fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{item.dept}</span><span style={{ color: 'var(--text-dim)' }}>{item.timestamp}</span></div>
            <div style={{ margin: '4px 0' }}><b>{item.model}</b>: {item.action} - {item.details}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Xodim: {item.user} {item.toWhom ? `| Kimga: ${item.toWhom}` : ''}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DeptPanel({ user, addLog, attendance, today }) {
  const [formData, setFormData] = useState({ model: '', action: '', details: '', toWhom: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || DEPARTMENTS[0];
  const att = attendance.find(a => a.headId === user.id && a.date === today);

  useEffect(() => {
    if (dept.actions.length > 0) setFormData(prev => ({ ...prev, action: dept.actions[0] }));
  }, [dept]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addLog(dept.name, formData.action, `${formData.details} ta`, formData);
    setFormData({ ...formData, model: '', details: '', toWhom: '' });
    alert('Ma\'lumot saqlandi!');
  };

  const markNow = async () => {
    const status = new Date().getHours() < 8 || (new Date().getHours() === 8 && new Date().getMinutes() <= 30) ? 'Keldi' : 'Kechikdi';
    await setDoc(doc(db, "attendance", `${today}_${user.id}`), { headId: user.id, status, date: today, timestamp: serverTimestamp() });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '18px' }}>{dept.name}</h3>
        {!att ? (
          <button onClick={markNow} className="btn-primary" style={{ marginTop: '10px', background: 'var(--success)', width: '100%' }}>Ishga keldim (8:30)</button>
        ) : (
          <div style={{ marginTop: '8px', color: att.status === 'Keldi' ? 'var(--success)' : '#ff9800', fontSize: '12px', fontWeight: 'bold' }}>
            Holat: {att.status}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input type="text" placeholder="Model nomi" className="input-field" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {dept.actions.map(act => (
            <button key={act} type="button" onClick={() => setFormData({ ...formData, action: act })}
              style={{ flex: '1 0 45%', padding: '8px', fontSize: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: formData.action === act ? 'var(--accent-color)' : 'transparent', color: formData.action === act ? '#000' : '#fff' }}>
              {act}
            </button>
          ))}
        </div>
        {dept.id === 'taqsimot' && <input type="text" placeholder="Kimga / Qayerdan" className="input-field" value={formData.toWhom} onChange={e => setFormData({ ...formData, toWhom: e.target.value })} />}
        <input type="number" placeholder="Soni" className="input-field" required value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Send size={18} /> Ma'lumotni saqlash
        </button>
      </form>
    </motion.div>
  );
}
