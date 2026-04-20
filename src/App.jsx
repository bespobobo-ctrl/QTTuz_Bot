import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  ChevronDown, ChevronUp, Search, Palette, Ruler, Scale, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "5.5";

const DEPARTMENTS = [
  { id: 'ombor', name: 'Ombor Bo\'limi', icon: Warehouse, actions: ['Kirim', 'Chiqim'], step: 0.2 },
  { id: 'matolar', name: 'Matolar Bo\'limi', icon: ScrollText, actions: ['Kirim', 'Chiqim'], step: 0.5 },
  { id: 'bichuv', name: 'Bichuv Bo\'limi', icon: Scissors, actions: ['Bichildi'], step: 1 },
  { id: 'taqsimot', name: 'Taqsimot Bo\'limi', icon: Truck, actions: ['Ishga berildi', 'Kraskaga yuborildi', 'Vishivkaga yuborildi', 'Pressga yuborildi', 'Natija qaytdi'], step: 2 },
  { id: 'tikuv', name: 'Tikuv Bo\'limi', icon: Activity, actions: ['Tikuv bitdi'], step: 3 },
  { id: 'upakovka', name: 'Upakovka Bo\'limi', icon: Box, actions: ['Upakovka bitdi', 'Tayyorga topshirildi'], step: 4 },
  { id: 'tayyor', name: 'Tayyor mahsulot', icon: CheckCircle2, actions: ['Qabul qilindi'], step: 5 },
  { id: 'xojalik', name: 'Xo\'jalik Bo\'limi', icon: Home, actions: ['Xarajat', 'Kirim'], step: 0 },
  { id: 'ekspremetal', name: 'Ekspremetal', icon: Wrench, actions: ['Namuna tayyor'], step: 0 },
  { id: 'kadirlar', name: 'Kadirlar Bo\'limi', icon: Users, actions: ['Hujjatlash'], step: 0 },
];

