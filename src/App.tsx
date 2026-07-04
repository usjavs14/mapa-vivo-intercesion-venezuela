/// <reference types="vite/client" />
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
  estado_ve: string | null
  estado: string
  categoria: string
  urgencia: string
  lat: number
  lng: number
  aprobado: boolean
  intercesores: number
  orando_ahora: number
}

const DEMO_FOCUSES: Focus[] = [
  { id:1, lat:10.6,  lng:-66.9,  ciudad:'La Guaira',      estado_ve:'Vargas',            titulo:'Replicas sismicas - La Guaira',       descripcion:'Cobertura urgente tras sismos',        estado:'sincobertura',      categoria:'emergencia', urgencia:'alta',  aprobado:true, intercesores:12, orando_ahora:3 },
  { id:2, lat:10.48, lng:-66.9,  ciudad:'Caracas',        estado_ve:'Distrito Capital',  titulo:'Cobertura sobre el gobierno',         descripcion:'Intercesion por las autoridades',     estado:'cadenaactiva',      categoria:'gobierno',   urgencia:'media', aprobado:true, intercesores:48, orando_ahora:8 },
  { id:3, lat:10.63, lng:-71.64, ciudad:'Maracaibo',      estado_ve:'Zulia',             titulo:'Colapso electrico y hospitalario',     descripcion:'Crisis de servicios en Zulia',        estado:'cadenaactiva',      categoria:'salud',      urgencia:'alta',  aprobado:true, intercesores:30, orando_ahora:5 },
  { id:4, lat:8.0,   lng:-62.75, ciudad:'Ciudad Guayana', estado_ve:'Bolivar',           titulo:'Juventud y mineria ilegal',           descripcion:'Proteccion de jovenes en riesgo',     estado:'sincobertura',      categoria:'juventud',   urgencia:'media', aprobado:true, intercesores:5,  orando_ahora:1 },
  { id:5, lat:7.77,  lng:-72.22, ciudad:'San Cristobal',  estado_ve:'Tachira',           titulo:'Restauracion de familias migrantes',  descripcion:'Familias separadas por migracion',    estado:'respuestapractica', categoria:'familia',    urgencia:'media', aprobado:true, intercesores:22, orando_ahora:4 },
  { id:6, lat:10.24, lng:-67.59, ciudad:'Valencia',       estado_ve:'Carabobo',          titulo:'Escasez de agua e insumos',           descripcion:'Crisis de agua potable',              estado:'sincobertura',      categoria:'emergencia', urgencia:'alta',  aprobado:true, intercesores:9,  orando_ahora:2 },
  { id:7, lat:9.75,  lng:-63.18, ciudad:'Maturin',        estado_ve:'Monagas',           titulo:'Avivamiento en curso - testimonio',   descripcion:'Senales de avivamiento espiritual',   estado:'testimonio',        categoria:'iglesia',    urgencia:'baja',  aprobado:true, intercesores:40, orando_ahora:7 },
]

const VE_CENTER: [number, number] = [8.0, -66.0]
const URGENCIA_COLOR: Record<string, string> = {
  alta:  '#e5484d',
  media: '#f6ad55',
  baja:  '#43c463',
}
const ESTADO_LABEL: Record<string, string> = {
  sincobertura:      'Sin cobertura',
  cadenaactiva:      'Cadena activa',
  respuestapractica: 'Respuesta practica',
  testimonio:        'Testimonio',
}

