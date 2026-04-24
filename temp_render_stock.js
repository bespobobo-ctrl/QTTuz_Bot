const renderStock = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package color="#FFAB40" /> Bruto Matolar ({batches.length} jami)
        </h2>

        {batches.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', opacity: 0.5, padding: 40 }}>Hali birorta ham partiya kiritilmagan</div>
        ) : (
            batches.map(batch => {
                const batchRolls = rolls.filter(r => String(r.batch_id) === String(batch.id));
                const doneCount = batchRolls.length;
                const totalCount = batch.expected_count || 0;

                const totalBrutoKg = batchRolls.reduce((sum, r) => sum + (Number(r.bruto) || 0), 0);
                const expectedWeight = batch.expected_weight || 0;

                const isComplete = doneCount >= totalCount && totalCount > 0;
                const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

                return (
                    <div key={batch.id} style={{ ...S.card, cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => { setVerdict(null); setActiveBatch(batch); }}>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 4, background: '#1a1a2e', width: '100%' }}>
                            <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: isComplete ? '#81C784' : '#FFAB40', transition: 'width 0.5s' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Package size={20} color="#FFAB40" />
                                <span style={{ fontSize: 18, fontWeight: 'bold' }}>{batch.batch_number}</span>
                                <span style={S.badge(isComplete)}>
                                    {isComplete ? 'TAYYOR ✅' : 'JARAYONDA ⏳'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }} onClick={e => e.stopPropagation()}>
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    const pc = parseColor(batch.color);
                                    setF({ bn: batch.batch_number, sup: batch.supplier_name, eW: batch.expected_weight, eC: batch.expected_count, type: pc.type, c: pc.c, unit: pc.unit, g: pc.g });
                                    setIsEdit(true);
                                    setEditID(batch.id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} style={{ background: 'none', border: 'none', color: '#4FC3F7', cursor: 'pointer' }}><Edit3 size={18} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteBatch(batch.id, batch.batch_number); }} style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                <ChevronRight color="#555" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: '#aaa', background: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 12 }}>
                            <div>Sana: <b style={{ color: '#fff' }}>{batch.arrival_date || batch.created_at ? new Date(batch.arrival_date || batch.created_at).toLocaleDateString() : '---'}</b></div>
                            <div>Turi: <b style={{ color: '#fff' }}>{parseColor(batch.color).type}</b></div>
                            <div>Rangi: <b style={{ color: '#fff' }}>{parseColor(batch.color).c}</b></div>
                            <div>Birlik: <b style={{ color: '#fff' }}>{parseColor(batch.color).unit.toUpperCase()}</b></div>

                            <div style={{ borderTop: '1px solid #2a2a40', paddingTop: 10, marginTop: 5 }}>
                                <span style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{parseColor(batch.color).unit === 'kg' ? 'Vazn' : 'Metir'} (Bruto)</span>
                                <b style={{ color: isComplete ? '#81C784' : '#FFAB40', fontSize: 16 }}>{totalBrutoKg.toFixed(1)}</b> / {expectedWeight} {parseColor(batch.color).unit}
                            </div>
                            <div style={{ borderTop: '1px solid #2a2a40', paddingTop: 10, marginTop: 5 }}>
                                <span style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Rulonlar</span>
                                <b style={{ color: isComplete ? '#81C784' : '#FFAB40', fontSize: 16 }}>{doneCount}</b> / {totalCount} ta
                            </div>
                        </div>

                        {isComplete && (
                            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: batch.status?.startsWith('VERDICT_') ? 'rgba(129,199,132,0.1)' : (Math.abs(totalBrutoKg - expectedWeight) < 0.5 ? 'rgba(129,199,132,0.1)' : 'rgba(255,171,64,0.1)'), border: '1px dashed' }}>
                                <div style={{ fontSize: 11, color: '#888' }}>
                                    {batch.status?.startsWith('VERDICT_') ? "YAKUNIY QAROR (TASDIQLANGAN):" : "TAQQOSLASH (OMBOR vs TAMINOTCHI):"}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                                    <b style={{ color: batch.status?.startsWith('VERDICT_') ? '#81C784' : (Math.abs(totalBrutoKg - expectedWeight) < 0.5 ? '#81C784' : '#FFAB40') }}>
                                        {batch.status === 'VERDICT_OMBOR' ? "OMBOR VAZNI QABUL QILINDI" :
                                            batch.status === 'VERDICT_SUPPLIER' ? "TAMINOTCHI VAZNI QABUL QILINDI" :
                                                Math.abs(totalBrutoKg - expectedWeight) < 0.5 ? "MA'LUMOTLAR TO'G'RI (MOS)" : `FARQ MAVJUD: ${(totalBrutoKg - expectedWeight).toFixed(1)} ${parseColor(batch.color).unit}`}
                                    </b>
                                    <div style={{ fontSize: 10, opacity: 0.6 }}>
                                        {totalBrutoKg.toFixed(1)} vs {expectedWeight}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })
        )}
    </motion.div>
);
