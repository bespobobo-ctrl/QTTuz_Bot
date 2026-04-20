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
  Download,
  CheckCircle,
  Repeat
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
  setDoc
} from 'firebase/firestore';

const DEPARTMENTS = [
  { id: 'bichuv', name: 'Bichuv Bo\'limi', icon: Scissors, actions: ['Bichildi'] },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', icon: Truck, actions: ['Ishga berildi', 'Kraskaga yuborildi', 'Vishivkaga yuborildi', 'Pressga yuborildi', 'Natija qaytdi'] },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', icon: CheckCircle, actions: ['Tikuv bitdi'] },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', icon: Box, actions: ['Upakovka bitdi', 'Tayyorga topshirildi'] },
  { id: 'ombor', name: 'Ombor Bo\'limi', icon: Warehouse, actions: ['Kirim', 'Chiqim'] },
  { id: 'tayyor', name: 'Tayyor mahsulot', icon: CheckCircle2, actions: ['Qabul qilindi'] },
  { id: 'xo\'jalik', name: 'Xo\'jalik Bo\'limi', icon: Home, actions: ['Xarajat', 'Kirim'] },
  { id: 'ekspremetal', name: 'Ekspremetal', icon: Wrench, actions: ['Namuna tayyor'] },
  { id: 'kadirlar', name: 'Kadirlar Bo\'limi', icon: Users, actions: ['Hujjatlash'] },
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
    const unsubscribe = onSnapshot(collection(db, "heads"), (snapshot) => {
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
    const unsubscribe = onSnapshot(collection(db, "attendance"), (snapshot) => {
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

  const addLog = async (dept, action, details, extraData = {}) => {
    await addDoc(collection(db, "history"), {
      dept,
      action,
      details,
      model: extraData.model || '',
      toWhom: extraData.toWhom || '',
      user: user.name,
      timestamp: serverTimestamp()
    });
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-color)' }}>QTTuz Production</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Boshqaruv tizimiga kirish</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
          <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Boshqaruv Paneli' : 'Ishchi Paneli'}</p>
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
            <LayoutDashboard size={20} />
            <span>Asosiy</span>
          </button>
          <button onClick={() => setActiveTab('heads')} className={`nav-item ${activeTab === 'heads' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <Users size={20} />
            <span>Davomat</span>
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
        <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          {time.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h2 style={{ fontSize: '26px', color: 'var(--accent-color)', fontWeight: 'bold' }}>{time.toLocaleTimeString('uz-UZ')}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <StatCard icon={Users} label="Jami ishchi" value={heads.length} color="var(--accent-color)" />
        <StatCard icon={UserCheck} label="Barvaqt" value={onTimeCount} color="var(--success)" />
        <StatCard icon={Clock} label="Kechikkan" value={lateCount} color="#ff9800" />
        <StatCard icon={AlertTriangle} label="Kelmagan" value={Math.max(0, notCameCount)} color="var(--danger)" />
        <StatCard icon={UserMinus} label="Ruhsatli" value={permissionCount} color="#00bcd4" />
      </div>

      <h3 style={{ marginBottom: '10px', fontSize: '15px' }}>Bo'limlar Holati</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
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
    <div className="glass-card" style={{ textAlign: 'center', padding: '12px' }}>
      <Icon size={20} color={color} style={{ marginBottom: '5px' }} />
      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{value}</div>
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
    await setDoc(doc(db, "attendance", docId), { headId, status, date: today, timestamp: serverTimestamp() });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <h3 style={{ fontSize: '16px' }}>Xodimlar Boshqaruvi</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>+ Yangi</button>
      </div>

      {showAdd && (
        <form onSubmit={addHead} className="glass-card" style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Ism sharif" className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="Login" className="input-field" required value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} />
            <input type="text" placeholder="Parol" className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <select className="input-field" value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value })}>
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
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{head.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-color)' }}>{DEPARTMENTS.find(d => d.id === head.deptId)?.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {!att ? (
                    <>
                      <button onClick={() => markAttendance(head.id, 'Sababli')} style={{ background: '#00bcd4', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '10px' }}>Sababli</button>
                      <button onClick={() => markAttendance(head.id, 'Keldi')} style={{ background: 'var(--success)', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '10px' }}>Keldi</button>
                    </>
                  ) : (
                    <span style={{ fontSize: '11px', color: att.status === 'Keldi' ? 'var(--success)' : '#00bcd4' }}>{att.status}</span>
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
      <h3 style={{ marginBottom: '15px' }}>Ish jarayoni tarixi</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Hozircha amallar yo'q</p> :
          history.map(item => (
            <div key={item.id} className="glass-card" style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{item.dept}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{item.timestamp}</span>
              </div>
              <div style={{ margin: '5px 0' }}>
                <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginRight: '5px' }}>{item.action}</span>
                <span style={{ fontWeight: '600' }}>{item.model}</span> - {item.details}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '5px' }}>
                Mas'ul: {item.user} {item.toWhom ? `| Kimga: ${item.toWhom}` : ''}
              </div>
            </div>
          ))
        }
      </div>
    </motion.div>
  );
}

function DeptPanel({ user, addLog, attendance, today }) {
  const [formData, setFormData] = useState({ model: '', action: '', details: '', toWhom: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || DEPARTMENTS[4];
  const att = attendance.find(a => a.headId === user.id && a.date === today);

  useEffect(() => {
    if (dept.actions.length > 0) setFormData(prev => ({ ...prev, action: dept.actions[0] }));
  }, [dept]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullDetails = `${formData.details} ta`;
    addLog(dept.name, formData.action, fullDetails, formData);
    setFormData({ ...formData, model: '', details: '', toWhom: '' });
    alert('Ma\'lumot saqlandi!');
  };

  const markNow = async () => {
    const now = new Date();
    const limit = new Date();
    limit.setHours(8, 30, 0);
    const status = now > limit ? 'Kechikdi' : 'Keldi';
    await setDoc(doc(db, "attendance", `${today}_${user.id}`), { headId: user.id, status, date: today, timestamp: serverTimestamp() });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px' }}>{dept.name}</h3>
        {!att ? (
          <button onClick={markNow} className="btn-primary" style={{ marginTop: '10px', background: 'var(--success)', width: '100%' }}>Ishga keldim (8:30)</button>
        ) : (
          <div style={{ marginTop: '10px', color: att.status === 'Keldi' ? 'var(--success)' : '#ff9800', fontWeight: 'bold', fontSize: '13px' }}>
            Holatingiz: {att.status}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Mahsulot Modeli</label>
          <input type="text" placeholder="Masalan: Nike-2024" className="input-field" required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
        </div>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Amal turi</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
            {dept.actions.map(act => (
              <button key={act} type="button" onClick={() => setFormData({ ...formData, action: act })}
                style={{ flex: '1 0 45%', padding: '8px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: formData.action === act ? 'var(--accent-color)' : 'transparent', color: formData.action === act ? '#000' : '#fff', transition: '0.3s' }}>
                {act}
              </button>
            ))}
          </div>
        </div>

        {dept.id === 'taqsimot' && (
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Kimga berildi / Qayerdan keldi?</label>
            <input type="text" placeholder="Ism yoki Ustaxona" className="input-field" value={formData.toWhom} onChange={e => setFormData({ ...formData, toWhom: e.target.value })} />
          </div>
        )}

        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Soni / Miqdori</label>
          <input type="number" placeholder="Masalan: 120" className="input-field" required value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Send size={18} /> Ma'lumotni Saqlash
        </button>
      </form>
    </motion.div>
  );
}

