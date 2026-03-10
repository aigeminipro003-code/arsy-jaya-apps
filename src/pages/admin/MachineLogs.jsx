import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../components/ui/Toast'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Plus, PenTool, Droplet, CheckCircle, Trash2, Edit2, Search, Calendar, X, Save } from 'lucide-react'
import { createPortal } from 'react-dom'

function MaintenanceModal({ log, machines, onSave, onClose, saving }) {
    const [form, setForm] = useState({
        machine_id: log?.machine_id ?? '',
        maintenance_date: log?.maintenance_date ? new Date(log.maintenance_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        maintenance_type: log?.maintenance_type ?? 'Rutin',
        description: log?.description ?? '',
        cost: log?.cost ?? 0,
        performed_by: log?.performed_by ?? '',
    })
    const isEdit = !!log?.id
    const inputS = {
        width: '100%', padding: '10px 12px', borderRadius: 8,
        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box'
    }

    return createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 460,
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800 }}>{isEdit ? 'Edit Log Maintenance' : 'Tambah Maintenance'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Mesin *</label>
                        <select style={inputS} value={form.machine_id} onChange={e => setForm({ ...form, machine_id: e.target.value })} required>
                            <option value="">-- Pilih Mesin --</option>
                            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tanggal & Waktu *</label>
                            <input type="datetime-local" style={inputS} value={form.maintenance_date} onChange={e => setForm({ ...form, maintenance_date: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Jenis *</label>
                            <select style={inputS} value={form.maintenance_type} onChange={e => setForm({ ...form, maintenance_type: e.target.value })}>
                                <option value="Rutin">Rutin (Berkala)</option>
                                <option value="Perbaikan">Perbaikan</option>
                                <option value="Ganti Part">Ganti Part</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Deskripsi Detail</label>
                        <textarea style={{ ...inputS, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Keterangan perbaikan / part yang diganti..." />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Biaya (Opsional)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 12, top: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>Rp</span>
                                <input type="number" style={{ ...inputS, paddingLeft: 36 }} value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} min={0} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Teknisi / Vendor</label>
                            <input style={inputS} value={form.performed_by} onChange={e => setForm({ ...form, performed_by: e.target.value })} placeholder="Nama teknisi..." />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                    <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Batal</button>
                    <button
                        onClick={() => onSave(form, log?.id)}
                        disabled={saving || !form.machine_id}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, background: form.machine_id ? 'linear-gradient(135deg, #1E4FD8, #B33B3D)' : 'var(--color-border)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: form.machine_id ? 'pointer' : 'not-allowed' }}>
                        <Save size={14} /> {saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}


function InkModal({ log, machines, onSave, onClose, saving }) {
    const [form, setForm] = useState({
        machine_id: log?.machine_id ?? '',
        replacement_date: log?.replacement_date ? new Date(log.replacement_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        ink_color: log?.ink_color ?? 'Cyan',
        quantity: log?.quantity ?? 1,
        notes: log?.notes ?? '',
        replaced_by: log?.replaced_by ?? '',
    })
    const isEdit = !!log?.id
    const inputS = {
        width: '100%', padding: '10px 12px', borderRadius: 8,
        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box'
    }

    const COLORS = ['Cyan', 'Magenta', 'Yellow', 'Black', 'Light Cyan', 'Light Magenta', 'White', 'Varnish', 'Lainnya']

    return createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 460,
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800 }}>{isEdit ? 'Edit Log Tinta' : 'Log Ganti Tinta'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Mesin *</label>
                        <select style={inputS} value={form.machine_id} onChange={e => setForm({ ...form, machine_id: e.target.value })} required>
                            <option value="">-- Pilih Mesin --</option>
                            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tanggal & Waktu *</label>
                            <input type="datetime-local" style={inputS} value={form.replacement_date} onChange={e => setForm({ ...form, replacement_date: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Warna Tinta *</label>
                            <select style={inputS} value={form.ink_color} onChange={e => setForm({ ...form, ink_color: e.target.value })}>
                                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Jumlah / Qty *</label>
                            <input type="number" step="0.5" min="0.5" style={inputS} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Operator</label>
                            <input style={inputS} value={form.replaced_by} onChange={e => setForm({ ...form, replaced_by: e.target.value })} placeholder="Nama yg ganti..." />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Catatan (Opsional)</label>
                        <input style={inputS} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Merek tinta, dsb..." />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                    <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Batal</button>
                    <button
                        onClick={() => onSave(form, log?.id)}
                        disabled={saving || !form.machine_id}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, background: form.machine_id ? 'linear-gradient(135deg, #1E4FD8, #B33B3D)' : 'var(--color-border)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: form.machine_id ? 'pointer' : 'not-allowed' }}>
                        <Save size={14} /> {saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

// Tab 1: MaintenanceLog
function MaintenanceLog() {
    const { toast } = useToast()
    const { isMobile } = useBreakpoint()
    const [machines, setMachines] = useState([])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(null) // null | 'new' | logObject
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadMachinesAndLogs()
    }, [])

    async function loadMachinesAndLogs() {
        setLoading(true)
        try {
            const { data: mData } = await supabase.from('machines').select('id, name').order('name')
            setMachines(mData || [])

            const { data: lData, error } = await supabase
                .from('trx_maintenance_log')
                .select(`*, machines(name), profiles:created_by(display_name)`)
                .order('maintenance_date', { ascending: false })
                .limit(50)

            if (error) throw error
            setLogs(lData || [])
        } catch (err) {
            console.error(err)
            // if relationship fails or table not exists, just ignore for now (schema might be missing)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data maintenance...</div>
    }

    async function handleSave(form, id) {
        if (!form.machine_id) return toast('Harap pilih mesin', 'error')
        setSaving(true)
        try {
            const payload = { ...form }
            if (id) {
                const { error } = await supabase.from('trx_maintenance_log').update(payload).eq('id', id)
                if (error) throw error
                toast('Log maintenance diperbarui', 'success')
            } else {
                const { error } = await supabase.from('trx_maintenance_log').insert(payload)
                if (error) throw error
                toast('Log maintenance berhasil ditambahkan', 'success')
            }
            setModal(null)
            loadMachinesAndLogs()
        } catch (err) {
            toast(err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(logId) {
        if (!window.confirm('Hapus log maintenance ini secara permanen?')) return
        try {
            const { error } = await supabase.from('trx_maintenance_log').delete().eq('id', logId)
            if (error) throw error
            toast('Berhasil dihapus', 'success')
            loadMachinesAndLogs()
        } catch (err) {
            toast(err.message, 'error')
        }
    }

    return (
        <div>
            {modal !== null && (
                <MaintenanceModal
                    log={modal === 'new' ? null : modal}
                    machines={machines}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                    saving={saving}
                />
            )}

            {/* Header & Button Tambah */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Riwayat Maintenance</h2>
                <button onClick={() => setModal('new')} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                    background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600
                }}>
                    <Plus size={16} /> Tambah Log
                </button>
            </div>

            {/* Table / List */}
            {logs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: 'var(--color-bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Belum ada riwayat maintenance.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {logs.map(log => (
                        <div key={log.id} style={{
                            padding: 16, background: 'var(--color-bg-card)', borderRadius: 'var(--radius)',
                            border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{log.machines?.name || 'Mesin Dihapus'}</div>
                                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                    {new Date(log.maintenance_date).toLocaleDateString('id-ID')} · {log.maintenance_type}
                                </div>
                                {log.description && <div style={{ fontSize: 13, marginTop: 4 }}>{log.description}</div>}
                                {log.cost > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginTop: 4 }}>Rp {log.cost.toLocaleString('id-ID')} · {log.performed_by || 'Internal'}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button onClick={() => setModal(log)} title="Edit" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                    <Edit2 size={13} />
                                </button>
                                <button onClick={() => handleDelete(log.id)} title="Hapus" style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: 'pointer' }}>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Tab 2: InkLog
function InkLog() {
    const { toast } = useToast()
    const { isMobile } = useBreakpoint()
    const [machines, setMachines] = useState([])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const { data: mData } = await supabase.from('machines').select('id, name').order('name')
            setMachines(mData || [])

            const { data: lData, error } = await supabase
                .from('trx_ink_log')
                .select(`*, machines(name), profiles:created_by(display_name)`)
                .order('replacement_date', { ascending: false })
                .limit(50)

            if (error) throw error
            setLogs(lData || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data log tinta...</div>
    }

    async function handleSave(form, id) {
        if (!form.machine_id) return toast('Harap pilih mesin', 'error')
        setSaving(true)
        try {
            const payload = { ...form }
            if (id) {
                const { error } = await supabase.from('trx_ink_log').update(payload).eq('id', id)
                if (error) throw error
                toast('Log tinta diperbarui', 'success')
            } else {
                const { error } = await supabase.from('trx_ink_log').insert(payload)
                if (error) throw error
                toast('Log tinta berhasil ditambahkan', 'success')
            }
            setModal(null)
            loadData()
        } catch (err) {
            toast(err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(logId) {
        if (!window.confirm('Hapus log tinta ini secara permanen?')) return
        try {
            const { error } = await supabase.from('trx_ink_log').delete().eq('id', logId)
            if (error) throw error
            toast('Berhasil dihapus', 'success')
            loadData()
        } catch (err) {
            toast(err.message, 'error')
        }
    }

    return (
        <div>
            {modal !== null && (
                <InkModal
                    log={modal === 'new' ? null : modal}
                    machines={machines}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                    saving={saving}
                />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Riwayat Penggantian Tinta</h2>
                <button onClick={() => setModal('new')} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                    background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600
                }}>
                    <Plus size={16} /> Tambah Log
                </button>
            </div>

            {logs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: 'var(--color-bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Belum ada riwayat penggantian tinta.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {logs.map(log => {
                        const { h, s, l } = {
                            'Cyan': { h: 180, s: 100, l: 45 }, 'Magenta': { h: 300, s: 100, l: 45 }, 'Yellow': { h: 60, s: 100, l: 45 },
                            'Black': { h: 0, s: 0, l: 20 }, 'Light Cyan': { h: 180, s: 60, l: 70 }, 'Light Magenta': { h: 300, s: 60, l: 70 },
                            'White': { h: 0, s: 0, l: 90 }, 'Varnish': { h: 45, s: 20, l: 85 }
                        }[log.ink_color] || { h: 0, s: 0, l: 50 }

                        return (
                            <div key={log.id} style={{
                                padding: '14px 16px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius)',
                                border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14
                            }}>
                                {/* Color Swatch */}
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                    background: `hsl(${h}, ${s}%, ${l}%)`,
                                    border: (log.ink_color === 'White' || log.ink_color === 'Varnish') ? '1px solid #ccc' : 'none',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }} />

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: `hsl(${h}, ${s}%, ${l < 50 ? l : l - 20}%)` }}>{log.ink_color}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, background: 'var(--color-bg-secondary)', padding: '2px 8px', borderRadius: 6 }}>Qty: {log.quantity}</div>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                        {new Date(log.replacement_date).toLocaleDateString('id-ID')} · {log.machines?.name || 'Mesin Dihapus'}
                                    </div>
                                    {(log.notes || log.replaced_by) && (
                                        <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-text-secondary)' }}>
                                            {log.notes && <span>{log.notes}</span>}
                                            {log.notes && log.replaced_by && <span> · </span>}
                                            {log.replaced_by && <span>Oleh: {log.replaced_by}</span>}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => setModal(log)} title="Edit" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                        <Edit2 size={13} />
                                    </button>
                                    <button onClick={() => handleDelete(log.id)} title="Hapus" style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default function MachineLogs() {
    const { isMobile } = useBreakpoint()
    const [activeTab, setActiveTab] = useState('maintenance') // 'maintenance' | 'ink'

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: '-0.04em' }}>Log Mesin & Perawatan</h1>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Catat dan pantau riwayat maintenance serta penggunaan tinta pada tiap mesin.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
                <button
                    onClick={() => setActiveTab('maintenance')}
                    style={{
                        padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                        color: activeTab === 'maintenance' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === 'maintenance' ? '3px solid var(--color-accent)' : '3px solid transparent',
                        transition: 'all 0.2s'
                    }}>
                    <PenTool size={16} /> Maintenance Log
                </button>
                <button
                    onClick={() => setActiveTab('ink')}
                    style={{
                        padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                        color: activeTab === 'ink' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === 'ink' ? '3px solid var(--color-accent)' : '3px solid transparent',
                        transition: 'all 0.2s'
                    }}>
                    <Droplet size={16} /> Ink Replacement Log
                </button>
            </div>

            {/* Content */}
            {activeTab === 'maintenance' && <MaintenanceLog />}
            {activeTab === 'ink' && <InkLog />}
        </div>
    )
}
