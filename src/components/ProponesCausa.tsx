/// <reference types="vite/client" />
import { useState } from 'react'
import { supabase } from '../hooks/useSupabase'

type Props = {
  user: { id: string; email?: string }
  onClose: () => void
}

const ESTADOS_VE = [
  'Amazonas','Anzoategui','Apure','Aragua','Barinas','Bolivar','Carabobo',
  'Cojedes','Delta Amacuro','Falcon','Guarico','Lara','Merida','Miranda',
  'Monagas','Nueva Esparta','Portuguesa','Sucre','Tachira','Trujillo',
  'Vargas','Yaracuy','Zulia','Distrito Capital'
]

const CATEGORIAS = ['emergencia','gobierno','salud','juventud','familia','iglesia']
// URGENCIAS used inline in JSX
const ESTADOS_FOCUS = ['sin_cobertura','cadena_activa','respuesta_practica','testimonio']

export default function ProponesCausa({ user, onClose }: Props) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [estadoVe, setEstadoVe] = useState('')
  const [categoria, setCategoria] = useState('')
  const [urgencia, setUrgencia] = useState('baja')
  const [estado, setEstado] = useState('sin_cobertura')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (isNaN(latNum) || isNaN(lngNum)) {
      setError('Por favor ingresa coordenadas validas (lat/lng numericas).')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.from('focuses').insert({
      titulo,
      descripcion: descripcion || null,
      ciudad,
      estado_ve: estadoVe || null,
      categoria,
      urgencia,
      estado,
      lat: latNum,
      lng: lngNum,
      intercesores: 0,
      orando_ahora: 0,
      testimonios: 0,
      propuesto_por: user.id,
      aprobado: false,
    })

    if (err) setError(err.message)
    else setSuccess(true)
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', marginBottom: 10, borderRadius: 6,
    border: '1px solid #2a3650', background: '#0f1826', color: '#e7ecf3',
    fontSize: 14, boxSizing: 'border-box'
  }

  if (success) return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ color: '#43c463' }}>Causa enviada para revision</h3>
        <p style={{ color: '#9aa7bd' }}>Un moderador aprobara tu propuesta pronto.</p>
        <button onClick={onClose} style={btnClose}>Cerrar</button>
      </div>
    </div>
  )

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ margin: '0 0 14px', color: '#f5b942' }}>Proponer Nueva Causa</h3>
        <form onSubmit={handleSubmit}>
          <input required placeholder="Titulo de la causa *" value={titulo} onChange={e => setTitulo(e.target.value)} style={inputStyle} />
          <textarea placeholder="Descripcion (opcional)" value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ ...inputStyle, height: 70, resize: 'vertical' }} />
          <input required placeholder="Ciudad *" value={ciudad} onChange={e => setCiudad(e.target.value)} style={inputStyle} />
          <select value={estadoVe} onChange={e => setEstadoVe(e.target.value)} style={inputStyle}>
            <option value="">Estado de Venezuela (opcional)</option>
            {ESTADOS_VE.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select required value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
            <option value="">Categoria *</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select value={urgencia} onChange={e => setUrgencia(e.target.value)} style={inputStyle}>
            <option value="baja">Urgencia: Baja</option>
            <option value="media">Urgencia: Media</option>
            <option value="alta">Urgencia: Alta</option>
          </select>
          <select value={estado} onChange={e => setEstado(e.target.value)} style={inputStyle}>
            {ESTADOS_FOCUS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <div style={{ display:'flex', gap:8 }}>
            <input required placeholder="Latitud (ej: 10.48) *" value={lat} onChange={e => setLat(e.target.value)} style={{ ...inputStyle, flex:1 }} />
            <input required placeholder="Longitud (ej: -66.9) *" value={lng} onChange={e => setLng(e.target.value)} style={{ ...inputStyle, flex:1 }} />
          </div>
          {error && <p style={{ color:'#e5484d', fontSize:13, margin:'4px 0' }}>{error}</p>}
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            <button type="submit" disabled={loading} style={btnSubmit}>{loading ? 'Enviando...' : 'Enviar Causa'}</button>
            <button type="button" onClick={onClose} style={btnClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }
const modal: React.CSSProperties = { background:'#121826', border:'1px solid #2a3650', borderRadius:12, padding:24, width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto', color:'#e7ecf3' }
const btnSubmit: React.CSSProperties = { flex:1, padding:'9px 0', borderRadius:7, background:'#3182ce', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, fontSize:14 }
const btnClose: React.CSSProperties = { flex:1, padding:'9px 0', borderRadius:7, background:'#4a5568', color:'#fff', border:'none', cursor:'pointer', fontSize:14 }
