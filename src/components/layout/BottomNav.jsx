import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, PlusCircle, Clock, Package, Users, FileText, Download } from 'lucide-react'

const operatorTabs = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/team-history', icon: Clock, label: 'Riwayat', exact: false },
    { to: '/materials', icon: Package, label: 'Bahan', exact: false },
]

const adminTabs = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/materials', icon: Package, label: 'Bahan', exact: false },
    { to: '/admin/users', icon: Users, label: 'User', exact: false },
    { to: '/admin/history', icon: FileText, label: 'Riwayat', exact: false },
    { to: '/admin/export', icon: Download, label: 'Export', exact: false },
]

export default function BottomNav() {
    const { isAdmin } = useAuth()
    const location = useLocation()
    const tabs = isAdmin ? adminTabs : operatorTabs

    return (
        <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
            background: 'var(--color-bg-card)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            paddingBottom: 'env(safe-area-inset-bottom)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
        }}>
            {tabs.map(({ to, icon: Icon, label, exact }) => {
                const active = exact
                    ? location.pathname === to
                    : location.pathname.startsWith(to)
                return (
                    <NavLink
                        key={to}
                        to={to}
                        end={exact}
                        style={{
                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', gap: 4, padding: '10px 4px 8px',
                            textDecoration: 'none', color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            transition: 'color 0.15s',
                            position: 'relative',
                        }}
                    >
                        {active && (
                            <span style={{
                                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                                width: 32, height: 3, borderRadius: '0 0 4px 4px',
                                background: 'var(--color-accent)',
                            }} />
                        )}
                        <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                        <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '0.02em' }}>
                            {label}
                        </span>
                    </NavLink>
                )
            })}
        </nav>
    )
}
