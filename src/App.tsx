import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth, useHeartbeat, usePresence, supabase } from './hooks/useSupabase'
import AuthModal from './components/AuthModal'
import ProponesCausa from './components/ProponesCausa'

type Focus = {
  id: string
  titulo: string
  descripcion: string
  estado_ve: string | null
  lat: number | null
  lng: number | null
}

const VE_CENTER: [number, number] = [8.0, -66.0]

export default function App() {
  const { user, loading } = useAuth()
  useHeartbeat(user?.id)
  const presenceCount = usePresence()

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [focuses, setFocuses] = useState<Focus[]>([])
  const [showAuth, setShowAuth] = useState(false)
  const [showPropon, setShowPropon] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)

  // Offline detection
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const map = L.map(mapRef.current, { zoomControl: true }).setView(VE_CENTER, 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)
    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  // Load focuses
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('focuses')
        .select('id,titulo,descripcion,estado_ve,lat,lng')
        .eq('aprobado', true)
      if (data) setFocuses(data as Focus[])
    }
    load()
  }, [])

  // Add markers to map
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    focuses.forEach(f => {
      if (f.lat && f.lng) {
        L.marker([f.lat, f.lng])
          .addTo(map)
          .bindPopup(`<b>${f.titulo}</b><br/>${f.descripcion ?? ''}`)
      }
    })
  }, [focuses])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#90cdf4' }}>
      Cargando...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#90cdf4' }}>Mapa Vivo - Intercesion Venezuela</h1>
          <p style={{ fontSize: 12, color: '#4299e1' }}>
            {offline ? 'Sin conexion' : `${presenceCount} intercesores activos ahora`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {user ? (
            <>
              <button onClick={() => setShowPropon(true)} style={btnGreen}>Proponer causa</button>
              <button onClick={handleSignOut} style={btnGray}>Salir</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={btnBlue}>Unirse en oracion</button>
          )}
        </div>
      </header>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1 }} />

      {/* Focuses sidebar hint */}
      {focuses.length > 0 && (
        <div style={focusBar}>
          <span style={{ color: '#68d391', fontSize: 13 }}>{focuses.length} causas activas en el mapa</span>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showPropon && user && <ProponesCausa user={user} onClose={() => setShowPropon(false)} />}
    </div>
  )
}

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 20px', background: '#1a365d', borderBottom: '1px solid #2a4a7f',
  zIndex: 500,
}
const focusBar: React.CSSProperties = {
  background: '#1a202c', padding: '8px 20px', borderTop: '1px solid #2d3748',
}
const btnBlue: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, background: '#3182ce',
  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
}
const btnGreen: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, background: '#2f855a',
  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
}
const btnGray: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, background: '#4a5568',
  color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13,
}
