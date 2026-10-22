
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { guardarCategoria, borrarCategoria, type CategoriaDB, type DatosCategoria } from '@/lib/services/categorias-vehiculos'


export default function CategoriasVehiculos({ iniciales, administrador, error }: { iniciales: CategoriaDB[]; administrador: boolean; error?: string }) {
  const router = useRouter()
  const [categorias, setCategorias] = useState(iniciales)
  const [editando, setEditando] = useState<number | null | undefined>(undefined)
  const [form, setForm] = useState<DatosCategoria>({ numero: 1, nota: '', fotos: [] })
  const [fotosTexto, setFotosTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  function abrir(c?: CategoriaDB) {
    setEditando(c?.numero ?? null)
    setForm(c ? { numero: c.numero, nota: c.nota ?? '', fotos: c.fotos } : { numero: Math.max(0, ...categorias.map(c => c.numero)) + 1, nota: '', fotos: [] })
    setFotosTexto(c?.fotos.join('\n') ?? '')
    setErrorForm('')
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setErrorForm('')
    try {
      const resultado = await guardarCategoria(editando ?? null, { ...form, fotos: fotosTexto.split('\n').map(x => x.trim()).filter(Boolean) })
      if ('error' in resultado && resultado.error) { setErrorForm(resultado.error); return }
      window.location.reload()
    } catch { setErrorForm('No se pudo guardar la categoría.') }
    finally { setGuardando(false) }
  }

  async function eliminar(c: CategoriaDB) {
    if (!window.confirm(`¿Eliminar la categoría ${c.numero}?`)) return
    setGuardando(true)
    try {
      const resultado = await borrarCategoria(c.numero)
      if ('error' in resultado && resultado.error) { window.alert(resultado.error); return }
      setCategorias(prev => prev.filter(x => x.numero !== c.numero))
      router.refresh()
    } catch { window.alert('No se pudo eliminar la categoría.') }
    finally { setGuardando(false) }
  }
  const [ampliada, setAmpliada] = useState<string | null>(null)
  const [categoriaActiva, setCategoriaActiva] = useState(iniciales[0]?.numero ?? 1)

  useEffect(() => {
    if (!ampliada) return

    const cerrar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAmpliada(null)
    }

    window.addEventListener('keydown', cerrar)

    return () => window.removeEventListener('keydown', cerrar)
  }, [ampliada])

  useEffect(() => {
    const secciones = categorias
      .map(c => document.getElementById(`categoria-${c.numero}`))
      .filter((el): el is HTMLElement => el !== null)

    if (secciones.length === 0) return

    const observer = new IntersectionObserver(
      entradas => {
        const visibles = entradas
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visibles.length > 0) {
          const numero = Number(
            visibles[0].target.id.replace('categoria-', '')
          )

          if (Number.isFinite(numero)) {
            setCategoriaActiva(numero)
          }
        }
      },
      {
        rootMargin: '-15% 0px -65% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    secciones.forEach(seccion => observer.observe(seccion))

    return () => observer.disconnect()
  }, [categorias])

  function irA(numero: number) {
    setCategoriaActiva(numero)

    document
      .getElementById(`categoria-${numero}`)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
  }

  return (
    <div>
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="mb-4">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">
          Categorías de vehículos
        </h1>

        <p className="text-sm text-gray-500">Guía para identificar la categoría de cada vehículo.</p>
        {administrador && <button type="button" onClick={() => abrir()} className="mt-3 inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"><Plus size={16} /> Nueva categoría</button>}
      </div>

      <div className="sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap gap-2 bg-gray-50 px-1 py-2">
        {categorias.map(c => {
          const activa = categoriaActiva === c.numero

          return (
            <button
              key={c.numero}
              type="button"
              onClick={() => irA(c.numero)}
              aria-label={`Ir a la categoría ${c.numero}`}
              aria-current={activa ? 'location' : undefined}
              className={`h-9 min-w-9 rounded-md border px-2 text-sm font-semibold transition-all duration-200 ${
                activa
                  ? 'scale-110 border-gray-900 bg-gray-900 text-white shadow-md'
                  : 'border-gray-300 bg-white text-gray-900 hover:-translate-y-0.5 hover:bg-gray-100'
              }`}
            >
              {c.numero}
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        {categorias.map(c => (
          <section
            key={c.numero}
            id={`categoria-${c.numero}`}
            className={`scroll-mt-14 rounded-lg border bg-white p-4 transition-all duration-300 ${categoriaActiva === c.numero ? 'border-gray-800 shadow-md' : 'border-gray-200 hover:shadow-sm'}`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className={`flex h-11 min-w-11 items-center justify-center rounded-lg bg-gray-900 px-3 text-xl font-semibold text-white transition-transform duration-300 ${categoriaActiva === c.numero ? 'scale-110' : 'scale-100'}`} >
                {c.numero}
              </span>

              <h2 className="text-sm font-semibold text-gray-900">
                Categoría {c.numero}
              </h2>

              {administrador && <div className="ml-auto flex gap-2"><button type="button" title="Editar" onClick={() => abrir(c)} className="rounded p-1 text-gray-600 hover:bg-gray-100"><Pencil size={16} /></button><button type="button" title="Eliminar" disabled={guardando} onClick={() => eliminar(c)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button></div>}
              {c.nota && (
                <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                  {c.nota}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {c.fotos.map((foto, i) => (
                <button
                  key={foto}
                  type="button"
                  onClick={() => setAmpliada(foto)}
                  aria-label={`Ampliar foto ${i + 1} de la categoría ${c.numero}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-md border border-gray-200 bg-gray-100 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                >
                  <Image
                    src={foto}
                    alt={`Vehículo de la categoría ${c.numero}`}
                    fill
                    sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 45vw"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {administrador && editando !== undefined && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{editando === null ? 'Nueva categoría' : 'Editar categoría'}</h2><button type="button" aria-label="Cerrar" disabled={guardando} onClick={() => setEditando(undefined)}><X size={20} /></button></div><form onSubmit={guardar} className="space-y-4"><label className="block text-sm font-medium">Número<input type="number" required min={1} step={1} value={form.numero} onChange={e => setForm(prev => ({ ...prev, numero: Number(e.target.value) }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label><label className="block text-sm font-medium">Nota<input value={form.nota} onChange={e => setForm(prev => ({ ...prev, nota: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label><label className="block text-sm font-medium">Rutas de fotos (una por línea, dentro de /public)<textarea rows={5} value={fotosTexto} onChange={e => setFotosTexto(e.target.value)} placeholder="/categorias/categoria-01-1.jpg" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>{errorForm && <p role="alert" className="text-sm text-red-600">{errorForm}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={guardando} onClick={() => setEditando(undefined)} className="rounded-md border px-4 py-2">Cancelar</button><button type="submit" disabled={guardando} className="rounded-md bg-gray-900 px-4 py-2 text-white">{guardando ? 'Guardando...' : 'Guardar cambios'}</button></div></form></div></div>}

      {ampliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setAmpliada(null)}
        >
          <button
            type="button"
            aria-label="Cerrar imagen"
            onClick={() => setAmpliada(null)}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-900 transition-colors hover:bg-white"
          >
            <X size={20} />
          </button>

          <div
            className="relative h-[85vh] w-full max-w-4xl"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={ampliada}
              alt="Foto ampliada del vehículo"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
