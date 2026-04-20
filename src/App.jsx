import React, { useState, useEffect } from 'react';
import {
  Users,
  Settings,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  Package,
  Scissors,
  Truck,
  Box,
  Warehouse,
  CheckCircle2,
  Home,
  Wrench
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
  serverTimestamp
} from 'firebase/firestore';

const DEPARTMENTS = [
  { id: 'kadirlar', name: 'Kadirlar Bo\'limi', icon: Users },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', icon: Scissors },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', icon: Truck },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', icon: Box },
  { id: 'ombor', name: 'Ombor Bo\'limi', icon: Warehouse },
  { id: 'tayyor', name: 'Tayyor mahsulot', icon: CheckCircle2 },
  { id: 'xo\x27jalik', name: 'Xo\'jalik Bo\'limi', icon: Home },
  { id: 'ekspremetal', name: 'Ekspremetal Bo\'limi', icon: Wrench },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authData, setAuthData] = useState({ login: '', password: '' });
  const [heads, setHeads] = useState([]);
  const [history, setHistory] = useState([]);

  // Subscribe to Heads
  useEffect(() => {
    const q = collection(db, "heads");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHeads(hList);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to History
  useEffect(() => {
    const q = query(collection(db, "history"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toLocaleString('uz-UZ') || 'Hozirgina'
      }));
      setHistory(sList);
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
      dept,
      action,
      details,
      user: user.name,
      timestamp: serverTimestamp()
    });
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-color)' }}>Ishlab Chiqarish</h1>
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
          <h2 style={{ fontSize: '18px' }}>{user.name}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{user.role === 'admin' ? 'Boshqaruv Paneli' : 'Bo\'lim Paneli'}</p>
        </div>
        <button onClick={() => setUser(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
          <LogOut size={20} />
        </button>
      </header>

      <main style={{ flex: 1, padding: '20px', paddingBottom: '100px', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {user.role === 'admin' && activeTab === 'dashboard' && <AdminDashboard heads={heads} />}
          {user.role === 'admin' && activeTab === 'heads' && <ManageHeads heads={heads} />}
          {user.role === 'admin' && activeTab === 'history' && <HistoryView history={history} />}
          {(user.role === 'dept' || (user.role === 'admin' && activeTab === 'dept_panel')) && <DeptPanel user={user} addLog={addLog} />}
        </AnimatePresence>
      </main>

      {user.role === 'admin' && (
        <nav className="footer-nav">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <LayoutDashboard size={24} />
            <span>Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('heads')} className={`nav-item ${activeTab === 'heads' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <Users size={24} />
            <span>Xodimlar</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>
            <History size={24} />
            <span>Istoriya</span>
          </button>
        </nav>
      )}
    </div>
  );
}

function AdminDashboard({ heads }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('uz-UZ', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="glass-card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--accent-color)', padding: '15px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {formatDate(time)}
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-color)', margin: '5px 0' }}>
          {formatTime(time)}
        </h2>
      </div>

      <h3 style={{ marginBottom: '20px' }}>Umumiy Holat</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--accent-color)', fontSize: '24px' }}>{DEPARTMENTS.length}</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Bo'limlar</p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--success)', fontSize: '24px' }}>{heads.length}</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Mas'ullar</p>
        </div>
      </div>
      <h3 style={{ marginBottom: '15px' }}>Bo'limlar monitoringi</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {DEPARTMENTS.map(dept => {
          const head = heads.find(h => h.deptId === dept.id);
          return (
            <div key={dept.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--accent-glow)', padding: '8px', borderRadius: '10px' }}>
                  <dept.icon size={20} color="var(--accent-color)" />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{dept.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Mas'ul: {head ? head.name : 'Tayinlanmagan'}</div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-dim)" />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function ManageHeads({ heads }) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', login: '', password: '', deptId: DEPARTMENTS[0].id });

  const addHead = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "heads"), formData);
    setShowAdd(false);
    setFormData({ name: '', login: '', password: '', deptId: DEPARTMENTS[0].id });
  };

  const deleteHead = async (id) => {
    if (confirm('O\'chirmoqchimisiz?')) {
      await deleteDoc(doc(db, "heads", id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Mas'ul xodimlar</h3>
        <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
          + Qo'shish
        </button>
      </div>
      {showAdd && (
        <div className="glass-card" style={{ marginBottom: '20px', border: '1px solid var(--accent-color)' }}>
          <form onSubmit={addHead} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Ismi" className="input-field" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input type="text" placeholder="Login" className="input-field" required value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} />
              <input type="text" placeholder="Parol" className="input-field" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <select className="input-field" value={formData.deptId} onChange={e => setFormData({ ...formData, deptId: e.target.value })} style={{ background: '#1a2a3a' }}>
              {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Saqlash</button>
              <button type="button" onClick={() => setShowAdd(false)} className="input-field" style={{ flex: 1, color: 'var(--danger)' }}>Bekor</button>
            </div>
          </form>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {heads.map(head => (
          <div key={head.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600' }}>{head.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--accent-color)' }}>{DEPARTMENTS.find(d => d.id === head.deptId)?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>L: {head.login} | P: {head.password}</div>
            </div>
            <button onClick={() => deleteHead(head.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function HistoryView({ history }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h3 style={{ marginBottom: '20px' }}>Harakatlar tarixi</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Ma'lumotlar yo'q</p> :
          history.map(item => (
            <div key={item.id} className="glass-card" style={{ fontSize: '13px' }}>
              <div style={{ color: 'var(--accent-color)', fontWeight: 'bold', marginBottom: '4px' }}>{item.dept}</div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: item.action === 'Kirim' ? 'var(--success)' : 'var(--danger)' }}>[{item.action}]</span> {item.details}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                <span>Xodim: {item.user}</span>
                <span>{item.timestamp}</span>
              </div>
            </div>
          ))
        }
      </div>
    </motion.div>
  );
}

function DeptPanel({ user, addLog }) {
  const [formData, setFormData] = useState({ type: 'Kirim', item: '', count: '' });
  const deptName = user.role === 'admin' ? 'Admin Test' : DEPARTMENTS.find(d => d.id === user.deptId)?.name;

  const handleSubmit = (e) => {
    e.preventDefault();
    addLog(deptName, formData.type, `${formData.item} - ${formData.count} ta`);
    setFormData({ ...formData, item: '', count: '' });
    alert('Saqlandi!');
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h3>{deptName}</h3>
      </div>
      <div className="glass-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
            <button type="button" onClick={() => setFormData({ ...formData, type: 'Kirim' })} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: formData.type === 'Kirim' ? 'var(--success)' : 'transparent', color: formData.type === 'Kirim' ? '#000' : '#fff' }}>Kirim</button>
            <button type="button" onClick={() => setFormData({ ...formData, type: 'Chiqim' })} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: formData.type === 'Chiqim' ? 'var(--danger)' : 'transparent', color: '#fff' }}>Chiqim</button>
          </div>
          <input type="text" placeholder="Nomi" className="input-field" required value={formData.item} onChange={e => setFormData({ ...formData, item: e.target.value })} />
          <input type="number" placeholder="Miqdori" className="input-field" required value={formData.count} onChange={e => setFormData({ ...formData, count: e.target.value })} />
          <button type="submit" className="btn-primary">Yuborish</button>
        </form>
      </div>
    </motion.div>
  );
}
