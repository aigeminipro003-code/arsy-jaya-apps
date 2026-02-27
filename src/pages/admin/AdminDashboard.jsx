import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, Package, AlertTriangle, AlertOctagon, ChevronRight, Banknote, Ruler, ShoppingCart, PackagePlus, SlidersHorizontal, TrendingUp, MonitorPlay, CheckCircle2, Settings, X, Save } from 'lucide-react'
import StockGauge from '../../components/ui/StockGauge'
import { useBreakpoint } from '../../hooks/useBreakpoint'

function GlassCard({ children, accentColor }) {
    return (
        <div style={{
            background: 'var(--color-bg-card)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${accentColor ? accentColor : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            display: 'flex', flexDirection: 'column', gap: 12,
            boxShadow: accentColor ? `0 8px 32px -8px ${accentColor}15` : '0 4px 20px -10px rgba(0,0,0,0.1)',
            position: 'relative', overflow: 'hidden'
        }}>
            {accentColor && (
                <div style={{
                    position: 'absolute', top: 0, right: 0, width: 120, height: 120,
                    background: `radial-gradient(circle at top right, ${accentColor}20, transparent 70%)`,
                    pointerEvents: 'none'
                }} />
            )}
            {children}
        </div>
    )
}

function StatCard({ icon: Icon, label, value, sub, color, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: 12,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
            onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none' } }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div>
            </div>
            <div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>{value}</div>
                {sub && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{sub}</div>}
            </div>
            {onClick && (
                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-accent)', fontSize: 12, fontWeight: 600 }}>
                    <span>Kelola</span>
                    <ChevronRight size={14} />
                </div>
            )}
        </div>
    )
}

function fmt(n) { return `Rp ${Math.round(n).toLocaleString('id-ID')}` }

