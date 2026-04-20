import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "5.1";

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

// Ombor kategoriyalari — har bir bo'lim uchun maxsus mahsulotlar
const OMBOR_CATEGORIES = [
  { id: 'bichuv', name: 'Bichuv uchun', dept: 'bichuv', items: ['Mato', 'Astar', 'Sintepon', 'Flizelin'] },
  { id: 'tikuv', name: 'Tikuv uchun', dept: 'tikuv', items: ['Ip', 'Igna', 'Qaychi', 'Mol', 'Rezinka'] },
  { id: 'taqsimot', name: 'Taqsimot uchun', dept: 'taqsimot', items: ['Zamok', 'Tugma', 'Knopka', 'Ilgak'] },
  { id: 'upakovka', name: 'Upakovka uchun', dept: 'upakovka', items: ['Paket', 'Sumka', 'Etiketka', 'Birka', 'Skotch'] },
  { id: 'xojalik', name: 'Xo\'jalik uchun', dept: 'xojalik', items: ['Tozalash vositasi', 'Qog\'oz', 'Marker'] },
];

/* ═══════════════ ASOSIY DASTUR ═══════════════ */
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
  const [heads, setHeads] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [models, setModels] = useState([]);
  const [whItems, setWhItems] = useState([]);
  const [whLog, setWhLog] = useState([]);
  const [msg, setMsg] = useState(null);
  const [dbOk, setDbOk] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 4000); }, []);

  const load = useCallback(async () => {
    try {
      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('attendance').select('*'),
        supabase.from('models').select('*').order('updatedAt', { ascending: false }),
        supabase.from('warehouse_items').select('*').order('dept'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(30)
      ]);
      if (r1.error) throw r1.error;
      setHeads(r1.data || []); setHistory(r2.data || []); setAttendance(r3.data || []);
      setModels(r4.data || []); setWhItems(r5.data || []); setWhLog(r6.data || []);
      setDbOk(true);
    } catch (e) { showMsg('Baza: ' + e.message, 'err'); }
  }, [showMsg]);

  useEffect(() => {
    localStorage.setItem('qv', APP_VERSION); load();
    const ch = supabase.channel('sync').on('postgres_changes', { event: '*', schema: 'public' }, () => load()).subscribe();
    return () => ch.unsubscribe();
  }, [load]);

  useEffect(() => { if (user) localStorage.setItem('qu', JSON.stringify(user)); else localStorage.removeItem('qu'); }, [user]);

  const login = (e) => {
    e.preventDefault();
    const l = auth.login.trim(), p = auth.password.trim();
    if (l === '0068' && p === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); return; }
    const h = heads.find(x => x.login === l && x.password === p);
    if (h) { setUser({ role: 'dept', ...h }); setTab('dept'); }
    else showMsg('Login yoki parol xato', 'err');
  };

  if (!user) return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={S.loginBox}>
        <Zap color="#00e676" size={36} style={{ margin: '0 auto 10px', display: 'block' }} />
        <h1 style={S.title}>QTTuz</h1>
        <p style={{ textAlign: 'center', color: '#555', fontSize: 10, marginBottom: 25 }}>V{APP_VERSION} | {dbOk ? '🟢 Online' : '⏳'}</p>
        <form onSubmit={login} style={S.form}>
          <input style={S.input} placeholder="Login" required value={auth.login} onChange={e => setAuth({ ...auth, login: e.target.value })} />
          <input style={S.input} type="password" placeholder="Parol" required value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} />
          <button type="submit" style={S.btnG}>KIRISH</button>
        </form>
      </motion.div>
    </div>
  );

  // Ombor bo'limi uchun maxsus panel
  const isOmbor = user.role === 'dept' && user.deptId === 'ombor';

  return (
    <div style={S.root}>
      <AnimatePresence>{msg && (
        <motion.div initial={{ y: -80 }} animate={{ y: 0 }} exit={{ y: -80 }}
          style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676', color: msg.type === 'err' ? '#fff' : '#000' }}>{msg.t}</motion.div>
      )}</AnimatePresence>

      <div style={S.header}>
        <div><div style={{ fontSize: 15, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 10, color: '#00e676' }}>V{APP_VERSION}</div></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={S.ib}><RefreshCcw size={16} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={16} /></button>
        </div>
      </div>

      <div style={S.content}>
        {/* ADMIN TABS */}
        {user.role === 'admin' && tab === 'dashboard' && <Dashboard heads={heads} attendance={attendance} today={today} models={models} whItems={whItems} />}
        {user.role === 'admin' && tab === 'heads' && <Heads heads={heads} showMsg={showMsg} load={load} />}
        {user.role === 'admin' && tab === 'models' && <Models models={models} />}
        {user.role === 'admin' && tab === 'history' && <Hist history={history} whLog={whLog} />}
        {/* OMBOR BO'LIMI */}
        {isOmbor && tab === 'dept' && <OmborDashboard user={user} whItems={whItems} whLog={whLog} attendance={attendance} heads={heads} today={today} showMsg={showMsg} load={load} />}
        {isOmbor && tab === 'wh_items' && <OmborMahsulot whItems={whItems} showMsg={showMsg} load={load} user={user} />}
        {isOmbor && tab === 'wh_log' && <OmborTarix whLog={whLog} />}
        {isOmbor && tab === 'wh_alert' && <OmborAlert whItems={whItems} />}
        {/* BOSHQA BO'LIMLAR */}
        {user.role === 'dept' && !isOmbor && <Dept user={user} attendance={attendance} today={today} showMsg={showMsg} load={load} />}
      </div>

      {/* ADMIN NAV */}
      {user.role === 'admin' && (
        <div style={S.nav}>
          {[{ id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' }, { id: 'models', icon: Layers, l: 'Modellar' }, { id: 'heads', icon: Users, l: 'Bo\'limlar' }, { id: 'history', icon: HistoryIcon, l: 'Tarix' }].map(x => (
            <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>
          ))}
        </div>
      )}

      {/* OMBOR NAV */}
      {isOmbor && (
        <div style={S.nav}>
          {[{ id: 'dept', icon: LayoutDashboard, l: 'Xulosa' }, { id: 'wh_items', icon: Package, l: 'Mahsulotlar' }, { id: 'wh_log', icon: HistoryIcon, l: 'Tarix' }, { id: 'wh_alert', icon: Bell, l: 'Ogohlantirish' }].map(x => (
            <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}><x.icon size={18} /><span style={{ fontSize: 9 }}>{x.l}</span></button>
          ))}
        </div>
      )}

      {/* ODDIY BO'LIM NAV */}
      {user.role === 'dept' && !isOmbor && (
        <div style={S.nav}>
          <button style={{ ...S.nb, color: '#00e676' }}><LayoutDashboard size={18} /><span style={{ fontSize: 9 }}>Panel</span></button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ OMBOR DASHBOARD ═══════════════ */
function OmborDashboard({ user, whItems, whLog, attendance, heads, today, showMsg, load }) {
  const att = attendance.find(a => a.headId === user.id && a.date === today);
  const omborHeads = heads.filter(h => h.deptId === 'ombor');
  const omborAtt = attendance.filter(a => a.date === today && omborHeads.find(h => h.id === a.headId));
  const lowStock = whItems.filter(i => i.quantity <= i.min_quantity);
  const lastIn = whLog.filter(l => l.type === 'Kirim').slice(0, 3);
  const lastOut = whLog.filter(l => l.type === 'Chiqim').slice(0, 3);

  const mark = async () => {
    const h = new Date().getHours(), m = new Date().getMinutes();
    const s = (h < 8 || (h === 8 && m <= 30)) ? 'Keldi' : 'Kechikdi';
    await supabase.from('attendance').upsert([{ id: `${today}_${user.id}`, headId: String(user.id), status: s, date: today }]);
    showMsg('Davomat belgilandi!'); load();
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Warehouse size={28} color="#00e676" style={{ margin: '0 auto 5px' }} />
        <h2 style={{ fontSize: 18, color: '#00e676' }}>Ombor Bo'limi</h2>
        {!att ? <button onClick={mark} style={{ ...S.btnG, marginTop: 10 }}>✅ Ishga keldim</button>
          : <div style={{ color: '#00e676', marginTop: 5, fontWeight: 'bold' }}>🟢 {att.status}</div>}
      </div>

      {/* STATISTIKA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
        <div style={S.card}><div style={{ fontSize: 9, color: '#555' }}>Xodimlar</div><div style={{ fontSize: 20, fontWeight: 'bold' }}>{omborHeads.length}</div></div>
        <div style={S.card}><div style={{ fontSize: 9, color: '#555' }}>Bugun keldi</div><div style={{ fontSize: 20, fontWeight: 'bold', color: '#00e676' }}>{omborAtt.length}</div></div>
        <div style={S.card}><div style={{ fontSize: 9, color: '#555' }}>Mahsulot turi</div><div style={{ fontSize: 20, fontWeight: 'bold' }}>{whItems.length}</div></div>
        <div style={{ ...S.card, border: lowStock.length > 0 ? '1px solid #ff3b30' : '1px solid #1a1a2e' }}>
          <div style={{ fontSize: 9, color: '#555' }}>Tugayotgan</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: lowStock.length > 0 ? '#ff3b30' : '#fff' }}>{lowStock.length}</div>
        </div>
      </div>

      {/* TUGAYOTGANLAR */}
      {lowStock.length > 0 && (
        <div style={{ ...S.card, marginBottom: 15, border: '1px solid #ff3b30' }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#ff3b30', marginBottom: 8 }}>⚠️ Tugayotgan Mahsulotlar</div>
          {lowStock.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a2e', fontSize: 12 }}>
              <span>{i.name}</span>
              <span style={{ color: '#ff3b30', fontWeight: 'bold' }}>{i.quantity} {i.unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* OXIRGI KIRIM */}
      <div style={{ ...S.card, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#00e676', marginBottom: 8 }}>📥 Oxirgi Kirimlar</div>
        {lastIn.length === 0 ? <p style={{ fontSize: 11, color: '#555' }}>Hali kirim yo'q</p> :
          lastIn.map(l => (
            <div key={l.id} style={{ fontSize: 11, padding: '5px 0', borderBottom: '1px solid #111' }}>
              <span style={{ color: '#00e676' }}>+{l.quantity}</span> {l.item_name} {l.note && `— ${l.note}`}
            </div>
          ))}
      </div>

      {/* OXIRGI CHIQIM */}
      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#ff9800', marginBottom: 8 }}>📤 Oxirgi Chiqimlar</div>
        {lastOut.length === 0 ? <p style={{ fontSize: 11, color: '#555' }}>Hali chiqim yo'q</p> :
          lastOut.map(l => (
            <div key={l.id} style={{ fontSize: 11, padding: '5px 0', borderBottom: '1px solid #111' }}>
              <span style={{ color: '#ff9800' }}>-{l.quantity}</span> {l.item_name} → {l.note || ''}
            </div>
          ))}
      </div>
    </div>
  );
}

/* ═══════════════ OMBOR MAHSULOTLAR ═══════════════ */
function OmborMahsulot({ whItems, showMsg, load, user }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showMove, setShowMove] = useState(null);
  const [moveQty, setMoveQty] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [moveType, setMoveType] = useState('Kirim');
  const [filter, setFilter] = useState('all');
  const [f, setF] = useState({ name: '', category: 'bichuv', dept: 'bichuv', quantity: '', min_quantity: '5', unit: 'dona', supplier: '' });

  const addItem = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('warehouse_items').insert([{ ...f, quantity: Number(f.quantity), min_quantity: Number(f.min_quantity) }]);
    if (error) showMsg('Xato: ' + error.message, 'err');
    else { showMsg('Mahsulot qo\'shildi! ✅'); setShowAdd(false); setF({ name: '', category: 'bichuv', dept: 'bichuv', quantity: '', min_quantity: '5', unit: 'dona', supplier: '' }); load(); }
  };

  const doMove = async (item) => {
    if (!moveQty || Number(moveQty) <= 0) { showMsg('Sonini kiriting!', 'err'); return; }
    const qty = Number(moveQty);
    const newQty = moveType === 'Kirim' ? item.quantity + qty : item.quantity - qty;
    if (newQty < 0) { showMsg('Yetarli mahsulot yo\'q!', 'err'); return; }

    const { error: e1 } = await supabase.from('warehouse_items').update({ quantity: newQty, updatedAt: new Date().toISOString() }).eq('id', item.id);
    const { error: e2 } = await supabase.from('warehouse_log').insert([{ item_id: item.id, item_name: item.name, type: moveType, quantity: qty, note: moveNote, user: user.name }]);
    if (e1 || e2) showMsg('Xato!', 'err');
    else { showMsg(`${moveType}: ${qty} ${item.unit} — ${item.name} ✅`); setShowMove(null); setMoveQty(''); setMoveNote(''); load(); }
  };

  const filtered = filter === 'all' ? whItems : whItems.filter(i => i.dept === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <h3 style={{ fontSize: 16 }}>Ombor Mahsulotlari</h3>
        <button onClick={() => setShowAdd(!showAdd)} style={{ ...S.btnG, padding: '6px 12px', fontSize: 12 }}>{showAdd ? 'Yopish' : '+ Yangi'}</button>
      </div>

      {/* FILTER */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 15, overflowX: 'auto', paddingBottom: 5 }}>
        <button onClick={() => setFilter('all')} style={{ ...S.chip, background: filter === 'all' ? '#00e676' : '#1a1a2e', color: filter === 'all' ? '#000' : '#888' }}>Hammasi</button>
        {OMBOR_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilter(c.dept)} style={{ ...S.chip, background: filter === c.dept ? '#00e676' : '#1a1a2e', color: filter === c.dept ? '#000' : '#888' }}>{c.name}</button>
        ))}
      </div>

      {/* YANGI MAHSULOT QO'SHISH */}
      {showAdd && (
        <form onSubmit={addItem} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15, border: '1px solid #00e676' }}>
          <input style={S.input} placeholder="Mahsulot nomi" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <select style={S.input} value={f.dept} onChange={e => setF({ ...f, dept: e.target.value, category: e.target.value })}>
            {OMBOR_CATEGORIES.map(c => <option key={c.id} value={c.dept}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={S.input} type="number" placeholder="Mavjud soni" required value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} />
            <input style={S.input} type="number" placeholder="Min soni" value={f.min_quantity} onChange={e => setF({ ...f, min_quantity: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={S.input} placeholder="Birlik (dona, metr...)" value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })} />
            <input style={S.input} placeholder="Ta'minotchi" value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} />
          </div>
          <button type="submit" style={S.btnG}>SAQLASH</button>
        </form>
      )}

      {/* MAHSULOTLAR RO'YXATI */}
      {filtered.length === 0 ? <p style={{ textAlign: 'center', color: '#555', fontSize: 12 }}>Mahsulot yo'q</p> :
        filtered.map(item => {
          const isLow = item.quantity <= item.min_quantity;
          return (
            <div key={item.id} style={{ ...S.card, marginBottom: 8, borderLeft: `3px solid ${isLow ? '#ff3b30' : '#00e676'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: '#555' }}>{OMBOR_CATEGORIES.find(c => c.dept === item.dept)?.name} | {item.supplier || ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: isLow ? '#ff3b30' : '#00e676' }}>{item.quantity}</div>
                  <div style={{ fontSize: 9, color: '#555' }}>{item.unit} (min: {item.min_quantity})</div>
                </div>
              </div>

              {/* KIRIM / CHIQIM TUGMALARI */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => { setShowMove(showMove === item.id ? null : item.id); setMoveType('Kirim'); }} style={{ ...S.smBtn, background: '#00e676', color: '#000' }}>📥 Kirim</button>
                <button onClick={() => { setShowMove(showMove === item.id ? null : item.id); setMoveType('Chiqim'); }} style={{ ...S.smBtn, background: '#ff9800', color: '#000' }}>📤 Chiqim</button>
                <button onClick={async () => { if (confirm("O'chirilsinmi?")) { await supabase.from('warehouse_items').delete().eq('id', item.id); load(); } }} style={{ ...S.smBtn, background: '#ff3b30', color: '#fff' }}>🗑</button>
              </div>

              {/* KIRIM/CHIQIM FORMASI */}
              {showMove === item.id && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input style={{ ...S.input, flex: 1 }} type="number" placeholder="Soni" value={moveQty} onChange={e => setMoveQty(e.target.value)} />
                  <input style={{ ...S.input, flex: 2 }} placeholder="Izoh (kimga/nimaga)" value={moveNote} onChange={e => setMoveNote(e.target.value)} />
                  <button onClick={() => doMove(item)} style={{ ...S.btnG, padding: '10px 15px' }}>{moveType}</button>
                </div>
              )}
            </div>
          );
        })
      }
    </div>
  );
}

/* ═══════════════ OMBOR TARIX ═══════════════ */
function OmborTarix({ whLog }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 15 }}>Ombor Tarixi</h3>
      {whLog.length === 0 ? <p style={{ textAlign: 'center', color: '#555', fontSize: 12 }}>Bo'sh</p> :
        whLog.map(l => (
          <div key={l.id} style={{ ...S.card, marginBottom: 8, fontSize: 11, borderLeft: `3px solid ${l.type === 'Kirim' ? '#00e676' : '#ff9800'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: l.type === 'Kirim' ? '#00e676' : '#ff9800', fontWeight: 'bold' }}>{l.type === 'Kirim' ? '📥' : '📤'} {l.type}</span>
              <span style={{ color: '#444' }}>{l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}</span>
            </div>
            <div><b>{l.item_name}</b>: {l.type === 'Kirim' ? '+' : '-'}{l.quantity}</div>
            {l.note && <div style={{ color: '#555', marginTop: 3 }}>💬 {l.note}</div>}
            <div style={{ color: '#333', fontSize: 9, marginTop: 2 }}>{l.user}</div>
          </div>
        ))
      }
    </div>
  );
}

/* ═══════════════ OMBOR OGOHLANTIRISH ═══════════════ */
function OmborAlert({ whItems }) {
  const lowStock = whItems.filter(i => i.quantity <= i.min_quantity);
  const orderText = lowStock.map(i => `• ${i.name}: ${i.quantity} ${i.unit} qoldi (min: ${i.min_quantity})`).join('\n');

  const copyOrder = () => {
    const text = `🔴 OMBOR: Zakaz kerak!\n\n${orderText}\n\nSana: ${new Date().toLocaleDateString()}`;
    navigator.clipboard.writeText(text).then(() => alert('Nusxalandi! Ta\'minotchiga yuboring.')).catch(() => alert(text));
  };

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 15 }}>⚠️ Ogohlantirish</h3>
      {lowStock.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: 30 }}>
          <CheckCircle size={40} color="#00e676" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 14, fontWeight: 'bold' }}>Hamma narsa yetarli!</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 5 }}>Hozircha hech narsa tugayotgani yo'q</div>
        </div>
      ) : (
        <>
          <div style={{ ...S.card, marginBottom: 15, border: '1px solid #ff3b30' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#ff3b30', marginBottom: 10 }}>🔴 {lowStock.length} ta mahsulot tugayapti!</div>
            {lowStock.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a2e' }}>
                <div><div style={{ fontSize: 13, fontWeight: 'bold' }}>{i.name}</div><div style={{ fontSize: 10, color: '#555' }}>{i.supplier || 'Ta\'minotchi belgilanmagan'}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 16, fontWeight: 'bold', color: '#ff3b30' }}>{i.quantity}</div><div style={{ fontSize: 9, color: '#555' }}>{i.unit}</div></div>
              </div>
            ))}
          </div>
          <button onClick={copyOrder} style={{ ...S.btnG, width: '100%', background: '#ff9800', color: '#000' }}>
            📋 Zakaz ro'yxatini nusxalash
          </button>
        </>
      )}
    </div>
  );
}

