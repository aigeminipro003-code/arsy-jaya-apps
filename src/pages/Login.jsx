import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
    const { signIn } = useAuth()
    const { isMobile } = useBreakpoint()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        const { error } = await signIn(email, password)
        if (error) {
            setError('Email atau password salah. Coba lagi.')
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-bg-primary)', padding: '20px',
            backgroundImage: 'radial-gradient(ellipse at 30% 0%, rgba(179,59,61,0.07) 0%, transparent 50%), radial-gradient(ellipse at 70% 0%, rgba(30,79,216,0.07) 0%, transparent 50%)',
        }}>
            <div className="animate-fade-in" style={{
                width: '100%', maxWidth: isMobile ? '100%' : 400,
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: isMobile ? 'var(--radius)' : 'var(--radius-lg)',
                padding: isMobile ? '32px 24px' : '40px 32px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <img
                        src="/logo_arsy.svg"
                        alt="Arsy Jaya"
                        style={{
                            width: 72, height: 72, margin: '0 auto 16px',
                            display: 'block', objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.25))',
                        }}
                    />
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>
                        Arsy Jaya Printing
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>
                        Production & Inventory Tracking
                    </p>
                </div>

                {/* Machine brand dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                    {['#3B82F6', '#F97316', '#A855F7'].map(c => (
                        <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.8 }} />
                    ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            Email
                        </label>
                        <input
                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="email@arsyjaya.com"
                            style={{
                                width: '100%', padding: '12px 14px', borderRadius: 10,
                                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)', fontSize: 14, outline: 'none',
                                transition: 'border-color 0.15s',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPass ? 'text' : 'password'} required value={password}
                                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                style={{
                                    width: '100%', padding: '12px 44px 12px 14px', borderRadius: 10,
                                    background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)', fontSize: 14, outline: 'none',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
                                    display: 'flex', alignItems: 'center', padding: 2
                                }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 8, color: 'var(--color-danger)', fontSize: 13
                        }}>
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{
                        padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                        border: 'none', marginTop: 8,
                        background: loading ? 'var(--color-border)' : 'linear-gradient(135deg, #1E4FD8, #B33B3D)',
                        color: '#fff', transition: 'all 0.2s', letterSpacing: '-0.01em',
                        boxShadow: loading ? 'none' : '0 4px 20px rgba(30,79,216,0.25)',
                    }}>
                        {loading ? 'Masuk...' : 'Masuk'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
                    {[
                        { label: 'Omajic UV', color: '#3B82F6' },
                        { label: 'Roland', color: '#F97316' },
                        { label: 'UV Flatbed', color: '#A855F7' },
                    ].map(m => (
                        <span key={m.label} style={{ fontSize: 11, color: m.color, fontWeight: 600, opacity: 0.7 }}>{m.label}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}
