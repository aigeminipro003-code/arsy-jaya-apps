import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { RefreshCw } from 'lucide-react'

/**
 * Banner saat service worker mendeteksi build baru (deploy).
 * Hanya relevan di production / saat PWA aktif.
 */
export default function PwaUpdatePrompt() {
    const [needRefresh, setNeedRefresh] = useState(false)
    const updateSWRef = useRef(null)

    useEffect(() => {
        const intervals = []
        updateSWRef.current = registerSW({
            immediate: true,
            onNeedRefresh() {
                setNeedRefresh(true)
            },
            onRegisteredSW(_url, registration) {
                if (!registration) return
                intervals.push(
                    setInterval(() => {
                        registration.update().catch(() => {})
                    }, 60 * 60 * 1000)
                )
            },
        })
        return () => intervals.forEach(id => clearInterval(id))
    }, [])

    async function applyUpdate() {
        try {
            await updateSWRef.current?.(true)
        } catch {
            window.location.reload()
        }
    }

    if (!needRefresh) return null

    return (
        <div
            role="status"
            style={{
                position: 'fixed',
                left: 16,
                right: 16,
                bottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
                zIndex: 10050,
                padding: '14px 16px',
                borderRadius: 12,
                background: 'var(--color-bg-card)',
                border: '1px solid rgba(30,79,216,0.45)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 12,
            }}
        >
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Versi baru tersedia
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Muat ulang halaman untuk mendapatkan pembaruan aplikasi.
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                    type="button"
                    onClick={() => setNeedRefresh(false)}
                    style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                    }}
                >
                    Nanti
                </button>
                <button
                    type="button"
                    onClick={applyUpdate}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #1E4FD8, #B33B3D)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                    }}
                >
                    <RefreshCw size={14} /> Muat ulang
                </button>
            </div>
        </div>
    )
}
