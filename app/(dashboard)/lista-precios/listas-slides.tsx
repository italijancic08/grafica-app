'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface SlideLista {
  id: string
  titulo: string
  contenido: ReactNode
}

export default function ListasSlides({ slides }: { slides: SlideLista[] }) {
  const pista = useRef<HTMLDivElement>(null)
  const botones = useRef<(HTMLButtonElement | null)[]>([])
  const [activo, setActivo] = useState(0)

  function ir(indice: number) {
    const el = pista.current
    if (!el) return
    const i = Math.max(0, Math.min(slides.length - 1, indice))
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  function alDesplazar() {
    const el = pista.current
    if (!el || !el.clientWidth) return
    setActivo(Math.round(el.scrollLeft / el.clientWidth))
  }

  // Mantiene visible la pestaña activa cuando hay poco ancho (celular).
  useEffect(() => {
    botones.current[activo]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activo])

  return <div className="p-6">
    <div className="mb-4 flex items-center gap-2">
      <button type="button" aria-label="Lista anterior" disabled={activo === 0} onClick={() => ir(activo - 1)}
        className="rounded-md border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30">
        <ChevronLeft size={18} />
      </button>
      <div role="tablist" className="flex min-w-0 flex-1 gap-2 overflow-x-auto border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((slide, i) => <button key={slide.id} ref={el => { botones.current[i] = el }}
          type="button" role="tab" aria-selected={activo === i} onClick={() => ir(i)}
          className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
            activo === i ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>{slide.titulo}</button>)}
      </div>
      <button type="button" aria-label="Lista siguiente" disabled={activo === slides.length - 1} onClick={() => ir(activo + 1)}
        className="rounded-md border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30">
        <ChevronRight size={18} />
      </button>
    </div>

    <div ref={pista} onScroll={alDesplazar}
      className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {slides.map(slide => <section key={slide.id} aria-label={slide.titulo}
        className="h-[calc(100dvh-10rem)] min-h-[24rem] w-full shrink-0 snap-center snap-always overflow-y-auto pr-1">
        {slide.contenido}
      </section>)}
    </div>
  </div>
}