import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import NumericKeypad from '../../components/ui/NumericKeypad'
import { ArrowLeft, ChevronRight, CheckCircle, AlertTriangle, Calculator } from 'lucide-react'

const MACHINES_STYLES = {
    'Omajic UV': { color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #1d4ed8)', glow: 'rgba(59,130,246,0.25)' },
    'Roland': { color: '#F97316', gradient: 'linear-gradient(135deg, #F97316, #c2410c)', glow: 'rgba(249,115,22,0.25)' },
    'UV Flatbed': { color: '#A855F7', gradient: 'linear-gradient(135deg, #A855F7, #7e22ce)', glow: 'rgba(168,85,247,0.25)' },
}

const CATEGORIES = [
    { id: 'order', label: '📦 Order', desc: 'Order produksi pelanggan', color: '#22d3ee' },
    { id: 'tes_warna', label: '🎨 Tes Warna', desc: 'Uji warna / kalibrasi printer', color: '#f59e0b' },
    { id: 'maintenance', label: '🔧 Maintenance', desc: 'Perawatan mesin', color: '#6366f1' },
    { id: 'kerusakan', label: '⚠️ Kerusakan', desc: 'Material rusak / reject', color: '#ef4444' },
]

function StepIndicator({ current, total }) {
    return (
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} style={{
                    height: 4, flex: 1, borderRadius: 99,
                    background: i < current ? 'var(--color-accent)' : i === current ? 'rgba(30,79,216,0.5)' : 'var(--color-border)',
                    transition: 'all 0.3s',
                }} />
            ))}
        </div>
    )
}

// Compact number input helpers for Order mode
function DimInput({ label, value, onChange, unit = 'cm', suffix }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                {label}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                <input
                    type="number" min="0" step="0.1"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="0"
                    style={{
                        flex: 1, padding: '12px 14px', background: 'transparent', border: 'none',
                        color: 'var(--color-text-primary)', fontSize: 20, fontWeight: 700,
                        outline: 'none', fontVariantNumeric: 'tabular-nums',
                    }}
                />
                <span style={{ padding: '0 14px', fontSize: 14, fontWeight: 700, color: 'var(--color-accent)', flexShrink: 0 }}>
                    {suffix || unit}
                </span>
            </div>
        </div>
    )
}

