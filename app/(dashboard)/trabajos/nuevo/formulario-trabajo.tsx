'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearTrabajo, listarInstaladoresActivos } from '@/lib/services/trabajos'
import type { Cliente } from '@/lib/types/cliente'
import { ETIQUETAS_RUBRO_TRABAJO, type RubroTrabajo } from '@/lib/types/trabajo'
import SelectorCliente from '../../clientes/selector-cliente'
import SelectorEmpresa from '../../clientes/selector-empresa'
import type { EmpresaCliente } from '@/lib/types/empresa-cliente'

type Instalador = { id: string; nombre: string }

export default function FormularioTrabajo({
  clientes,
  empresas,
}: {
  clientes: Cliente[]
  empresas: EmpresaCliente[]
}) {
  const router = useRouter()
  const [clienteId, setClienteId] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [rubro, setRubro] = useState<RubroTrabajo | ''>('')
  const [fechaMaxima, setFechaMaxima] = useState('')
  const [precioFinal, setPrecioFinal] = useState('')
  const [anchoCm, setAnchoCm] = useState('')
  const [largoCm, setLargoCm] = useState('')
  const [requiereTurno, setRequiereTurno] = useState(false)
  const [turnoFecha, setTurnoFecha] = useState('')
  const [turnoHora, setTurnoHora] = useState('')
  const [instaladorId, setInstaladorId] = useState('')
  const [instaladores, setInstaladores] = useState<Instalador[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    listarInstaladoresActivos().then((r) => {
      if (r.data) setInstaladores(r.data)
    })
  }, [])

  // Si el cliente pertenece a una empresa, esa empresa aparece primera en la lista
  const empresaDelCliente = clientes.find((c) => c.id === clienteId)?.empresa_cliente_id ?? undefined

  const m2 = Number(anchoCm) > 0 && Number(largoCm) > 0
    ? (Number(anchoCm) / 100) * (Number(largoCm) / 100)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!clienteId) { setError('Seleccioná un cliente'); return }
    if (requiereTurno && turnoFecha && !turnoHora) {
      setError('Si cargás la fecha del turno, también indicá la hora.'); return
    }
    if (requiereTurno && turnoHora && !turnoFecha) {
      setError('Si cargás la hora del turno, también indicá la fecha.'); return
    }

    setCargando(true)
    try {
      const resultado = await crearTrabajo({
        cliente_id: clienteId,
        empresa_cliente_id: empresaId,
        descripcion,
        rubro: rubro || undefined,
        fecha_maxima: fechaMaxima,
        precio_final: precioFinal.trim() === '' ? undefined : Number(precioFinal),
        ancho_cm: anchoCm ? Number(anchoCm) : undefined,
        largo_cm: largoCm ? Number(largoCm) : undefined,
        requiere_turno: requiereTurno,
        turno_fecha: turnoFecha,
        turno_hora: turnoHora,
        instalador_id: instaladorId,
      })
      if (resultado.error) { setError(resultado.error); return }
      router.push(`/trabajos/${resultado.data.id}`)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally { setCargando(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Cliente</label>
        <SelectorCliente clientes={clientes} clienteId={clienteId} onChange={setClienteId} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Ingresa por parte de
          <span className="ml-1 font-normal text-gray-400">(opcional)</span>
        </label>
        <SelectorEmpresa
          empresas={empresas}
          valor={empresaId}
          onChange={setEmpresaId}
          etiquetaVacia="El cliente (a su nombre)"
          destacadaId={empresaDelCliente}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Rubro <span className="font-normal text-gray-400">(se puede definir más adelante)</span></label>
        <select value={rubro} onChange={(e) => setRubro(e.target.value as RubroTrabajo)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">Sin definir</option>
          {Object.entries(ETIQUETAS_RUBRO_TRABAJO).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Descripción del trabajo</label>
        <textarea required minLength={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Plazo de entrega</label>
          <input type="date" value={fechaMaxima} onChange={(e) => setFechaMaxima(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Precio <span className="font-normal text-gray-400">(opcional)</span></label>
          <input type="number" step="0.01" min="0" value={precioFinal} onChange={(e) => setPrecioFinal(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Medidas (opcional)</label>
        <div className="flex items-end gap-3">
          <div><label className="mb-1 block text-xs text-gray-500">Ancho (cm)</label><input type="number" step="0.1" min="0" value={anchoCm} onChange={(e) => setAnchoCm(e.target.value)} className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs text-gray-500">Largo (cm)</label><input type="number" step="0.1" min="0" value={largoCm} onChange={(e) => setLargoCm(e.target.value)} className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          {m2 !== null && <p className="pb-2 text-sm text-gray-500">= {m2.toFixed(2)} m²</p>}
        </div>
      </div>

      <div className="rounded-md border border-gray-200 p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
          <input type="checkbox" checked={requiereTurno} onChange={(e) => setRequiereTurno(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
          ¿Es con turno?
        </label>
        {requiereTurno && <div className="mt-4 space-y-3">
          <p className="text-xs text-gray-500">Fecha, hora e instalador se pueden completar después de hablar con el cliente.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div><label className="mb-1 block text-xs font-medium text-gray-600">Día (opcional)</label><input type="date" value={turnoFecha} onChange={(e) => setTurnoFecha(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">Hora (opcional)</label><input type="time" value={turnoHora} onChange={(e) => setTurnoHora(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">Instalador (opcional)</label><select value={instaladorId} onChange={(e) => setInstaladorId(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"><option value="">Sin asignar</option>{instaladores.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}</select></div>
          </div>
          {instaladores.length === 0 && <p className="text-xs text-amber-700">Todavía no hay instaladores cargados. Podés agregarlos desde Turnos.</p>}
        </div>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={cargando} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{cargando ? 'Guardando...' : 'Guardar presupuesto'}</button>
    </form>
  )
}
