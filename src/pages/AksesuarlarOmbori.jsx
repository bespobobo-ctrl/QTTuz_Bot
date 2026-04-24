import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
    Box, PlusCircle, Search, History, ChevronRight, Edit3, Trash2,
    Calendar, CheckCircle2, Download, Package
} from 'lucide-react';

export default function AksesuarlarOmbori({ tab, data, load, showMsg }) {
    const [activeTab, setActiveTab] = useState('baza');

    const S = {
        card: { background: '#12121e', padding: 18, borderRadius: 20, border: '1px solid #2a2a40', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: 20 },
        primaryBtn: { padding: '14px 24px', background: '#BA68C8', color: '#fff', borderRadius: 14, border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(186, 104, 200, 0.3)', width: '100%' },
        input: { width: '100%', padding: '15px 20px', background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, color: '#fff', outline: 'none', fontSize: 16, boxSizing: 'border-box' }
    };

    if (tab === 'dashboard' || tab === 'baza') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                    <h2 style={{ margin: 0, color: '#BA68C8', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Box size={28} /> Aksesuarlar (Baza)
                    </h2>
                </div>

                <div style={S.card}>
                    <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>
                        Tez orada bu yerda aksesuarlar ro'yxati chiqadi.
                        Ayni paytda bazada barcha jadvallarni ulab chiqyapmiz.
                    </p>
                </div>

                <button style={S.primaryBtn}>
                    <PlusCircle size={20} /> YANGI AKSESUAR KISHRITISH (Tez orada)
                </button>
            </motion.div>
        );
    }

    if (tab === 'kirim') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, color: '#BA68C8' }}>Omborga Kirim</h2>
                <div style={S.card}>
                    <div style={{ display: 'grid', gap: 15 }}>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', marginBottom: 5, display: 'block' }}>Aksesuar turini tanlang</label>
                            <input style={S.input} placeholder="Masalan: Zamok 20sm qora..." disabled />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', marginBottom: 5, display: 'block' }}>Miqdori</label>
                            <input style={S.input} type="number" placeholder="0.0" disabled />
                        </div>
                        <button style={{ ...S.primaryBtn, background: '#555', boxShadow: 'none' }} disabled>
                            QABUL QILISH (Kutmoqda)
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (tab === 'history') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ marginBottom: 20, color: '#BA68C8', display: 'flex', gap: 10 }}>
                    <History size={24} /> Amallar Tarixi
                </h2>
                <div style={S.card}>
                    <p style={{ color: '#888', textAlign: 'center' }}>Tarix hozircha bo'sh.</p>
                </div>
            </motion.div>
        );
    }

    return (
        <div style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>
            Bunday sahifa topilmadi.
        </div>
    );
}
