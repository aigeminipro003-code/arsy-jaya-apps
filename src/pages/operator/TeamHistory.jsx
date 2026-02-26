import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Clock, Filter, FileEdit, PackagePlus, User, RefreshCw, Activity, Target } from 'lucide-react'

const CATEGORY_LABELS = { order: 'Order', tes_warna: 'Tes Warna', maintenance: 'Maintenance', kerusakan: 'Kerusakan' }
const CATEGORY_COLORS = { order: '#1E4FD8', tes_warna: '#f59e0b', maintenance: '#6366f1', kerusakan: '#ef4444' }

function timeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays === 1) return 'Kemarin'
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function TeamHistory() {
    const { isMobile } = useBreakpoint()
    const [activeTab, setActiveTab] = useState('produksi')
    const [logs, setLogs] = useState([])
    const [stockLogs, setStockLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [stockLoading, setStockLoading] = useState(true)
    const [filter, setFilter] = useState('')

    // Production Progress
    const [todayProgress, setTodayProgress] = useState(0)
    const [todayTarget, setTodayTarget] = useState(500) // Default target 500m
    const [refreshing, setRefreshing] = useState(false)

    async function loadProgress() {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Load dinamic target from app_settings
        const { data: targetData } = await supabase.from('app_settings').select('value').eq('key', 'daily_target_m').single()
        if (targetData && targetData.value) {
            const parsed = parseInt(targetData.value, 10)
            if (!isNaN(parsed) && parsed > 0) setTodayTarget(parsed)
        }

        const { data } = await supabase
            .from('production_logs')
            .select('panjang_netto')
            .gte('created_at', today.toISOString())

        if (data) {
            const sum = data.reduce((acc, row) => acc + (parseFloat(row.panjang_netto) || 0), 0)
            setTodayProgress(sum)
        }
    }

    async function loadData() {
        setRefreshing(true)
        setLoading(true)

        // 1. Load History Logs
        let q = supabase.from('production_logs')
            .select('*, profiles(display_name), machines(name), materials(name, width_cm)')
            .order('created_at', { ascending: false })
            .limit(100)
        if (filter) q = q.eq('category', filter)
        const { data } = await q
        setLogs(data || [])
        setLoading(false)

        // 2. Load Progress
        await loadProgress()

        setRefreshing(false)
    }

    useEffect(() => { loadData() }, [filter])

    useEffect(() => {
        async function loadStock() {
            setStockLoading(true)
            const { data } = await supabase
                .from('stock_movements')
                .select('id, quantity_m, rolls, panjang_per_roll, harga_per_satuan, satuan_harga, total_harga_beli, created_at, materials(name, width_cm), profiles(display_name)')
                .eq('movement_type', 'in')
                .order('created_at', { ascending: false })
                .limit(100)
            setStockLogs(data || [])
            setStockLoading(false)
        }
        loadStock()
    }, [])

    const tabStyle = (active) => ({
        padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        background: active ? 'var(--color-accent)' : 'var(--color-bg-card)',
        color: active ? '#fff' : 'var(--color-text-secondary)',
        border: active ? '1px solid transparent' : '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
    })

    const percentage = Math.min(100, Math.round((todayProgress / todayTarget) * 100)) || 0
    let progressColor = '#f59e0b' // orange (default mid)
    if (percentage < 50) progressColor = '#3b82f6' // blue
    if (percentage >= 80) progressColor = '#22c55e' // green
    const isCompleted = percentage >= 100

    return (
        <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: '-0.04em' }}>Riwayat Tim</h1>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Aktivitas produksi dan stok masuk terbaru</p>
                </div>
                <button
                    onClick={loadData}
                    disabled={refreshing}
                    style={{
                        padding: '8px 12px', borderRadius: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)', fontSize: 12, fontWeight: 600, cursor: refreshing ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, opacity: refreshing ? 0.7 : 1, transition: 'all 0.2s',
                    }}
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    {!isMobile && 'Refresh'}
                </button>
            </div>

            {/* ── TARGET PRODUKSI HARI INI ── */}
            <div style={{
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                padding: '16px 20px', marginBottom: 24, position: 'relative', overflow: 'hidden',
                boxShadow: isCompleted ? `0 0 16px ${progressColor}22` : 'none',
                transition: 'all 0.3s ease',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${progressColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target size={14} color={progressColor} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Produksi Hari Ini</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 2, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                {todayProgress.toLocaleString('id-ID')}
                                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>/ {todayTarget.toLocaleString('id-ID')} m</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: progressColor }}>
                        {percentage}%
                    </div>
                </div>

                <div style={{ height: 8, background: 'var(--color-bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: progressColor,
                        borderRadius: 99,
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isCompleted ? `0 0 10px ${progressColor}88` : 'none',
                    }} />
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button style={tabStyle(activeTab === 'produksi')} onClick={() => setActiveTab('produksi')}>
                    <Clock size={13} /> Log Produksi
                </button>
                <button style={tabStyle(activeTab === 'stok')} onClick={() => setActiveTab('stok')}>
                    <PackagePlus size={13} /> Stok Masuk
                </button>
            </div>

            {/* ── TAB: LOG PRODUKSI ── */}
            {activeTab === 'produksi' && (
                <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                        {[['', 'Semua'], ['order', 'Order'], ['tes_warna', 'Tes Warna'], ['maintenance', 'Maintenance'], ['kerusakan', 'Kerusakan']].map(([val, lbl]) => (
                            <button key={val} onClick={() => setFilter(val)} style={{
                                padding: isMobile ? '8px 14px' : '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                background: filter === val ? 'var(--color-accent)' : 'var(--color-bg-card)',
                                color: filter === val ? '#fff' : 'var(--color-text-secondary)',
                                border: filter === val ? '1px solid transparent' : '1px solid var(--color-border)',
                                transition: 'all 0.15s',
                            }}>{lbl}</button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <div style={{ width: 30, height: 30, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }} className="animate-spin" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
                            <Clock size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                            <p>Belum ada riwayat produksi</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {logs.map(log => {
                                const cat = log.category
                                const color = CATEGORY_COLORS[cat] ?? '#1E4FD8'
                                return (
                                    <div key={log.id} style={{
                                        display: 'flex', gap: 14, alignItems: 'flex-start',
                                        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                                        padding: '16px', position: 'relative'
                                    }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                            background: `${color}15`, color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Activity size={20} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text-primary)' }}>{log.machines?.name}</span>
                                                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>oleh</span>
                                                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{log.profiles?.display_name}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 10 }}>
                                                    {timeAgo(log.created_at)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${color}18`, color }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                                                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{log.materials?.name} {log.materials?.width_cm ? `(${log.materials.width_cm}cm)` : ''}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                                                <div>Bruto <strong style={{ color: 'var(--color-text-primary)' }}>{log.bahan_bruto}m</strong></div>
                                                <div>Netto <strong style={{ color: 'var(--color-text-primary)' }}>{log.panjang_netto}m</strong></div>
                                                <div>Waste <strong style={{ color: 'var(--color-danger)' }}>{log.waste}m</strong></div>
                                            </div>
                                            {log.notes && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, padding: '6px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>📝 {log.notes}</div>}
                                            {log.edit_reason && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8,
                                                    padding: '6px 10px', borderRadius: 6,
                                                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)',
                                                }}>
                                                    <FileEdit size={12} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                                                    <div style={{ fontSize: 11 }}>
                                                        <span style={{ fontWeight: 700, color: '#6366f1' }}>KOREKSI ADMIN: </span>
                                                        <span style={{ color: 'var(--color-text-secondary)' }}>{log.edit_reason}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ── TAB: STOK MASUK ── */}
            {activeTab === 'stok' && (
                stockLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                        <div style={{ width: 30, height: 30, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }} className="animate-spin" />
                    </div>
                ) : stockLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
                        <PackagePlus size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <p>Belum ada riwayat stok masuk</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {stockLogs.map(log => {
                            const nama = log.profiles?.display_name || log.profiles?.email?.split('@')[0] || '—'
                            const hargaLabel = log.harga_per_satuan > 0 ? `Rp${Number(log.harga_per_satuan).toLocaleString('id-ID')}/${log.satuan_harga === 'per_roll' ? 'roll' : 'm'}` : null
                            const totalLabel = log.total_harga_beli > 0 ? `Rp${Number(log.total_harga_beli).toLocaleString('id-ID')}` : null
                            return (
                                <div key={log.id} style={{
                                    display: 'flex', gap: 14, alignItems: 'flex-start',
                                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                                    padding: '16px', position: 'relative'
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                        background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <PackagePlus size={20} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text-primary)' }}>{log.materials?.name} {log.materials?.width_cm ? `(${log.materials.width_cm}cm)` : ''}</span>
                                                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>oleh</span>
                                                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{nama}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: 10 }}>
                                                {timeAgo(log.created_at)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontWeight: 700 }}>
                                                Stok Masuk
                                            </span>
                                            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{log.rolls} roll × {log.panjang_per_roll}m</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                                            <div>Total <strong style={{ color: '#22c55e' }}>+{Number(log.quantity_m).toLocaleString('id-ID')} m</strong></div>
                                        </div>
                                        {(hargaLabel || totalLabel) && (
                                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, padding: '6px 10px', background: 'var(--color-bg-secondary)', borderRadius: 6 }}>
                                                💰 {hargaLabel}{totalLabel ? ` · Total: ${totalLabel}` : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            )}
        </div>
    )
}

