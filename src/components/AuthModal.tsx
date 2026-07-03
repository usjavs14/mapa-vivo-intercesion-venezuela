import { useState } from 'react'
import { supabase } from '../hooks/useSupabase'

type Props = {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn}>x</button>
        <h2 style={{ color: '#90cdf4', marginBottom: 16 }}>Unete en intercesion</h2>

        {sent ? (
          <p style={{ color: '#68d391' }}>Revisa tu correo - te enviamos un enlace magico.</p>
        ) : (
          <>
            <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <button type="submit" disabled={loading} style={btnPrimary}>
                {loading ? 'Enviando...' : 'Recibir enlace magico'}
              </button>
            </form>

            <div style={{ textAlign: 'center', color: '#718096', margin: '12px 0' }}>o</div>

            <button onClick={handleGoogle} style={btnGoogle}>
              Continuar con Google
            </button>

            {error && <p style={{ color: '#fc8181', marginTop: 8 }}>{error}</p>}
          </>
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
  background: '#1a202c', borderRadius: 12, padding: 32, width: 360,
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
  padding: '10px 14px', borderRadius: 8, background: '#3182ce',
  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
}
const btnGoogle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  background: '#fff', color: '#1a202c', border: 'none', cursor: 'pointer', fontWeight: 600,
}
