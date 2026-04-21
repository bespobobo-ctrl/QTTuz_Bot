import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, History as HistoryIcon, LayoutDashboard, LogOut, Trash2, Scissors,
  Truck, Box, Warehouse, CheckCircle2, Home, Wrench, UserCheck,
  AlertTriangle, Activity, Layers, ScrollText, RefreshCcw, Plus, Minus,
  Zap, CheckCircle, Package, ArrowDown, ArrowUp, Bell, ShoppingCart,
  Settings, Palette, Ruler, Scale, QrCode, Scan, X, Printer, Clock, Coffee, Search, Filter as FilterIcon,
  Download, Upload, ChevronRight, Maximize, RulerIcon, Info, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255xwygwwnhnghqihuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "10.2 WAREHOUSE-ULTRA";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('qu');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ heads: [], history: [], whItems: [], whLog: [], whBatches: [], whRolls: [] });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  const showMsg = useCallback((t, type = 'ok') => { setMsg({ t, type }); setTimeout(() => setMsg(null), 3000); }, []);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [h, hi, wi, wl, wb, wr, ver] = await Promise.all([
        supabase.from('heads').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(20),
        supabase.from('warehouse_items').select('*'),
        supabase.from('warehouse_log').select('*').order('timestamp', { ascending: false }).limit(30),
        supabase.from('warehouse_batches').select('*').order('arrival_date', { ascending: false }),
        supabase.from('warehouse_rolls').select('*').order('created_at', { ascending: false }),
        supabase.from('system_config').select('*').eq('key', 'app_version').single()
      ]);

      if (ver.data && ver.data.value !== APP_VERSION) {
        setNeedsUpdate(true);
      } else {
        setNeedsUpdate(false);
      }

      setData({ heads: h.data || [], history: hi.data || [], whItems: wi.data || [], whLog: wl.data || [], whBatches: wb.data || [], whRolls: wr.data || [] });
    } catch (e) {
      console.error(e);
      // Silently fail if version config is missing
    }
    finally { setLoading(false); }
  }, []);

  const handleHardUpdate = () => {
    const url = new URL(window.location.origin);
    url.searchParams.set('v', Date.now());
    window.location.href = url.toString();
  };

  useEffect(() => {
    load();
    const sub = supabase.channel('ultra-sync').on('postgres_changes', { event: '*', schema: 'public' }, () => load(true)).subscribe();
    return () => sub.unsubscribe();
  }, [load]);

  if (needsUpdate) return (
    <div style={{ ...S.root, justifyContent: 'center', alignItems: 'center', padding: 40, textAlign: 'center' }}>
      <Zap size={60} color="#00e676" style={{ marginBottom: 20 }} />
      <h1 style={{ fontSize: 22, fontWeight: 'bold' }}>YANGI VERSIYA MAVJUD!</h1>
      <p style={{ color: '#888', marginBottom: 20 }}>Tizimning barqaror ishlashi uchun yangilash tugmasini bosing.</p>
      <button onClick={handleHardUpdate} style={{ ...S.btnG, width: '100%', marginTop: 10 }}> YANGILASH VA TOZALASH 🚀</button>
    </div>
  );

  if (!user) return <Login data={data} setUser={setUser} setTab={setTab} showMsg={showMsg} />;

  const isOmbor = user.role === 'dept' && user.deptId === 'ombor';

  return (
    <div style={S.root}>
      <AnimatePresence>
        {msg && (<motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676' }}>{msg.t}</motion.div>)}
        {loading && <div style={S.loadingBar} />}
      </AnimatePresence>

      <header style={S.header}>
        <div><div style={{ fontSize: 16, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 9, color: '#00e676' }}>{APP_VERSION} PRO</div></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => load()} style={S.ib}><RefreshCcw size={18} className={loading ? 'spin' : ''} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={S.content}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isOmbor ? <OmborUltra tab={tab} user={user} data={data} showMsg={showMsg} load={load} /> : <div style={S.card}>Admin bo'limi...</div>}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav style={S.nav}>
        {(isOmbor ? [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Radar' },
          { id: 'kirim', icon: Download, l: 'Kirim' },
          { id: 'ombor', icon: Package, l: 'Stock' },
          { id: 'chiqim', icon: Upload, l: 'Chiqim' }
        ] : [
          { id: 'dashboard', icon: LayoutDashboard, l: 'Xulosa' },
          { id: 'heads', icon: Users, l: 'Xodim' },
          { id: 'history', icon: HistoryIcon, l: 'Log' }
        ]).map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} style={{ ...S.nb, color: tab === x.id ? '#00e676' : '#555' }}>
            <x.icon size={22} /><span style={{ fontSize: 9 }}>{x.l}</span>
          </button>
        ))}
      </nav>
      <style>{` @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; } `}</style>
    </div>
  );
}

