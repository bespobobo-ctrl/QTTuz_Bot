import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Minus, Scale, Search, CheckCircle2, AlertTriangle, Printer, Layers, Scan,
  ArrowDown, RefreshCcw, LogOut, Package, Download, Upload, LayoutDashboard, X, Trash2,
  Shield, Users, Box, Scissors, Filter, GitBranch, Shirt, CheckCircle, Zap, Archive,
  Warehouse, ShoppingCart, HardHat, ChevronRight, Lock, Key, Settings, Edit3, History
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import MatoOmboriPanel from './pages/MatoOmbori';
import OmborchiPanel from './pages/Omborchi';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const VERSION = "17.3 SUPER PRO";

const DEPARTMENTS = [
  { id: 'rahbar', name: 'Rahbar', icon: Shield, color: '#FFD700' },
  { id: 'kadirlar', name: 'Kadirlar Bo\'limi', icon: Users, color: '#4FC3F7' },
  { id: 'mato_ombori', name: 'Mato ombori', icon: Layers, color: '#81C784' },
  { id: 'aksesuvar_ombori', name: 'Aksesuvar Ombori', icon: Box, color: '#BA68C8' },
  { id: 'omborchi', name: 'Omborchi', icon: HardHat, color: '#FF8A65' },
  { id: 'bichuv', name: 'Bichuv Bo\'limi', icon: Scissors, color: '#F06292' },
  { id: 'tasnif', name: 'Tasnif Bo\'limi', icon: Filter, color: '#4DB6AC' },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', icon: GitBranch, color: '#7986CB' },
  { id: 'tikuv', name: 'Tikuv Bo\'limlar', icon: Shirt, color: '#AED581' },
  { id: 'otk', name: 'OTK (Sifat nazorati)', icon: CheckCircle, color: '#FFF176' },
  { id: 'dazmol', name: 'Dazmol Bo\'limi', icon: Zap, color: '#FFB74D' },
  { id: 'qadoqlov', name: 'Qadoqlov Bo\'limi', icon: Archive, color: '#A1887F' },
  { id: 'tayyor_ombor', name: 'Tayyor mahsulot Ombori', icon: Warehouse, color: '#90A4AE' },
  { id: 'sotuv', name: 'Sotuv Bo\'limi', icon: ShoppingCart, color: '#E57373' }
];

