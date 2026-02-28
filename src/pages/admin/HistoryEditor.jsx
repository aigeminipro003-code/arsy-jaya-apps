import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../components/ui/Toast'
import { Save, X, Edit2, FileEdit, PackagePlus, User } from 'lucide-react'
import { createPortal } from 'react-dom'

const CATEGORY_LABELS = { order: 'Order', tes_warna: 'Tes Warna', maintenance: 'Maintenance', kerusakan: 'Kerusakan' }
const CATEGORY_COLORS = { order: '#1E4FD8', tes_warna: '#f59e0b', maintenance: '#6366f1', kerusakan: '#ef4444' }
const EMPTY_STOCK = { panjang_per_roll: '', jumlah_roll: '', satuan_harga: 'per_m', harga_per_satuan: '' }

function Modal({ title, children, onClose }) {
    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9000,
                background: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div
                className="animate-fade-in"
                style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    width: '100%', maxWidth: 460,
                    maxHeight: '85vh', overflowY: 'auto',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 1 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, display: 'flex' }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: 20 }}>{children}</div>
            </div>
        </div>,
        document.body
    )
}

const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)', fontSize: 13, outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }

function EditRow({ log, machines, materials, onSave, onCancel }) {
    const [form, setForm] = useState({
        panjang_netto: log.panjang_netto,
        bahan_bruto: log.bahan_bruto,
        category: log.category,
        notes: log.notes || '',
        material_id: log.material_id,
        machine_id: log.machine_id,
        edit_reason: '',
    })
    const waste = (parseFloat(form.bahan_bruto) - parseFloat(form.panjang_netto)).toFixed(2)
    const reasonMissing = !form.edit_reason.trim()

    const inputS = { padding: '5px 8px', borderRadius: 6, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-bright)', color: 'var(--color-text-primary)', fontSize: 12, minWidth: 0, width: '100%' }
    return (
        <>
            <tr style={{ background: 'rgba(30,79,216,0.04)' }}>
                <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                <td style={{ padding: '10px 12px', fontSize: 12 }}>{log.profiles?.display_name}</td>
                <td style={{ padding: '10px 12px' }}>
                    <select style={inputS} value={form.machine_id} onChange={e => setForm({ ...form, machine_id: e.target.value })}>
                        {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </td>
                <td style={{ padding: '10px 12px' }}>
                    <select style={inputS} value={form.material_id} onChange={e => setForm({ ...form, material_id: e.target.value })}>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </td>
                <td style={{ padding: '10px 12px' }}>
                    <select style={inputS} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </td>
                <td style={{ padding: '10px 12px' }}><input type="number" step="0.01" min="0" style={inputS} value={form.panjang_netto} onChange={e => setForm({ ...form, panjang_netto: e.target.value })} /></td>
                <td style={{ padding: '10px 12px' }}><input type="number" step="0.01" min="0" style={inputS} value={form.bahan_bruto} onChange={e => setForm({ ...form, bahan_bruto: e.target.value })} /></td>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--color-danger)' }}>{waste}</td>
                <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={() => onSave(log.id, form)}
                            disabled={reasonMissing}
                            title={reasonMissing ? 'Isi alasan koreksi dulu' : 'Simpan'}
                            style={{ background: reasonMissing ? 'var(--color-bg-secondary)' : 'rgba(34,197,94,0.15)', border: `1px solid ${reasonMissing ? 'var(--color-border)' : 'rgba(34,197,94,0.3)'}`, color: reasonMissing ? 'var(--color-text-muted)' : '#22c55e', borderRadius: 6, padding: '5px 7px', cursor: reasonMissing ? 'not-allowed' : 'pointer', display: 'flex' }}>
                            <Save size={13} />
                        </button>
                        <button onClick={onCancel} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', display: 'flex' }}><X size={13} /></button>
                    </div>
                </td>
            </tr>
            <tr style={{ background: 'rgba(30,79,216,0.02)' }}>
                <td colSpan={9} style={{ padding: '0 12px 12px' }}>
                    <div style={{
                        padding: 12, borderRadius: 8,
                        background: 'rgba(239,68,68,0.05)',
                        border: `1px solid ${reasonMissing ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.3)'}`,
                        transition: 'border-color 0.2s',
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: reasonMissing ? '#ef4444' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                            <FileEdit size={12} />
                            Alasan Koreksi <span style={{ color: '#ef4444' }}>*</span> — wajib diisi sebelum menyimpan
                        </label>
                        <textarea
                            rows={2}
                            required
                            autoFocus
                            placeholder="Contoh: Salah input panjang netto, seharusnya 45m bukan 54m..."
                            value={form.edit_reason}
                            onChange={e => setForm({ ...form, edit_reason: e.target.value })}
                            style={{
                                width: '100%', padding: '8px 10px', borderRadius: 6, resize: 'vertical',
                                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-bright)',
                                color: 'var(--color-text-primary)', fontSize: 12, fontFamily: 'var(--font-sans)',
                                lineHeight: 1.5, outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </td>
            </tr>
        </>
    )
}

export default function HistoryEditor() {
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState('produksi')
    const [logs, setLogs] = useState([])
    const [stockLogs, setStockLogs] = useState([])
    const [machines, setMachines] = useState([])
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [stockLoading, setStockLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const [editHistoryModal, setEditHistoryModal] = useState(null)
    const [editHistoryForm, setEditHistoryForm] = useState(EMPTY_STOCK)
    const [saving, setSaving] = useState(false)

    async function load() {
        setLoading(true)
        const [{ data: mc }, { data: mt }] = await Promise.all([
            supabase.from('machines').select('*'),
            supabase.from('materials').select('*'),
        ])
        setMachines(mc || [])
        setMaterials(mt || [])

        let q = supabase.from('production_logs')
            .select('*, profiles(display_name), machines(name), materials(name, width_cm)')
            .order('created_at', { ascending: false })
            .limit(200)
        if (dateFrom) q = q.gte('created_at', dateFrom)
        if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59')

        const { data } = await q
        setLogs(data || [])
        setLoading(false)
    }

    async function loadStockHistory() {
        setStockLoading(true)
        let q = supabase
            .from('stock_movements')
            .select('id, material_id, quantity_m, rolls, panjang_per_roll, harga_per_satuan, satuan_harga, total_harga_beli, created_at, materials(id, name, width_cm), profiles(display_name)')
            .eq('movement_type', 'in')
            .order('created_at', { ascending: false })
            .limit(200)
        if (dateFrom) q = q.gte('created_at', dateFrom)
        if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59')
        const { data } = await q
        setStockLogs(data || [])
        setStockLoading(false)
    }

    useEffect(() => { load(); loadStockHistory() }, [dateFrom, dateTo])

    async function handleSave(id, form) {
        if (!form.edit_reason?.trim()) {
            toast('Alasan koreksi wajib diisi sebelum menyimpan', 'error')
            return
        }
        const { error } = await supabase.from('production_logs').update({
            panjang_netto: parseFloat(form.panjang_netto),
            bahan_bruto: parseFloat(form.bahan_bruto),
            category: form.category,
            notes: form.notes || null,
            machine_id: form.machine_id,
            material_id: form.material_id,
            edit_reason: form.edit_reason.trim(),
            edited_at: new Date().toISOString(),
        }).eq('id', id)
        if (error) toast(error.message, 'error')
        else { toast('✅ Log berhasil diperbarui', 'success'); setEditingId(null); load() }
    }

    async function handleDelete(id) {
        if (!window.confirm('Hapus log ini? Stock tidak akan dikembalikan secara otomatis.')) return
        const { error } = await supabase.from('production_logs').delete().eq('id', id)
        if (error) toast(error.message, 'error')
        else { toast('Log dihapus', 'success'); load() }
    }

    async function handleSaveHistory(e) {
        e.preventDefault()
        if (!editHistoryModal) return
        setSaving(true)

        const qty = parseFloat(editHistoryForm.panjang_per_roll) * parseInt(editHistoryForm.jumlah_roll)
        const jumlahRoll = parseInt(editHistoryForm.jumlah_roll)
        const hargaSatuanVal = parseFloat(editHistoryForm.harga_per_satuan) || 0
        const totalHargaVal = (() => {
            if (!hargaSatuanVal) return 0
            if (editHistoryForm.satuan_harga === 'per_roll') return hargaSatuanVal * jumlahRoll
            return hargaSatuanVal * qty
        })()

        const oldQty = parseFloat(editHistoryModal.quantity_m)
        const delta = qty - oldQty

        // If qty changed, update material stock safety logic
        if (delta !== 0) {
            const { data: matData } = await supabase.from('materials').select('total_stock_m').eq('id', editHistoryModal.material_id).single()
            if (matData) {
                await supabase.from('materials').update({ total_stock_m: Number(matData.total_stock_m) + delta }).eq('id', editHistoryModal.material_id)
            }
        }

        const { error } = await supabase.from('stock_movements').update({
            quantity_m: qty,
            rolls: jumlahRoll,
            panjang_per_roll: parseFloat(editHistoryForm.panjang_per_roll),
            harga_per_satuan: hargaSatuanVal,
            satuan_harga: editHistoryForm.satuan_harga,
            total_harga_beli: totalHargaVal,
        }).eq('id', editHistoryModal.id)

        setSaving(false)
        if (error) toast(error.message, 'error')
        else { toast('✅ Riwayat stok berhasil diedit', 'success'); setEditHistoryModal(null); loadStockHistory() }
    }

    function openEditStock(log) {
        setEditHistoryForm({
            panjang_per_roll: String(log.panjang_per_roll || ''),
            jumlah_roll: String(log.rolls || ''),
            satuan_harga: log.satuan_harga || 'per_m',
            harga_per_satuan: log.harga_per_satuan ? String(log.harga_per_satuan) : ''
        })
        setEditHistoryModal(log)
    }

    const thStyle = { padding: '10px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap', textAlign: 'left' }
    const tdStyle = { padding: '10px 12px', fontSize: 12, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em' }}>Edit Riwayat</h1>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Koreksi log produksi · Lihat stok masuk</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[['produksi', 'Log Produksi', Edit2], ['stok', 'Stok Masuk', PackagePlus]].map(([id, lbl, Icon]) => (
                    <button key={id} onClick={() => setActiveTab(id)} style={{
                        padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: activeTab === id ? 'var(--color-accent)' : 'var(--color-bg-card)',
                        color: activeTab === id ? '#fff' : 'var(--color-text-secondary)',
                        border: activeTab === id ? '1px solid transparent' : '1px solid var(--color-border)',
                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                    }}>
                        <Icon size={13} /> {lbl}
                    </button>
                ))}
            </div>

            {/* Date filter */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Filter tanggal:</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: 12 }} />
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>s/d</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: 12 }} />
                {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo('') }} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}>Reset</button>}
            </div>

            {/* ── TAB: LOG PRODUKSI ── */}
            {activeTab === 'produksi' && (
                <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                    <th style={thStyle}>Waktu</th>
                                    <th style={thStyle}>Operator</th>
                                    <th style={thStyle}>Mesin</th>
                                    <th style={thStyle}>Material</th>
                                    <th style={thStyle}>Kategori</th>
                                    <th style={thStyle}>Netto (m)</th>
                                    <th style={thStyle}>Bruto (m)</th>
                                    <th style={thStyle}>Waste (m)</th>
                                    <th style={thStyle}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: 40 }}>Memuat...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Tidak ada data</td></tr>
                                ) : logs.map(log =>
                                    editingId === log.id ? (
                                        <EditRow key={log.id} log={log} machines={machines} materials={materials}
                                            onSave={handleSave} onCancel={() => setEditingId(null)} />
                                    ) : (
                                        <React.Fragment key={log.id}>
                                            <tr style={{ transition: 'background 0.1s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                <td style={{ ...tdStyle, fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                    {new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    {log.edit_reason && (
                                                        <div style={{ marginTop: 3, color: 'var(--color-accent)', fontWeight: 600 }}>
                                                            ✎ diedit {log.edited_at ? new Date(log.edited_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={tdStyle}>{log.profiles?.display_name}</td>
                                                <td style={tdStyle}>{log.machines?.name}</td>
                                                <td style={tdStyle}>
                                                    {log.materials?.name}
                                                    {log.materials?.width_cm ? <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 4 }}>({log.materials.width_cm}cm)</span> : ''}
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: `${CATEGORY_COLORS[log.category]}18`, color: CATEGORY_COLORS[log.category] }}>
                                                        {CATEGORY_LABELS[log.category] ?? log.category}
                                                    </span>
                                                </td>
                                                <td style={{ ...tdStyle, fontWeight: 600 }}>{log.panjang_netto}</td>
                                                <td style={{ ...tdStyle, fontWeight: 600 }}>{log.bahan_bruto}</td>
                                                <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-danger)' }}>{log.waste}</td>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button onClick={() => setEditingId(log.id)} title="Edit" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', display: 'flex' }}><Edit2 size={12} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {log.edit_reason && (
                                                <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
                                                    <td colSpan={9} style={{ padding: '0 12px 10px' }}>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'flex-start', gap: 8,
                                                            padding: '8px 12px', borderRadius: 6,
                                                            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                                                        }}>
                                                            <FileEdit size={13} color="#6366f1" style={{ marginTop: 1, flexShrink: 0 }} />
                                                            <div>
                                                                <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Catatan Koreksi Admin</span>
                                                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{log.edit_reason}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB: STOK MASUK ── */}
            {activeTab === 'stok' && (
                <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                    {['Waktu', 'Operator', 'Bahan', 'Roll', 'Pjg/Roll', 'Total (m)', 'Harga/Satuan', 'Total Harga', 'Aksi'].map(h => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {stockLoading ? (
                                    <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: 40 }}>Memuat...</td></tr>
                                ) : stockLogs.length === 0 ? (
                                    <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Belum ada riwayat stok masuk</td></tr>
                                ) : stockLogs.map((l, i) => {
                                    const nama = l.profiles?.display_name || l.profiles?.email?.split('@')[0] || '—'
                                    const hargaLabel = l.harga_per_satuan > 0 ? `Rp${Number(l.harga_per_satuan).toLocaleString('id-ID')}/${l.satuan_harga === 'per_roll' ? 'roll' : 'm'}` : '—'
                                    const totalLabel = l.total_harga_beli > 0 ? `Rp${Number(l.total_harga_beli).toLocaleString('id-ID')}` : '—'
                                    return (
                                        <tr key={l.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.1s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                                        >
                                            <td style={{ ...tdStyle, fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                {new Date(l.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <User size={11} color="var(--color-accent)" />
                                                    <span>{nama}</span>
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                                                {l.materials?.name ?? '—'}
                                                {l.materials?.width_cm ? <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 4 }}>({l.materials.width_cm}cm)</span> : ''}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>{l.rolls}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>{l.panjang_per_roll}m</td>
                                            <td style={{ ...tdStyle, fontWeight: 700, color: '#22c55e' }}>+{Number(l.quantity_m).toLocaleString('id-ID')}m</td>
                                            <td style={{ ...tdStyle, fontSize: 11, color: 'var(--color-text-secondary)' }}>{hargaLabel}</td>
                                            <td style={{ ...tdStyle, fontWeight: 700 }}>{totalLabel}</td>
                                            <td style={tdStyle}>
                                                <button onClick={() => openEditStock(l)} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', display: 'flex' }}><Edit2 size={12} /></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Riwayat Edit modal */}
            {editHistoryModal && (() => {
                const totalStockHistory = editHistoryForm.panjang_per_roll && editHistoryForm.jumlah_roll
                    ? (parseFloat(editHistoryForm.panjang_per_roll) * parseInt(editHistoryForm.jumlah_roll))
                    : null
                const hargaSatuanHistory = parseFloat(editHistoryForm.harga_per_satuan) || 0
                const totalHargaHistory = (() => {
                    if (!totalStockHistory || !hargaSatuanHistory) return null
                    if (editHistoryForm.satuan_harga === 'per_roll') {
                        return hargaSatuanHistory * parseInt(editHistoryForm.jumlah_roll || 0)
                    }
                    return hargaSatuanHistory * totalStockHistory
                })()
                const hargaPerMeterHistory = totalStockHistory && totalHargaHistory ? totalHargaHistory / totalStockHistory : null
                const oldTotalStr = `${editHistoryModal.quantity_m}m`

                return (
                    <Modal title={`Edit Riwayat Masuk — ${editHistoryModal.materials?.name ?? 'Bahan'}`} onClose={() => setEditHistoryModal(null)}>
                        <form onSubmit={handleSaveHistory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ padding: '10px 12px', background: 'rgba(30,79,216,0.08)', border: '1px solid rgba(30,79,216,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-primary)' }}>
                                ℹ️ Anda mengedit riwayat masuk pada <strong>{new Date(editHistoryModal.created_at).toLocaleString('id-ID')}</strong> (Sebelumnya: {oldTotalStr}).<br />
                                <em>Perubahan kuantitas di sini akan otomatis disesuaikan ke stok saat ini.</em>
                            </div>
                            <div><label style={labelStyle}>Panjang per Roll (m)</label><input type="number" min="0.1" step="0.1" required style={inputStyle} value={editHistoryForm.panjang_per_roll} onChange={e => setEditHistoryForm({ ...editHistoryForm, panjang_per_roll: e.target.value })} placeholder="50" /></div>
                            <div><label style={labelStyle}>Jumlah Roll</label><input type="number" min="1" step="1" required style={inputStyle} value={editHistoryForm.jumlah_roll} onChange={e => setEditHistoryForm({ ...editHistoryForm, jumlah_roll: e.target.value })} placeholder="3" /></div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                                <label style={labelStyle}>Harga Pembelian</label>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                    {[['per_m', 'Per Meter'], ['per_roll', 'Per Roll']].map(([val, lbl]) => (
                                        <button
                                            key={val} type="button" onClick={() => setEditHistoryForm({ ...editHistoryForm, satuan_harga: val })}
                                            style={{
                                                flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                cursor: 'pointer', border: '1px solid',
                                                borderColor: editHistoryForm.satuan_harga === val ? 'var(--color-accent)' : 'var(--color-border)',
                                                background: editHistoryForm.satuan_harga === val ? 'var(--color-accent-dim)' : 'var(--color-bg-secondary)',
                                                color: editHistoryForm.satuan_harga === val ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                            }}
                                        >
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number" min="0" step="100" style={inputStyle} value={editHistoryForm.harga_per_satuan} onChange={e => setEditHistoryForm({ ...editHistoryForm, harga_per_satuan: e.target.value })} placeholder={editHistoryForm.satuan_harga === 'per_m' ? 'Rp / meter (kosongkan jika tidak tahu)' : 'Rp / roll'}
                                />
                            </div>

                            {totalStockHistory && (
                                <div style={{ padding: '14px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Revisi total stok masuk</span>
                                        <span style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{totalStockHistory.toFixed(1)} m</span>
                                    </div>
                                    {totalHargaHistory !== null && (
                                        <>
                                            <div style={{ height: 1, background: 'rgba(34,197,94,0.2)' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Total harga beli revisi</span>
                                                <span style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>Rp {totalHargaHistory.toLocaleString('id-ID')}</span>
                                            </div>
                                            {editHistoryForm.satuan_harga === 'per_roll' && hargaPerMeterHistory && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Efektif per meter</span>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Rp {Math.round(hargaPerMeterHistory).toLocaleString('id-ID')}/m</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" onClick={() => setEditHistoryModal(null)} style={{ flex: 1, padding: '12px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                                <button type="submit" disabled={saving || !totalStockHistory} style={{ flex: 2, padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Menyimpan...' : 'Simpan Revisi'}</button>
                            </div>
                        </form>
                    </Modal>
                )
            })()}
        </div>
    )
}

