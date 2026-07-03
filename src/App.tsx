import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth, useHeartbeat, usePresence, supabase } from './hooks/useSupabase'
import AuthModal from './components/AuthModal'
import ProponesCausa from './components/ProponesCausa'

type Focus = {
  id: number
  titulo: string
  descripcion: string | null
  ciudad: string
  estado: string
  categoria: string
  urgencia: string
  lat: number
  lng: number
  aprobado: boolean
  intercesores: number
  orando_ahora: number
}

const VE_CENTER: [number, number] = [8.0, -66.0]

const URGENCIA_COLOR: Record<string, string> = {
  alta: '#fc8181',
  media: '#f6ad55',
  baja: '#68d391',
}

export default function App() {
  const { user, loading } = useAuth()
  useHeartbeat(user?.id)
  const presenceCount = usePresence()

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.CircleMarker[]>([])
  const [focuses, setFocuses] = useState<Focus[]>([])
  const [showAuth, setShowAuth] = useState(false)
  const [showPropon, setShowPropon] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const map = L.map(mapRef.current, { zoomControl: true }).setView(VE_CENTER, 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)
    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('focuses')
        .select('id,titulo,descripcion,ciudad,estado,categoria,urgencia,lat,lng,aprobado,intercesores,orando_ahora')
        .eq('aprobado', true)
        .order('urgencia', { ascending: true })
      if (data) setFocuses(data as Focus[])
    }
    load()
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    focuses.forEach(f => {
      const color = URGENCIA_COLOR[f.urgencia] ?? '#90cdf4'
      const marker = L.circleMarker([f.lat, f.lng], {
        radius: 10 + Math.min(f.orando_ahora, 20),
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.75,
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;min-width:180px">
            <b style="color:#1a365d">${f.titulo}</b><br/>
            <small>${f.ciudad}, ${f.estado}</small><br/>
            <span style="color:#718096">${f.descripcion ?? ''}</span><br/>
            <small>Categoria: <b>${f.categoria}</b> | Urgencia: <b style="color:${color}">${f.urgencia}</b></small><br/>
            <small>Intercesores: <b>${f.intercesores}</b> | Orando ahora: <b>${f.orando_ahora}</b></small>
          </div>`
        )
      markersRef.current.push(marker)
    })
  }, [focuses])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#90cdf4', background: '#0f172a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>Cargando mapa...</div>
        <div style={{ color: '#4299e1', fontSize: 14 }}>Mapa Vivo de Intercesion por Venezuela</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a' }}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#90cdf4', margin: 0 }}>Mapa Vivo — Intercesion Venezuela</h1>
          <p style={{ fontSize: 12, color: offline ? '#fc8181' : '#68d391', margin: '2px 0 0 0' }}>
            {offline ? '⚠ Sin conexion' : `${presenceCount} intercesores activos ahora`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ fontSize: 12, color: '#718096' }}>{user.email}</span>
              <button onClick={() => setShowPropon(true)} style={btnGreen}>+ Causa</button>
              <button onClick={handleSignOut} style={btnGray}>Salir</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={btnBlue}>Unirse en oracion</button>
          )}
        </div>
      </header>

      {focuses.length > 0 && (
        <div style={legendBar}>
          <span style={{ color: '#fc8181', fontSize: 12 }}>● Alta</span>
          <span style={{ color: '#f6ad55', fontSize: 12, marginLeft: 12 }}>● Media</span>
          <span style={{ color: '#68d391', fontSize: 12, marginLeft: 12 }}>● Baja urgencia</span>
          <span style={{ color: '#a0aec0', fontSize: 12, marginLeft: 20 }}>{focuses.length} causas activas</span>
        </div>
      )}

      <div ref={mapRef} style={{ flex: 1 }} />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showPropon && user && <ProponesCausa user={user} onClose={() => setShowPropon(false)} />}
    </div>
  )
}

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 16px', background: '#1a365d', borderBottom: '2px solid #2a4a7f',
  zIndex: 500,
}
const legendBar: React.CSSProperties = {
  background: '#1e2a3a', padding: '4px 16px', borderBottom: '1px solid #2d3748',
  display: 'flex', alignItems: 'center',
}
const btnBlue: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 8, background: '#3182ce',
  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
}
const btnGreen: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 8, background: '#2f855a',
  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
}
const btnGray: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 8, background: '#4a5568',
  color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13,
}
