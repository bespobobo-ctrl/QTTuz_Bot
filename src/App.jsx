import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Minus, Scale, Search, CheckCircle2, AlertTriangle, Printer, Layers, Scan,
  ArrowDown, RefreshCcw, LogOut, Package, Download, Upload, LayoutDashboard, X, Trash2,
  Shield, Users, Box, Scissors, Filter, GitBranch, Shirt, CheckCircle, Zap, Archive,
  Warehouse, ShoppingCart, HardHat, ChevronRight, Lock, Key, Settings, Edit3
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const VERSION = "13.0 PRO";

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
  const [data, setData] = useState({ whBatches: [], whRolls: [], whLog: [], deptLogins: [] });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbVer, setDbVer] = useState(null);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 3500); }, []);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [wb, wr, wl, dl, settings] = await Promise.all([
        supabase.from('warehouse_batches').select('*').order('arrival_date', { ascending: false }),
        supabase.from('warehouse_rolls').select('*').order('created_at', { ascending: false }),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('department_logins').select('*'),
        supabase.from('system_config').select('value').eq('key', 'app_version').single()
      ]);
      setData({
        whBatches: wb.data || [],
        whRolls: wr.data || [],
        whLog: wl.data || [],
        deptLogins: dl.data || []
      });
      if (settings.data) setDbVer(settings.data.value);
    } catch (e) { console.error("Load error:", e); }
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
      case 'mato_ombori':
      case 'omborchi': return <OmborPanel tab={tab} data={data} load={load} showMsg={showMsg} />;
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
            <div style={{ fontSize: 9, color: '#00e676' }}>{user.deptName} • {VERSION}</div>
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
            { id: 'dashboard', icon: LayoutDashboard, l: 'Radar' },
            { id: 'kirim', icon: Download, l: 'Kirim' },
            { id: 'ombor', icon: Package, l: 'Stock' }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={S.card}>
        <h3 style={{ color: '#FFD700', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} /> RAHBAR BOSHQARUVI
        </h3>
        <p style={{ fontSize: 12, color: '#555' }}>Barcha bo'limlar uchun kirish ma'lumotlarini shu yerdan boshqarishingiz mumkin.</p>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {DEPARTMENTS.filter(d => d.id !== 'rahbar').map(dept => {
          const config = data.deptLogins.find(l => l.dept_id === dept.id) || { login_name: 'belgilanmagan', password: '***' };
          return (
            <div key={dept.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ color: dept.color }}><dept.icon size={24} /></div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{dept.name}</div>
                  <div style={{ fontSize: 11, color: '#00e676' }}>Login: {config.login_name}</div>
                </div>
              </div>
              <button
                onClick={() => { setEditingDept(dept); setForm({ u: config.login_name === 'belgilanmagan' ? '' : config.login_name, p: '' }); }}
                style={{ ...S.ib, color: '#555' }}
              >
                <Edit3 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {editingDept && (
        <div style={S.overlay}>
          <div style={{ ...S.mCard, background: '#12121e', color: '#fff', border: '1px solid #1a1a2e' }}>
            <h3 style={{ marginBottom: 20 }}>{editingDept.name} sozlamalari</h3>
            <input style={S.input} placeholder="Yangi Login" value={form.u} onChange={e => setForm({ ...form, u: e.target.value })} />
            <input style={S.input} type="password" placeholder="Yangi Parol" value={form.p} onChange={e => setForm({ ...form, p: e.target.value })} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditingDept(null)} style={{ ...S.btnG, background: '#1a1a2e', color: '#fff', flex: 1 }}>BEKOR QILISH</button>
              <button onClick={async () => {
                if (!form.u || !form.p) return showMsg('Barcha maydonlarni to\'ldiring!', 'err');
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

function OmborPanel({ tab, data, load, showMsg }) {
  const [m, setM] = useState('bruto');
  const [f, setF] = useState({ bn: '', eC: '', eW: '', sup: '', c: '', rT: '', rE: '', rG: '' });
  const [q, setQ] = useState('');

  if (tab === 'dashboard') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      <button onClick={() => {
        const id = prompt('Rulon ID yoki QR:');
        if (id) {
          const r = data.whRolls.find(x => String(x.id) === id || x.batch_number === id);
          if (r) showMsg('Rulon topildi: ' + r.batch_number); else showMsg('Rulon topilmadi!', 'err');
        }
      }} style={{ ...S.btnG, padding: 30, fontSize: 18, background: '#00e676', color: '#000' }}><Scan size={24} /> RADARNI ISHGA TUSHIRISH</button>
      <div style={S.card}>
        <div style={{ marginBottom: 15, fontWeight: 'bold', color: '#00e676' }}>XRONOLOGIYA</div>
        {data.whLog.length > 0 ? data.whLog.map(l => (
          <div key={l.id} style={{ fontSize: 12, borderBottom: '1px solid #1a1a2e', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span>{l.item_name}</span>
            <b style={{ color: '#00e676' }}>{l.quantity} kg</b>
          </div>
        )) : <div style={{ color: '#555', textAlign: 'center', padding: 20 }}>Hozircha ma'lumot yo'q</div>}
      </div>
    </div>
  );

  if (tab === 'kirim') return (
    <div style={S.card}>
      <h3 style={{ marginBottom: 20, color: '#00e676' }}>YANGI PARTIYA</h3>
      <form onSubmit={async (e) => {
        e.preventDefault();
        await supabase.from('warehouse_batches').insert([{ batch_number: f.bn, supplier_name: f.sup, color: f.c, expected_count: Number(f.eC), expected_weight: Number(f.eW), status: 'IN_PROGRESS' }]);
        showMsg('Partiya ochildi!'); setTab('ombor'); load(true);
      }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={S.input} placeholder="Partiya #" required onChange={e => setF({ ...f, bn: e.target.value })} />
        <input style={S.input} placeholder="Taminotchi" required onChange={e => setF({ ...f, sup: e.target.value })} />
        <input style={S.input} placeholder="Rangi" required onChange={e => setF({ ...f, c: e.target.value })} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input style={S.input} type="number" placeholder="Soni" required onChange={e => setF({ ...f, eC: e.target.value })} />
          <input style={S.input} type="number" placeholder="Vazni" required onChange={e => setF({ ...f, eW: e.target.value })} />
        </div>
        <button style={S.btnG}>SAQLASH</button>
      </form>
    </div>
  );

  if (tab === 'ombor') return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 15, background: '#12121e', padding: 5, borderRadius: 12, border: '1px solid #1a1a2e' }}>
        {['bruto', 'kontrol', 'neto'].map(x => (
          <button key={x} onClick={() => setM(x)} style={{ ...S.btn, flex: 1, background: m === x ? '#00e676' : 'transparent', color: m === x ? '#000' : '#555', fontSize: 10, fontWeight: 'bold' }}>{x.toUpperCase()}</button>
        ))}
      </div>
      <div style={{ position: 'relative', marginBottom: 15 }}>
        <Search size={18} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
        <input style={{ ...S.input, paddingLeft: 45, marginBottom: 0 }} placeholder="Qidiruv..." onChange={e => setQ(e.target.value)} />
      </div>

      {m === 'bruto' && (
        !activeBatch ? (
          data.whBatches.filter(b => b.batch_number?.toLowerCase().includes(q.toLowerCase())).map(b => (
            <div key={b.id} onClick={() => setActiveBatch(b)} style={{ ...S.card, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><b>{b.batch_number}</b><br /><span style={{ fontSize: 11, color: '#555' }}>{b.color}</span></div>
              <ChevronRight size={18} color="#555" />
            </div>
          ))
        ) : (
          <div>
            <button onClick={() => setActiveBatch(null)} style={{ color: '#00e676', marginBottom: 15, background: 'none', border: 'none', fontWeight: 'bold' }}>← ORQAGA</button>
            <div style={{ ...S.card, borderColor: '#00e676', marginBottom: 15 }}>
              <div style={{ fontSize: 12, marginBottom: 10, color: '#555' }}>Yangi rulon vazni (KG)</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input style={{ ...S.input, marginBottom: 0 }} type="number" placeholder="0.00" value={f.rT} onChange={e => setF({ ...f, rT: e.target.value })} />
                <button onClick={async () => {
                  if (!f.rT) return showMsg('Vaznni kiriting!', 'err');
                  await supabase.from('warehouse_rolls').insert([{ batch_id: activeBatch.id, batch_number: activeBatch.batch_number, bruto: Number(f.rT), status: 'BRUTO', fabric_name: activeBatch.color, color: activeBatch.color }]);
                  setF({ ...f, rT: '' }); load(true);
                }} style={{ ...S.btnG, padding: '0 20px' }}><Plus size={20} /></button>
              </div>
            </div>
            {data.whRolls.filter(r => r.batch_id === activeBatch.id).map(r => (
              <div key={r.id} style={{ ...S.card, marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{r.bruto} kg</span>
                {r.status === 'BRUTO' && <button onClick={async () => { await supabase.from('warehouse_rolls').update({ status: 'KO\'RIKDA' }).eq('id', r.id); load(true); }} style={{ ...S.btnG, padding: '8px 15px', fontSize: 10 }}>KONTROLGA</button>}
              </div>
            ))}
          </div>
        )
      )}
      {m === 'kontrol' && (
        data.whRolls.filter(r => (r.status === 'KO\'RIKDA' || r.status === 'KONTROLDAN_OTDI') && r.batch_number?.toLowerCase().includes(q.toLowerCase())).map(r => (
          <div key={r.id} style={{ ...S.card, marginBottom: 10, borderLeft: `6px solid ${r.status.includes('OTDI') ? '#00e676' : '#ff9800'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><b>{r.batch_number}</b><br /><span style={{ fontSize: 11, color: '#00e676' }}>{r.bruto} kg</span></div>
              <div style={{ display: 'flex', gap: 8 }}>
                {r.status === 'KO\'RIKDA' && <button onClick={() => { setActiveRollId(r.id); setF({ ...f, rT: '', rE: '', rG: '' }) }} style={{ ...S.btnG, background: '#00e676', color: '#000', padding: '8px 15px', fontSize: 11 }}>O'LCHASH</button>}
                <button onClick={() => setQrRoll(r)} style={{ ...S.btnG, background: 'rgba(0,230,118,0.1)', color: '#00e676', padding: '8px 15px', fontSize: 11 }}>PASPORT</button>
              </div>
            </div>
            {activeRollId === r.id && (
              <div style={{ marginTop: 15, borderTop: '1px solid #1a1a2e', paddingTop: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input style={S.input} type="number" placeholder="Tara (KG)" value={f.rT} onChange={e => setF({ ...f, rT: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input style={S.input} type="number" placeholder="Eni (sm)" value={f.rE} onChange={e => setF({ ...f, rE: e.target.value })} />
                  <input style={S.input} placeholder="Gramaj" value={f.rG} onChange={e => setF({ ...f, rG: e.target.value })} />
                </div>
                <button onClick={async () => {
                  const n = r.bruto - Number(f.rT);
                  const upd = { tara: Number(f.rT), neto: n, en: Number(f.rE), gramaj: f.rG, status: 'KONTROLDAN_OTDI', neto_date: new Date().toISOString() };
                  await supabase.from('warehouse_rolls').update(upd).eq('id', r.id);
                  setActiveRollId(null); setQrRoll({ ...r, ...upd }); load(true);
                }} style={{ ...S.btnG, width: '100%' }}>SAQLASH ✅</button>
              </div>
            )}
          </div>
        ))
      )}
      {m === 'neto' && (
        data.whRolls.filter(r => r.status === 'Neto').map(r => (
          <div key={r.id} style={{ ...S.card, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><b>{r.batch_number}</b><br /><span style={{ fontSize: 11, color: '#00e676' }}>{r.neto?.toFixed(2)} kg</span></div>
            <button onClick={() => setQrRoll(r)} style={{ ...S.ib, color: '#00e676', background: 'rgba(0,230,118,0.1)', padding: 8, borderRadius: 8 }}><Printer size={18} /></button>
          </div>
        ))
      )}
    </div>
  );
}

const S = {
  root: { minHeight: '100vh', background: '#0a0a14', color: '#fff', fontSize: 14, fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: '#12121e', borderBottom: '1px solid #1a1a2e', position: 'sticky', top: 0, zIndex: 100 },
  content: { padding: 15, paddingBottom: 100 },
  card: { background: '#12121e', padding: 18, borderRadius: 24, border: '1px solid #1a1a2e', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  input: { width: '100%', padding: 16, background: '#1a1a2e', border: '1px solid #222', borderRadius: 16, color: '#fff', marginBottom: 15, boxSizing: 'border-box', outline: 'none', transition: '0.3s' },
  btnG: { padding: 16, background: '#00e676', color: '#000', border: 'none', borderRadius: 16, fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  nav: { position: 'fixed', bottom: 0, width: '100%', height: 80, background: 'rgba(18,18,30,0.98)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid #1a1a2e', zIndex: 1000, backdropFilter: 'blur(10px)' },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', gap: 6, transition: '0.3s' },
  ib: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btn: { padding: 12, border: 'none', borderRadius: 12, cursor: 'pointer', transition: '0.3s' },
  toast: { position: 'fixed', top: 15, left: 15, right: 15, padding: 16, borderRadius: 16, zIndex: 10000, color: '#000', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  loadingBar: { position: 'fixed', top: 0, width: '100%', height: 4, background: '#00e676', zIndex: 11000 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(5px)' },
  mCard: { background: '#fff', color: '#000', width: '100%', maxWidth: 350, padding: 30, borderRadius: 30, textAlign: 'center' }
};
