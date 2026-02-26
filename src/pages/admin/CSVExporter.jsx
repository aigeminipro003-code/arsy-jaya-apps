import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Download, Filter, PackagePlus } from 'lucide-react'

const CATEGORY_LABELS = { order: 'Order', tes_warna: 'Tes Warna', maintenance: 'Maintenance', kerusakan: 'Kerusakan' }

function downloadCSV(rows, filename) {
    if (!rows.length) return
    const csv = rows.join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
}

function produksiToCSV(rows) {
    const headers = ['Tanggal', 'Jam', 'Operator', 'Mesin', 'Material', 'Lebar (cm)', 'Kategori', 'Netto (m)', 'Bruto (m)', 'Waste (m)', 'Catatan']
    return [
        headers.join(','),
        ...rows.map(r => [
            new Date(r.created_at).toLocaleDateString('id-ID'),
            new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            `"${r.profiles?.display_name ?? ''}"`,
            `"${r.machines?.name ?? ''}"`,
            `"${r.materials?.name ?? ''}"`,
            r.materials?.width_cm ?? '',
            CATEGORY_LABELS[r.category] ?? r.category,
            r.panjang_netto,
            r.bahan_bruto,
            r.waste,
            `"${r.notes ?? ''}"`,
        ].join(','))
    ]
}

function stokToCSV(rows) {
    const headers = ['Tanggal', 'Jam', 'Operator', 'Bahan', 'Lebar (cm)', 'Jumlah Roll', 'Panjang/Roll (m)', 'Total (m)', 'Harga/Satuan', 'Satuan Harga', 'Total Harga Beli']
    return [
        headers.join(','),
        ...rows.map(r => [
            new Date(r.created_at).toLocaleDateString('id-ID'),
            new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            `"${r.profiles?.display_name || r.profiles?.email?.split('@')[0] || ''}"`,
            `"${r.materials?.name ?? ''}"`,
            r.materials?.width_cm ?? '',
            r.rolls ?? '',
            r.panjang_per_roll ?? '',
            r.quantity_m ?? '',
            r.harga_per_satuan ?? '',
            r.satuan_harga ?? '',
            r.total_harga_beli ?? '',
        ].join(','))
    ]
}