const OMBOR_CATEGORIES = [
  { id: 'bichuv', name: 'Bichuv uchun', dept: 'bichuv' },
  { id: 'tikuv', name: 'Tikuv uchun', dept: 'tikuv' },
  { id: 'taqsimot', name: 'Taqsimot uchun', dept: 'taqsimot' },
  { id: 'upakovka', name: 'Upakovka uchun', dept: 'upakovka' },
  { id: 'xojalik', name: 'Xo\'jalik uchun', dept: 'xojalik' },
];

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      if (localStorage.getItem('qv') !== APP_VERSION) { localStorage.clear(); return null; }
      const s = localStorage.getItem('qu');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [tab, setTab] = useState('dashboard');
  const [auth, setAuth] = useState({ login: '', password: '' });
  const [data, setData] = useState({ heads: [], history: [], attendance: [], models: [], whItems: [], whLog: [], whOrders: [] });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 4000); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, hi, att, md, wi, wl, wo] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('attendance').select('*'),
        supabase.from('models').select('*').order('updatedAt', { ascending: false }),
        supabase.from('warehouse_items').select('*').order('name'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('warehouse_orders').select('*').order('timestamp', { ascending: false })
      ]);
      setData({ heads: h.data || [], history: hi.data || [], attendance: att.data || [], models: md.data || [], whItems: wi.data || [], whLog: wl.data || [], whOrders: wo.data || [] });
    } catch (e) { showMsg(e.message, 'err'); }
    setLoading(false);
  }, [showMsg]);

  useEffect(() => {
    localStorage.setItem('qv', APP_VERSION); load();
    const sub = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public' }, load).subscribe();
    return () => sub.unsubscribe();
  }, [load]);

  useEffect(() => { if (user) localStorage.setItem('qu', JSON.stringify(user)); else localStorage.removeItem('qu'); }, [user]);

  const login = (e) => {
    e.preventDefault();
    if (auth.login === '0068' && auth.password === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); return; }
    const h = data.heads.find(x => x.login === auth.login && x.password === auth.password);
    if (h) { setUser({ role: 'dept', ...h }); setTab('dept'); }
    else showMsg('Login yoki parol xato', 'err');
  };

  if (!user) return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={S.loginBox}>
        <Zap color="#00e676" size={40} style={{ margin: '0 auto 15px', display: 'block' }} />
        <h1 style={S.title}>QTTuz</h1>
        <p style={{ textAlign: 'center', color: '#555', fontSize: 11, marginBottom: 30 }}>Ishlab Chiqarishni Boshqarish V{APP_VERSION}</p>
        <form onSubmit={login} style={S.form}>
          <input style={S.input} placeholder="Login" required value={auth.login} onChange={e => setAuth({ ...auth, login: e.target.value })} />
          <input style={S.input} type="password" placeholder="Parol" required value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} />
          <button type="submit" style={S.btnG}>KIRISH</button>
        </form>
      </motion.div>
    </div>
  );

  const isOmbor = user.role === 'dept' && user.deptId === 'ombor';

  return (
    <div style={S.root}>
      <AnimatePresence>{msg && (<motion.div initial={{ y: -80 }} animate={{ y: 0 }} exit={{ y: -80 }} style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676', color: msg.type === 'err' ? '#fff' : '#000' }}>{msg.t}</motion.div>)}</AnimatePresence>

      <header style={S.header}>
        <div><div style={{ fontSize: 15, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 10, color: '#00e676' }}>{APP_VERSION} PRO</div></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={S.ib}><RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={16} /></button>
        </div>
      </header>

      <main style={S.content}>
        {user.role === 'admin' && tab === 'dashboard' && <AdminDashboard data={data} />}
        {user.role === 'admin' && tab === 'heads' && <Heads heads={data.heads} showMsg={showMsg} load={load} />}
        {user.role === 'admin' && tab === 'models' && <Models models={data.models} />}
        {user.role === 'admin' && tab === 'history' && <Hist history={data.history} />}

        {isOmbor && tab === 'dept' && <OmborDashboard user={user} data={data} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'wh_items' && <OmborMahsulotlar whItems={data.whItems} user={user} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'wh_orders' && <OmborZakazlar whOrders={data.whOrders} user={user} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'wh_settings' && <OmborSozlamalar user={user} />}

        {user.role === 'dept' && !isOmbor && <DeptPanel user={user} data={data} showMsg={showMsg} load={load} />}
      </main>

      {/* FOOTER NAV */}
      <nav style={S.nav}>
        {user.role === 'admin' && [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' },
          { id: 'models', icon: Layers, l: 'Progress' },
          { id: 'heads', icon: Users, l: 'Bo\'limlar' },
          { id: 'history', icon: HistoryIcon, l: 'Arxiv' }
        ].map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>
        ))}
        {isOmbor && [
          { id: 'dept', icon: LayoutDashboard, l: 'Asosiy' },
          { id: 'wh_items', icon: Package, l: 'Ombor' },
          { id: 'wh_orders', icon: ShoppingCart, l: 'Zakazlar' },
          { id: 'wh_settings', icon: Settings, l: 'Sozlamalar' }
        ].map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>
        ))}
        {user.role === 'dept' && !isOmbor && <button style={{ ...S.nb, color: '#00e676' }}><LayoutDashboard size={18} /><span>Panel</span></button>}
      </nav>
    </div>
  );
}