export default function ProductionForm() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { toast } = useToast()
    const { isMobile } = useBreakpoint()

    const [step, setStep] = useState(state?.machine ? 1 : 0)
    const [machines, setMachines] = useState([])
    const [materials, setMaterials] = useState([])
    const [selectedMachine, setSelectedMachine] = useState(state?.machine || null)
    const [selectedMaterial, setSelectedMaterial] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // ── ORDER mode: P × L × Lembar ──────────────────────────
    const [orderPanjang, setOrderPanjang] = useState('')   // cm
    const [orderLebar, setOrderLebar] = useState('')       // cm
    const [jumlahLembar, setJumlahLembar] = useState('')  // pcs

    // ── NON-ORDER mode: direct meter/cm input ───────────────
    const [bruto, setBruto] = useState('')
    const [netto, setNetto] = useState('')
    const [unitBruto, setUnitBruto] = useState('m')
    const [unitNetto, setUnitNetto] = useState('m')
    const [activeKeypad, setActiveKeypad] = useState('bruto')

    const isOrderMode = selectedCategory === 'order'

    // ── ORDER calculations ───────────────────────────────────
    const bahanLebarCm = selectedMaterial?.width_cm || 0
    const panjangCm = parseFloat(orderPanjang) || 0
    const lebarCm = parseFloat(orderLebar) || 0
    const lembar = parseInt(jumlahLembar) || 0

    // How many prints fit side-by-side in material width?
    const fitPerBaris = lebarCm > 0 && bahanLebarCm > 0
        ? Math.max(1, Math.floor(bahanLebarCm / lebarCm))
        : 0
    // How many rows of prints are needed?
    const totalBaris = fitPerBaris > 0 && lembar > 0
        ? Math.ceil(lembar / fitPerBaris)
        : 0
    // Material consumed from the roll
    const brutoOrderM = totalBaris > 0 ? (totalBaris * panjangCm / 100) : 0
    // Netto = ideal if no width waste (purely from print length × prints / bahan_width)
    const nettoOrderM = lembar > 0 && panjangCm > 0 && bahanLebarCm > 0
        ? (lembar * panjangCm * lebarCm) / (bahanLebarCm * 100)
        : 0
    const wasteOrderM = brutoOrderM > 0 ? (brutoOrderM - nettoOrderM) : 0
    const orderValid = panjangCm > 0 && lebarCm > 0 && lembar > 0 && lebarCm <= bahanLebarCm * 3

    // ── NON-ORDER calculations ────────────────────────────────
    function toMeters(val, unit) {
        const n = parseFloat(val)
        if (isNaN(n)) return NaN
        return unit === 'cm' ? n / 100 : n
    }
    const brutoM = toMeters(bruto, unitBruto)
    const nettoM = toMeters(netto, unitNetto)
    const wasteNonOrder = !isNaN(brutoM) && !isNaN(nettoM) && bruto && netto
        ? (brutoM - nettoM).toFixed(2) : '—'
    const isWasteNegative = parseFloat(wasteNonOrder) < 0
    const nonOrderValid = bruto && netto && !isWasteNegative

    // ── Final values for confirm & submit ────────────────────
    const finalBrutoM = isOrderMode ? brutoOrderM : brutoM
    const finalNettoM = isOrderMode ? nettoOrderM : nettoM
    const finalWaste = isOrderMode
        ? wasteOrderM.toFixed(2)
        : wasteNonOrder

    useEffect(() => {
        supabase.from('machines').select('*').order('name').then(({ data }) => setMachines(data || []))
        supabase.from('materials').select('*').order('name').then(({ data }) => setMaterials(data || []))
    }, [])

    async function handleSubmit() {
        if (!selectedMachine || !selectedMaterial || !selectedCategory) return
        if (isOrderMode && !orderValid) return
        if (!isOrderMode && !nonOrderValid) return

        setSubmitting(true)
        const payload = {
            operator_id: user.id,
            machine_id: selectedMachine.id,
            material_id: selectedMaterial.id,
            panjang_netto: parseFloat(finalNettoM.toFixed(4)),
            bahan_bruto: parseFloat(finalBrutoM.toFixed(4)),
            category: selectedCategory,
            notes: notes || null,
        }
        if (isOrderMode) {
            payload.order_panjang_cm = panjangCm
            payload.order_lebar_cm = lebarCm
            payload.jumlah_lembar = lembar
        }

        const { error } = await supabase.from('production_logs').insert(payload)
        setSubmitting(false)

        if (error) {
            toast(`Gagal menyimpan: ${error.message}`, 'error')
        } else {
            toast('✅ Log produksi berhasil disimpan! Stok otomatis dikurangi.', 'success')
            navigate('/')
        }
    }

    const machineStyle = selectedMachine
        ? (MACHINES_STYLES[selectedMachine.name] || { color: '#1E4FD8', gradient: 'linear-gradient(135deg,#1E4FD8,#B33B3D)', glow: 'rgba(30,79,216,0.2)' })
        : null

    const canProceedToConfirm = isOrderMode ? orderValid : nonOrderValid

    return (
        <div className="animate-fade-in" style={{ maxWidth: isMobile ? '100%' : 640, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} style={{
                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 10,
                    padding: 8, cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex',
                }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, letterSpacing: '-0.04em' }}>Log Produksi</h1>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {['Pilih Mesin', 'Pilih Material', 'Kategori', 'Input Data', 'Konfirmasi'][step]}
                    </p>
                </div>
            </div>

            <StepIndicator current={step} total={5} />

            {/* Step 0: Machine */}
            {step === 0 && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {machines.map(m => {
                            const ms = MACHINES_STYLES[m.name] || { gradient: 'linear-gradient(135deg,#1E4FD8,#B33B3D)', glow: 'rgba(30,79,216,0.2)' }
                            return (
                                <button key={m.id} onClick={() => { setSelectedMachine(m); setStep(1) }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px',
                                        borderRadius: 'var(--radius)', background: ms.gradient, border: 'none', cursor: 'pointer',
                                        boxShadow: `0 8px 32px ${ms.glow}`, transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = ''}
                                >
                                    <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{m.name}</span>
                                    <ChevronRight size={22} color="rgba(255,255,255,0.8)" />
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Step 1: Material */}
            {step === 1 && (
                <div className="animate-fade-in">
                    {selectedMachine && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: machineStyle?.glow?.replace('0.25', '0.1') || 'var(--color-bg-card)', borderRadius: 10, border: `1px solid ${machineStyle?.color}33` }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: machineStyle?.color }}>🖨 {selectedMachine.name}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {materials.map(m => (
                            <button key={m.id} onClick={() => { setSelectedMaterial(m); setStep(2) }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px',
                                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-bg-card-hover)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-card)' }}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>{m.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
                                        Lebar: <strong>{m.width_cm} cm</strong> · Stok: <strong style={{ color: m.total_stock_m < 5 ? 'var(--color-danger)' : 'var(--color-success)' }}>{m.total_stock_m} m</strong>
                                    </div>
                                </div>
                                <ChevronRight size={16} color="var(--color-text-muted)" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Category */}
            {step === 2 && (
                <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {CATEGORIES.map(c => (
                        <button key={c.id} onClick={() => { setSelectedCategory(c.id); setStep(3) }}
                            style={{
                                padding: '22px 18px', borderRadius: 'var(--radius)', border: `2px solid ${c.color}33`,
                                background: `${c.color}10`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.background = `${c.color}20` }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = `${c.color}33`; e.currentTarget.style.background = `${c.color}10` }}
                        >
                            <div style={{ fontSize: 22, marginBottom: 8 }}>{c.label.split(' ')[0]}</div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: c.color }}>{c.label.slice(c.label.indexOf(' ') + 1)}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{c.desc}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* Step 3: Input */}
            {step === 3 && (
                <div className="animate-fade-in">
                    {/* Summary chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                        {[
                            { label: selectedMachine?.name, color: machineStyle?.color },
                            { label: selectedMaterial ? `${selectedMaterial.name} · ${selectedMaterial.width_cm}cm` : null, color: '#22d3ee' },
                            { label: CATEGORIES.find(c => c.id === selectedCategory)?.label, color: '#6366f1' },
                        ].map((chip, i) => chip.label && (
                            <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99, background: `${chip.color}18`, color: chip.color, border: `1px solid ${chip.color}33` }}>
                                {chip.label}
                            </span>
                        ))}
                    </div>

                    {/* ── ORDER MODE ─────────────────────────────────────── */}
                    {isOrderMode ? (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <Calculator size={16} color="var(--color-accent)" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent)' }}>Kalkulator Ukuran Cetak</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <DimInput label="Panjang per lembar" value={orderPanjang} onChange={setOrderPanjang} suffix="cm" />
                                <DimInput label="Lebar per lembar" value={orderLebar} onChange={setOrderLebar} suffix="cm" />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <DimInput label="Jumlah Lembar / Copy" value={jumlahLembar} onChange={setJumlahLembar} suffix="lbr" />
                            </div>

                            {/* Lebar warning */}
                            {lebarCm > 0 && bahanLebarCm > 0 && lebarCm > bahanLebarCm && (
                                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 12 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--color-danger)', fontSize: 13, fontWeight: 600 }}>
                                        <AlertTriangle size={14} />
                                        Lebar cetak ({lebarCm}cm) melebihi lebar bahan ({bahanLebarCm}cm)!
                                    </div>
                                </div>
                            )}

                            {/* Calculation result */}
                            {orderValid && (
                                <div style={{ background: 'rgba(30,79,216,0.05)', border: '1px solid rgba(30,79,216,0.2)', borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                                        Hasil Kalkulasi
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {[
                                            ['Lebar Bahan', `${bahanLebarCm} cm`, 'var(--color-text-secondary)'],
                                            ['Muat per Baris', `${fitPerBaris} lembar`, 'var(--color-accent)'],
                                            ['Total Baris', `${totalBaris} baris`, '#6366f1'],
                                            ['Ukuran cetak', `${orderPanjang} × ${orderLebar} cm`, '#f59e0b'],
                                        ].map(([label, val, color]) => (
                                            <div key={label} style={{ background: 'var(--color-bg-secondary)', borderRadius: 8, padding: '10px 12px' }}>
                                                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                                        <div style={{ flex: 1, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Bahan Bruto</div>
                                            <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.03em' }}>{brutoOrderM.toFixed(2)} <span style={{ fontSize: 14 }}>m</span></div>
                                        </div>
                                        <div style={{ flex: 1, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 10, color: 'var(--color-danger)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Waste</div>
                                            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-danger)', letterSpacing: '-0.03em' }}>{wasteOrderM.toFixed(2)} <span style={{ fontSize: 14 }}>m</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── NON-ORDER MODE: original keypad ───────────── */
                        <div>
                            <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--color-bg-secondary)', borderRadius: 10, padding: 4 }}>
                                {[['bruto', `Bahan Bruto (${unitBruto})`], ['netto', `Panjang Netto (${unitNetto})`]].map(([id, lbl]) => (
                                    <button key={id} onClick={() => setActiveKeypad(id)} style={{
                                        flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                                        background: activeKeypad === id ? 'var(--color-accent)' : 'transparent',
                                        color: activeKeypad === id ? '#000' : 'var(--color-text-muted)',
                                        transition: 'all 0.15s',
                                    }}>{lbl}</button>
                                ))}
                            </div>
                            {activeKeypad === 'bruto'
                                ? <NumericKeypad value={bruto} onChange={setBruto} label="Bahan Bruto (Real Terpakai)" unit={unitBruto} onUnitChange={setUnitBruto} />
                                : <NumericKeypad value={netto} onChange={setNetto} label="Panjang Netto (Gambar)" unit={unitNetto} onUnitChange={setUnitNetto} />
                            }

                            {bruto && netto && (
                                <div style={{
                                    marginTop: 16, padding: '14px 16px', borderRadius: 10,
                                    background: isWasteNegative ? 'rgba(239,68,68,0.1)' : 'rgba(30,79,216,0.06)',
                                    border: `1px solid ${isWasteNegative ? 'rgba(239,68,68,0.3)' : 'rgba(30,79,216,0.2)'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Waste = Bruto − Netto</span>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: isWasteNegative ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                                            {wasteNonOrder} m
                                        </span>
                                    </div>
                                    {isWasteNegative && (
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, color: 'var(--color-danger)', fontSize: 12 }}>
                                            <AlertTriangle size={12} /> Netto tidak boleh lebih besar dari Bruto
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Nama pemesan / keterangan order (opsional)..."
                        rows={2}
                        style={{
                            width: '100%', marginTop: 16, padding: '12px 16px', borderRadius: 10,
                            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)', fontSize: 13, resize: 'none', outline: 'none',
                            fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                    />

                    <button onClick={() => setStep(4)} disabled={!canProceedToConfirm} style={{
                        width: '100%', marginTop: 16, padding: '16px', borderRadius: 12, fontWeight: 800, fontSize: 16,
                        border: 'none', cursor: canProceedToConfirm ? 'pointer' : 'not-allowed', letterSpacing: '-0.01em',
                        background: canProceedToConfirm ? 'linear-gradient(135deg, #1E4FD8, #B33B3D)' : 'var(--color-border)',
                        color: '#fff', boxShadow: canProceedToConfirm ? '0 4px 20px rgba(30,79,216,0.25)' : 'none',
                        transition: 'all 0.2s',
                    }}>
                        Lanjut → Konfirmasi
                    </button>
                </div>
            )}

            {/* Step 4: Confirm & Submit */}
            {step === 4 && (
                <div className="animate-fade-in">
                    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
                        {[
                            ['Mesin', selectedMachine?.name, machineStyle?.color],
                            ['Material', `${selectedMaterial?.name} · ${selectedMaterial?.width_cm}cm`, '#22d3ee'],
                            ['Kategori', CATEGORIES.find(c => c.id === selectedCategory)?.label, '#6366f1'],
                            // Order-specific rows
                            ...(isOrderMode ? [
                                ['Ukuran Cetak', `${orderPanjang} × ${orderLebar} cm`, '#f59e0b'],
                                ['Jumlah Lembar', `${lembar} lembar`, '#22d3ee'],
                                ['Muat per Baris', `${fitPerBaris} lembar`, 'var(--color-text-secondary)'],
                            ] : [
                                ['Bahan Bruto (input)', `${bruto} ${unitBruto}`, '#f59e0b'],
                                ['Panjang Netto (input)', `${netto} ${unitNetto}`, '#22c55e'],
                            ]),
                            ['Bahan Bruto (m)', `${finalBrutoM.toFixed(2)} m`, '#f59e0b'],
                            ['Waste', `${finalWaste} m`, '#ef4444'],
                        ].map(([label, val, color], i, arr) => (
                            <div key={label} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '13px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                            }}>
                                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{label}</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color }}>{val}</span>
                            </div>
                        ))}
                    </div>
                    {notes && (
                        <div style={{ padding: '10px 14px', background: 'var(--color-bg-secondary)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            📝 {notes}
                        </div>
                    )}
                    <button onClick={handleSubmit} disabled={submitting} style={{
                        width: '100%', padding: '18px', borderRadius: 12, fontWeight: 800, fontSize: 17, border: 'none', cursor: 'pointer',
                        background: submitting ? 'var(--color-border)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: submitting ? 'none' : '0 4px 24px rgba(34,197,94,0.3)', transition: 'all 0.2s',
                    }}>
                        {submitting
                            ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" /> Menyimpan...</>
                            : <><CheckCircle size={18} /> Simpan Log Produksi</>
                        }
                    </button>
                </div>
            )}
        </div>
    )
}