function Login({ data, setUser, setTab, showMsg }) {
  const [auth, setAuth] = useState({ login: '', password: '' });
  return (
    <div style={S.root}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={S.loginBox}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}><Warehouse color="#00e676" size={50} style={{ margin: '0 auto' }} /></div>
        <h1 style={{ ...S.title, fontSize: 26 }}>QTTuz PRO</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (auth.login === '0068' && auth.password === '0068') { setUser({ role: 'admin', name: 'Rahbar' }); return; }
          if (auth.login === '1234' && auth.password === '1234') { setUser({ role: 'dept', deptId: 'ombor', name: 'Omborchi' }); return; }
          const h = data.heads.find(x => x.login === auth.login && x.password === auth.password);
          if (h) { setUser({ role: 'dept', ...h }); setTab('dashboard'); } else showMsg('Xato!', 'err');
        }} style={S.form}>
          <input style={S.input} placeholder="Login" required onChange={e => setAuth({ ...auth, login: e.target.value })} />
          <input style={S.input} type="password" placeholder="Parol" required onChange={e => setAuth({ ...auth, password: e.target.value })} />
          <button type="submit" style={S.btnG}>KIRISH</button>
        </form>
      </motion.div>
    </div>
  );
}

function OmborUltra({ tab, user, data, showMsg, load }) {
  const [m, setM] = useState('fabric');
  const [f, setF] = useState({ bn: '', n: '', c: '', b: '', en: '', gr: '', rS: 1, activeRollId: null, rT: '', rE: '', rG: '', qrRoll: null });
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [q, setQ] = useState('');

  if (tab === 'dashboard') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={S.card}><ScrollText color="#ff9800" /><div style={{ fontSize: 24, fontWeight: 'bold' }}>{data.whBatches.length}</div><small style={{ color: '#666' }}>Partiyalar</small></div>
        <div style={S.card}><Package color="#00e676" /><div style={{ fontSize: 24, fontWeight: 'bold' }}>{data.whRolls.length}</div><small style={{ color: '#666' }}>Rulonlar</small></div>
      </div>

      <button
        onClick={() => { const id = prompt('Rulon ID sini skanerlang (yoki qo\'lda kiriting):'); if (id) { const r = data.whRolls.find(x => x.id === id || x.batch_number === id); if (r) { setF({ ...f, qrRoll: r }); } else { showMsg('Topilmadi!', 'err'); } } }}
        style={{ ...S.btnG, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, fontSize: 18 }}
      >
        <Scan size={24} /> SKANERLASH (RADAR)
      </button>

      <div style={S.card}>
        <div style={{ textAlign: 'left', fontWeight: 'bold', fontSize: 11, color: '#00e676', marginBottom: 12 }}>OXIRGI AMALLAR</div>
        {data.whLog.slice(0, 5).map(l => (
          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a2e', fontSize: 12 }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600' }}>{l.item_name}</div>
              <div style={{ fontSize: 10, color: '#666' }}>{l.type} • {new Date(l.timestamp).toLocaleTimeString()}</div>
            </div>
            <b style={{ color: l.type.includes('Kirim') ? '#00e676' : '#ff4444' }}>{l.quantity} kg</b>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'kirim') return (
    <div style={S.card}>
      <h3 style={{ marginBottom: 20, color: '#00e676' }}>YANGI PARTIYA QABULI</h3>
      <form onSubmit={async (e) => {
        e.preventDefault();
        try {
          const { data: bData, error: bErr } = await supabase.from('warehouse_batches').insert([{ batch_number: f.bn, user_name: user.name }]).select().single();
          if (bErr) throw bErr;
          showMsg('Partiya ochildi. Endi rulonlarni qo\'shing!'); setSelectedBatch(bData); setTab('ombor'); load(true);
        } catch (err) { showMsg(err.message, 'err'); }
      }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'left', fontSize: 11, color: '#555', marginBottom: 2 }}>Partiya raqami (masalan: P-9980):</div>
        <input style={S.input} placeholder="P-0000" required value={f.bn} onChange={e => setF({ ...f, bn: e.target.value })} />
        <button type="submit" style={S.btnG}>PARTIYA OCHISH ➕</button>
      </form>
    </div>
  );

  if (tab === 'ombor') {
    if (selectedBatch) {
      const rolls = data.whRolls.filter(r => r.batch_id === selectedBatch.id);
      return (
        <div style={{ paddingBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
            <button onClick={() => setSelectedBatch(null)} style={{ ...S.ib, color: '#00e676', display: 'flex', alignItems: 'center', gap: 4 }}><ArrowDown style={{ transform: 'rotate(90deg)' }} size={18} /> Orqaga</button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{selectedBatch.batch_number}</div>
              <div style={{ fontSize: 10, color: '#00e676' }}>{rolls.length} Rulon | {rolls.reduce((sum, r) => sum + (r.neto || 0), 0).toFixed(2)} kg</div>
            </div>
          </div>

          <div style={{ ...S.card, marginBottom: 15 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 13 }}>Rulon qo'shish (Bruto o'lchov)</div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('warehouse_rolls').insert([{ batch_id: selectedBatch.id, batch_number: selectedBatch.batch_number, fabric_name: f.n, color: f.c, bruto: Number(f.b), user_name: user.name }]);
              setF({ ...f, b: '' }); load(true); showMsg('Rulon qo\'shildi!');
            }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input style={S.input} placeholder="Mato nomi" required value={f.n} onChange={e => setF({ ...f, n: e.target.value })} />
              <input style={S.input} placeholder="Rangi" required value={f.c} onChange={e => setF({ ...f, c: e.target.value })} />
              <div style={{ display: 'flex', gap: 5 }}><input style={S.input} type="number" step="0.01" placeholder="Bruto (kg)" required value={f.b} onChange={e => setF({ ...f, b: e.target.value })} /><button style={S.btnG}>+</button></div>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rolls.map((r, idx) => {
              const isControlling = f.activeRollId === r.id;
              return (
                <div key={r.id} style={{ ...S.card, textAlign: 'left', borderLeft: `6px solid ${r.status === 'Tayyor' ? '#00e676' : r.status === 'Ko\'rikda' ? '#ff9800' : '#40c4ff'}`, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>RULON #{idx + 1}</div>
                      <div style={{ fontSize: 16, fontWeight: '600' }}>{r.fabric_name}</div>
                      <div style={{ fontSize: 12, color: '#aaa' }}>{r.color}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 'bold', color: r.status === 'Tayyor' ? '#00e676' : '#fff' }}>
                        {r.status === 'Tayyor' ? r.neto.toFixed(2) : r.bruto.toFixed(2)} <small style={{ fontSize: 10 }}>kg</small>
                      </div>
                      <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: r.status === 'Tayyor' ? 'rgba(0,230,118,0.1)' : 'rgba(64,196,255,0.1)', color: r.status === 'Tayyor' ? '#00e676' : '#40c4ff', display: 'inline-block', marginTop: 4 }}>
                        {r.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {r.status !== 'Tayyor' && !isControlling && (
                    <button
                      onClick={() => setF({ ...f, activeRollId: r.id, rT: '', rE: '', rG: '' })}
                      style={{ ...S.btnG, padding: '10px', fontSize: 12, width: '100%', marginTop: 12, background: '#40c4ff', color: '#000' }}
                    >
                      KONTROL QILISH (KO'RIK) <Maximize size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                    </button>
                  )}

                  {isControlling && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #1a1a2e' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div>
                          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>FTULKA (KG)</label>
                          <input style={S.input} type="number" step="0.01" value={f.rT} onChange={e => setF({ ...f, rT: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>ENI (SM)</label>
                          <input style={S.input} type="number" value={f.rE} onChange={e => setF({ ...f, rE: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>GRAMAJ</label>
                          <input style={S.input} value={f.rG} onChange={e => setF({ ...f, rG: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setF({ ...f, activeRollId: null })} style={{ ...S.btnG, background: '#333', color: '#fff', flex: 1 }}>BEKOR</button>
                        <button
                          onClick={async () => {
                            if (!f.rT || !f.rE || !f.rG) return showMsg('Barcha maydonlarni to\'ldiring!', 'err');
                            const n = r.bruto - Number(f.rT);
                            await supabase.from('warehouse_rolls').update({ tara: Number(f.rT), neto: n, en: Number(f.rE), gramaj: f.rG, status: 'Tayyor' }).eq('id', r.id);
                            setF({ ...f, activeRollId: null });
                            showMsg('Rulon tayyor holatga keltirildi!');
                            load(true);
                          }}
                          style={{ ...S.btnG, flex: 2 }}
                        >
                          SAQLASH ✓
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {r.status === 'Tayyor' && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1a1a2e' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                        <div><div style={{ fontSize: 9, color: '#666' }}>TARA</div><div style={{ fontSize: 13, fontWeight: 'bold' }}>{r.tara} kg</div></div>
                        <div><div style={{ fontSize: 9, color: '#666' }}>ENI</div><div style={{ fontSize: 13, fontWeight: 'bold' }}>{r.en} sm</div></div>
                        <div><div style={{ fontSize: 9, color: '#666' }}>GR</div><div style={{ fontSize: 13, fontWeight: 'bold' }}>{r.gramaj}</div></div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setF({ ...f, qrRoll: r })}
                          style={{ ...S.btnG, background: '#1a1a2e', color: '#00e676', border: '1px solid #00e676', padding: '10px', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <QrCode size={16} /> QR YORLIQ
                        </button>
                        <button
                          onClick={() => { if (confirm('O\'chirish?')) { supabase.from('warehouse_rolls').delete().eq('id', r.id).then(() => load(true)); } }}
                          style={{ ...S.btnG, background: '#1a1a2e', color: '#ff4444', border: '1px solid #ff4444', padding: '10px', width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* QR MODAL (PREMIUM VIEW) */}
          <AnimatePresence>
            {f.qrRoll && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} style={{ ...S.card, width: '100%', maxWidth: 320, background: '#fff', color: '#000', textAlign: 'center', padding: 25 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 20, fontWeight: 'bold' }}>QTTuz PRO</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Rulon Yorlig'i | {f.qrRoll.batch_number}</div>
                    </div>
                    <button onClick={() => setF({ ...f, qrRoll: null })} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 30, height: 30 }}><X size={18} /></button>
                  </div>

                  <div style={{ background: '#fff', padding: 15, borderRadius: 15, border: '1px solid #eee', display: 'inline-block', marginBottom: 20 }}>
                    <QRCodeCanvas value={JSON.stringify({ id: f.qrRoll.id, b: f.qrRoll.batch_number })} size={180} />
                  </div>

                  <div style={{ textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, fontSize: 13 }}>
                    <div><small style={{ color: '#888' }}>MATO:</small><div><b>{f.qrRoll.fabric_name}</b></div></div>
                    <div><small style={{ color: '#888' }}>RANGI:</small><div><b>{f.qrRoll.color}</b></div></div>
                    <div><small style={{ color: '#888' }}>SOFT (NETO):</small><div style={{ fontSize: 18, color: '#00c853' }}><b>{f.qrRoll.neto.toFixed(2)} KG</b></div></div>
                    <div><small style={{ color: '#888' }}>EN/GR:</small><div><b>{f.qrRoll.en}sm / {f.qrRoll.gramaj}</b></div></div>
                  </div>

                  <button onClick={() => window.print()} style={{ ...S.btnG, width: '100%', marginTop: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Printer size={18} /> PRINTERGA YUBORISH
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div>
        <div style={{ position: 'relative', marginBottom: 20 }}><Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#444' }} /><input style={{ ...S.input, paddingLeft: 40 }} placeholder="Partiya raqamini yozing..." onChange={e => setQ(e.target.value)} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.whBatches.filter(b => b.batch_number.toLowerCase().includes(q.toLowerCase())).map(b => (
            <div key={b.id} onClick={() => setSelectedBatch(b)} style={{ ...S.card, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 'bold', fontSize: 16 }}>{b.batch_number}</div><small style={{ color: '#555' }}>{new Date(b.arrival_date).toLocaleDateString()}</small></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 16, color: '#40c4ff' }}>{data.whRolls.filter(r => r.batch_id === b.id).length} rulon</div><ChevronRight size={18} color="#444" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'chiqim') {
    const readyRolls = data.whRolls.filter(r => r.status === 'Tayyor');
    return (
      <div>
        <h3 style={{ marginBottom: 15, color: '#ff4444' }}>TAYYOR RULONLAR (BICHUVGA)</h3>
        {readyRolls.map(r => (
          <div key={r.id} style={{ ...S.card, textAlign: 'left', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div><b>{r.fabric_name}</b><br /><small style={{ color: '#666' }}>Partiya: {r.batch_number} | Rang: {r.color}</small></div>
              <b style={{ fontSize: 20 }}>{r.neto.toFixed(2)} <small>kg</small></b>
            </div>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 10 }}>Eni: {r.en}sm | Gramaj: {r.gramaj}</div>
            <button onClick={async () => { if (confirm('Bichuvga chiqim?')) { await supabase.from('warehouse_rolls').delete().eq('id', r.id); await supabase.from('warehouse_log').insert([{ item_name: r.fabric_name, type: 'Bichuvga Chiqim', quantity: r.neto, note: r.batch_number, user: user.name }]); load(true); showMsg('Chiqim qilindi! 🚀'); } }} style={{ ...S.btnG, width: '100%', background: '#ff4444', color: '#fff' }}>BICHUVGA TOPSHIRISH 📤</button>
          </div>
        ))}
      </div>
    );
  }
}

const S = {
  root: { minHeight: '100vh', background: '#0a0a14', display: 'flex', flexDirection: 'column', color: '#fff', fontSize: 13, fontFamily: '-apple-system, sans-serif' },
  loginBox: { margin: 'auto', width: '100%', maxWidth: 360, padding: 35, background: '#12121e', borderRadius: 32, border: '1px solid #1a1a2e' },
  title: { textAlign: 'center', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { width: '100%', padding: '15px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btnG: { padding: '15px', background: '#00e676', color: '#000', border: 'none', borderRadius: 16, fontWeight: 'bold', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1a1a2e' },
  content: { flex: 1, padding: 15, paddingBottom: 100, overflowY: 'auto' },
  card: { background: '#12121e', borderRadius: 26, padding: 18, border: '1px solid #1a1a2e' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '14px 10px', background: 'rgba(10,10,20,0.95)', borderTop: '1px solid #1a1a2e', zIndex: 1000 },
  nb: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', flex: 1 },
  ib: { background: 'none', border: 'none', cursor: 'pointer' },
  subTab: { flex: 1, padding: '12px', border: 'none', borderRadius: 14, fontWeight: 'bold', fontSize: 11 },
  toast: { position: 'fixed', top: 15, left: 15, right: 15, padding: 16, borderRadius: 18, zIndex: 10000, textAlign: 'center', fontWeight: 'bold' },
  loadingBar: { position: 'fixed', top: 0, left: 0, height: 3, background: '#00e676', zIndex: 11000, width: '100%', animation: 'loading 2s infinite' }
};