/* ═══════════════ OMBOR DASHBOARD ═══════════════ */
function OmborDashboard({ user, data, showMsg, load }) {
  const today = new Date().toISOString().split('T')[0];
  const att = data.attendance.find(a => a.headId === user.id && a.date === today);
  const lowStock = data.whItems.filter(i => i.quantity <= i.min_quantity);
  const activeOrders = data.whOrders.filter(o => o.status === 'Kutilmoqda');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {!att ? <button onClick={async () => {
          const s = new Date().getHours() < 8 || (new Date().getHours() === 8 && new Date().getMinutes() <= 30) ? 'Keldi' : 'Kechikdi';
          await supabase.from('attendance').upsert([{ id: `${today}_${user.id}`, headId: String(user.id), status: s, date: today }]);
          showMsg('Ish boshlandi!'); load();
        }} style={S.btnG}>✅ Ishga keldim</button> : <div style={{ color: '#00e676', fontWeight: 'bold' }}>🟢 BUGUN ISHDA: {att.status}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
        <SCard icon={Package} l="Jami mahsulot" v={data.whItems.length} c="#00e676" />
        <SCard icon={AlertTriangle} l="Kam qolgan" v={lowStock.length} c={lowStock.length > 0 ? '#ff3b30' : '#00e676'} />
        <SCard icon={ShoppingCart} l="Zakazlar" v={activeOrders.length} c="#ff9800" />
        <SCard icon={HistoryIcon} l="Bugungi harakat" v={data.whLog.filter(l => l.timestamp.startsWith(today)).length} c="#40c4ff" />
      </div>

      {lowStock.length > 0 && (
        <div style={S.alertCard}>
          <div style={{ fontWeight: 'bold', fontSize: 13, color: '#ff3b30', marginBottom: 5 }}>⚠️ Tugab bormoqda</div>
          {lowStock.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0' }}>
              <span>{i.name} {i.color ? `(${i.color})` : ''}</span>
              <span style={{ fontWeight: 'bold' }}>{i.quantity} {i.unit}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════ OMBOR MAHSULOTLAR (YANGILANGAN) ═══════════════ */
function OmborMahsulotlar({ whItems, user, showMsg, load }) {
  const [subTab, setSubTab] = useState('fabric'); // fabric or production
  const [showAdd, setShowAdd] = useState(false);
  const [showMove, setShowMove] = useState(null);
  const [move, setMove] = useState({ qty: '', type: 'Kirim', note: '' });
  const [f, setF] = useState({ name: '', is_fabric: true, category: 'bichuv', dept: 'bichuv', quantity: '', min_quantity: '5', unit: 'kg', color: '', gramaj: '', width: '', supplier: '' });

  const filtered = useMemo(() => whItems.filter(i => subTab === 'fabric' ? i.is_fabric : !i.is_fabric), [whItems, subTab]);

  const saveItem = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('warehouse_items').insert([{ ...f, is_fabric: subTab === 'fabric', quantity: Number(f.quantity), min_quantity: Number(f.min_quantity) }]);
    if (error) showMsg(error.message, 'err');
    else { showMsg('Saqlandi! ✅'); setShowAdd(false); load(); }
  };

  const updateQty = async (item) => {
    const q = Number(move.qty);
    if (q <= 0) return;
    const newQ = move.type === 'Kirim' ? item.quantity + q : item.quantity - q;
    if (newQ < 0) { showMsg('Omborda yetarli emas!', 'err'); return; }

    await supabase.from('warehouse_items').update({ quantity: newQ, updatedAt: new Date().toISOString() }).eq('id', item.id);
    await supabase.from('warehouse_log').insert([{ item_id: item.id, item_name: item.name, type: move.type, quantity: q, note: move.note, user: user.name }]);
    showMsg('Bajarildi! ✅'); setShowMove(null); setMove({ qty: '', type: 'Kirim', note: '' }); load();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
        <button onClick={() => setSubTab('fabric')} style={{ ...S.subTab, background: subTab === 'fabric' ? '#00e676' : '#12121e', color: subTab === 'fabric' ? '#000' : '#555' }}>
          <ScrollText size={16} /> Mato Ombori
        </button>
        <button onClick={() => setSubTab('production')} style={{ ...S.subTab, background: subTab === 'production' ? '#00e676' : '#12121e', color: subTab === 'production' ? '#000' : '#555' }}>
          <Package size={16} /> I/Ch Ombori
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3>{subTab === 'fabric' ? 'Matolar' : 'I/Ch Mahsulotlari'}</h3>
        <button onClick={() => setShowAdd(!showAdd)} style={{ ...S.btnG, padding: '6px 12px', fontSize: 12 }}>{showAdd ? 'Yopish' : '+ Yangi'}</button>
      </div>

      {showAdd && (
        <form onSubmit={saveItem} style={S.addForm}>
          <input style={S.input} placeholder="Nomi" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          {subTab === 'fabric' ? (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={S.input} placeholder="Rangi" value={f.color} onChange={e => setF({ ...f, color: e.target.value })} />
                <input style={S.input} placeholder="Gramaj" value={f.gramaj} onChange={e => setF({ ...f, gramaj: e.target.value })} />
              </div>
              <input style={S.input} placeholder="Eni" value={f.width} onChange={e => setF({ ...f, width: e.target.value })} />
            </>
          ) : (
            <select style={S.input} value={f.dept} onChange={e => setF({ ...f, dept: e.target.value, category: e.target.value })}>
              {OMBOR_CATEGORIES.map(c => <option key={c.id} value={c.dept}>{c.name}</option>)}
            </select>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={S.input} type="number" placeholder="Soni" required value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} />
            <input style={S.input} placeholder="Birlik" value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })} />
          </div>
          <button type="submit" style={S.btnG}>QO'SHISH</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(i => (
          <div key={i.id} style={{ ...S.card, textAlign: 'left', borderLeft: i.quantity <= i.min_quantity ? '4px solid #ff3b30' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{i.name} {i.color && <span style={{ color: '#00e676' }}>— {i.color}</span>}</div>
                {i.is_fabric && <div style={{ fontSize: 9, color: '#555' }}>G: {i.gramaj} | E: {i.width}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: i.quantity <= i.min_quantity ? '#ff3b30' : '#fff' }}>{i.quantity} <span style={{ fontSize: 10 }}>{i.unit}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => { setShowMove(showMove === i.id ? null : i.id); setMove({ ...move, type: 'Kirim' }); }} style={{ ...S.smBtn, background: '#00e676' }}>Kirim</button>
              <button onClick={() => { setShowMove(showMove === i.id ? null : i.id); setMove({ ...move, type: 'Chiqim' }); }} style={{ ...S.smBtn, background: '#ff9800' }}>Chiqim</button>
              <button onClick={async () => { if (confirm('O\'chirilsinmi?')) { await supabase.from('warehouse_items').delete().eq('id', i.id); load(); } }} style={{ ...S.smBtn, background: '#ff3b30', width: 30 }}><Trash2 size={12} /></button>
            </div>

            {showMove === i.id && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input style={S.input} type="number" placeholder="Soni" value={move.qty} onChange={e => setMove({ ...move, qty: e.target.value })} />
                <input style={S.input} placeholder="Izoh (kimga/kimdan)" value={move.note} onChange={e => setMove({ ...move, note: e.target.value })} />
                <button onClick={() => updateQty(i)} style={S.btnG}>{move.type}NI TASDIQLASH</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ OMBOR ZAKAZLAR ═══════════════ */
function OmborZakazlar({ whOrders, user, showMsg, load }) {
  const [showAdd, setShowAdd] = useState(false);
  const [f, setF] = useState({ item_name: '', quantity: '', supplier: '', delivery_date: '', note: '' });

  const saveOrder = async (e) => {
    e.preventDefault();
    await supabase.from('warehouse_orders').insert([{ ...f, user: user.name }]);
    showMsg('Zakaz qo\'shildi! ✅'); setShowAdd(false); setF({ item_name: '', quantity: '', supplier: '', delivery_date: '', note: '' }); load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <h3>Zakazlar Nazorati</h3>
        <button onClick={() => setShowAdd(!showAdd)} style={S.btnG}>{showAdd ? 'Yopish' : '+ Zakaz'}</button>
      </div>

      {showAdd && (
        <form onSubmit={saveOrder} style={S.addForm}>
          <input style={S.input} placeholder="Nima zakaz (Mato/Ip...)" required value={f.item_name} onChange={e => setF({ ...f, item_name: e.target.value })} />
          <input style={S.input} type="number" placeholder="Soni" required value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} />
          <input style={S.input} placeholder="Ta'minotchi" value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} />
          <input style={S.input} type="date" placeholder="Kelish sanasi" value={f.delivery_date} onChange={e => setF({ ...f, delivery_date: e.target.value })} />
          <button type="submit" style={S.btnG}>ZAKAZNI RO'YXATGA OLISH</button>
        </form>
      )}

      {whOrders.map(o => (
        <div key={o.id} style={{ ...S.card, textAlign: 'left', borderLeft: o.status === 'Keldi' ? '4px solid #00e676' : '4px solid #ff9800' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{o.item_name} — {o.quantity} dona</div>
              <div style={{ fontSize: 10, color: '#555' }}>Ta'minotchi: {o.supplier}</div>
            </div>
            <div style={{ fontSize: 10, textAlign: 'right' }}>
              <div style={{ color: '#ff9800' }}>📅 {o.delivery_date || 'Noma\'lum'}</div>
              <div style={{ fontWeight: 'bold' }}>{o.status}</div>
            </div>
          </div>
          {o.status === 'Kutilmoqda' && (
            <button onClick={async () => { await supabase.from('warehouse_orders').update({ status: 'Keldi' }).eq('id', o.id); load(); }} style={{ ...S.btnG, marginTop: 10, padding: '5px 10px', fontSize: 10 }}>KELDIMI?</button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ QOLGAN KOMPONENTLAR ═══════════════ */
function AdminDashboard({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <SCard icon={Users} l="Bo'limlar" v={data.heads.length} c="#00e676" />
      <SCard icon={Activity} l="Modellar" v={data.models.length} c="#40c4ff" />
      <SCard icon={Warehouse} l="Mato turlari" v={data.whItems.filter(i => i.is_fabric).length} c="#ff9800" />
      <SCard icon={Package} l="Mahsulotlar" v={data.whItems.filter(i => !i.is_fabric).length} c="#00e676" />
    </div>
  );
}

function SCard({ icon: I, l, v, c }) { return <div style={S.card}><I size={18} color={c} style={{ margin: '0 auto 5px' }} /><div style={{ fontSize: 22, fontWeight: 'bold' }}>{v}</div><div style={{ fontSize: 9, color: '#555' }}>{l}</div></div> }
function Heads({ heads, showMsg, load }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', login: '', password: '', deptId: 'ombor' });
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}><h3>Bo'limlar</h3><button onClick={() => setOpen(!open)} style={S.btnG}>{open ? 'Yopish' : '+'}</button></div>
      {open && <form onSubmit={async (e) => { e.preventDefault(); await supabase.from('heads').insert([f]); setOpen(false); load(); }} style={S.addForm}><input style={S.input} placeholder="Ism" required onChange={e => setF({ ...f, name: e.target.value })} /><div style={{ display: 'flex', gap: 5 }}><input style={S.input} placeholder="L" onChange={e => setF({ ...f, login: e.target.value })} /><input style={S.input} placeholder="P" onChange={e => setF({ ...f, password: e.target.value })} /></div><select style={S.input} onChange={e => setF({ ...f, deptId: e.target.value })}>{DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select><button type="submit" style={S.btnG}>SAQLASH</button></form>}
      {heads.map(h => <div key={h.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><div>{h.name} <span style={{ fontSize: 9, color: '#00e676' }}>{h.deptId}</span></div><button onClick={async () => { if (confirm('?')) { await supabase.from('heads').delete().eq('id', h.id); load(); } }} style={{ ...S.ib, color: '#ff3b30' }}><Trash2 size={16} /></button></div>)}
    </div>
  );
}
function Models({ models }) { return <div>{models.map(m => <div key={m.id} style={{ ...S.card, marginBottom: 10, textAlign: 'left' }}><b>{m.modelName}</b> — <span style={{ fontSize: 10 }}>{m.currentDept}</span><div style={{ height: 4, background: '#1a1a2e', marginTop: 5 }}><div style={{ width: `${(m.progress / 5) * 100}%`, height: '100%', background: '#00e676' }} /></div></div>)}</div> }
function Hist({ history }) { return <div>{history.map(x => <div key={x.id} style={{ ...S.card, marginBottom: 8, fontSize: 10, textAlign: 'left' }}><b style={{ color: '#00e676' }}>{x.dept}</b>: {x.model} — {x.action}</div>)}</div> }
function OmborSozlamalar() { return <div style={S.card}>SOZLAMALAR PANELI<p style={{ fontSize: 10, color: '#555', marginTop: 10 }}>V5.5 - Matolar va I/Ch Ombori alohida tizimi</p></div> }
function DeptPanel({ user, data, showMsg, load }) {
  const [f, setF] = useState({ model: '', action: '', details: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || DEPARTMENTS[0];
  const att = data.attendance.find(a => a.headId === user.id && a.date === new Date().toISOString().split('T')[0]);
  const mats = data.whItems.filter(i => i.is_fabric && (user.deptId === 'bichuv' || user.deptId === 'ekspremetal' || user.deptId === 'taqsimot'));

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}><h3 style={{ color: '#00e676' }}>{dept.name}</h3>{!att && <button onClick={async () => { await supabase.from('attendance').upsert([{ id: `${new Date().toISOString().split('T')[0]}_${user.id}`, headId: String(user.id), status: 'Keldi', date: new Date().toISOString().split('T')[0] }]); load(); }} style={S.btnG}>ISHGA KELDIM</button>}</div>
      <form onSubmit={async (e) => { e.preventDefault(); await supabase.from('history').insert([{ dept: dept.name, action: f.action, details: f.details, model: f.model, user: user.name }]); if (f.model) await supabase.from('models').upsert([{ id: f.model.toLowerCase(), modelName: f.model, currentDept: dept.name, progress: dept.step || 0 }]); showMsg('Tayyor!'); setF({ ...f, model: '', details: '' }); load(); }} style={S.addForm}>
        <input style={S.input} placeholder="Model" required value={f.model} onChange={e => setF({ ...f, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{dept.actions.map(a => <button key={a} type="button" onClick={() => setF({ ...f, action: a })} style={{ ...S.chip, background: f.action === a ? '#00e676' : '#12121e', color: f.action === a ? '#000' : '#555', flex: '1 0 45%', padding: 10 }}>{a}</button>)}</div>
        <input style={S.input} placeholder="Soni/Izoh" value={f.details} onChange={e => setF({ ...f, details: e.target.value })} />
        <button type="submit" style={S.btnG}>YUBORISH</button>
      </form>
      {mats.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ fontSize: 12, marginBottom: 10, color: '#ff9800' }}>OMBOR QOLDIG'I (MATOLAR)</h4>
          {mats.map(m => <div key={m.id} style={{ ...S.card, marginBottom: 5, fontSize: 10, display: 'flex', justifyContent: 'space-between' }}><span>{m.name} ({m.color})</span><b>{m.quantity} kg</b></div>)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ STILLAR ═══════════════ */
const S = {
  root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13 },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 350, padding: 30, background: '#12121e', borderRadius: 24, border: '1px solid rgba(0,230,118,0.1)' },
  title: { textAlign: 'center', fontSize: 32, fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { width: '100%', padding: '14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btnG: { padding: '14px', background: '#00e676', color: '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #1a1a2e' },
  content: { flex: 1, padding: 15, paddingBottom: 85, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 16, padding: 15, border: '1px solid #1a1a2e', textAlign: 'center' },
  alertCard: { background: 'rgba(255,59,48,0.1)', border: '1px solid #ff3b30', borderRadius: 16, padding: 15, marginBottom: 15 },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 0', background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid #1a1a2e' },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' },
  ib: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  smBtn: { padding: '6px 12px', border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 'bold', cursor: 'pointer', color: '#000' },
  subTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' },
  addForm: { background: '#12121e', padding: 15, borderRadius: 16, border: '1px solid #00e676', marginBottom: 15, display: 'flex', flexDirection: 'column', gap: 10 },
  chip: { border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 'bold', cursor: 'pointer' },
  toast: { position: 'fixed', top: 10, left: 10, right: 10, padding: 15, borderRadius: 14, zIndex: 10000, textAlign: 'center', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }
};
