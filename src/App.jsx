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
  AlertTriangle
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
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';

const DEPARTMENTS = [
  { id: 'kadirlar', name: 'Kadirlar Bo\'limi', icon: Users },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', icon: Scissors },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', icon: Truck },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', icon: Box },
  { id: 'ombor', name: 'Ombor Bo\'limi', icon: Warehouse },
  { id: 'tayyor', name: 'Tayyor mahsulot', icon: CheckCircle2 },
  { id: 'xo\'jalik', name: 'Xo\'jalik Bo\'limi', icon: Home },
  { id: 'ekspremetal', name: 'Ekspremetal Bo\'limi', icon: Wrench },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authData, setAuthData] = useState({ login: '', password: '' });
  const [heads, setHeads] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const q = collection(db, "heads");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "history"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toLocaleString('uz-UZ') || 'Hozirgina'
      })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collection(db, "attendance");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (authData.login === '0068' && authData.password === '0068') {
      setUser({ role: 'admin', name: 'Rahbar' });
      setActiveTab('dashboard');
    } else {
      const head = heads.find(h => h.login === authData.login && h.password === authData.password);
      if (head) {
        setUser({ role: 'dept', ...head });
        setActiveTab('dept_panel');
      } else {
        alert('Login yoki parol xato!');
      }
    }
  };

  const addLog = async (dept, action, details) => {
    await addDoc(collection(db, "history"), {
      dept, action, details, user: user.name, timestamp: serverTimestamp()
    });
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-color)' }}>QTTuz Production</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Tizimga kirish</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="text" placeholder="Login" className="input-field" value={authData.login} onChange={(e) => setAuthData({ ...authData, login: e.target.value })} />
            <input type="password" placeholder="Parol" className="input-field" value={authData.password} onChange={(e) => setAuthData({ ...authData, password: e.target.value })} />
            <button type="submit" className="btn-primary">Kirish</button>
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
          <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Boshqaruv Paneli' : 'Bo\'lim Paneli'}</p>
        </div>
        <button onClick={() => setUser(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
          <LogOut size={18} />
        </button>
      </header>

      <main style={{ flex: 1, padding: '15px', paddingBottom: '90px', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {user.role === 'admin' && activeTab === 'dashboard' && <AdminDashboard heads={heads} attendance={attendance} today={today} />}
          {user.role === 'admin' && activeTab === 'heads' && <ManageHeads heads={heads} attendance={attendance} today={today} />}
          {user.role === 'admin' && activeTab === 'history' && <HistoryView history={history} />}
          {(user.role === 'dept' || (user.role === 'admin' && activeTab === 'dept_panel')) && (
            <DeptPanel user={user} addLog={addLog} attendance={attendance} today={today} />
          )}
        </AnimatePresence>
      </main>

      {user.role === 'admin' && (
        <nav className="footer-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <LayoutDashboard size={22} />
            <span>Asosiy</span>
          </button>
          <button onClick={() => setActiveTab('heads')} className={`nav-item ${activeTab === 'heads' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <Users size={22} />
            <span>Davomat</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <History size={22} />
            <span>Tarix</span>
          </button>
        </nav>
      )}
    </div>
  );
}

function AdminDashboard({ heads, attendance, today }) {
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
        <h2 style={{ fontSize: '28px', color: 'var(--accent-color)' }}>{time.toLocaleTimeString('uz-UZ')}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <StatCard icon={Users} label="Jami ishchi" value={heads.length} color="var(--accent-color)" />
        <StatCard icon={UserCheck} label="Barvaqt" value={onTimeCount} color="var(--success)" />
        <StatCard icon={Clock} label="Kechikkan" value={lateCount} color="#ff9800" />
        <StatCard icon={AlertTriangle} label="Kelmagan" value={Math.max(0, notCameCount)} color="var(--danger)" />
        <StatCard icon={UserMinus} label="Ruhsatli" value={permissionCount} color="#00bcd4" />
      </div>

      <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Bo'limlar Monitoringi</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {DEPARTMENTS.map(dept => (
          <div key={dept.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <dept.icon size={18} color="var(--accent-color)" />
              <span style={{ fontSize: '13px' }}>{dept.name}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              {heads.filter(h => h.deptId === dept.id).length} xodim
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '15px' }}>
      <Icon size={20} color={color} style={{ marginBottom: '5px' }} />
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{label}</div>
    </div>
  );
}

function ManageHeads({ heads, attendance, today }) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', login: '', password: '', deptId: DEPARTMENTS[0].id });

  const addHead = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "heads"), formData);
    setShowAdd(false);
    setFormData({ name: '', login: '', password: '', deptId: DEPARTMENTS[0].id });
  };

  const markAttendance = async (headId, status) => {
    const docId = `${today}_${headId}`;
    await setDoc(doc(db, "attendance", docId), {
      headId,
      status,
      date: today,
      timestamp: serverTimestamp()
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3>Davomat va Xodimlar</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>+ Yangi</button>
      </div>

      {showAdd && (
        <form onSubmit={addHead} className="glass-card" style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Ism" className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="L" className="input-field" required value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} />
            <input type="text" placeholder="P" className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <select className="input-field" value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value })} style={{ background: '#1a2a3a' }}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" className="btn-primary">Saqlash</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {heads.map(head => {
          const att = attendance.find(a => a.headId === head.id && a.date === today);
          return (
            <div key={head.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{head.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-color)' }}>{DEPARTMENTS.find(d => d.id === head.deptId)?.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {!att ? (
                    <>
                      <button onClick={() => markAttendance(head.id, 'Sababli')} style={{ background: '#00bcd4', border: 'none', borderRadius: '5px', color: '#000', padding: '4px 8px', fontSize: '10px' }}>Sababli</button>
                      <button onClick={() => markAttendance(head.id, 'Keldi')} style={{ background: 'var(--success)', border: 'none', borderRadius: '5px', color: '#000', padding: '4px 8px', fontSize: '10px' }}>Keldi</button>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: att.status === 'Keldi' ? 'var(--success)' : '#00bcd4' }}>{att.status}</span>
                  )}
                  <button onClick={() => deleteDoc(doc(db, "heads", head.id))} style={{ color: 'var(--danger)', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function HistoryView({ history }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 style={{ marginBottom: '15px' }}>Amallar Tarixi</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map(item => (
          <div key={item.id} className="glass-card" style={{ fontSize: '12px' }}>
            <div style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{item.dept}</div>
            <div style={{ margin: '4px 0' }}><span style={{ color: item.action === 'Kirim' ? 'var(--success)' : 'var(--danger)' }}>[{item.action}]</span> {item.details}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '10px' }}>
              <span>Xodim: {item.user}</span>
              <span>{item.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DeptPanel({ user, addLog, attendance, today }) {
  const [formData, setFormData] = useState({ type: 'Kirim', item: '', count: '' });
  const deptName = user.role === 'admin' ? 'Admin Test' : DEPARTMENTS.find(d => d.id === user.deptId)?.name;

  const att = attendance.find(a => a.headId === user.id && a.date === today);

  const handleAttendance = async (status) => {
    const docId = `${today}_${user.id}`;
    await setDoc(doc(db, "attendance", docId), {
      headId: user.id,
      status,
      date: today,
      timestamp: serverTimestamp()
    });
    alert('Davomat qayd etildi!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addLog(deptName, formData.type, `${formData.item} - ${formData.count} ta`);
    setFormData({ ...formData, item: '', count: '' });
    alert('Saqlandi!');
  };

  const markNow = async () => {
    const now = new Date();
    const limit = new Date();
    limit.setHours(8, 30, 0);
    const status = now > limit ? 'Kechikdi' : 'Keldi';
    handleAttendance(status);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3>{deptName}</h3>
        {!att ? (
          <button onClick={markNow} className="btn-primary" style={{ marginTop: '10px', background: 'var(--success)' }}>Ishga keldim (8:30)</button>
        ) : (
          <div style={{ marginTop: '10px', color: att.status === 'Keldi' ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
            Sizning holatingiz: {att.status}
          </div>
        )}
        {!att && (
          <button onClick={() => handleAttendance('Ruhsatli')} style={{ marginTop: '10px', marginLeft: '10px', border: '1px solid #00bcd4', color: '#00bcd4', background: 'none', padding: '10px', borderRadius: '12px' }}>Ruhsat so'rash</button>
        )}
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
            <button type="button" onClick={() => setFormData({ ...formData, type: 'Kirim' })} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: formData.type === 'Kirim' ? 'var(--success)' : 'transparent', color: formData.type === 'Kirim' ? '#000' : '#fff' }}>Kirim</button>
            <button type="button" onClick={() => setFormData({ ...formData, type: 'Chiqim' })} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: formData.type === 'Chiqim' ? 'var(--danger)' : 'transparent', color: '#fff' }}>Chiqim</button>
          </div>
          <input type="text" placeholder="Mahsulot" className="input-field" required value={formData.item} onChange={e => setFormData({ ...formData, item: e.target.value })} />
          <input type="number" placeholder="Soni" className="input-field" required value={formData.count} onChange={e => setFormData({ ...formData, count: e.target.value })} />
          <button type="submit" className="btn-primary">Yozish</button>
        </form>
      </div>
    </motion.div>
  );
}
