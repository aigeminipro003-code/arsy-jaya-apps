/**
 * Shared UI style constants — 8px grid enforced.
 * Import what you need: import { labelStyle, inputStyle } from '../../lib/uiStyles'
 */

export const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
}

export const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    fontSize: 13,
    outline: 'none',
}

/** Base for all action buttons */
const btnBase = {
    padding: '10px 16px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.15s',
}

export const btnPrimary = {
    ...btnBase,
    background: 'linear-gradient(135deg, var(--color-accent), #6366f1)',
    color: '#000',
    fontWeight: 700,
}

export const btnSuccess = {
    ...btnBase,
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: '#fff',
    fontWeight: 700,
}

export const btnDanger = {
    ...btnBase,
    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    color: '#fff',
    fontWeight: 700,
}

export const btnWarning = {
    ...btnBase,
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#000',
    fontWeight: 700,
}

export const btnSecondary = {
    ...btnBase,
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)',
}

export const btnGhost = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    padding: 8,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}