export default function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('qu'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [selectedDept, setSelectedDept] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ whBatches: [], whRolls: [], whLog: [], deptLogins: [], whOrders: [] });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbVer, setDbVer] = useState(null);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 3500); }, []);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [wb, wr, wl, dl, wo, settings] = await Promise.all([
        supabase.from('warehouse_batches').select('*').order('created_at', { ascending: false }),
        supabase.from('warehouse_rolls').select('*').order('created_at', { ascending: false }),
        supabase.from('warehouse_log').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('department_logins').select('*'),
        supabase.from('warehouse_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('system_config').select('value').eq('key', 'app_version').single()
      ]);

      if (wb.error) console.error("Batches error:", wb.error);
      if (wr.error) console.error("Rolls error:", wr.error);
      if (wl.error) console.error("Logs error:", wl.error);

      setData({
        whBatches: wb.data || [],
        whRolls: wr.data || [],
        whLog: wl.data || [],
        deptLogins: dl.data || [],
        whOrders: wo.data || []
      });
      if (settings.data) setDbVer(settings.data.value);
    } catch (e) {
      console.error("Load catch error:", e);
      showMsg("Ma'lumot yuklashda xato!", "err");
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deptId = params.get('dept');
    if (deptId && !user) {
      const dept = DEPARTMENTS.find(d => d.id === deptId);
      if (dept) setSelectedDept(dept);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('qu');
    setUser(null);
    setSelectedDept(null);
  };

  if (!user) {
    if (!selectedDept) return <DepartmentSelection onSelect={setSelectedDept} />;
    return <Login selectedDept={selectedDept} setUser={setUser} onBack={() => setSelectedDept(null)} deptLogins={data.deptLogins} />;
  }

  const renderContent = () => {
    switch (user.role) {
      case 'rahbar': return <RahbarPanel data={data} load={load} showMsg={showMsg} />;
      case 'mato_ombori': return <MatoOmboriPanel tab={tab} data={data} load={load} showMsg={showMsg} />;
      case 'omborchi': return <OmborchiPanel tab={tab} data={data} load={load} showMsg={showMsg} />;
      default: return <DepartmentPlaceholder name={user.deptName} />;
    }
  };

  return (
    <div style={S.root}>
      <AnimatePresence>
        {msg && <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676' }}>{msg.t}</motion.div>}
        {loading && <div style={S.loadingBar} />}
      </AnimatePresence>

      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: user.deptColor || '#00e676', width: 35, height: 35, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.createElement(DEPARTMENTS.find(d => d.id === user.role)?.icon || Shield, { size: 20, color: "#000" })}
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{user.name}</div>
            <div style={{ fontSize: 9, color: '#ff5252', fontWeight: 'bold' }}>{user.deptName} • {VERSION} ⚡</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => load()} style={S.ib}><RefreshCcw size={18} /></button>
          <button onClick={handleLogout} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={S.content}>{renderContent()}</main>

      {user.role !== 'rahbar' && (
        <nav style={S.nav}>
          {[
            { id: 'dashboard', icon: LayoutDashboard, l: user.role === 'omborchi' ? 'Bruto Partiyalar' : 'Asosiy' },
            { id: 'scan', icon: Scan, l: 'Skayner' },
            ...(user.role !== 'omborchi' ? [{ id: 'kirim', icon: Download, l: 'Kirim' }] : []),
            { id: 'ombor', icon: Package, l: user.role === 'omborchi' ? 'Tayyor (Dam)' : 'Bruto' },
            ...(user.role === 'mato_ombori' ? [
              { id: 'neto', icon: CheckCircle2, l: 'Neto' },
              { id: 'history', icon: History, l: 'Istoriya' }
            ] : [])
          ].map(x => (
            <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}>
              <x.icon size={22} /><span style={{ fontSize: 9 }}>{x.l}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function RahbarPanel({ data, load, showMsg }) {
  const [editingDept, setEditingDept] = useState(null);
  const [form, setForm] = useState({ u: '', p: '' });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {DEPARTMENTS.slice(1).map(d => (
          <div key={d.id} style={{ ...S.card, padding: 15, cursor: 'pointer', border: '1px solid #2a2a40' }} onClick={() => { setEditingDept(d); setForm({ u: '', p: '' }); }}>
            <d.icon size={24} color={d.color} />
            <div style={{ marginTop: 10, fontWeight: 'bold', fontSize: 13 }}>{d.name}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ color: '#00e676', marginBottom: 15, fontWeight: 'bold' }}>XRONOLOGIYA</div>
        {data.whLog.map(l => (
          <div key={l.id} style={{ fontSize: 12, borderBottom: '1px solid #2a2a40', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span>{l.item_name}</span>
            <b style={{ color: '#00e676' }}>{l.quantity} kg</b>
          </div>
        ))}
      </div>

      {editingDept && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...S.card, width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 20, color: editingDept.color }}>{editingDept.name} sozlashtirish</h2>
            <input style={S.input} placeholder="Login" value={form.u} onChange={e => setForm({ ...form, u: e.target.value })} />
            <div style={{ height: 10 }} />
            <input style={S.input} type="password" placeholder="Parol" value={form.p} onChange={e => setForm({ ...form, p: e.target.value })} />
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditingDept(null)} style={{ ...S.btnG, background: '#333', color: '#fff', flex: 1 }}>BEKOR</button>
              <button onClick={async () => {
                try {
                  const { error } = await supabase.from('department_logins').upsert({
                    dept_id: editingDept.id,
                    login_name: form.u,
                    password: form.p
                  }, { onConflict: 'dept_id' });
                  if (error) throw error;
                  showMsg('Ma\'lumotlar saqlandi!');
                  setEditingDept(null);
                  load(true);
                } catch (e) { showMsg('Xato yuz berdi!', 'err'); }
              }} style={{ ...S.btnG, flex: 1 }}>SAQLASH</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Login({ selectedDept, setUser, onBack, deptLogins }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const handle = (e) => {
    e.preventDefault();
    if (selectedDept.id === 'rahbar' && u === 'admin' && p === '0068') {
      const r = { role: 'rahbar', name: 'Rahbar', deptName: 'Rahbariyat', deptColor: '#FFD700' };
      localStorage.setItem('qu', JSON.stringify(r)); setUser(r); return;
    }
    const acc = deptLogins.find(a => a.dept_id === selectedDept.id && a.login_name === u && a.password === p);
    if (acc) {
      const r = { role: selectedDept.id, name: u, deptName: selectedDept.name, deptColor: selectedDept.color };
      localStorage.setItem('qu', JSON.stringify(r)); setUser(r);
    } else alert('Login yoki parol xato!');
  };
  return (
    <div style={{ padding: 40, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 40, background: 'none', border: 'none', color: '#555' }}>← ORQAGA</button>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <selectedDept.icon size={60} color={selectedDept.color} />
        <h1 style={{ marginTop: 20 }}>{selectedDept.name}</h1>
      </div>
      <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <input style={S.input} placeholder="Login" value={u} onChange={e => setU(e.target.value)} />
        <input style={S.input} type="password" placeholder="Parol" value={p} onChange={e => setP(e.target.value)} />
        <button style={S.btnG}>KIRISH</button>
      </form>
    </div>
  );
}

function DepartmentSelection({ onSelect }) {
  return (
    <div style={{ padding: '40px 20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 40, fontSize: 32, fontWeight: '900' }}>BESPO <span style={{ color: '#00e676' }}>ERP</span></h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
        {DEPARTMENTS.map(d => (
          <button key={d.id} onClick={() => onSelect(d)} style={{ ...S.card, padding: 25, border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, cursor: 'pointer' }}>
            <d.icon size={32} color={d.color} />
            <div style={{ fontWeight: 'bold', fontSize: 13, color: '#fff' }}>{d.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DepartmentPlaceholder({ name }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 100, color: '#555' }}>
      <h1>{name}</h1>
      <p>Bu bo'lim paneli tez orada ishga tushadi.</p>
    </div>
  );
}

const S = {
  root: { minHeight: '100vh', background: '#0a0a14', color: '#fff', fontFamily: 'Inter, sans-serif' },
  header: { padding: '15px 20px', background: 'rgba(18, 18, 30, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #2a2a40', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 },
  content: { padding: '20px 20px 100px 20px' },
  nav: { position: 'fixed', bottom: 20, left: 20, right: 20, background: 'rgba(18, 18, 30, 0.95)', border: '1px solid #2a2a40', borderRadius: 25, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '12px 5px', backdropFilter: 'blur(15px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 1000 },
  nb: { background: 'none', border: 'none', color: '#555', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.3s' },
  ib: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: 10, borderRadius: 12, cursor: 'pointer' },
  toast: { position: 'fixed', top: 20, left: 20, right: 20, padding: '15px 20px', borderRadius: 14, color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center', zIndex: 99999, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  loadingBar: { position: 'fixed', top: 0, left: 0, height: 3, background: '#00e676', zIndex: 10001, animation: 'loading 2s infinite linear' },
  card: { background: '#12121e', padding: 20, borderRadius: 20, border: '1px solid #2a2a40', marginBottom: 20 },
  input: { width: '100%', padding: '15px 20px', background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', outline: 'none', fontSize: 16, boxSizing: 'border-box' },
  btnG: { padding: '15px 25px', background: '#00e676', color: '#000', borderRadius: 14, border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }
};

