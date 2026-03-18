import React from 'react'

/**
 * Visualisasi layout cetak untuk mode `order`.
 * Catatan: DB & perhitungan utama tetap pakai logika yang sudah ada di ProductionForm.
 * Diagram dibuat untuk "membaca posisi" netto (kotak terpakai) vs waste (sisa ruang).
 */
export default function OrderLayoutPreview({
    bahanLebarCm,
    panjangCm,
    lebarCm,
    lembar,
    fitPerBaris,
    totalBaris,
    marginCm = 0,
    gapCm = 0,
    brutoOrderM,
    wasteOrderM,
}) {
    if (!bahanLebarCm || !panjangCm || !lebarCm || !lembar || !fitPerBaris || !totalBaris) return null

    const rows = totalBaris
    const cols = fitPerBaris
    const viewW = bahanLebarCm
    const gap = Math.max(0, parseFloat(gapCm) || 0)
    const viewH = rows * panjangCm + (rows - 1) * gap

    const margin = Math.max(0, parseFloat(marginCm) || 0)
    const bahanLebarEff = Math.max(0, viewW - 2 * margin)
    const usedWidth = cols * lebarCm + Math.max(0, cols - 1) * gap
    const leftoverX = Math.max(0, bahanLebarEff - usedWidth)
    // Pusatkan susunan netto agar tidak selalu "nempel" kiri
    const startX = margin + leftoverX / 2

    const bahanAreaCm2 = viewW * viewH
    const nettoAreaCm2 = (parseFloat(lembar) || 0) * panjangCm * lebarCm
    const wasteAreaCm2 = Math.max(0, bahanAreaCm2 - nettoAreaCm2)

    const isOverflow = usedWidth > bahanLebarEff
    const isPortrait = panjangCm >= lebarCm

    const showIndex = lembar <= 9

    return (
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 16, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                    Visual Layout (Netto vs Waste)
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-accent)' }}>
                    {isPortrait ? 'Portrait' : 'Landscape'}
                </div>
            </div>

            {isOverflow && (
                <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)', fontSize: 12, fontWeight: 700 }}>
                    Lebar cetak melebihi lebar bahan. Diagram mengikuti asumsi perhitungan di mode order.
                </div>
            )}

            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border-bright)' }}>
                <svg
                    viewBox={`0 0 ${viewW} ${viewH}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ width: '100%', height: 280, background: 'var(--color-bg-secondary)' }}
                >
                    {/* Bahan (outer area): waste color */}
                    <rect x="0" y="0" width={viewW} height={viewH} fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.35)" />

                    {/* Area printable: setelah margin sisi */}
                    <rect
                        x={margin}
                        y={0}
                        width={bahanLebarEff}
                        height={viewH}
                        fill="transparent"
                        stroke="rgba(148,163,184,0.55)"
                        strokeDasharray="3 3"
                        strokeWidth="0.6"
                    />

                    {/* Grid ringan: garis tepi sel termasuk gap */}
                    {Array.from({ length: cols }).map((_, col) => (
                        <g key={`col-${col}`}>
                            <line
                                x1={startX + col * (lebarCm + gap)}
                                y1={0}
                                x2={startX + col * (lebarCm + gap)}
                                y2={viewH}
                                stroke="rgba(148,163,184,0.22)"
                                strokeWidth="0.2"
                            />
                            <line
                                x1={startX + col * (lebarCm + gap) + lebarCm}
                                y1={0}
                                x2={startX + col * (lebarCm + gap) + lebarCm}
                                y2={viewH}
                                stroke="rgba(148,163,184,0.22)"
                                strokeWidth="0.2"
                            />
                        </g>
                    ))}
                    {Array.from({ length: rows }).map((_, row) => (
                        <g key={`row-${row}`}>
                            <line
                                x1={0}
                                y1={row * (panjangCm + gap)}
                                x2={viewW}
                                y2={row * (panjangCm + gap)}
                                stroke="rgba(148,163,184,0.22)"
                                strokeWidth="0.2"
                            />
                            <line
                                x1={0}
                                y1={row * (panjangCm + gap) + panjangCm}
                                x2={viewW}
                                y2={row * (panjangCm + gap) + panjangCm}
                                stroke="rgba(148,163,184,0.22)"
                                strokeWidth="0.2"
                            />
                        </g>
                    ))}

                    {/* Netto cells */}
                    {Array.from({ length: lembar }).map((_, i) => {
                        const r = Math.floor(i / cols)
                        const c = i % cols
                        const x = startX + c * (lebarCm + gap)
                        const y = r * (panjangCm + gap)
                        if (r >= rows) return null
                        return (
                            <g key={i}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={lebarCm}
                                    height={panjangCm}
                                    fill="rgba(34,197,94,0.18)"
                                    stroke="rgba(34,197,94,0.7)"
                                    strokeWidth="0.25"
                                />
                                {showIndex && (
                                    <text
                                        x={x + lebarCm / 2}
                                        y={y + panjangCm / 2}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill="rgba(34,197,94,0.85)"
                                        fontSize="0.9"
                                        fontWeight="800"
                                    >
                                        {i + 1}
                                    </text>
                                )}
                            </g>
                        )
                    })}
                </svg>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Netto area</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-accent)' }}>{Math.round(nettoAreaCm2).toLocaleString('id-ID')} cm²</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Waste area</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-danger)' }}>{Math.round(wasteAreaCm2).toLocaleString('id-ID')} cm²</div>
                </div>
                <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Waste (cm)</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-danger)' }}>{(Number(wasteOrderM || 0) * 100).toFixed(2)} cm</div>
                </div>
                <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Bruto (cm)</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#f59e0b' }}>{(Number(brutoOrderM || 0) * 100).toFixed(2)} cm</div>
                </div>
            </div>
        </div>
    )
}

