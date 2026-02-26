import { useState, useCallback } from 'react'

let toastId = 0
let addToast = null

export function useToast() {
    return {
        toast: (message, type = 'success') => {
            if (addToast) addToast({ id: ++toastId, message, type })
        }
    }
}

export function ToastContainer() {
    const [toasts, setToasts] = useState([])

    addToast = useCallback((t) => {
        setToasts(prev => [...prev, t])
        setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500)
    }, [])

    const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' }

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {toasts.map(t => (
                <div key={t.id} className="animate-slide-in" style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 18px', borderRadius: 12, minWidth: 260, maxWidth: 380,
                    background: 'var(--color-bg-card)', border: `1px solid ${colors[t.type]}44`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
                }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[t.type], flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: 'var(--color-text-primary)', fontWeight: 500 }}>{t.message}</span>
                </div>
            ))}
        </div>
    )
}
