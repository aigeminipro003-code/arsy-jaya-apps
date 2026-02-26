// Large numeric keypad for touch-friendly input with m/cm unit toggle
export default function NumericKeypad({ value, onChange, label, unit = 'm', onUnitChange }) {
    const display = value === '' ? '0' : value

    function press(key) {
        if (key === 'C') { onChange(''); return }
        if (key === '⌫') {
            onChange(value.slice(0, -1)); return
        }
        if (key === '.' && value.includes('.')) return
        const next = value + key
        // Prevent leading zeros (except "0.")
        if (next.length > 1 && next[0] === '0' && next[1] !== '.') {
            onChange(next.slice(1)); return
        }
        onChange(next)
    }

    const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '⌫']

    return (
        <div>
            {label && (
                <div style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--color-text-muted)', marginBottom: 8
                }}>
                    {label}
                </div>
            )}

            {/* Unit toggle */}
            {onUnitChange && (
                <div style={{
                    display: 'flex', gap: 8, marginBottom: 8,
                    background: 'var(--color-bg-secondary)', padding: 4, borderRadius: 10,
                }}>
                    {['m', 'cm'].map(u => (
                        <button key={u} onClick={() => { onUnitChange(u); onChange('') }}
                            style={{
                                flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: 14, letterSpacing: '0.02em',
                                background: unit === u ? 'var(--color-accent)' : 'transparent',
                                color: unit === u ? '#000' : 'var(--color-text-muted)',
                                transition: 'all 0.15s',
                            }}
                        >
                            {u}
                        </button>
                    ))}
                </div>
            )}

            {/* Display */}
            <div style={{
                background: 'var(--color-bg-primary)', borderRadius: 12,
                border: '1px solid var(--color-border-bright)', padding: '16px 20px',
                marginBottom: 12, textAlign: 'right', minHeight: 62,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
            }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                    {display}
                </span>
                <span style={{ fontSize: 16, color: 'var(--color-accent)', fontWeight: 700 }}>{unit}</span>
            </div>

            {/* Keys */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {keys.map(k => {
                    const isSpecial = k === 'C' || k === '⌫'
                    return (
                        <button key={k} onClick={() => press(k)} style={{
                            padding: '16px', borderRadius: 12, border: '1px solid var(--color-border)', cursor: 'pointer',
                            fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em',
                            background: isSpecial ? 'rgba(239,68,68,0.12)' : 'var(--color-bg-card)',
                            color: isSpecial ? 'var(--color-danger)' : 'var(--color-text-primary)',
                            transition: 'all 0.1s', userSelect: 'none',
                        }}
                            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.93)'; e.currentTarget.style.background = isSpecial ? 'rgba(239,68,68,0.25)' : 'var(--color-bg-card-hover)' }}
                            onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = isSpecial ? 'rgba(239,68,68,0.12)' : 'var(--color-bg-card)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = isSpecial ? 'rgba(239,68,68,0.12)' : 'var(--color-bg-card)' }}
                        >
                            {k}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
