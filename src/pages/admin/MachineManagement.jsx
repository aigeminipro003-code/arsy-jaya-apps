import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../components/ui/Toast'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Plus, Edit2, Trash2, X, Save, Printer, CheckCircle, XCircle } from 'lucide-react'

function MachineModal({ machine, onSave, onClose, saving }) {
    const PRESET_COLORS = [
        '#3B82F6', '#1E4FD8', '#6366F1', '#8B5CF6', '#A855F7',
        '#EC4899', '#EF4444', '#F97316', '#F59E0B', '#22C55E',
        '#14B8A6', '#0EA5E9',
    ]
    const [form, setForm] = useState({
        name: machine?.name ?? '',
        description: machine?.description ?? '',
        is_active: machine?.is_active ?? true,
        color: machine?.color ?? '#3B82F6',
    })
    const isEdit = !!machine?.id
    const inputS = {
        width: '100%', padding: '10px 12px', borderRadius: 8,
        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box'
    }
    return (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 420,
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800 }}>{isEdit ? 'Edit Mesin' : 'Tambah Mesin Baru'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Nama Mesin *</label>
                        <input style={inputS} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Mesin Roland 1" required />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Deskripsi / Keterangan</label>
                        <input style={inputS} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contoh: Printer flatbed A2 (opsional)" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Warna Mesin</label>
                        {/* Preview card */}
                        <div style={{ height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${form.color}, ${form.color}aa)`, display: 'flex', alignItems: 'center', paddingLeft: 14, marginBottom: 10, boxShadow: `0 4px 16px ${form.color}44` }}>
                            <Printer size={16} color="rgba(255,255,255,0.9)" />
                            <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 13, color: '#fff' }}>{form.name || 'Nama Mesin'}</span>
                        </div>
                        {/* Preset swatches */}
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
                            {PRESET_COLORS.map(c => (
                                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{
                                    width: 28, height: 28, borderRadius: 7, background: c, border: form.color === c ? '3px solid #fff' : '2px solid transparent',
                                    cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 1, transition: 'all 0.15s',
                                }} />
                            ))}
                            {/* Custom color picker */}
                            <label title="Pilih warna kustom" style={{ width: 28, height: 28, borderRadius: 7, border: '2px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                                <span style={{ fontSize: 16 }}>🎨</span>
                                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                            </label>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Hex: <code style={{ fontFamily: 'monospace' }}>{form.color}</code></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                style={{ width: 16, height: 16, cursor: 'pointer' }} />
                            Mesin aktif / bisa dipilih saat log produksi
                        </label>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                    <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Batal</button>
                    <button
                        onClick={() => onSave(form, machine?.id)}
                        disabled={saving || !form.name.trim()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, background: form.name.trim() ? 'linear-gradient(135deg, #1E4FD8, #B33B3D)' : 'var(--color-border)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: form.name.trim() ? 'pointer' : 'not-allowed' }}>
                        <Save size={14} /> {saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah Mesin'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function MachineManagement() {
    const { toast } = useToast()
    const { isMobile } = useBreakpoint()
    const [machines, setMachines] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(null) // null | 'new' | { id, name, ... }
    const [saving, setSaving] = useState(false)

    async function load() {
        setLoading(true)
        const { data } = await supabase.from('machines').select('*').order('name')
        setMachines(data || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function handleSave(form, id) {
        if (!form.name.trim()) { toast('Nama mesin wajib diisi', 'error'); return }
        setSaving(true)
        if (id) {
            const { error } = await supabase.from('machines').update({
                name: form.name.trim(),
                description: form.description?.trim() || null,
                is_active: form.is_active,
                color: form.color,
            }).eq('id', id)
            if (error) toast(error.message, 'error')
            else { toast('✅ Mesin berhasil diperbarui', 'success'); setModal(null); load() }
        } else {
            const { error } = await supabase.from('machines').insert({
                name: form.name.trim(),
                description: form.description?.trim() || null,
                is_active: form.is_active,
                color: form.color,
            })
            if (error) toast(error.message, 'error')
            else { toast(`✅ Mesin "${form.name}" berhasil ditambahkan!`, 'success'); setModal(null); load() }
        }
        setSaving(false)
    }

    async function handleDelete(machine) {
        if (!window.confirm(`Hapus mesin "${machine.name}"?\nData log produksi yang menggunakan mesin ini tidak akan terhapus.`)) return
        const { error } = await supabase.from('machines').delete().eq('id', machine.id)
        if (error) toast(error.message, 'error')
        else { toast(`Mesin "${machine.name}" dihapus`, 'success'); load() }
    }

    async function toggleActive(machine) {
        const { error } = await supabase.from('machines').update({ is_active: !machine.is_active }).eq('id', machine.id)
        if (!error) load()
    }

    const activeCount = machines.filter(m => m.is_active).length
    const inactiveCount = machines.length - activeCount

    return (
        <>
            {modal !== null && (
                <MachineModal
                    machine={modal === 'new' ? null : modal}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                    saving={saving}
                />
            )}

            <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? 12 : 0, marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: '-0.04em' }}>Manajemen Mesin</h1>
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                            {activeCount} mesin aktif{inactiveCount > 0 ? ` · ${inactiveCount} nonaktif` : ''} · Mesin aktif muncul di form log produksi
                        </p>
                    </div>
                    <button onClick={() => setModal('new')} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)', border: 'none',
                        fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer',
                    }}>
                        <Plus size={15} /> Tambah Mesin
                    </button>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, auto)', gap: 12, marginBottom: 24 }}>
                    {[
                        ['Total Mesin', machines.length, 'var(--color-accent)'],
                        ['Aktif', activeCount, '#22c55e'],
                        ['Nonaktif', inactiveCount, '#f59e0b'],
                    ].map(([lbl, val, color]) => (
                        <div key={lbl} style={{ background: 'var(--color-bg-card)', border: `1px solid ${color}30`, borderRadius: 'var(--radius)', padding: '16px 20px', minWidth: 120 }}>
                            <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.04em' }}>{val}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{lbl}</div>
                        </div>
                    ))}
                </div>

                {/* Machines list */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <div style={{ width: 28, height: 28, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }} className="animate-spin" />
                    </div>
                ) : machines.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
                        <Printer size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Belum ada mesin</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>Klik "Tambah Mesin" untuk menambahkan mesin pertama</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {machines.map(m => (
                            <div key={m.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap',
                                background: 'var(--color-bg-card)', border: `1px solid ${m.is_active ? 'var(--color-border)' : 'rgba(239,68,68,0.2)'}`,
                                borderRadius: 'var(--radius)', padding: '14px 16px',
                                opacity: m.is_active ? 1 : 0.7,
                            }}>
                                {/* Color strip + icon */}
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${m.color || '#1E4FD8'}, ${m.color || '#1E4FD8'}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${m.color || '#1E4FD8'}44`, opacity: m.is_active ? 1 : 0.5 }}>
                                    <Printer size={18} color="rgba(255,255,255,0.95)" />
                                </div>
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                                    {m.description && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>{m.description}</div>}
                                </div>
                                {/* Status badge */}
                                <button onClick={() => toggleActive(m)} title="Toggle status aktif" style={{
                                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
                                    background: m.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
                                    border: `1px solid ${m.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`,
                                }}>
                                    {m.is_active ? <CheckCircle size={12} color="#22c55e" /> : <XCircle size={12} color="#ef4444" />}
                                    <span style={{ fontSize: 11, fontWeight: 700, color: m.is_active ? '#22c55e' : '#ef4444' }}>
                                        {m.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </button>
                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => setModal(m)} title="Edit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                        <Edit2 size={13} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(m)} title="Hapus" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
