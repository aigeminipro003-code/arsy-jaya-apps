// Stock fuel gauge component - shows material stock as a visual bar
// Turns red if stock < min_stock_m
export default function StockGauge({ material }) {
    const { name, width_cm, total_stock_m, min_stock_m } = material
    const max = Math.max(total_stock_m * 1.5, min_stock_m * 3, 50)
    const pct = Math.max(0, Math.min(100, (total_stock_m / max) * 100))
    const isLow = total_stock_m <= min_stock_m
    const isCritical = total_stock_m <= (min_stock_m * 0.5) || total_stock_m === 0

    const barColor = isCritical
        ? 'var(--color-danger)'
        : isLow
            ? 'var(--color-warning)'
            : 'var(--color-accent)'

    return (
        <div style={{
            background: 'var(--color-bg-card)', border: `1px solid ${isCritical ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius)', padding: '14px 16px',
            animation: isCritical ? 'pulse-glow 2s infinite' : 'none',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{name}</span>
                    {width_cm > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>{width_cm}cm</span>
                    )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>
                    {Number(total_stock_m).toFixed(1)} m
                </span>
            </div>

            {/* Progress bar track */}
            <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 99,
                    background: barColor,
                    transition: 'width 0.5s ease, background 0.3s',
                    boxShadow: `0 0 6px ${barColor}66`,
                }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    {isCritical ? '🔴 KRITIS' : isLow ? '⚠️ Rendah' : '✓ Aman'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    Min: {min_stock_m} m
                </span>
            </div>
        </div>
    )
}