/* ═══════════════ ADMIN DASHBOARD ═══════════════ */
function Dashboard({ heads, attendance, today, models, whItems }) {
  const att = attendance.filter(a => a.date === today).length;
  const low = whItems.filter(i => i.quantity <= i.min_quantity).length;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <SC icon={Users} l="Xodimlar" v={heads.length} c="#00e676" />
        <SC icon={Activity} l="Modellar" v={models.length} c="#40c4ff" />
        <SC icon={UserCheck} l="Keldi" v={att} c="#00e676" />
        <SC icon={AlertTriangle} l="Yo'q" v={Math.max(0, heads.length - att)} c="#ff3b30" />
        <SC icon={Package} l="Ombor turlari" v={whItems.length} c="#ff9800" />
        <SC icon={Bell} l="Tugayotgan" v={low} c={low > 0 ? '#ff3b30' : '#00e676'} />
      </div>
    </div>
  );
}

function SC({ icon: I, l, v, c }) {
  return <div style={S.card}><I size={18} color={c} style={{ marginBottom: 4 }} /><div style={{ fontSize: 20, fontWeight: 'bold' }}>{v}</div><div style={{ fontSize: 9, color: '#555' }}>{l}</div></div>;
}

/* ═══════════════ HEADS ═══════════════ */
function Heads({ heads, showMsg, load }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', login: '', password: '', deptId: 'ombor' });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from('heads').insert([f]).select();
    if (error) showMsg('Xato: ' + error.message, 'err');
    else { showMsg('Saqlandi! ✅'); setOpen(false); setF({ name: '', login: '', password: '', deptId: 'ombor' }); load(); }
    setBusy(false);
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <h3 style={{ fontSize: 16 }}>Bo'lim Boshliqlari</h3>
        <button onClick={() => setOpen(!open)} style={{ ...S.btnG, padding: '6px 12px', fontSize: 12 }}>{open ? 'Yopish' : '+ Qo\'shish'}</button>
      </div>
      {open && (
        <form onSubmit={save} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15, border: '1px solid #00e676' }}>
          <input style={S.input} placeholder="Ism familiya" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={S.input} placeholder="Login" required value={f.login} onChange={e => setF({ ...f, login: e.target.value })} />
            <input style={S.input} placeholder="Parol" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
          </div>
          <select style={S.input} value={f.deptId} onChange={e => setF({ ...f, deptId: e.target.value })}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" style={S.btnG} disabled={busy}>{busy ? '...' : 'SAQLASH'}</button>
        </form>
      )}
      {heads.map(h => (
        <div key={h.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div><div style={{ fontSize: 13, fontWeight: 'bold' }}>{h.name}</div><div style={{ fontSize: 10, color: '#00e676' }}>{DEPARTMENTS.find(d => d.id === h.deptId)?.name || h.deptId}</div></div>
          <button onClick={async () => { if (confirm("O'chirilsinmi?")) { await supabase.from('heads').delete().eq('id', h.id); showMsg("O'chirildi!"); load(); } }} style={{ ...S.ib, color: '#ff3b30' }}><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ DEPT ═══════════════ */
function Dept({ user, attendance, today, showMsg, load }) {
  const [f, setF] = useState({ model: '', action: '', details: '' });
  const dept = DEPARTMENTS.find(d => d.id === user.deptId) || DEPARTMENTS[0];
  const att = attendance.find(a => a.headId === user.id && a.date === today);
  const send = async (e) => {
    e.preventDefault();
    if (!f.action) { showMsg('Amalni tanlang!', 'err'); return; }
    const { error } = await supabase.from('history').insert([{ dept: dept.name, action: f.action, details: f.details, model: f.model, user: user.name }]);
    if (error) { showMsg('Xato: ' + error.message, 'err'); return; }
    if (f.model) await supabase.from('models').upsert([{ id: f.model.toLowerCase(), modelName: f.model, currentDept: dept.name, progress: dept.step || 0, updatedAt: new Date().toISOString() }]);
    showMsg('Saqlandi! ✅'); setF({ ...f, model: '', details: '' }); load();
  };
  const mark = async () => {
    const s = (new Date().getHours() < 8 || (new Date().getHours() === 8 && new Date().getMinutes() <= 30)) ? 'Keldi' : 'Kechikdi';
    await supabase.from('attendance').upsert([{ id: `${today}_${user.id}`, headId: String(user.id), status: s, date: today }]);
    showMsg('Davomat!'); load();
  };
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}><h3 style={{ color: '#00e676' }}>{dept.name}</h3>{!att ? <button onClick={mark} style={{ ...S.btnG, marginTop: 10 }}>✅ Ishga keldim</button> : <div style={{ color: '#00e676' }}>🟢 {att.status}</div>}</div>
      <form onSubmit={send} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={S.input} placeholder="Model" required value={f.model} onChange={e => setF({ ...f, model: e.target.value })} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{dept.actions.map(a => (
          <button key={a} type="button" onClick={() => setF({ ...f, action: a })} style={{ flex: '1 0 45%', padding: 10, fontSize: 11, borderRadius: 8, border: 'none', background: f.action === a ? '#00e676' : '#1a1a2e', color: f.action === a ? '#000' : '#888' }}>{a}</button>
        ))}</div>
        <input style={S.input} type="number" placeholder="Soni" required value={f.details} onChange={e => setF({ ...f, details: e.target.value })} />
        <button type="submit" style={S.btnG}>YUBORISH</button>
      </form>
    </div>
  );
}

/* ═══════════════ MODELS ═══════════════ */
function Models({ models }) {
  return <div><h3 style={{ fontSize: 16, marginBottom: 15 }}>Modellar</h3>{models.map(m => (
    <div key={m.id} style={{ ...S.card, marginBottom: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><b>{m.modelName}</b><span style={{ color: '#00e676', fontSize: 10 }}>{m.currentDept}</span></div>
      <div style={{ height: 4, background: '#1a1a2e', borderRadius: 2 }}><div style={{ width: `${(m.progress / 5) * 100}%`, height: '100%', background: '#00e676', borderRadius: 2 }}></div></div></div>
  ))}</div>;
}

/* ═══════════════ HISTORY ═══════════════ */
function Hist({ history, whLog }) {
  return <div><h3 style={{ fontSize: 16, marginBottom: 15 }}>Tarix</h3>
    {history.map(x => (<div key={x.id} style={{ ...S.card, marginBottom: 8, fontSize: 11, borderLeft: '3px solid #00e676' }}><div style={{ color: '#00e676', fontWeight: 'bold' }}>{x.dept}</div><div>{x.model}: {x.action} — {x.details}</div></div>))}
  </div>;
}

/* ═══════════════ STILLAR ═══════════════ */
const S = {
  root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, sans-serif', color: '#fff' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 360, padding: 30, background: '#12121e', borderRadius: 20, border: '1px solid rgba(0,230,118,0.15)' },
  title: { textAlign: 'center', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { width: '100%', padding: '12px 14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btnG: { padding: '12px 20px', background: '#00e676', color: '#000', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 13, cursor: 'pointer' },
  smBtn: { flex: 1, padding: '8px', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 11, cursor: 'pointer' },
  chip: { padding: '6px 12px', borderRadius: 20, border: 'none', fontSize: 10, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #1a1a2e' },
  content: { flex: 1, padding: 15, paddingBottom: 80, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 12, padding: 15, border: '1px solid #1a1a2e', textAlign: 'center' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '8px 0', background: '#0a0a14', borderTop: '1px solid #1a1a2e' },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer' },
  ib: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  toast: { position: 'fixed', top: 10, left: 10, right: 10, padding: 14, borderRadius: 12, zIndex: 10000, textAlign: 'center', fontWeight: 'bold', fontSize: 13, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }
};