export default function AdminDashboard() {
    const navigate = useNavigate()
    const { isMobile } = useBreakpoint()
    const [stats, setStats] = useState({ todayNet: 0, todayWaste: 0, yesterdayWaste: 0, efficiency: 0, lowStock: 0 })
    const [chartData, setChartData] = useState([])
    const [leaderboard, setLeaderboard] = useState([])
    const [lowStockMaterials, setLowStockMaterials] = useState([])
    const [finance, setFinance] = useState({ totalSpend: 0, totalMeter: 0, totalRollBeli: 0, byMaterial: [] })
    const [materials, setMaterials] = useState([])
    const [recentLogs, setRecentLogs] = useState([])
    const [adjustmentLogs, setAdjustmentLogs] = useState([])

    // Dynamic Settings State
    const [dailyTarget, setDailyTarget] = useState(500)
    const [waNumber, setWaNumber] = useState('6281234567890')
    const [waTemplate, setWaTemplate] = useState('Halo Admin, tolong stok ulang bahan ini:\n\n*{material_name}*\nKetebalan/Lebar: {width_cm} cm\n\nTerima kasih.')

    const [showSettings, setShowSettings] = useState(false)
    const [newTarget, setNewTarget] = useState('')
    const [newWaNumber, setNewWaNumber] = useState('')
    const [newWaTemplate, setNewWaTemplate] = useState('')

    useEffect(() => {
        async function load() {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const todayStr = today.toISOString().split('T')[0]

            const sevenDaysAgo = new Date(today)
            sevenDaysAgo.setDate(today.getDate() - 6)

            const [{ data: mat }, { data: logs }, { data: movements }, { data: adjustments }, { data: settings }] = await Promise.all([
                supabase.from('materials').select('*').order('total_stock_m'),
                supabase.from('production_logs')
                    .select('*, profiles(display_name), machines(name), materials(name)')
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .order('created_at', { ascending: false }),
                supabase.from('stock_movements')
                    .select('*, materials(name)')
                    .eq('movement_type', 'in'),
                supabase.from('stock_movements')
                    .select('id, quantity_m, notes, created_at, materials(name), profiles(display_name)')
                    .eq('movement_type', 'adjustment')
                    .order('created_at', { ascending: false })
                    .limit(20),
                supabase.from('app_settings').select('key, value').in('key', ['daily_target_m', 'wa_admin_number', 'wa_admin_template'])
            ])

            const matList = mat || []
            const logList = logs || []
            const mvList = movements || []
            const settingsData = settings || []
            settingsData.forEach(item => {
                if (item.key === 'daily_target_m') {
                    const parsed = parseInt(item.value, 10)
                    if (!isNaN(parsed) && parsed > 0) setDailyTarget(parsed)
                } else if (item.key === 'wa_admin_number') {
                    setWaNumber(item.value)
                } else if (item.key === 'wa_admin_template') {
                    setWaTemplate(item.value)
                }
            })

            // Compute financial totals
            const totalSpend = mvList.reduce((s, m) => s + (parseFloat(m.total_harga_beli) || 0), 0)
            const totalMeter = mvList.reduce((s, m) => s + (parseFloat(m.quantity_m) || 0), 0)
            const totalRollBeli = mvList.reduce((s, m) => s + (parseInt(m.rolls) || 0), 0)

            // Group by material
            const byMat = {}
            mvList.forEach(m => {
                const name = m.materials?.name ?? 'Unknown'
                if (!byMat[name]) byMat[name] = { name, totalSpend: 0, totalMeter: 0, totalRoll: 0 }
                byMat[name].totalSpend += parseFloat(m.total_harga_beli) || 0
                byMat[name].totalMeter += parseFloat(m.quantity_m) || 0
                byMat[name].totalRoll += parseInt(m.rolls) || 0
            })
            const byMaterial = Object.values(byMat).sort((a, b) => b.totalSpend - a.totalSpend)

            setMaterials(matList)
            // Aman memfilter log khusus hari ini
            const todayLogsFiltered = logList.filter(l => l && l.created_at && l.created_at.startsWith(todayStr))
            setRecentLogs(todayLogsFiltered)
            setAdjustmentLogs(adjustments || [])
            setFinance({ totalSpend, totalMeter, totalRollBeli, byMaterial })

            // Analyze production past 7 days
            const dailyStats = {}
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today)
                d.setDate(today.getDate() - i)
                const dStr = d.toISOString().split('T')[0]
                const labelDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                dailyStats[dStr] = { date: labelDate, Net: 0, Waste: 0 }
            }

            const operators = {} // for leaderboard

            let todayNet = 0, todayWaste = 0, todayBruto = 0, yesterdayWaste = 0

            const yesterdayStr = (() => { const d = new Date(today); d.setDate(today.getDate() - 1); return d.toISOString().split('T')[0] })()

            logList.forEach(l => {
                const createdDate = l?.created_at
                if (!createdDate) return

                const dayKey = createdDate.split('T')[0]
                const net = parseFloat(l.panjang_netto) || 0
                const w = parseFloat(l.waste) || 0
                const b = parseFloat(l.bahan_bruto) || 0

                if (dailyStats[dayKey]) {
                    dailyStats[dayKey].Net += net
                    dailyStats[dayKey].Waste += w
                }

                if (dayKey === todayStr) {
                    todayNet += net
                    todayWaste += w
                    todayBruto += b

                    // Scoreboard accumulation
                    const opName = l.profiles?.display_name || 'Unknown'
                    const hwId = l.machines?.name || 'Unknown Machine'
                    if (!operators[opName]) operators[opName] = { name: opName, machine: hwId, net: 0, waste: 0, bruto: 0 }
                    operators[opName].net += net
                    operators[opName].waste += w
                    operators[opName].bruto += b
                } else if (dayKey === yesterdayStr) {
                    yesterdayWaste += w
                }
            })

            const eff = todayBruto > 0 ? (todayNet / todayBruto) * 100 : 0

            // Format Leaderboard (aman dari division by zero)
            const board = Object.values(operators)
                .map(o => ({
                    ...o,
                    efficiency: o.bruto > 0 ? (o.net / o.bruto) * 100 : 0
                }))
                .filter(o => o.bruto > 0 && !isNaN(o.efficiency))
                .sort((a, b) => b.efficiency - a.efficiency) // Highest efficiency first

            setLeaderboard(board || [])
            setChartData(Object.values(dailyStats) || [])

            const lowMats = matList.filter(m => (m?.total_stock_m || 0) <= (m?.min_stock_m || 5)).sort((a, b) => (a?.total_stock_m || 0) - (b?.total_stock_m || 0)).slice(0, 5)
            setLowStockMaterials(lowMats || [])

            setStats({
                todayNet: todayNet || 0,
                todayWaste: todayWaste || 0,
                yesterdayWaste: yesterdayWaste || 0,
                efficiency: eff || 0,
                lowStock: lowMats.length,
            })
        }
        load()
    }, [])

    return (
        <>
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: '-0.04em' }}>Admin Dashboard</h1>
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setNewTarget(dailyTarget.toString())
                            setNewWaNumber(waNumber)
                            setNewWaTemplate(waTemplate)
                            setShowSettings(true)
                        }}
                        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <Settings size={16} /> {!isMobile && <span style={{ fontSize: 13, fontWeight: 600 }}>Pengaturan</span>}
                    </button>
                </div>

                {/* Smart Header Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    {/* Card 1: Efficiency */}
                    <GlassCard accentColor={stats.efficiency >= 95 ? '#22c55e' : (stats.efficiency >= 85 ? '#f59e0b' : '#ef4444')}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Efisiensi Produksi</div>
                                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
                                    {stats.efficiency.toFixed(1)}<span style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-muted)' }}>%</span>
                                </div>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={20} color={stats.efficiency >= 95 ? '#22c55e' : 'var(--color-text-secondary)'} />
                            </div>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                            Target Kompetitif: {'>'}95%
                        </div>
                    </GlassCard>

                    {/* Card 2: Waste Ratio */}
                    <GlassCard accentColor={stats.todayWaste > stats.yesterdayWaste ? '#ef4444' : '#22c55e'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total Waste</div>
                                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: stats.todayWaste > stats.yesterdayWaste ? '#ef4444' : 'var(--color-text-primary)' }}>
                                    {stats.todayWaste.toFixed(1)}<span style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-muted)' }}>m</span>
                                </div>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={20} color={stats.todayWaste > stats.yesterdayWaste ? '#ef4444' : 'var(--color-text-secondary)'} />
                            </div>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {stats.todayWaste > stats.yesterdayWaste ? (
                                <><TrendingUp size={14} color="#ef4444" /><span style={{ color: '#ef4444', fontWeight: 600 }}>Naik</span> vs {stats.yesterdayWaste.toFixed(1)}m kemarin</>
                            ) : (
                                <><TrendingDown size={14} color="#22c55e" /><span style={{ color: '#22c55e', fontWeight: 600 }}>Membaik</span> vs {stats.yesterdayWaste.toFixed(1)}m kemarin</>
                            )}
                        </div>
                    </GlassCard>

                    {/* Card 3: Output Today */}
                    <GlassCard accentColor="var(--color-accent)">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Output Netto (Hari Ini)</div>
                                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
                                    {stats.todayNet.toFixed(1)}<span style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text-muted)' }}>m</span>
                                </div>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MonitorPlay size={20} color="var(--color-accent)" />
                            </div>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            Cetak bersih tanpa retur/cacat
                        </div>
                    </GlassCard>
                </div>

                {/* Production Tools & Critical Watch Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Chart Section */}
                    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Tren Produksi (7 Hari)</div>
                        <div style={{ height: 300 }}>
                            <div style={{ height: 300, display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 24, paddingTop: 20 }}>
                                {chartData.length > 0 ? (
                                    chartData.map((d, i) => {
                                        // Hitung persentase skala berdasarkan angka tertinggi
                                        const maxVal = Math.max(...chartData.map(cd => Math.max(cd?.Net || 0, cd?.Waste || 0, 10)))
                                        const netPx = Math.max(4, ((d?.Net || 0) / maxVal) * 200)
                                        const wastePx = Math.max(4, ((d?.Waste || 0) / maxVal) * 200)

                                        return (
                                            <div key={d?.date || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                                {/* Bar wrapper */}
                                                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 200 }}>
                                                    {/* Netto Bar */}
                                                    <div title={`Netto: ${d?.Net || 0}m`} style={{ width: 14, height: netPx, background: 'var(--color-accent)', borderRadius: '4px 4px 0 0', opacity: 0.9 }} />
                                                    {/* Waste Bar */}
                                                    <div title={`Waste: ${d?.Waste || 0}m`} style={{ width: 14, height: wastePx, background: '#ef4444', borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                                                </div>
                                                {/* Axis Label */}
                                                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 12, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    {d?.date ? d.date.split(' ')[0] : ''} {/* Ambil tgl saja */}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>Belum ada data 7 hari terakhir</div>
                                )}
                            </div>
                            {/* Legend mini */}
                            {chartData.length > 0 && (
                                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: -10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-accent)' }}></span> Netto
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }}></span> Waste
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Material Critical Watch */}
                    <div style={{
                        background: 'var(--color-bg-card)',
                        border: `1px solid ${lowStockMaterials.length > 0 ? 'rgba(245,158,11,0.5)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Package size={18} color="#f59e0b" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bahan Kritis / Habis</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.lowStock} <span style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>bahan</span></span>
                        </div>

                        <div style={{ padding: '8px 0' }}>
                            {lowStockMaterials.length > 0 ? (
                                lowStockMaterials.map((m, i) => {
                                    // For critical watch, full bar is 15m
                                    const pct = Math.max(0, Math.min(100, (m.total_stock_m / 15) * 100))
                                    const isDanger = m.total_stock_m < 5
                                    return (
                                        <div key={m.id} style={{
                                            padding: '12px 24px',
                                            borderBottom: i < lowStockMaterials.length - 1 ? '1px solid var(--color-border)' : 'none',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <span style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</span>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: isDanger ? '#ef4444' : '#f59e0b' }}>
                                                    {parseFloat(m.total_stock_m).toFixed(1)}m
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: isDanger ? 'linear-gradient(90deg, #ef4444, #f97316)' : 'linear-gradient(90deg, #f59e0b, #84cc16)', transition: 'width 0.5s' }} />
                                                </div>
                                                <button
                                                    style={{
                                                        padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                                                        background: isDanger ? '#ef4444' : 'var(--color-bg-secondary)',
                                                        color: isDanger ? '#fff' : 'var(--color-text-primary)',
                                                        border: isDanger ? 'none' : '1px solid var(--color-border)',
                                                        cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4
                                                    }}
                                                    onClick={() => {
                                                        const cleanNumber = waNumber.replace(/\D/g, '') || "6281234567890" // default fallback if empty
                                                        const hydratedTemplate = waTemplate
                                                            .replace('{material_name}', m.name)
                                                            .replace('{width_cm}', String(m.width_cm || '-'))

                                                        const text = encodeURIComponent(hydratedTemplate)
                                                        window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank')
                                                    }}
                                                >
                                                    Pesan Via WA
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div style={{ padding: '32px 24px', textAlign: 'center', fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
                                    ✓ Stok semua bahan dalam batas aman.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financial Stats */}
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Investasi Bahan (All-Time)</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    <StatCard
                        label="Total Pengeluaran Bahan"
                        value={finance.totalSpend > 0 ? fmt(finance.totalSpend) : '—'}
                        sub={finance.totalSpend > 0 ? `dari ${finance.byMaterial.length} jenis bahan` : 'Belum ada data harga'}
                        icon={Banknote}
                        color="#22c55e"
                        onClick={() => navigate('/admin/materials')}
                    />
                    <StatCard
                        label="Total Meter Dibeli"
                        value={finance.totalMeter > 0 ? `${finance.totalMeter.toFixed(0)}m` : '—'}
                        sub={finance.totalMeter > 0 && finance.totalSpend > 0 ? `≈ ${fmt(finance.totalSpend / finance.totalMeter)}/m rata-rata` : undefined}
                        icon={Ruler}
                        color="#6366f1"
                    />
                    <StatCard
                        label="Total Roll Dibeli"
                        value={finance.totalRollBeli > 0 ? `${finance.totalRollBeli} roll` : '—'}
                        icon={ShoppingCart}
                        color="#f59e0b"
                    />
                </div>

                {/* Per-material breakdown */}
                {
                    finance.byMaterial.length > 0 && (
                        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: 20, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Rincian Per Bahan</span>
                                <button onClick={() => navigate('/admin/materials')} style={{ fontSize: 12, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Kelola →</button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                            {['Bahan', 'Total Roll', 'Total Meter', 'Total Dibeli'].map(h => (
                                                <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Bahan' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {finance.byMaterial.map((row, i) => (
                                            <tr key={row.name} style={{ borderTop: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.name}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{row.totalRoll} roll</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{row.totalMeter.toFixed(1)} m</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: row.totalSpend > 0 ? '#22c55e' : 'var(--color-text-muted)' }}>
                                                    {row.totalSpend > 0 ? fmt(row.totalSpend) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 12 }}>Total</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{finance.totalRollBeli} roll</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{finance.totalMeter.toFixed(1)} m</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#22c55e', fontSize: 14 }}>
                                                {finance.totalSpend > 0 ? fmt(finance.totalSpend) : '—'}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )
                }

                {/* ── Log Adjustment (Koreksi Stok) ── */}
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 10, marginTop: 8 }}>Log Koreksi Stok (Adjustment)</div>
                <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <SlidersHorizontal size={15} color="#f59e0b" />
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Riwayat Koreksi Manual Stok</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>20 terbaru</span>
                    </div>
                    {adjustmentLogs.length === 0 ? (
                        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>✓ Belum ada koreksi stok</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                        {['Waktu', 'Admin/Operator', 'Bahan', 'Δ Stok (m)', 'Catatan'].map(h => (
                                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {adjustmentLogs.map((adj, i) => {
                                        const delta = parseFloat(adj.quantity_m) || 0
                                        const isPos = delta > 0
                                        return (
                                            <tr key={adj.id} style={{ borderTop: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                                <td style={{ padding: '11px 16px', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                    {new Date(adj.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>{adj.profiles?.display_name ?? '—'}</td>
                                                <td style={{ padding: '11px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>{adj.materials?.name ?? '—'}</td>
                                                <td style={{ padding: '11px 16px', fontWeight: 700, color: isPos ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>
                                                    {isPos ? '+' : ''}{delta.toFixed(2)}m
                                                </td>
                                                <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adj.notes ?? '—'}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
                    {/* Stock overview */}
                    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Stok Bahan</span>
                            <button onClick={() => navigate('/admin/materials')} style={{ fontSize: 12, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Kelola →</button>
                        </div>
                        {materials.length === 0
                            ? <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Belum ada bahan</p>
                            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{materials.map(m => <StockGauge key={m.id} material={m} />)}</div>
                        }
                    </div>

                    {/* Team Leaderboard */}
                    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Operator Terbaik Hari Ini</span>
                        </div>
                        {leaderboard.length === 0
                            ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>Belum ada data produksi hari ini</div>
                            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                                {leaderboard.map((op, i) => (
                                    <div key={op.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: i === 0 ? 'rgba(34,197,94,0.05)' : 'var(--color-bg-secondary)', border: i === 0 ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent', borderRadius: 12 }}>
                                        {/* Rank badge */}
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#22c55e' : 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: i === 0 ? '#fff' : 'var(--color-text-secondary)', flexShrink: 0 }}>
                                            #{i + 1}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? '#22c55e' : 'var(--color-text-primary)' }}>{op.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <MonitorPlay size={12} /> {op.machine}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: op.efficiency >= 95 ? '#22c55e' : 'var(--color-text-primary)' }}>
                                                {op.efficiency.toFixed(1)}%
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Efisiensi</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                </div>
            </div >

            {/* Modal Settings */}
            {showSettings && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div className="animate-fade-in" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)' }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Pengaturan Global</div>
                            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: 20 }}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Target Produksi Harian (Netto)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input
                                        type="number"
                                        value={newTarget}
                                        onChange={e => setNewTarget(e.target.value)}
                                        style={{ flex: 1, maxWidth: 200, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: 14 }}
                                    />
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>meter</span>
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>Target ini akan dijadikan baseline 100% pada Progress Bar di Halaman Riwayat Tim (Operator).</p>
                            </div>

                            <div style={{ padding: '20px 0', borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--color-text-primary)' }}>Pesan WA Pengingat Stok</div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Nomor WhatsApp Admin / Tujuan</label>
                                <input
                                    type="text"
                                    value={newWaNumber}
                                    onChange={e => setNewWaNumber(e.target.value)}
                                    placeholder="Contoh: 6281234567890"
                                    style={{ width: '100%', marginBottom: 12, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: 13 }}
                                />

                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Template Pesan Isi</label>
                                <textarea
                                    value={newWaTemplate}
                                    onChange={e => setNewWaTemplate(e.target.value)}
                                    rows={4}
                                    placeholder="Gunakan {material_name} dan {width_cm} sebagai format pengganti dinamis."
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                                />
                                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>Gunakan tag: <b>{`{material_name}`}</b> dan <b>{`{width_cm}`}</b> agar nama bahan diganti otomatis.</p>
                            </div>
                        </div>
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setShowSettings(false)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>Batal</button>
                            <button
                                onClick={async () => {
                                    const val = parseInt(newTarget, 10)
                                    if (isNaN(val) || val <= 0) return alert('Target tidak valid')

                                    const updates = [
                                        { key: 'daily_target_m', value: val.toString() },
                                        { key: 'wa_admin_number', value: newWaNumber.replace(/\D/g, '') },
                                        { key: 'wa_admin_template', value: newWaTemplate }
                                    ]

                                    const { error } = await supabase.from('app_settings').upsert(updates)
                                    if (error) alert('Gagal menyimpan pengaturan: ' + error.message)
                                    else {
                                        setDailyTarget(val)
                                        setWaNumber(newWaNumber.replace(/\D/g, ''))
                                        setWaTemplate(newWaTemplate)
                                        setShowSettings(false)
                                    }
                                }}
                                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--color-accent)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <Save size={14} /> Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

