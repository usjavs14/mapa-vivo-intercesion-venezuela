import { useState } from 'react'
import { supabase } from '../hooks/useSupabase'
import type { UserProfile } from '../hooks/useSupabase'

type Props = {
  user: UserProfile
  onClose: () => void
}

const ESTADOS_VE = [
  'Amazonas','Anzoategui','Apure','Aragua','Barinas','Bolivar','Carabobo',
  'Cojedes','Delta Amacuro','Falcon','Guarico','Lara','Merida','Miranda',
  'Monagas','Nueva Esparta','Portuguesa','Sucre','Tachira','Trujillo',
  'Vargas','Yaracuy','Zulia','Distrito Capital'
]

export default function ProponesCausa({ user, onClose }: Props) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('focuses').insert({
      titulo,
      descripcion,
      estado_ve: estado || null,
      propuesto_por: user.id,
      aprobado: false,
    })

    if (err) setError(err.message)
    else setSuccess(true)
    setLoading(false)
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn}>x</button>
        <h2 style={{ color: '#90cdf4', marginBottom: 16 }}>Proponer causa de intercesion</h2>

        {success ? (
          <p style={{ color: '#68d391' }}>Tu causa fue enviada y esta en revision. Gracias!</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              placeholder="Titulo de la causa"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required maxLength={120}
              style={inputStyle}
            />
            <textarea
              placeholder="Describe la situacion (max 500 caracteres)"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              maxLength={500} rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <select
              value={estado}
              onChange={e => setEstado(e.target.value)}
              style={inputStyle}
            >
              <option value="">Estado (opcional)</option>
              {ESTADOS_VE.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? 'Enviando...' : 'Enviar causa'}
            </button>
            {error && <p style={{ color: '#fc8181' }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}
const modal: React.CSSProperties = {
  background: '#1a202c', borderRadius: 12, padding: 32, width: 420,
  position: 'relative', border: '1px solid #2d3748',
}
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 12, right: 12, background: 'none',
  border: 'none', color: '#718096', fontSize: 18, cursor: 'pointer',
}
const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8, border: '1px solid #4a5568',
  background: '#2d3748', color: '#e2e8f0', fontSize: 14,
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8, background: '#2f855a',
  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
}
