import React from 'react'

/**
 * Visualisasi 1D untuk mode non-order:
 * - Bruto (total) sebagai 100%
 * - Netto sebagai bagian terpakai (hijau)
 * - Waste = Bruto - Netto sebagai sisanya (merah)
 *
 * Semua input di-render dalam satuan centimeter (cm).
 */
export default function LengthUsagePreview({
    brutoCm,
    nettoCm,
    wasteCm,
    isWasteNegative = false,
}) {
    const bruto = parseFloat(brutoCm)
    const netto = parseFloat(nettoCm)
    const waste = parseFloat(wasteCm)

    const hasData = Number.isFinite(bruto) && Number.isFinite(netto) && Number.isFinite(waste)
    if (!hasData || bruto <= 0) {
        return (
            <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                    Visual Netto vs Waste
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Isi nilai Bruto dan Netto terlebih dahulu (cm).</div>
            </div>
        )
    }

    // Jika waste negatif, bar akan tetap ditampilkan proporsional dengan clamp,
    // dan pesan akan menunjukkan bahwa Netto tidak boleh lebih besar dari Bruto.
    const usedRatio = bruto > 0 ? Math.max(0, Math.min(1, netto / bruto)) : 0
    const wasteRatio = bruto > 0 ? Math.max(0, Math.min(1, (waste / bruto))) : 0

    const usedPct = Math.round(usedRatio * 1000) / 10
    const wastePct = Math.round((wasteRatio) * 1000) / 10

    return (
        <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Visual Netto vs Waste
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: isWasteNegative ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                    {isWasteNegative ? 'Netto tidak boleh lebih besar dari Bruto' : 'Layout sudah valid'}
                </div>
            </div>

            <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-bright)', borderRadius: 999, padding: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 18, borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${usedPct}%`, background: 'rgba(34,197,94,0.25)', borderRight: '1px solid rgba(34,197,94,0.55)' }} />
                        <div style={{ width: `${Math.max(0, 100 - usedPct)}%`, background: isWasteNegative ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.14)' }} />
                    </div>
                    <div style={{ width: 90, textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--color-text-primary)' }}>{bruto.toFixed(2)}cm</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Total (Bruto)</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '10px 12px', flex: '1 1 180px' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Netto</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-accent)' }}>{netto.toFixed(2)}cm ({usedPct}%)</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid ${isWasteNegative ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 10, padding: '10px 12px', flex: '1 1 180px' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Waste</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: isWasteNegative ? 'var(--color-danger)' : 'var(--color-danger)' }}>
                        {waste.toFixed(2)}cm ({wastePct}%)
                    </div>
                </div>
            </div>
        </div>
    )
}

