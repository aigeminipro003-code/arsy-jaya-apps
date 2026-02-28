import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Plus, Edit2, Trash2, PackagePlus, SlidersHorizontal, Eye, EyeOff, X, History, User, ChevronDown, ChevronUp } from 'lucide-react'
import StockGauge from '../../components/ui/StockGauge'

const EMPTY_STOCK = { panjang_per_roll: '', jumlah_roll: '', satuan_harga: 'per_m', harga_per_satuan: '' }
const EMPTY_ADJUST = { stok_aktual: '', alasan: '' }
const EMPTY_FORM = { name: '', width_cm: '', min_stock_m: '5', satuan_harga: 'per_m', input_harga: '', panjang_per_roll: '' }

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

export default function MaterialManagement() {
    const { user, isAdmin, profile } = useAuth()
    const { toast } = useToast()
    const { isMobile } = useBreakpoint()
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [editModal, setEditModal] = useState(null)
    const [stockModal, setStockModal] = useState(null)
    const [adjustModal, setAdjustModal] = useState(null)
    const [deleteModal, setDeleteModal] = useState(null) // null | material object
    const [form, setForm] = useState(EMPTY_FORM)
    const [stockForm, setStockForm] = useState(EMPTY_STOCK)
    const [adjustForm, setAdjustForm] = useState(EMPTY_ADJUST)
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteShowPw, setDeleteShowPw] = useState(false)
    const [deleteError, setDeleteError] = useState('')
    const [saving, setSaving] = useState(false)

    async function load() {
        const { data } = await supabase.from('materials').select('*').order('name')
        setMaterials(data || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    function openCreate() { setForm(EMPTY_FORM); setEditModal('create') }
    function openEdit(m) {
        setForm({
            name: m.name,
            width_cm: m.width_cm,
            min_stock_m: m.min_stock_m,
            satuan_harga: 'per_m',
            input_harga: m.price_per_m || '',
            panjang_per_roll: ''
        })
        setEditModal(m)
    }
    function openStock(m) {
        setStockForm({ ...EMPTY_STOCK, harga_per_satuan: m.price_per_m ? String(m.price_per_m) : '' })
        setStockModal(m)
    }
    function openAdjust(m) { setAdjustForm({ stok_aktual: String(m.total_stock_m ?? ''), alasan: '' }); setAdjustModal(m) }


    const totalStock = stockForm.panjang_per_roll && stockForm.jumlah_roll
        ? (parseFloat(stockForm.panjang_per_roll) * parseInt(stockForm.jumlah_roll))
        : null

    const hargaSatuan = parseFloat(stockForm.harga_per_satuan) || 0
    const totalHarga = (() => {
        if (!totalStock || !hargaSatuan) return null
        if (stockForm.satuan_harga === 'per_roll') {
            return hargaSatuan * parseInt(stockForm.jumlah_roll || 0)
        }
        return hargaSatuan * totalStock
    })()
    const hargaPerMeter = totalStock && totalHarga ? totalHarga / totalStock : null

    async function handleSaveMaterial(e) {
        e.preventDefault()
        setSaving(true)

        // Hitung harga per meter jika mode per_roll
        let finalPricePerMeter = 0
        const inputHrg = parseFloat(form.input_harga) || 0
        if (form.satuan_harga === 'per_roll') {
            const pjg = parseFloat(form.panjang_per_roll) || 1 // hindari bagi nol
            finalPricePerMeter = inputHrg / pjg
        } else {
            finalPricePerMeter = inputHrg
        }

        const payload = {
            name: form.name,
            width_cm: parseFloat(form.width_cm) || 0,
            min_stock_m: parseFloat(form.min_stock_m) || 5,
            price_per_m: finalPricePerMeter
        }

        let error
        if (editModal === 'create') {
            ({ error } = await supabase.from('materials').insert(payload))
        } else {
            ({ error } = await supabase.from('materials').update(payload).eq('id', editModal.id))
        }
        setSaving(false)
        if (error) toast(error.message, 'error')
        else { toast(editModal === 'create' ? '✅ Bahan ditambahkan' : '✅ Bahan diperbarui', 'success'); setEditModal(null); load() }
    }

    function handleDelete(m) {
        setDeletePassword('')
        setDeleteShowPw(false)
        setDeleteError('')
        setDeleteModal(m)
    }

    async function handleDeleteConfirm(e) {
        e.preventDefault()
        if (!deleteModal) return
        setSaving(true)
        setDeleteError('')

        // Verify admin password before allowing delete
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: deletePassword,
        })
        if (authError) {
            setDeleteError('Password salah. Silakan coba lagi.')
            setSaving(false)
            return
        }

        const { error } = await supabase.from('materials').delete().eq('id', deleteModal.id)
        setSaving(false)
        if (error) {
            setDeleteError(error.message)
        } else {
            toast(`🗑 Bahan "${deleteModal.name}" berhasil dihapus.`, 'success')
            setDeleteModal(null)
            load()
        }
    }

    async function handleStockIn(e) {
        e.preventDefault()
        if (!stockModal) return
        setSaving(true)
        const qty = parseFloat(totalStock)
        const jumlahRoll = parseInt(stockForm.jumlah_roll)
        const hargaSatuanVal = parseFloat(stockForm.harga_per_satuan) || 0
        const totalHargaVal = (() => {
            if (!hargaSatuanVal) return 0
            if (stockForm.satuan_harga === 'per_roll') return hargaSatuanVal * jumlahRoll
            return hargaSatuanVal * qty
        })()

        const { error } = await supabase.from('stock_movements').insert({
            material_id: stockModal.id,
            movement_type: 'in',
            quantity_m: qty,
            rolls: jumlahRoll,
            panjang_per_roll: parseFloat(stockForm.panjang_per_roll),
            operator_id: profile?.id ?? user.id,
            harga_per_satuan: hargaSatuanVal,
            satuan_harga: stockForm.satuan_harga,
            total_harga_beli: totalHargaVal,
        })
        setSaving(false)
        if (error) toast(error.message, 'error')
        else { toast(`✅ Stok +${qty}m ditambahkan${totalHargaVal ? ` · Rp${totalHargaVal.toLocaleString('id-ID')}` : ''}`, 'success'); setStockModal(null); load() }
    }

    async function handleAdjust(e) {
        e.preventDefault()
        if (!adjustModal) return
        const newStock = parseFloat(adjustForm.stok_aktual)
        if (isNaN(newStock) || newStock < 0) { toast('Masukkan nilai stok yang valid', 'error'); return }
        if (!adjustForm.alasan.trim()) { toast('Alasan koreksi wajib diisi', 'error'); return }
        setSaving(true)

        const prevStock = parseFloat(adjustModal.total_stock_m) || 0
        const delta = newStock - prevStock

        // Directly set the stock value
        const { error: updateErr } = await supabase
            .from('materials')
            .update({ total_stock_m: newStock })
            .eq('id', adjustModal.id)

        if (updateErr) { setSaving(false); toast(updateErr.message, 'error'); return }

        // Record in stock_movements for audit trail
        await supabase.from('stock_movements').insert({
            material_id: adjustModal.id,
            movement_type: 'adjustment',
            quantity_m: delta,
            operator_id: user.id,
            notes: `[KOREKSI] ${adjustForm.alasan.trim()} | Sebelum: ${prevStock}m → Sesudah: ${newStock}m`,
        })

        setSaving(false)
        toast(`✅ Stok dikoreksi ke ${newStock} m`, 'success')
        setAdjustModal(null)
        load()
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? 12 : 0, marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: '-0.04em' }}>
                        {isAdmin ? 'Manajemen Bahan' : 'Stok Bahan'}
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        {isAdmin ? 'CRUD bahan, input stok masuk, koreksi stok' : 'Tambahkan stok bahan masuk'}
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)', border: 'none', fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer' }}>
                        <Plus size={15} /> Tambah Bahan
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div style={{ width: 28, height: 28, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }} className="animate-spin" /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {materials.map(m => (
                        <div key={m.id} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                        {m.width_cm}cm · Rp{Number(m.price_per_m).toLocaleString('id-ID')}/m
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => openStock(m)} title="Tambah Stok" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><PackagePlus size={14} /></button>
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => openAdjust(m)} title="Koreksi Stok" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><SlidersHorizontal size={14} /></button>
                                            <button onClick={() => openEdit(m)} title="Edit" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(m)} title="Hapus" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <StockGauge material={m} />
                        </div>
                    ))}
                </div>
            )}

            {/* Material edit/create modal */}
            {editModal && (
                <Modal title={editModal === 'create' ? 'Tambah Bahan Baru' : 'Edit Bahan'} onClose={() => setEditModal(null)}>
                    <form onSubmit={handleSaveMaterial} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div><label style={labelStyle}>Nama Bahan</label><input required style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Vinyl Gloss" /></div>
                        <div><label style={labelStyle}>Lebar (cm)</label><input type="number" min="0" step="0.1" required style={inputStyle} value={form.width_cm} onChange={e => setForm({ ...form, width_cm: e.target.value })} placeholder="160" /></div>
                        <div><label style={labelStyle}>Minimum Stok (m)</label><input type="number" min="0" step="0.1" required style={inputStyle} value={form.min_stock_m} onChange={e => setForm({ ...form, min_stock_m: e.target.value })} placeholder="5" /></div>

                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                            <label style={labelStyle}>Harga Beli Acuan</label>
                            {/* Toggle per_m / per_roll */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                {[['per_m', 'Per Meter'], ['per_roll', 'Per Roll']].map(([val, lbl]) => (
                                    <button
                                        key={val} type="button" onClick={() => setForm({ ...form, satuan_harga: val })}
                                        style={{
                                            flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                            cursor: 'pointer', border: '1px solid',
                                            borderColor: form.satuan_harga === val ? 'var(--color-accent)' : 'var(--color-border)',
                                            background: form.satuan_harga === val ? 'var(--color-accent-dim)' : 'var(--color-bg-secondary)',
                                            color: form.satuan_harga === val ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                        }}
                                    >
                                        {lbl}
                                    </button>
                                ))}
                            </div>

                            {form.satuan_harga === 'per_roll' && (
                                <div style={{ marginBottom: 10 }}>
                                    <input type="number" min="0.1" step="0.1" required style={inputStyle} value={form.panjang_per_roll} onChange={e => setForm({ ...form, panjang_per_roll: e.target.value })} placeholder="Panjang per 1 Roll (Contoh: 50m)" />
                                </div>
                            )}

                            <div>
                                <input type="number" min="0" style={inputStyle} value={form.input_harga} onChange={e => setForm({ ...form, input_harga: e.target.value })} placeholder={form.satuan_harga === 'per_m' ? 'Rp harga per meter' : 'Rp harga total per 1 roll'} />
                            </div>

                            {form.satuan_harga === 'per_roll' && parseFloat(form.input_harga) > 0 && parseFloat(form.panjang_per_roll) > 0 && (
                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8, padding: '6px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6, display: 'inline-block' }}>
                                    Disimpan sebagai: <b>Rp{Math.round(parseFloat(form.input_harga) / parseFloat(form.panjang_per_roll)).toLocaleString('id-ID')}/m</b>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button type="button" onClick={() => setEditModal(null)} style={{ flex: 1, padding: '12px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                            <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Stock in modal */}
            {stockModal && (
                <Modal title={`Tambah Stok — ${stockModal.name}`} onClose={() => setStockModal(null)}>
                    <form onSubmit={handleStockIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div><label style={labelStyle}>Panjang per Roll (m)</label><input type="number" min="0.1" step="0.1" required style={inputStyle} value={stockForm.panjang_per_roll} onChange={e => setStockForm({ ...stockForm, panjang_per_roll: e.target.value })} placeholder="50" /></div>
                        <div><label style={labelStyle}>Jumlah Roll</label><input type="number" min="1" step="1" required style={inputStyle} value={stockForm.jumlah_roll} onChange={e => setStockForm({ ...stockForm, jumlah_roll: e.target.value })} placeholder="3" /></div>

                        {/* Harga Section */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                            <label style={labelStyle}>Harga Pembelian</label>
                            {/* Toggle per_m / per_roll */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                {[['per_m', 'Per Meter'], ['per_roll', 'Per Roll']].map(([val, lbl]) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setStockForm({ ...stockForm, satuan_harga: val })}
                                        style={{
                                            flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                                            cursor: 'pointer', border: '1px solid',
                                            borderColor: stockForm.satuan_harga === val ? 'var(--color-accent)' : 'var(--color-border)',
                                            background: stockForm.satuan_harga === val ? 'var(--color-accent-dim)' : 'var(--color-bg-secondary)',
                                            color: stockForm.satuan_harga === val ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                        }}
                                    >
                                        {lbl}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number" min="0" step="100"
                                style={inputStyle}
                                value={stockForm.harga_per_satuan}
                                onChange={e => setStockForm({ ...stockForm, harga_per_satuan: e.target.value })}
                                placeholder={stockForm.satuan_harga === 'per_m' ? 'Rp / meter (kosongkan jika tidak tahu)' : 'Rp / roll'}
                            />
                        </div>

                        {/* Preview */}
                        {totalStock && (
                            <div style={{ padding: '14px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Total stok masuk</span>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{totalStock.toFixed(1)} m</span>
                                </div>
                                {totalHarga !== null && (
                                    <>
                                        <div style={{ height: 1, background: 'rgba(34,197,94,0.2)' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Total harga beli</span>
                                            <span style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>Rp {totalHarga.toLocaleString('id-ID')}</span>
                                        </div>
                                        {stockForm.satuan_harga === 'per_roll' && hargaPerMeter && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Efektif per meter</span>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Rp {Math.round(hargaPerMeter).toLocaleString('id-ID')}/m</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" onClick={() => setStockModal(null)} style={{ flex: 1, padding: '12px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                            <button type="submit" disabled={saving || !totalStock} style={{ flex: 2, padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Menyimpan...' : '+ Tambah Stok'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Stock adjustment / correction modal */}
            {adjustModal && (() => {
                const prev = parseFloat(adjustModal.total_stock_m) || 0
                const next = parseFloat(adjustForm.stok_aktual)
                const delta = !isNaN(next) ? (next - prev) : null
                return (
                    <Modal title={`Koreksi Stok — ${adjustModal.name}`} onClose={() => setAdjustModal(null)}>
                        {/* Current stock info */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <div style={{ flex: 1, background: 'var(--color-bg-secondary)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Stok Sistem</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-text-primary)' }}>{prev} <span style={{ fontSize: 13 }}>m</span></div>
                            </div>
                            {delta !== null && (
                                <div style={{ flex: 1, background: delta >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${delta >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Selisih</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: delta >= 0 ? '#22c55e' : 'var(--color-danger)' }}>
                                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)} <span style={{ fontSize: 13 }}>m</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={labelStyle}>Stok Aktual (hasil hitung fisik)</label>
                                <input
                                    type="number" min="0" step="0.01" required
                                    style={{ ...inputStyle, fontSize: 20, fontWeight: 700, textAlign: 'right' }}
                                    value={adjustForm.stok_aktual}
                                    onChange={e => setAdjustForm({ ...adjustForm, stok_aktual: e.target.value })}
                                    placeholder={String(prev)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Alasan Koreksi <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                                <textarea
                                    required rows={2}
                                    style={{ ...inputStyle, resize: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}
                                    value={adjustForm.alasan}
                                    onChange={e => setAdjustForm({ ...adjustForm, alasan: e.target.value })}
                                    placeholder="Contoh: Stok hitung ulang, ada bahan rusak tidak tercatat..."
                                />
                            </div>
                            <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: 12, color: '#f59e0b' }}>
                                ⚠️ Koreksi ini akan mengubah stok secara langsung dan dicatat sebagai entri <strong>Penyesuaian</strong> untuk audit.
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="button" onClick={() => setAdjustModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                                <button type="submit" disabled={saving || isNaN(next)} style={{ flex: 2, padding: '10px', borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Menyimpan...' : '✓ Terapkan Koreksi'}</button>
                            </div>
                        </form>
                    </Modal>
                )
            })()}

            {/* Delete confirmation modal with admin password verify */}
            {deleteModal && (
                <Modal title="Konfirmasi Hapus Bahan" onClose={() => setDeleteModal(null)}>
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <Trash2 size={20} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-danger)', marginBottom: 4 }}>Hapus Bahan Permanen</div>
                            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                Kamu akan menghapus <strong style={{ color: 'var(--color-text-primary)' }}>"{deleteModal.name}"</strong>. Data tidak dapat dikembalikan.
                            </div>
                        </div>
                    </div>
                    <form onSubmit={handleDeleteConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={labelStyle}>Konfirmasi Password Admin</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={deleteShowPw ? 'text' : 'password'}
                                    required autoFocus
                                    style={{ ...inputStyle, paddingRight: 42 }}
                                    value={deletePassword}
                                    onChange={e => { setDeletePassword(e.target.value); setDeleteError('') }}
                                    placeholder="Masukkan password kamu..."
                                />
                                <button type="button"
                                    onClick={() => setDeleteShowPw(p => !p)}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}
                                >
                                    {deleteShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {deleteError && (
                                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-danger)', display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span>⚠</span> {deleteError}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="button" onClick={() => setDeleteModal(null)}
                                style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                            >Batal</button>
                            <button type="submit" disabled={saving || !deletePassword}
                                style={{ flex: 2, padding: '11px', borderRadius: 8, background: saving || !deletePassword ? 'var(--color-border)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none', color: '#fff', fontWeight: 700, cursor: saving || !deletePassword ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                            >
                                {saving ? 'Memverifikasi...' : <><Trash2 size={14} /> Hapus Permanen</>}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    )
}


