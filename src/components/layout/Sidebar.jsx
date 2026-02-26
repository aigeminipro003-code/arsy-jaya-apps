import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
    LayoutDashboard, Printer, Clock, Users, Package,
    FileEdit, Download, LogOut, Mail, Cpu, Sun, Moon
} from 'lucide-react'

const s = {
    sidebar: {
        width: 240, minWidth: 240,
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        padding: '0',
        overflow: 'hidden',
    },
    brand: {
        padding: '24px 16px 16px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 12,
    },
    brandIcon: {
        width: 40, height: 40, borderRadius: 10,
        background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    brandText: { lineHeight: 1.2 },
    brandName: { display: 'block', fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' },
    brandSub: { display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 },
    nav: { flex: 1, padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
    divider: { height: 1, background: 'var(--color-border)', margin: '8px' },
    sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-muted)', padding: '8px 8px 4px', textTransform: 'uppercase' },
    logoutBtn: {
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
        padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
    },
}

function NavItem({ to, icon: Icon, label, end = false }) {
    return (
        <NavLink to={to} end={end} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10,
            fontSize: 13.5, fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            background: isActive ? 'var(--color-accent-dim)' : 'transparent',
            border: isActive ? '1px solid rgba(30,79,216,0.25)' : '1px solid transparent',
            textDecoration: 'none', transition: 'all 0.15s',
        })}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--color-bg-card)' }}
            onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent' }}
        >
            <Icon size={16} strokeWidth={2} />
            {label}
        </NavLink>
    )
}

export default function Sidebar() {
    const { profile, isAdmin, signOut, session } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const email = session?.user?.email ?? ''

    const roleBadge = isAdmin
        ? { label: 'Administrator', bg: 'rgba(179,59,61,0.1)', color: '#B33B3D', dot: '#B33B3D' }
        : { label: 'Operator', bg: 'rgba(30,79,216,0.12)', color: '#1E4FD8', dot: '#1E4FD8' }

    const initials = (profile?.display_name ?? 'U')
        .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

    async function handleLogout() {
        await signOut()
        navigate('/login')
    }

    return (
        <aside style={s.sidebar}>
            {/* Brand */}
            <div style={s.brand}>
                <div style={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo_arsy.svg" alt="Arsy Jaya" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                </div>
                <div style={s.brandText}>
                    <span style={s.brandName}>Arsy Jaya</span>
                    <span style={s.brandSub}>Printing</span>
                </div>
            </div>

            {/* Nav */}
            <nav style={s.nav}>
                {!isAdmin && (
                    <>
                        <span style={s.sectionLabel}>Operator</span>
                        <NavItem to="/" end icon={LayoutDashboard} label="Dashboard" />
                        <NavItem to="/team-history" icon={Clock} label="Riwayat Tim" />
                        <NavItem to="/materials" icon={Package} label="Stok Bahan" />
                    </>
                )}

                {isAdmin && (
                    <>
                        <span style={s.sectionLabel}>Admin</span>
                        <NavItem to="/admin" end icon={LayoutDashboard} label="Dashboard" />
                        <NavItem to="/admin/materials" icon={Package} label="Manajemen Bahan" />
                        <NavItem to="/admin/machines" icon={Cpu} label="Manajemen Mesin" />
                        <NavItem to="/admin/users" icon={Users} label="Manajemen User" />
                        <NavItem to="/admin/history" icon={FileEdit} label="Edit Riwayat" />
                        <NavItem to="/admin/export" icon={Download} label="Export CSV" />
                    </>
                )}
            </nav>

            {/* Profile Card */}
            <div style={{
                margin: '0 8px 12px',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
            }}>
                {/* Top colored stripe */}
                <div style={{
                    height: 4,
                    background: 'linear-gradient(90deg, #1E4FD8, #B33B3D)',
                }} />

                <div style={{ padding: '12px 14px' }}>
                    {/* Avatar + actions row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 13, color: '#fff',
                            boxShadow: '0 2px 8px rgba(30,79,216,0.3)',
                        }}>
                            {initials}
                        </div>

                        <div style={{ display: 'flex', gap: 4 }}>
                            <button
                                style={s.logoutBtn}
                                onClick={toggleTheme}
                                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)', e.currentTarget.style.background = 'var(--color-accent-dim)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)', e.currentTarget.style.background = 'none')}
                            >
                                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                            </button>
                            <button
                                style={s.logoutBtn}
                                onClick={handleLogout}
                                title="Keluar"
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)', e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)', e.currentTarget.style.background = 'none')}
                            >
                                <LogOut size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Name */}
                    <div style={{
                        fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: 3, letterSpacing: '-0.01em',
                    }}>
                        {profile?.display_name ?? 'User'}
                    </div>

                    {/* Email */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        marginBottom: 10,
                    }}>
                        <Mail size={11} color="var(--color-text-muted)" strokeWidth={2} />
                        <span style={{
                            fontSize: 11, color: 'var(--color-text-muted)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {email || '—'}
                        </span>
                    </div>

                    {/* Role Badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 99,
                        background: roleBadge.bg,
                        border: `1px solid ${roleBadge.dot}33`,
                    }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: roleBadge.dot,
                            boxShadow: `0 0 6px ${roleBadge.dot}`,
                        }} />
                        <span style={{
                            fontSize: 11, fontWeight: 700, color: roleBadge.color,
                            letterSpacing: '0.04em',
                        }}>
                            {roleBadge.label}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    )
}