export default function CSVExporter() {
    const today = new Date().toISOString().slice(0, 10)
    const firstOfMonth = today.slice(0, 8) + '01'
    const { isMobile } = useBreakpoint()

    const [activeExport, setActiveExport] = useState('produksi')
    const [dateFrom, setDateFrom] = useState(firstOfMonth)
    const [dateTo, setDateTo] = useState(today)
    const [machineId, setMachineId] = useState('')
    const [operatorId, setOperatorId] = useState('')
    const [category, setCategory] = useState('')
    const [materialId, setMaterialId] = useState('')
    const [machines, setMachines] = useState([])
    const [operators, setOperators] = useState([])
    const [materials, setMaterials] = useState([])
    const [preview, setPreview] = useState([])
    const [stockPreview, setStockPreview] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        supabase.from('machines').select('id,name').then(({ data }) => setMachines(data || []))
        supabase.from('profiles').select('id,display_name').order('display_name').then(({ data }) => setOperators(data || []))
        supabase.from('materials').select('id,name').order('name').then(({ data }) => setMaterials(data || []))
    }, [])

    async function handleLoad() {
        setLoading(true)
        if (activeExport === 'produksi') {
            let q = supabase.from('production_logs')
                .select('*, profiles(display_name), machines(name), materials(name, width_cm)')
                .gte('created_at', dateFrom)
                .lte('created_at', dateTo + 'T23:59:59')
                .order('created_at', { ascending: false })
            if (machineId) q = q.eq('machine_id', machineId)
            if (operatorId) q = q.eq('operator_id', operatorId)
            if (category) q = q.eq('category', category)
            const { data } = await q
            setPreview(data || [])
            setStockPreview([])
        } else {
            let q = supabase.from('stock_movements')
                .select('id, quantity_m, rolls, panjang_per_roll, harga_per_satuan, satuan_harga, total_harga_beli, created_at, materials(name, width_cm), profiles(display_name)')
                .eq('movement_type', 'in')
                .gte('created_at', dateFrom)
                .lte('created_at', dateTo + 'T23:59:59')
                .order('created_at', { ascending: false })
            if (operatorId) q = q.eq('operator_id', operatorId)
            if (materialId) q = q.eq('material_id', materialId)
            const { data } = await q
            setStockPreview(data || [])
            setPreview([])
        }
        setLoading(false)
    }

    function handleExport() {
        if (activeExport === 'produksi') {
            const csvRows = produksiToCSV(preview)
            downloadCSV(csvRows, `produksi_${dateFrom}_sd_${dateTo}.csv`)
        } else {
            const csvRows = stokToCSV(stockPreview)
            downloadCSV(csvRows, `stok_masuk_${dateFrom}_sd_${dateTo}.csv`)
        }
    }

    const selectStyle = { padding: '8px 12px', borderRadius: 8, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: 13 }
    const activeRows = activeExport === 'produksi' ? preview : stockPreview

    const totalWaste = preview.reduce((s, r) => s + (parseFloat(r.waste) || 0), 0)
    const totalNetto = preview.reduce((s, r) => s + (parseFloat(r.panjang_netto) || 0), 0)
    const totalBruto = preview.reduce((s, r) => s + (parseFloat(r.bahan_bruto) || 0), 0)
    const totalStokM = stockPreview.reduce((s, r) => s + (parseFloat(r.quantity_m) || 0), 0)
    const totalStokHarga = stockPreview.reduce((s, r) => s + (parseFloat(r.total_harga_beli) || 0), 0)

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: '-0.04em' }}>Export CSV</h1>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Generate laporan produksi atau stok masuk dalam format CSV</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[['produksi', 'Log Produksi'], ['stok', 'Stok Masuk']].map(([id, lbl]) => (
                    <button key={id} onClick={() => { setActiveExport(id); setPreview([]); setStockPreview([]) }} style={{
                        padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: activeExport === id ? 'var(--color-accent)' : 'var(--color-bg-card)',
                        color: activeExport === id ? '#fff' : 'var(--color-text-secondary)',
                        border: activeExport === id ? '1px solid transparent' : '1px solid var(--color-border)',
                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                    }}>
                        {id === 'stok' && <PackagePlus size={13} />} {lbl}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dari Tanggal</label>
                        <input type="date" style={selectStyle} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Sampai Tanggal</label>
                        <input type="date" style={selectStyle} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Operator</label>
                        <select style={{ ...selectStyle, width: '100%' }} value={operatorId} onChange={e => setOperatorId(e.target.value)}>
                            <option value="">Semua Operator</option>
                            {operators.map(o => <option key={o.id} value={o.id}>{o.display_name}</option>)}
                        </select>
                    </div>
                    {activeExport === 'produksi' && (
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Mesin</label>
                                <select style={{ ...selectStyle, width: '100%' }} value={machineId} onChange={e => setMachineId(e.target.value)}>
                                    <option value="">Semua Mesin</option>
                                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Kategori</label>
                                <select style={{ ...selectStyle, width: '100%' }} value={category} onChange={e => setCategory(e.target.value)}>
                                    <option value="">Semua Kategori</option>
                                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    {activeExport === 'stok' && (
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Bahan</label>
                            <select style={{ ...selectStyle, width: '100%' }} value={materialId} onChange={e => setMaterialId(e.target.value)}>
                                <option value="">Semua Bahan</option>
                                {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleLoad} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        <Filter size={14} /> {loading ? 'Memuat...' : 'Preview Data'}
                    </button>
                    <button onClick={handleExport} disabled={!activeRows.length} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10, background: activeRows.length ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--color-border)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: activeRows.length ? 'pointer' : 'not-allowed' }}>
                        <Download size={14} /> Download CSV ({activeRows.length} baris)
                    </button>
                </div>
            </div>

            {/* Summary Produksi */}
            {activeExport === 'produksi' && preview.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        ['Total Log', preview.length, 'var(--color-accent)'],
                        ['Total Bruto', `${totalBruto.toFixed(1)}m`, '#f59e0b'],
                        ['Total Netto', `${totalNetto.toFixed(1)}m`, '#22c55e'],
                        ['Total Waste', `${totalWaste.toFixed(1)}m`, 'var(--color-danger)'],
                    ].map(([label, val, color]) => (
                        <div key={label} style={{ background: 'var(--color-bg-card)', border: `1px solid ${color}33`, borderRadius: 12, padding: '16px' }}>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4, letterSpacing: '-0.03em' }}>{val}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary Stok */}
            {activeExport === 'stok' && stockPreview.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                        ['Total Entri', stockPreview.length, 'var(--color-accent)'],
                        ['Total Meter Masuk', `${totalStokM.toFixed(1)}m`, '#22c55e'],
                        ['Total Harga Beli', `Rp${Math.round(totalStokHarga).toLocaleString('id-ID')}`, '#f59e0b'],
                    ].map(([label, val, color]) => (
                        <div key={label} style={{ background: 'var(--color-bg-card)', border: `1px solid ${color}33`, borderRadius: 12, padding: '16px' }}>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 4, letterSpacing: '-0.03em' }}>{val}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Table Produksi */}
            {activeExport === 'produksi' && preview.length > 0 && (
                <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto', maxHeight: 400 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead style={{ position: 'sticky', top: 0 }}>
                                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                    {['Tanggal', 'Jam', 'Operator', 'Mesin', 'Material', 'Kategori', 'Netto', 'Bruto', 'Waste'].map(h => (
                                        <th key={h} style={{ padding: '9px 12px', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em', color: 'var(--color-text-muted)', textAlign: 'left', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((row, i) => (
                                    <tr key={row.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{new Date(row.created_at).toLocaleDateString('id-ID')}</td>
                                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{row.profiles?.display_name}</td>
                                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{row.machines?.name}</td>
                                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{row.materials?.name}</td>
                                        <td style={{ padding: '8px 12px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{CATEGORY_LABELS[row.category]}</span></td>
                                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#22c55e' }}>{row.panjang_netto}m</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f59e0b' }}>{row.bahan_bruto}m</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#ef4444' }}>{row.waste}m</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Preview Table Stok */}
            {activeExport === 'stok' && stockPreview.length > 0 && (
                <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto', maxHeight: 400 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead style={{ position: 'sticky', top: 0 }}>
                                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                    {['Tanggal', 'Jam', 'Operator', 'Bahan', 'Roll', 'Total (m)', 'Harga/Satuan', 'Total Harga'].map(h => (
                                        <th key={h} style={{ padding: '9px 12px', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em', color: 'var(--color-text-muted)', textAlign: 'left', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {stockPreview.map((row, i) => {
                                    const nama = row.profiles?.display_name || row.profiles?.email?.split('@')[0] || '—'
                                    const hargaLabel = row.harga_per_satuan > 0 ? `Rp${Number(row.harga_per_satuan).toLocaleString('id-ID')}/${row.satuan_harga === 'per_roll' ? 'roll' : 'm'}` : '—'
                                    return (
                                        <tr key={row.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{new Date(row.created_at).toLocaleDateString('id-ID')}</td>
                                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{nama}</td>
                                            <td style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.materials?.name}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>{row.rolls}</td>
                                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#22c55e' }}>{Number(row.quantity_m).toLocaleString('id-ID')}m</td>
                                            <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--color-text-secondary)' }}>{hargaLabel}</td>
                                            <td style={{ padding: '8px 12px', fontWeight: 700 }}>{row.total_harga_beli > 0 ? `Rp${Number(row.total_harga_beli).toLocaleString('id-ID')}` : '—'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

