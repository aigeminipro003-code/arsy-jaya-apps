import { ArrowUp, ArrowDown } from 'lucide-react'

/**
 * Input angka tanpa spinner native + stepper custom (menyatu dengan kolom).
 * value/onChange pakai string agar konsisten dengan form controlled input.
 */
export default function NumericStepInput({
    value,
    onChange,
    min = '0',
    max,
    step = 0.1,
    bumpStep,
    integer = false,
    required,
    placeholder,
    disabled,
    autoFocus,
    suffix,
    prefix,
    compact = false,
    style = {},
    inputStyle = {},
    className = '',
}) {
    const safeValue = value === null || value === undefined || value === '' ? '' : String(value)
    const stepAny = step === 'any'
    const parsedStep = stepAny
        ? (bumpStep != null ? bumpStep : 1)
        : (integer ? 1 : (parseFloat(step) || 0.1))
    const minN = parseFloat(min)
    const minNum = Number.isFinite(minN) ? minN : 0
    const maxN = max != null && Number.isFinite(parseFloat(max)) ? parseFloat(max) : null

    function snap(n) {
        if (integer) return Math.round(n)
        const inv = 1 / parsedStep
        return Math.round(n * inv) / inv
    }

    function bump(dir) {
        const raw = safeValue === '' ? null : parseFloat(safeValue)
        let base = Number.isFinite(raw) ? raw : minNum
        let next = base + dir * parsedStep
        next = snap(next)
        if (next < minNum) next = minNum
        if (maxN != null && next > maxN) next = maxN
        onChange(String(next))
    }

    const hBtn = compact ? 22 : 26
    const wBtn = compact ? 28 : 34
    const iconSz = compact ? 12 : 14
    const inpPad = compact ? '6px 8px' : '10px 12px'
    const inpFs = inputStyle.fontSize ?? (compact ? 12 : 13)

    const btnBase = {
        width: wBtn,
        height: hBtn,
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: 'var(--color-text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.45 : 1,
    }

    return (
        <div
            className={className}
            style={{
                display: 'flex',
                alignItems: 'stretch',
                width: '100%',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                boxSizing: 'border-box',
                ...style,
            }}
        >
            {prefix != null && prefix !== '' ? (
                <span
                    style={{
                        padding: compact ? '0 8px' : '0 12px',
                        fontSize: compact ? 11 : 13,
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        borderRight: '1px solid var(--color-border)',
                    }}
                >
                    {prefix}
                </span>
            ) : null}
            <input
                type="number"
                min={min}
                max={max}
                step={stepAny ? 'any' : step}
                required={required}
                disabled={disabled}
                autoFocus={autoFocus}
                placeholder={placeholder}
                className="no-spinner"
                value={safeValue}
                onChange={(e) => {
                    const raw = e.target.value
                    if (integer) {
                        if (raw === '') return onChange('')
                        const n = parseFloat(raw)
                        if (Number.isNaN(n)) return onChange('')
                        return onChange(String(Math.round(n)))
                    }
                    onChange(raw)
                }}
                style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    color: 'var(--color-text-primary)',
                    fontWeight: 700,
                    padding: inpPad,
                    fontSize: inpFs,
                    fontVariantNumeric: 'tabular-nums',
                    boxSizing: 'border-box',
                    ...inputStyle,
                }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border)', flexShrink: 0 }}>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => bump(1)}
                    style={btnBase}
                    onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = 'rgba(30,79,216,0.12)'; e.currentTarget.style.color = 'var(--color-accent)' } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                    aria-label="Tambah"
                >
                    <ArrowUp size={iconSz} />
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => bump(-1)}
                    style={btnBase}
                    onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = 'rgba(30,79,216,0.12)'; e.currentTarget.style.color = 'var(--color-accent)' } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                    aria-label="Kurangi"
                >
                    <ArrowDown size={iconSz} />
                </button>
            </div>
            {suffix ? (
                <span
                    style={{
                        padding: compact ? '0 8px' : '0 12px',
                        fontSize: compact ? 11 : 13,
                        fontWeight: 700,
                        color: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        borderLeft: '1px solid var(--color-border)',
                    }}
                >
                    {suffix}
                </span>
            ) : null}
        </div>
    )
}
