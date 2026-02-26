import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Zap, LogOut, Sun, Moon } from 'lucide-react'

export default function AppLayout() {
    const { isMobile } = useBreakpoint()
    const { profile, isAdmin, signOut, session } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const profileMenuRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfileMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const email = session?.user?.email ?? ''
    const initials = (profile?.display_name ?? 'U')
        .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const roleBadge = isAdmin
        ? { label: 'Admin', color: 'var(--color-accent)', dot: '#1E4FD8', bg: 'rgba(30,79,216,0.12)' }
        : { label: 'Operator', color: '#818cf8', dot: '#818cf8', bg: 'rgba(99,102,241,0.12)' }

    async function handleLogout() {
        await signOut()
        navigate('/login')
    }

    if (isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg-primary)' }}>
                {/* Mobile top header */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 50,
                    background: 'var(--color-bg-secondary)',
                    borderBottom: '1px solid var(--color-border)',
                    padding: 'env(safe-area-inset-top) 16px 0',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
                        {/* Brand */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Zap size={14} color="#fff" strokeWidth={2.5} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>Arsy Jaya</span>
                        </div>

                        {/* Right Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                                style={{
                                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', cursor: 'pointer',
                                    color: 'var(--color-text-secondary)', width: 34, height: 34,
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            {/* Avatar Trigger */}
                            <div style={{ position: 'relative' }} ref={profileMenuRef}>
                                <button
                                    onClick={() => setShowProfileMenu(v => !v)}
                                    style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #1E4FD8, #1e3a8a)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: 14, color: '#fff',
                                        border: 'none', cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(30,79,216,0.2)',
                                    }}
                                >
                                    {initials}
                                </button>

                                {/* Dropdown Menu */}
                                {showProfileMenu && (
                                    <div className="animate-fade-in" style={{
                                        position: 'absolute', top: '100%', right: 0, marginTop: 8,
                                        width: 220, background: 'var(--color-bg-card)',
                                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
                                        display: 'flex', flexDirection: 'column',
                                        transformOrigin: 'top right', transition: 'opacity 0.2s ease, transform 0.2s ease',
                                    }}>
                                        <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--color-border)' }}>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text-primary)' }}>
                                                {profile?.display_name ?? 'User'}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, marginBottom: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {email}
                                            </div>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                padding: '4px 10px', borderRadius: 99,
                                                background: roleBadge.bg, border: `1px solid ${roleBadge.dot}33`,
                                            }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleBadge.dot, boxShadow: `0 0 6px ${roleBadge.dot}` }} />
                                                <span style={{ fontSize: 11, fontWeight: 700, color: roleBadge.color, letterSpacing: '0.04em' }}>{roleBadge.label}</span>
                                            </div>
                                        </div>
                                        <div style={{ padding: 4 }}>
                                            <button onClick={handleLogout} style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '10px 14px', borderRadius: 'var(--radius)', border: 'none', background: 'transparent',
                                                color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                                textAlign: 'left', transition: 'background 0.15s ease'
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <LogOut size={16} /> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main style={{
                    flex: 1, overflowY: 'auto',
                    padding: '16px 16px',
                    paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
                }}>
                    <Outlet />
                </main>
                <BottomNav />
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg-primary)' }}>
            <Sidebar />
            <main style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingLeft: '32px' }}>
                <Outlet />
            </main>
        </div>
    )
}