export default function App() {
  const { user, loading } = useAuth()
  useHeartbeat(user?.id)
  const _presence = usePresence()
  const mapRef           = useRef<HTMLDivElement>(null)
  const mapInstanceRef   = useRef<L.Map | null>(null)
  const markersRef       = useRef<L.CircleMarker[]>([])
  const [focuses, setFocuses]       = useState<Focus[]>(DEMO_FOCUSES)
  const [showAuth, setShowAuth]     = useState(false)
  const [showPropon, setShowPropon] = useState(false)
  const [offline, setOffline]       = useState(!navigator.onLine)
  const [mapReady, setMapReady]     = useState(false)

  useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const map = L.map(mapRef.current, { zoomControl: true }).setView(VE_CENTER, 6)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '\u00a9 OpenStreetMap \u00a9 CARTO',
      maxZoom: 19,
    }).addTo(map)
    mapInstanceRef.current = map
    requestAnimationFrame(() => {
      map.invalidateSize()
      setMapReady(true)
    })
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('focuses')
          .select('id,titulo,descripcion,ciudad,estado_ve,estado,categoria,urgencia,lat,lng,aprobado,intercesores,orando_ahora')
          .eq('aprobado', true)
          .order('urgencia', { ascending: false })
        if (data && data.length > 0) setFocuses(data as Focus[])
      } catch (_) { /* usa demo si falla */ }
    }
    load()
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    focuses.forEach(f => {
      const color    = URGENCIA_COLOR[f.urgencia] ?? '#90cdf4'
      const ubicacion = f.estado_ve ? f.ciudad + ', ' + f.estado_ve : f.ciudad
      const marker = L.circleMarker([f.lat, f.lng], {
        radius:      10 + Math.min(f.orando_ahora ?? 0, 20),
        fillColor:   color,
        color:       '#fff',
        weight:      2,
        opacity:     0.9,
        fillOpacity: 0.75,
      })
        .addTo(map)
        .bindPopup(
          '<div style="font-family:sans-serif;min-width:180px">'
          + '<b>' + f.titulo + '</b><br/>'
          + '<span style="color:#aaa;font-size:12px">' + ubicacion + '</span><br/><br/>'
          + (f.descripcion ? f.descripcion + '<br/><br/>' : '')
          + 'Categoria: <b>' + f.categoria + '</b> | Urgencia: <b>' + f.urgencia + '</b><br/>'
          + 'Intercesores: <b>' + f.intercesores + '</b> | Estado: <b>' + (ESTADO_LABEL[f.estado] ?? f.estado) + '</b>'
          + '</div>'
        )
      markersRef.current.push(marker)
    })
  }, [focuses, mapReady])

  async function handleSignOut() { await supabase.auth.signOut() }

  if (loading) return <div style={{ padding: 20, background: '#0b0f1a', color: '#fff', height: '100vh' }}>Cargando...</div>

  const totalInterc = focuses.reduce((a, f) => a + (f.intercesores ?? 0), 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'#0b0f1a' }}>

      {/* HEADER */}
      <header style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', background:'linear-gradient(90deg,#0b0f1a,#152036)', borderBottom:'1px solid #22304a', flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={{ margin:0, color:'#f5b942', fontSize:17, fontFamily:'Segoe UI,sans-serif', letterSpacing:0.5 }}>Mapa Vivo <span style={{ color:'#4fd1c5' }}>Intercesion Venezuela</span></h1>
          <div style={{ color:'#9aa7bd', fontSize:12, marginTop:2 }}>Red interdenominacional de oracion y guerra espiritual</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color:'#9aa7bd', fontSize:13 }}>{offline ? 'Sin conexion' : totalInterc + ' intercesores activos'}</span>
          {user ? (
            <>
              <button onClick={() => setShowPropon(true)} style={btnGreen}>+ Proponer Causa</button>
              <button onClick={handleSignOut} style={btnGray}>Salir</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={btnBlue}>Unirse en oracion</button>
          )}
        </div>
      </header>

      {/* LEYENDA */}
      <div style={{ flexShrink:0, background:'#1a2233', padding:'5px 20px', borderBottom:'1px solid #22304a', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <span style={{ color:'#e5484d', fontSize:12 }}>&#9679; Alta urgencia</span>
        <span style={{ color:'#f6ad55', fontSize:12 }}>&#9679; Media</span>
        <span style={{ color:'#43c463', fontSize:12 }}>&#9679; Baja urgencia</span>
        <span style={{ color:'#9aa7bd', fontSize:12 }}>{focuses.length} causas activas</span>
      </div>

      {/* MAPA */}
      <div ref={mapRef} style={{ width:'100%', height:'calc(100vh - 110px)', minHeight:400 }} />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showPropon && user && <ProponesCausa user={user} onClose={() => setShowPropon(false)} />}
    </div>
  )
}

const btnBlue:  React.CSSProperties = { padding:'8px 16px', borderRadius:8, background:'#3182ce', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, fontSize:13 }
const btnGreen: React.CSSProperties = { padding:'8px 16px', borderRadius:8, background:'#2f855a', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, fontSize:13 }
const btnGray:  React.CSSProperties = { padding:'8px 16px', borderRadius:8, background:'#4a5568', color:'#fff', border:'none', cursor:'pointer', fontSize:13 }

void _presence
