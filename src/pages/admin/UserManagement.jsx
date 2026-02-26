import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../components/ui/Toast'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { UserPlus, Trash2, Shield, User, Edit2, X, Save, KeyRound, Eye, EyeOff } from 'lucide-react'

// Call edge function with current session Bearer token
async function callUserFn(body) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Tidak ada sesi aktif')
    const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(body),
        }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
    return data
}

function EditModal({ user, onSave, onClose, saving }) {
    const [name, setName] = useState(user.display_name || '')
    const [role, setRole] = useState(user.role || 'operator')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)

    const inputS = { width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }

    return (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800 }}>Edit Akun</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Nama Lengkap</label>
                        <input style={inputS} value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Role</label>
                        <select style={{ ...inputS, cursor: 'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><KeyRound size={11} /> Ganti Password <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional, min. 6 karakter)</span></span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input type={showPass ? 'text' : 'password'} style={{ ...inputS, paddingRight: 38 }} value={password} onChange={e => setPassword(e.target.value)} placeholder="Kosongkan jika tidak ganti" />
                            <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                    <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Batal</button>
                    <button
                        onClick={() => onSave({ user_id: user.id, display_name: name, role, password: password || undefined })}
                        disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function UserManagement() {
    const { toast } = useToast()
    const { isMobile } = useBreakpoint()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editUser, setEditUser] = useState(null)
    const [form, setForm] = useState({ email: '', password: '', display_name: '', role: 'operator' })
    const [saving, setSaving] = useState(false)
    const [showPass, setShowPass] = useState(false)
    // Map userId -> email from auth (fetched separately)
    const [emailMap, setEmailMap] = useState({})

    async function load() {
        setLoading(true)
        const { data } = await supabase.from('profiles').select('*').order('display_name')
        setUsers(data || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function handleCreate(e) {
        e.preventDefault()
        if (!form.email || !form.password || !form.display_name) {
            toast('Semua field wajib diisi', 'error'); return
        }
        setSaving(true)
        try {
            await callUserFn({ action: 'create', ...form })
            toast(`✅ Akun "${form.display_name}" berhasil dibuat!`, 'success')
            setForm({ email: '', password: '', display_name: '', role: 'operator' })
            setShowForm(false)
            load()
        } catch (err) {
            toast(err.message, 'error')
        }
        setSaving(false)
    }

    async function handleUpdate(payload) {
        setSaving(true)
        try {
            await callUserFn({ action: 'update', ...payload })
            toast('✅ Akun berhasil diperbarui!', 'success')
            setEditUser(null)
            load()
        } catch (err) {
            toast(err.message, 'error')
        }
        setSaving(false)
    }

    async function handleDelete(user) {
        if (!window.confirm(`Hapus akun "${user.display_name}"? Akun tidak dapat dipulihkan.`)) return
        setSaving(true)
        try {
            await callUserFn({ action: 'delete', user_id: user.id })
            toast(`Akun "${user.display_name}" dihapus`, 'success')
            load()
        } catch (err) {
            toast(err.message, 'error')
        }
        setSaving(false)
    }

    const inputStyle = {
        width: '100%', padding: '10px 12px', borderRadius: 8,
        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
    }

    const badgeStyle = (role) => ({
        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99,
        background: role === 'admin' ? 'rgba(30,79,216,0.15)' : 'rgba(179,59,61,0.12)',
        border: `1px solid ${role === 'admin' ? 'rgba(30,79,216,0.4)' : 'rgba(179,59,61,0.35)'}`,
        flexShrink: 0,
    })

    return (
        <>
            {editUser && (
                <EditModal user={editUser} onSave={handleUpdate} onClose={() => setEditUser(null)} saving={saving} />
            )}

            <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? 12 : 0, marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: '-0.04em' }}>Manajemen User</h1>
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Kelola akun operator dan admin · Hanya akun yang dibuat di sini yang bisa login</p>
                    </div>
                    <button onClick={() => { setShowForm(v => !v); }} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)', border: 'none',
                        fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer',
                    }}>
                        <UserPlus size={15} /> {showForm ? 'Tutup Form' : 'Tambah User'}
                    </button>
                </div>

                {/* Create form */}
                {showForm && (
                    <div className="animate-fade-in" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Buat Akun Baru</h2>
                        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Nama Lengkap</label>
                                <input required style={inputStyle} value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="Contoh: Budi Santoso" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Email</label>
                                <input required type="email" style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="budi@arsyjaya.com" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input required minLength={6} type={showPass ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 38 }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 karakter" />
                                    <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Role</label>
                                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option value="operator">Operator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                    Batal
                                </button>
                                <button type="submit" disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    {saving ? 'Membuat...' : 'Buat Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div style={{ width: 28, height: 28, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }} className="animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)', fontSize: 14 }}>Belum ada akun</div>
                    ) : users.map(u => (
                        <div key={u.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                            padding: '14px 16px', flexWrap: isMobile ? 'wrap' : 'nowrap',
                        }}>
                            {/* Avatar */}
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${u.role === 'admin' ? '#1E4FD8, #B33B3D' : '#F97316, #c2410c'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                                {u.display_name?.[0]?.toUpperCase() ?? '?'}
                            </div>

                            {/* Name + info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{u.display_name}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>ID: {u.id.slice(0, 8)}…</div>
                            </div>

                            {/* Role badge */}
                            <div style={badgeStyle(u.role)}>
                                {u.role === 'admin' ? <Shield size={10} color="#1E4FD8" /> : <User size={10} color="#B33B3D" />}
                                <span style={{ fontSize: 11, fontWeight: 700, color: u.role === 'admin' ? '#1E4FD8' : '#B33B3D', textTransform: 'capitalize' }}>{u.role}</span>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button
                                    onClick={() => setEditUser(u)}
                                    title="Edit akun"
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                    <Edit2 size={13} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(u)}
                                    title="Hapus akun"
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: 'pointer' }}>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
