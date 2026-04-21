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
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const APP_VERSION = "11.7 WAREHOUSE-ULTRA PRO";

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
  const [selectedBatch, setSelectedBatch] = useState(null);

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

      setData({ sysConfig: ver.data, heads: h.data || [], history: hi.data || [], whItems: wi.data || [], whLog: wl.data || [], whBatches: wb.data || [], whRolls: wr.data || [] });
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


  if (!user) return <Login data={data} setUser={setUser} setTab={setTab} showMsg={showMsg} />;

  const isOmbor = user.role === 'dept' && user.deptId === 'ombor';

  return (
    <div style={S.root}>
      <AnimatePresence>
        {msg && (<motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} style={{ ...S.toast, background: msg.type === 'err' ? '#ff3b30' : '#00e676' }}>{msg.t}</motion.div>)}
        {loading && <div style={S.loadingBar} />}
      </AnimatePresence>

      {needsUpdate && (
        <div style={{ background: '#ff9800', color: '#000', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 'bold' }}>
          <span>YANGI VERSIYA MAVJUD (v{data.sysConfig?.value || '?'})</span>
          <button onClick={handleHardUpdate} style={{ background: '#000', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 10 }}>YANGILASH 🚀</button>
        </div>
      )}

      <header style={S.header}>
        <div><div style={{ fontSize: 16, fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: 9, color: '#00e676' }}>{APP_VERSION}</div></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => load()} style={S.ib}><RefreshCcw size={18} className={loading ? 'spin' : ''} /></button>
          <button onClick={() => setUser(null)} style={{ ...S.ib, color: '#ff3b30' }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={S.content}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isOmbor ? <OmborUltra tab={tab} user={user} data={data} showMsg={showMsg} load={load} setTab={setTab} selectedBatch={selectedBatch} setSelectedBatch={setSelectedBatch} /> : <div style={S.card}>Admin bo'limi...</div>}
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
      <style>{` 
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; } 
        @media print {
          body * { display: none !important; }
          .print-area, .print-area * { display: block !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .page-break { page-break-after: always; }
          .label { border: 1px solid #000; padding: 20px; text-align: center; margin-bottom: 20px; }
        }
      `}</style>

      {/* HIDDEN PRINT AREA */}
      <div className="print-area" style={{ display: 'none' }}>
        {selectedBatch && data.whRolls.filter(r => r.batch_id === selectedBatch.id).map(r => (
          <div key={r.id} className="label page-break">
            <h2>QTTuz PRO</h2>
            <p>Batch: {r.batch_number} | Roll ID: {r.id}</p>
            <p>Mato: {r.fabric_name} | Rang: {r.color}</p>
            <QRCodeCanvas value={JSON.stringify({ id: r.id, b: r.batch_number })} size={200} />
            <h3>Vazn: {r.bruto} kg</h3>
          </div>
        ))}
      </div>
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

function OmborUltra({ tab, user, data, showMsg, load, setTab, selectedBatch, setSelectedBatch }) {
  const [m, setM] = useState('bruto');
  const [f, setF] = useState({ bn: '', n: '', c: '', b: '', en: '', gr: '', rS: 1, activeRollId: null, rT: '', rE: '', rG: '', qrRoll: null, eC: '', eW: '', sup: '', rCC: '', rComp: '', rD: { s: 0, t: 0, d: 0 } });
  const [q, setQ] = useState('');

  const isResting = (d) => {
    if (!d) return false;
    const diff = (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60);
    return diff < 48; // 48 soatdan kam bo'lsa "Resting"
  };

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
      <h3 style={{ marginBottom: 20, color: '#00e676', textAlign: 'center' }}>📦 YANGI PARTIYA QABULI</h3>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!f.bn || !f.eC || !f.eW || !f.sup || !f.c) return showMsg('Barcha ma\'lumotlarni kiriting!', 'err');
        try {
          const { data: bData, error: bErr } = await supabase.from('warehouse_batches').insert([{
            batch_number: f.bn,
            user_name: user.name,
            supplier_name: f.sup,
            color: f.c,
            expected_count: Number(f.eC),
            expected_weight: Number(f.eW),
            status: 'IN_PROGRESS'
          }]).select().single();
          if (bErr) throw bErr;
          showMsg('Partiya ochildi. Rulonlarni tortishni boshlang!');
          setSelectedBatch(bData);
          setTab('ombor');
          setF({ ...f, bn: '', eC: '', eW: '', sup: '', c: '' });
          load(true);
        } catch (err) { showMsg(err.message, 'err'); }
      }} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5 }}>PARTIYA (INVOICE #)</label>
            <input style={S.input} placeholder="P-9980" required value={f.bn} onChange={e => setF({ ...f, bn: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5 }}>TAMINOTCHI (FABRIKA)</label>
            <input style={S.input} placeholder="Nomi..." required value={f.sup} onChange={e => setF({ ...f, sup: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5 }}>RULON SONI</label>
            <input style={S.input} type="number" placeholder="0" required value={f.eC} onChange={e => setF({ ...f, eC: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5 }}>MATO RANGI</label>
            <input style={S.input} placeholder="Qora, Ko'k..." required value={f.c} onChange={e => setF({ ...f, c: e.target.value })} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 5 }}>JAMI KUTILGAN VAZN (KG)</label>
          <input style={S.input} type="number" step="0.01" placeholder="0.00" required value={f.eW} onChange={e => setF({ ...f, eW: e.target.value })} />
        </div>

        <button type="submit" style={{ ...S.btnG, marginTop: 10 }}>PARTIYA OCHISH VA QABULNI BOSHLASH 🚀</button>
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
              <div style={{ fontSize: 10, color: '#00e676' }}>{rolls.length} Rulon | {rolls.reduce((sum, r) => sum + (r.bruto || 0), 0).toFixed(2)} kg (Bruto)</div>
              {rolls.length > 0 && (
                <button onClick={() => window.print()} style={{ fontSize: 9, background: '#1a1a2e', border: '1px solid #00e676', color: '#00e676', padding: '2px 8px', borderRadius: 4, marginTop: 5 }}>
                  PECHAT UCHUN 🖨️
                </button>
              )}
            </div>
          </div>

          {/* RECEPTION WIZARD SUMMARY */}
          <div style={{ ...S.card, background: 'rgba(0,145,234,0.05)', borderColor: '#0091ea', marginBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 'bold', color: '#0091ea' }}>QABUL QILISH HOLATI</div>
              <div style={{ fontSize: 10, background: '#0091ea', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>O'LCHASH JARAYONI</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
              <div><small style={{ color: '#666' }}>Kutilgan</small><div style={{ fontSize: 16, fontWeight: 'bold' }}>{selectedBatch.expected_weight} <small style={{ fontSize: 9 }}>kg</small></div></div>
              <div><small style={{ color: '#666' }}>O'lchangan</small><div style={{ fontSize: 16, fontWeight: 'bold' }}>{rolls.reduce((s, x) => s + Number(x.bruto), 0).toFixed(2)} <small style={{ fontSize: 9 }}>kg</small></div></div>
              <div>
                <small style={{ color: '#666' }}>Farq</small>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: (rolls.reduce((s, x) => s + Number(x.bruto), 0) - selectedBatch.expected_weight) === 0 ? '#00e676' : '#ff4444' }}>
                  {(rolls.reduce((s, x) => s + Number(x.bruto), 0) - (selectedBatch.expected_weight || 0)).toFixed(2)} <small style={{ fontSize: 9 }}>kg</small>
                </div>
              </div>
            </div>

            {rolls.length >= (selectedBatch.expected_count || 0) && (
              <div style={{ marginTop: 20, padding: 15, background: 'rgba(0,230,118,0.05)', borderRadius: 16, border: '1px solid #00e676' }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#00e676', textAlign: 'center', marginBottom: 15 }}>QABULNI YAKUNLASH: VAZNNI TANLANG</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    onClick={async () => {
                      if (confirm(`Zavod vazni (${selectedBatch.expected_weight} kg) bo'yicha qabul qilinsinmi?`)) {
                        await supabase.from('warehouse_batches').update({ status: 'ACCEPTED', actual_weight: selectedBatch.expected_weight }).eq('id', selectedBatch.id);
                        showMsg('Partiya zavod vazni bilan qabul qilindi!'); setSelectedBatch(null); load(true);
                      }
                    }}
                    style={{ ...S.btnG, fontSize: 10, height: 'auto', padding: '15px 5px' }}
                  >
                    FABRIKA VAZNI<br /><b style={{ fontSize: 14 }}>{selectedBatch.expected_weight} kg</b>
                  </button>
                  <button
                    onClick={async () => {
                      const actual = rolls.reduce((s, x) => s + Number(x.bruto), 0);
                      if (confirm(`Tarozi vazni (${actual.toFixed(2)} kg) bo'yicha qabul qilinsinmi?`)) {
                        await supabase.from('warehouse_batches').update({ status: 'ACCEPTED', actual_weight: actual }).eq('id', selectedBatch.id);
                        showMsg('Partiya tarozi vazni bilan qabul qilindi!'); setSelectedBatch(null); load(true);
                      }
                    }}
                    style={{ ...S.btnG, fontSize: 10, height: 'auto', padding: '15px 5px', background: '#40c4ff' }}
                  >
                    TAROZI VAZNI<br /><b style={{ fontSize: 14 }}>{rolls.reduce((s, x) => s + Number(x.bruto), 0).toFixed(2)} kg</b>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ ...S.card, marginBottom: 15 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 13, borderBottom: '1px solid #1a1a2e', paddingBottom: 8 }}>Tarozi (Bruto o'lchov)</div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (rolls.length >= selectedBatch.expected_count) return showMsg('Barcha kutilgan rulonlar o\'lchab bo\'lingan!', 'err');
              await supabase.from('warehouse_rolls').insert([{ batch_id: selectedBatch.id, batch_number: selectedBatch.batch_number, fabric_name: f.n, color: f.c, bruto: Number(f.b), user_name: user.name, status: 'Kirim' }]);
              setF({ ...f, b: '' }); load(true); showMsg('Rulon vazni saqlandi!');
            }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input style={S.input} placeholder="Mato" required value={f.n} onChange={e => setF({ ...f, n: e.target.value })} />
                <input style={S.input} placeholder="Rang" required value={f.c} onChange={e => setF({ ...f, c: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...S.input, fontSize: 20, fontWeight: 'bold' }} type="number" step="0.01" placeholder="0.00 kg" required value={f.b} onChange={e => setF({ ...f, b: e.target.value })} />
                <button style={{ ...S.btnG, width: 60 }}><Plus /></button>
              </div>
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
                      <div style={{
                        fontSize: 8, padding: '2px 6px', borderRadius: 4,
                        background: r.status === 'Neto' ? (isResting(r.neto_date) ? 'rgba(255,235,59,0.1)' : 'rgba(0,230,118,0.1)') : r.status === 'Bichuvda' ? 'rgba(156,39,176,0.1)' : 'rgba(64,196,255,0.1)',
                        color: r.status === 'Neto' ? (isResting(r.neto_date) ? '#fbc02d' : '#00e676') : r.status === 'Bichuvda' ? '#9c27b0' : '#40c4ff',
                        display: 'inline-block', marginTop: 4
                      }}>
                        {r.status === 'Neto' ? (isResting(r.neto_date) ? `⏳ DAM OLMOQDA (${(48 - (Date.now() - new Date(r.neto_date).getTime()) / (1000 * 60 * 60)).toFixed(1)} s)` : 'TAYYOR ✅') : r.status.toUpperCase()}
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div>
                          <label style={{ fontSize: 9, color: '#666', display: 'block', marginBottom: 4 }}>RANG KODI</label>
                          <input style={S.input} placeholder="#000" value={f.rCC} onChange={e => setF({ ...f, rCC: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, color: '#666', display: 'block', marginBottom: 4 }}>MATO TARKIBI</label>
                          <input style={S.input} placeholder="95% Cotton..." value={f.rComp} onChange={e => setF({ ...f, rComp: e.target.value })} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 15 }}>
                        <div>
                          <label style={{ fontSize: 9, color: '#666', display: 'block', marginBottom: 4 }}>FTULKA (KG)</label>
                          <input style={S.input} type="number" step="0.01" value={f.rT} onChange={e => setF({ ...f, rT: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, color: '#666', display: 'block', marginBottom: 4 }}>ENI (SM)</label>
                          <input style={S.input} type="number" value={f.rE} onChange={e => setF({ ...f, rE: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, color: '#666', display: 'block', marginBottom: 4 }}>GRAMAJ</label>
                          <input style={S.input} value={f.rG} onChange={e => setF({ ...f, rG: e.target.value })} />
                        </div>
                      </div>

                      {/* DEFECTS SECTION */}
                      <div style={{ background: 'rgba(255,68,68,0.05)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,68,68,0.2)', marginBottom: 15 }}>
                        <div style={{ fontSize: 10, fontWeight: 'bold', color: '#ff4444', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={14} /> DEFEKTLAR (BRAK)</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 11 }}>Dog'lar</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button onClick={() => setF({ ...f, rD: { ...f.rD, s: Math.max(0, f.rD.s - 1) } })} style={{ ...S.ib, color: '#ff4444' }}><Minus size={16} /></button>
                            <b>{f.rD.s}</b>
                            <button onClick={() => setF({ ...f, rD: { ...f.rD, s: f.rD.s + 1 } })} style={{ ...S.ib, color: '#00e676' }}><Plus size={16} /></button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 11 }}>Sirtiq/Teshik</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button onClick={() => setF({ ...f, rD: { ...f.rD, t: Math.max(0, f.rD.t - 1) } })} style={{ ...S.ib, color: '#ff4444' }}><Minus size={16} /></button>
                            <b>{f.rD.t}</b>
                            <button onClick={() => setF({ ...f, rD: { ...f.rD, t: f.rD.t + 1 } })} style={{ ...S.ib, color: '#00e676' }}><Plus size={16} /></button>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setF({ ...f, activeRollId: null })} style={{ ...S.btnG, background: '#333', color: '#fff', flex: 1 }}>BEKOR</button>
                        <button
                          onClick={async () => {
                            if (!f.rT || !f.rE || !f.rG) return showMsg('Minimal maydonlarni to\'ldiring!', 'err');
                            const n = r.bruto - Number(f.rT);
                            const now = new Date().toISOString();
                            await supabase.from('warehouse_rolls').update({
                              tara: Number(f.rT), neto: n, en: Number(f.rE), gramaj: f.rG,
                              color_code: f.rCC, composition: f.rComp, defects: f.rD,
                              status: 'Neto',
                              neto_date: now
                            }).eq('id', r.id);
                            setF({ ...f, activeRollId: null });
                            showMsg('Rulon nazoratdan o\'tdi!');
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 8 }}>
                        <div><div style={{ fontSize: 9, color: '#666' }}>TARA</div><div style={{ fontSize: 13, fontWeight: 'bold' }}>{r.tara} kg</div></div>
                        <div><div style={{ fontSize: 9, color: '#666' }}>ENI</div><div style={{ fontSize: 13, fontWeight: 'bold' }}>{r.en} sm</div></div>
                        <div><div style={{ fontSize: 9, color: '#666' }}>GR</div><div style={{ fontSize: 13, fontWeight: 'bold' }}>{r.gramaj}</div></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        <div><div style={{ fontSize: 9, color: '#666' }}>KOD / TARKIB</div><div style={{ fontSize: 11 }}>{r.color_code || '-'} / {r.composition || '-'}</div></div>
                        {r.defects && (r.defects.s > 0 || r.defects.t > 0) && (
                          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: '#ff4444' }}>BRAK</div><div style={{ fontSize: 11, color: '#ff4444' }}>{r.defects.s} D | {r.defects.t} S</div></div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setF({ ...f, qrRoll: r })}
                          style={{ ...S.btnG, background: '#1a1a2e', color: '#00e676', border: '1px solid #00e676', padding: '10px', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <QrCode size={16} /> QR YORLIQ
                        </button>

                        {(r.defects?.s > 0 || r.defects?.t > 0) && (
                          <button
                            onClick={() => {
                              const batch = data.whBatches.find(b => b.id === r.batch_id);
                              const txt = `Hurmatli ${batch?.supplier_name || 'Taminotchi'},\nSiz yuborgan ${r.batch_number} partiyasidagi ${r.fabric_name} (Rang: ${r.color}, Kod: ${r.color_code || '-'}) rulonida kamchilik aniqlandi:\n- Dog'lar: ${r.defects?.s || 0} ta\n- Sirtiq/Teshik: ${r.defects?.t || 0} ta\nIltimos, ushbu rulonni brak sifatida ko'rib chiqing.\nID: ${r.id}`;
                              window.open(`https://t.me/share/url?url=${encodeURIComponent(txt)}`, '_blank');
                            }}
                            style={{ ...S.btnG, background: '#ff4444', color: '#fff', padding: '10px', fontSize: 10, flex: 1 }}
                          >
                            BRAK HISOBOTI 📨
                          </button>
                        )}

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
      <div style={{ paddingBottom: 20 }}>
        {/* FILTRLAR / HUDUDLAR */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 15, background: '#1a1a2e', padding: 4, borderRadius: 10 }}>
          {[
            { id: 'bruto', l: 'BRUTO', icon: Scale },
            { id: 'kontrol', l: 'KONTROL', icon: Search },
            { id: 'neto', l: 'NETO', icon: CheckCircle2 },
            { id: 'acc', l: 'AKSESUAR', icon: Layers }
          ].map(x => (
            <button key={x.id} onClick={() => setM(x.id)} style={{ ...S.btn, flex: 1, fontSize: 8, padding: '8px 2px', background: m === x.id ? '#00e676' : 'transparent', color: m === x.id ? '#000' : '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              <x.icon size={14} style={{ marginBottom: 4 }} /><br />{x.l}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: 20 }}><Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#444' }} /><input style={{ ...S.input, paddingLeft: 40 }} placeholder="Partiya raqamini yozing..." onChange={e => setQ(e.target.value)} /></div>

        {m === 'bruto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!f.selectedBrutoBatch ? (
              // BATCH LIST (Accepted + In Progress)
              data.whBatches.filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS').filter(b => b.batch_number.toLowerCase().includes(q.toLowerCase())).map(b => {
                const bRolls = data.whRolls.filter(r => r.batch_id === b.id && (r.status === 'BRUTO' || r.status === 'Kirim'));
                const isInProgress = b.status === 'IN_PROGRESS';

                return (
                  <div key={b.id} onClick={() => setF({ ...f, selectedBrutoBatch: b })} style={{ ...S.card, textAlign: 'left', borderLeft: `6px solid ${isInProgress ? '#ff9800' : '#40c4ff'}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{b.batch_number} {isInProgress && '⏳'}</div>
                        <div style={{ fontSize: 10, color: '#666' }}>{b.supplier_name} | {b.color}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                          {bRolls.length} / {b.expected_count} rulon | {bRolls.reduce((s, r) => s + r.bruto, 0).toFixed(1)} kg
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('O\'chirilsinmi?')) {
                            supabase.from('warehouse_batches').delete().eq('id', b.id).then(() => {
                              supabase.from('warehouse_rolls').delete().eq('batch_id', b.id).then(() => load(true));
                            });
                          }
                        }}
                        style={{ ...S.ib, color: '#ff4444' }}
                      ><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <button onClick={() => setF({ ...f, selectedBrutoBatch: null })} style={{ ...S.ib, color: '#00e676', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ArrowDown size={14} style={{ transform: 'rotate(90deg)' }} /> Orqaga
                  </button>
                  <div style={{ textAlign: 'right' }}>
                    <b style={{ fontSize: 16 }}>{f.selectedBrutoBatch.batch_number}</b>
                    <div style={{ fontSize: 10, color: '#666' }}>{f.selectedBrutoBatch.supplier_name}</div>
                  </div>
                </div>

                {(() => {
                  const bRolls = data.whRolls.filter(r => r.batch_id === f.selectedBrutoBatch.id);
                  const curWeight = bRolls.reduce((s, r) => s + (r.bruto || 0), 0);
                  const diff = curWeight - (f.selectedBrutoBatch.expected_weight || 0);
                  const isDone = bRolls.length >= (f.selectedBrutoBatch.expected_count || 0);

                  return (
                    <>
                      <div style={{ ...S.card, background: 'rgba(64,196,255,0.05)', marginBottom: 20, padding: 15 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
                          <div><small style={{ color: '#888', fontSize: 9 }}>Kutilgan</small><div style={{ fontWeight: 'bold' }}>{f.selectedBrutoBatch.expected_weight} <small>kg</small></div></div>
                          <div><small style={{ color: '#888', fontSize: 9 }}>O'lchangan</small><div style={{ fontWeight: 'bold' }}>{curWeight.toFixed(1)} <small>kg</small></div></div>
                          <div><small style={{ color: '#888', fontSize: 9 }}>Farq</small><div style={{ fontWeight: 'bold', color: diff === 0 ? '#00e676' : '#ff4444' }}>{diff.toFixed(1)} <small>kg</small></div></div>
                        </div>
                        <div style={{ fontSize: 10, textAlign: 'center', marginTop: 10, color: isDone ? '#00e676' : '#ff9800' }}>
                          {bRolls.length} / {f.selectedBrutoBatch.expected_count} Rulon tortildi
                        </div>
                      </div>

                      {f.selectedBrutoBatch.status === 'IN_PROGRESS' && !isDone && (
                        <div style={{ ...S.card, borderColor: '#ff9800', marginBottom: 20 }}>
                          <div style={{ fontSize: 12, marginBottom: 10, color: '#ff9800', fontWeight: 'bold' }}>#{bRolls.length + 1} RULON TAROZISI ⚖️</div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <input type="number" style={{ ...S.input, flex: 1, fontSize: 18, fontWeight: 'bold' }} placeholder="0.00" value={f.rT} onChange={e => setF({ ...f, rT: e.target.value })} />
                            <button onClick={async () => {
                              if (!f.rT) return showMsg('Vaznni yozing!', 'err');
                              await supabase.from('warehouse_rolls').insert([{ batch_id: f.selectedBrutoBatch.id, batch_number: f.selectedBrutoBatch.batch_number, fabric_name: f.selectedBrutoBatch.color, bruto: Number(f.rT), status: 'BRUTO', color: f.selectedBrutoBatch.color }]);
                              setF({ ...f, rT: '' }); load(true); showMsg('Rulon saqlandi!');
                            }} style={{ ...S.btnG, padding: '0 25px' }}>SAQLASH</button>
                          </div>
                        </div>
                      )}

                      {isDone && f.selectedBrutoBatch.status === 'IN_PROGRESS' && (
                        <div style={{ ...S.card, borderColor: '#00e676', background: 'rgba(0,230,118,0.05)', marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#00e676', textAlign: 'center', marginBottom: 15 }}>HAMMA RULONLAR TORTILDI. VAZNNI TANLANG:</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <button onClick={async () => { if (confirm('Zavod vazni bilan?')) { await supabase.from('warehouse_batches').update({ status: 'ACCEPTED', actual_weight: f.selectedBrutoBatch.expected_weight }).eq('id', f.selectedBrutoBatch.id); showMsg('Qabul qilindi!'); setF({ ...f, selectedBrutoBatch: null }); load(true); } }} style={{ ...S.btnG, fontSize: 10, padding: '15px 5px' }}>FABRIKA: {f.selectedBrutoBatch.expected_weight}kg</button>
                            <button onClick={async () => { if (confirm('Tarozi vazni bilan?')) { await supabase.from('warehouse_batches').update({ status: 'ACCEPTED', actual_weight: curWeight }).eq('id', f.selectedBrutoBatch.id); showMsg('Qabul qilindi!'); setF({ ...f, selectedBrutoBatch: null }); load(true); } }} style={{ ...S.btnG, fontSize: 10, padding: '15px 5px', background: '#40c4ff' }}>TAROZI: {curWeight.toFixed(1)}kg</button>
                          </div>
                        </div>
                      )}

                      {f.selectedBrutoBatch.status === 'ACCEPTED' && (
                        <div style={{ ...S.card, borderColor: '#40c4ff', background: 'rgba(64,196,255,0.05)', marginBottom: 20 }}>
                          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#40c4ff', textAlign: 'center', marginBottom: 15 }}>PARTIYA QABUL QILINGAN ✅</div>
                          <button onClick={() => setF({ ...f, showBatchQRs: true })} style={{ ...S.btnG, width: '100%', background: '#40c4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <Printer size={18} /> BARCODELARNI CHOP ETISH 🖨️
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {bRolls.sort((a, b) => b.id - a.id).map((r, idx, arr) => (
                          <div key={r.id} style={{ ...S.card, textAlign: 'left', borderLeft: '4px solid #40c4ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px' }}>
                            <div><small style={{ color: '#888' }}>Rulon #{arr.length - idx}</small><div style={{ fontSize: 16, fontWeight: 'bold' }}>{r.bruto} kg</div></div>
                            {f.selectedBrutoBatch.status === 'ACCEPTED' && r.status === 'BRUTO' && (
                              <button onClick={async () => { if (confirm('Nazoratga o\'tkazilsinmi?')) { await supabase.from('warehouse_rolls').update({ status: 'KO\'RIKDA' }).eq('id', r.id); load(true); showMsg('O\'tkazildi!'); } }} style={{ ...S.btnG, padding: '8px 15px', fontSize: 10, background: '#40c4ff', color: '#000' }}>NAZORATGA 🔍</button>
                            )}
                            {r.status !== 'BRUTO' && <span style={{ fontSize: 10, color: '#ff9800' }}>{r.status.toUpperCase()}</span>}
                          </div>
                        ))}
                      </div>

                      {/* YAKUNIY BARCODELAR OYNASI */}
                      <AnimatePresence>
                        {f.showBatchQRs && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 3000, overflowY: 'auto' }}>
                            {/* BOSHQA ELEMENTLAR PRINTDA KO'RINMASLIGI UCHUN class qo'shmadim, maxsus print CSS ishlashida butun window qoladi */}
                            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: '#1a1a2e', color: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                              <b style={{ fontSize: 16 }}>YORLIQLAR (Pechatga tayyor)</b>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => window.print()} style={{ ...S.btnG, padding: '5px 15px', background: '#00e676', border: 'none' }}><Printer size={16} /></button>
                                <button onClick={() => setF({ ...f, showBatchQRs: false })} style={{ background: '#ff3b30', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: 8 }}>YOPISH <X size={16} /></button>
                              </div>
                            </div>

                            <div className="print-area-active" style={{ padding: 20, color: '#000' }}>
                              {bRolls.map((r, i) => (
                                <div key={r.id} className="page-break" style={{ padding: '30px 20px', textAlign: 'center', border: '2px dashed #ccc', margin: '0 auto 40px auto', maxWidth: 400, background: '#fff' }}>
                                  <h2 style={{ fontSize: 28, margin: '0 0 10px 0', borderBottom: '2px solid #000', paddingBottom: 10 }}>QTTuz WAREHOUSE</h2>
                                  <p style={{ fontSize: 24, fontWeight: 'bold', margin: '15px 0' }}>{f.selectedBrutoBatch.batch_number}</p>
                                  <p style={{ fontSize: 18, margin: '5px 0' }}>Mato: {f.selectedBrutoBatch.color} | Supplier: {f.selectedBrutoBatch.supplier_name}</p>
                                  <div style={{ margin: '30px auto', display: 'flex', justifyContent: 'center' }}>
                                    <QRCodeCanvas value={JSON.stringify({ id: r.id, b: r.batch_number, w: r.bruto })} size={250} />
                                  </div>
                                  <h1 style={{ fontSize: 50, margin: '20px 0', fontWeight: '900' }}>{r.bruto} KG</h1>
                                  <p style={{ fontSize: 16, color: '#444', fontWeight: 'bold' }}>Bruto Rulon</p>
                                  <p style={{ fontSize: 12, color: '#666', marginTop: 10 }}>ID: {r.id}</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {m === 'kontrol' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.whRolls.filter(r => r.status === 'KO\'RIKDA' || f.activeRollId === r.id).filter(r => r.batch_number?.toLowerCase().includes(q.toLowerCase())).map((r, idx) => {
              const isControlling = f.activeRollId === r.id;
              return (
                <div key={r.id} style={{ ...S.card, textAlign: 'left', borderLeft: '6px solid #ff9800' }}>
                  {isControlling ? (
                    /* Standard Control Logic here - similar to previous but focused */
                    <div style={{ padding: 10 }}>Nazorat qilinmoqda... (Avvalgi interfeys)</div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><b>{r.batch_number}</b><br /><small>{r.bruto} kg</small></div>
                      <button onClick={() => setF({ ...f, activeRollId: r.id })} style={{ ...S.btnG, padding: '10px', fontSize: 11 }}>O'LCHASH 📏</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {m === 'neto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.whRolls.filter(r => r.status === 'Neto').filter(r => r.batch_number?.toLowerCase().includes(q.toLowerCase())).map((r, idx) => (
              <div key={r.id} style={{ ...S.card, textAlign: 'left', borderLeft: `6px solid ${isResting(r.neto_date) ? '#fbc02d' : '#00e676'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><b>{r.batch_number}</b><br /><small>{r.neto} kg Neto</small></div>
                  <div style={{ fontSize: 9 }}>{isResting(r.neto_date) ? '⌛ DAM OLMOQDA' : '✅ TAYYOR'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
