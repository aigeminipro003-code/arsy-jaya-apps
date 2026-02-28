import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import StockGauge from '../../components/ui/StockGauge'
import { Printer, Activity, Package, ChevronRight, Clock } from 'lucide-react'


// Convert hex color to a darker shade for gradient
function darken(hex, amount = 40) {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, (num >> 16) - amount)
    const g = Math.max(0, ((num >> 8) & 0xff) - amount)
    const b = Math.max(0, (num & 0xff) - amount)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
function getMachineStyle(color = '#1E4FD8') {
    const dark = darken(color, 50)
    return {
        color,
        gradient: `linear-gradient(135deg, ${color}, ${dark})`,
        glow: `${color}55`,
    }
}


function PageHeader({ title, subtitle }) {
    return (
        <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--color-text-primary)' }}>{title}</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{subtitle}</p>
        </div>
    )
}

function SectionCard({ children, title, icon: Icon, style = {} }) {
    return (
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, ...style }}>
            {title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    {Icon && <Icon size={15} color="var(--color-text-muted)" />}
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{title}</span>
                </div>
            )}
            {children}
        </div>
    )
}

const CATEGORY_LABELS = { order: 'Order', tes_warna: 'Tes Warna', maintenance: 'Maintenance', kerusakan: 'Kerusakan' }
const CATEGORY_COLORS = { order: '#1E4FD8', tes_warna: '#f59e0b', maintenance: '#6366f1', kerusakan: '#ef4444' }

export default function OperatorDashboard() {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const { isMobile } = useBreakpoint()
    const [machines, setMachines] = useState([])
    const [materials, setMaterials] = useState([])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [{ data: m }, { data: mat }, { data: l }] = await Promise.all([
                supabase.from('machines').select('*').eq('is_active', true).order('name'),
                supabase.from('materials').select('*').order('name'),
                supabase.from('production_logs')
                    .select('*, profiles(display_name), machines(name), materials(name)')
                    .order('created_at', { ascending: false })
                    .limit(20),
            ])
            setMachines(m || [])
            setMaterials(mat || [])
            setLogs(l || [])
            setLoading(false)
        }
        load()

        // Real-time subscriptions
        const ch = supabase.channel('dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'production_logs' }, load)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, load)
            .subscribe()
        return () => supabase.removeChannel(ch)
    }, [])

    const now = new Date()
    const hitHour = now.getHours()
    const greeting = hitHour < 10 ? 'Selamat Pagi' : hitHour < 15 ? 'Selamat Siang' : hitHour < 18 ? 'Selamat Sore' : 'Selamat Malam'

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }} className="animate-spin" />
        </div>
    )

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
                <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--color-text-primary)' }}>
                    {`${greeting}, ${profile?.display_name?.split(' ')[0] ?? 'Operator'}! 👋`}
                </h1>
                <p style={{ fontSize: isMobile ? 12 : 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Machine Cards */}
            <SectionCard title="Pilih Mesin" icon={Printer} style={{ marginBottom: isMobile ? 16 : 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {machines.map(machine => {
                        const style = getMachineStyle(machine.color || '#1E4FD8')
                        return (
                            <button key={machine.id} onClick={() => navigate('/production', { state: { machine } })}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
                                    padding: '20px', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
                                    background: style.gradient, border: 'none',
                                    boxShadow: `0 8px 32px ${style.glow}`,
                                    transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${style.glow}` }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 8px 32px ${style.glow}` }}
                            >
                                <Printer size={28} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.02em' }}>{machine.name}</div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{machine.description || 'Tap untuk log produksi'}</div>
                                </div>
                                <ChevronRight size={16} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }} />
                            </button>
                        )
                    })}
                </div>
            </SectionCard>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 20 }}>
                {/* Stock Watch */}
                <SectionCard title="Pantau Stok Bahan" icon={Package}>
                    {materials.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Belum ada data bahan</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {materials.map(m => <StockGauge key={m.id} material={m} />)}
                        </div>
                    )}
                </SectionCard>

                {/* Activity Feed */}
                <SectionCard title="Aktivitas Tim Terbaru" icon={Activity}>
                    {logs.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Belum ada aktivitas</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 420, overflowY: 'auto' }}>
                            {logs.map((log, i) => (
                                <div key={log.id} style={{
                                    display: 'flex', gap: 12, padding: '12px 0',
                                    borderBottom: i < logs.length - 1 ? '1px solid var(--color-border)' : 'none',
                                }}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[log.category] ?? '#22d3ee', marginTop: 6 }} />
                                        {i < logs.length - 1 && <div style={{ width: 1, background: 'var(--color-border)', position: 'absolute', left: 3.5, top: 16, bottom: -12 }} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {log.profiles?.display_name ?? 'Unknown'}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                                                {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                            {log.machines?.name} · {log.materials?.name}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: `${CATEGORY_COLORS[log.category]}22`, color: CATEGORY_COLORS[log.category] }}>
                                                {CATEGORY_LABELS[log.category] ?? log.category}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                Bruto: <strong style={{ color: 'var(--color-text-primary)' }}>{log.bahan_bruto}m</strong>
                                                {' '}· Netto: <strong style={{ color: 'var(--color-text-primary)' }}>{log.panjang_netto}m</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    )
}
