
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { CATEGORIAS_VEHICULOS } from '@/lib/data/categorias-vehiculos'

export default function CategoriasVehiculos() {
  const [ampliada, setAmpliada] = useState<string | null>(null)
  const [categoriaActiva, setCategoriaActiva] = useState(
    CATEGORIAS_VEHICULOS[0]?.numero ?? 1
  )

  useEffect(() => {
    if (!ampliada) return

    const cerrar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAmpliada(null)
    }

    window.addEventListener('keydown', cerrar)

    return () => window.removeEventListener('keydown', cerrar)
  }, [ampliada])

  useEffect(() => {
    const secciones = CATEGORIAS_VEHICULOS
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
  }, [])

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
      <div className="mb-4">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">
          Categorías de vehículos
        </h1>

        <p className="text-sm text-gray-500">
          Guía para identificar la categoría de cada vehículo.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap gap-2 bg-gray-50 px-1 py-2">
        {CATEGORIAS_VEHICULOS.map(c => {
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
        {CATEGORIAS_VEHICULOS.map(c => (
          <section
            key={c.numero}
            id={`categoria-${c.numero}`}
            className="scroll-mt-14 rounded-lg border border-gray-200 bg-white p-4 transition-shadow duration-300 hover:shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="flex h-11 min-w-11 items-center justify-center rounded-lg bg-gray-900 px-3 text-xl font-semibold text-white">
                {c.numero}
              </span>

              <h2 className="text-sm font-semibold text-gray-900">
                Categoría {c.numero}
              </h2>

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
