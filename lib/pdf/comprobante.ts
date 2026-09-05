import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatearMoneda, formatearFecha } from '@/lib/utils/formato'
import { ETIQUETAS_RUBRO_TRABAJO, type RubroTrabajo } from '@/lib/types/trabajo'
import type { Empresa } from '@/lib/types/empresa'

export async function generarPdfComprobante(datos: {
  numero: string
  fecha: string
  monto: number
  empresa: Empresa | null
  cliente: {
    nombre_razon_social: string
    cuit_cuil: string | null
    domicilio: string | null
  }
  trabajo: {
    numero: string
    descripcion: string
    rubro: RubroTrabajo
  }
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89]) // A4 en puntos
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const negro = rgb(0.1, 0.1, 0.1)
  const gris = rgb(0.45, 0.45, 0.45)
  const margenIzq = 56
  let y = 780

  const anchoUtil = 595.28 - margenIzq * 2

  function texto(
    contenido: string,
    opciones: { tamano?: number; negrita?: boolean; color?: ReturnType<typeof rgb>; x?: number } = {}
  ) {
    const { tamano = 11, negrita = false, color = negro, x = margenIzq } = opciones
    page.drawText(contenido, { x, y, size: tamano, font: negrita ? fontBold : font, color })
  }

  // Corta un texto largo en varias líneas que entren dentro de anchoUtil,
  // y las dibuja una debajo de la otra (pdf-lib no hace word-wrap solo)
  function textoConWrap(
    contenido: string,
    opciones: { tamano?: number; color?: ReturnType<typeof rgb>; interlineado?: number } = {}
  ) {
    const { tamano = 9, color = gris, interlineado = 12 } = opciones
    const palabras = contenido.split(' ')
    let linea = ''

    for (const palabra of palabras) {
      const intento = linea ? `${linea} ${palabra}` : palabra
      if (font.widthOfTextAtSize(intento, tamano) > anchoUtil && linea) {
        page.drawText(linea, { x: margenIzq, y, size: tamano, font, color })
        y -= interlineado
        linea = palabra
      } else {
        linea = intento
      }
    }
    if (linea) {
      page.drawText(linea, { x: margenIzq, y, size: tamano, font, color })
      y -= interlineado
    }
  }

  // --- Membrete de la empresa ---
  texto(datos.empresa?.nombre ?? 'Sistema de gestión', { tamano: 16, negrita: true })
  y -= 18
  if (datos.empresa?.cuit) { texto(`CUIT: ${datos.empresa.cuit}`, { tamano: 9, color: gris }); y -= 13 }
  if (datos.empresa?.direccion) { texto(datos.empresa.direccion, { tamano: 9, color: gris }); y -= 13 }
  const contacto = [datos.empresa?.telefono, datos.empresa?.email].filter(Boolean).join(' · ')
  if (contacto) { texto(contacto, { tamano: 9, color: gris }); y -= 13 }

  // --- Título y datos del comprobante ---
  y -= 20
  texto(`Recibo N.° ${datos.numero}`, { tamano: 14, negrita: true })
  y -= 16
  texto(`Fecha: ${formatearFecha(datos.fecha)}`, { tamano: 10, color: gris })

  // Línea separadora
  y -= 18
  page.drawLine({ start: { x: margenIzq, y }, end: { x: 595.28 - margenIzq, y }, thickness: 0.75, color: gris })

  // --- Datos del cliente ---
  y -= 26
  texto('Cliente', { tamano: 9, negrita: true, color: gris })
  y -= 15
  texto(datos.cliente.nombre_razon_social, { tamano: 11 })
  if (datos.cliente.cuit_cuil) { y -= 14; texto(`CUIT/CUIL: ${datos.cliente.cuit_cuil}`, { tamano: 9, color: gris }) }
  if (datos.cliente.domicilio) { y -= 14; texto(datos.cliente.domicilio, { tamano: 9, color: gris }) }

  // --- Datos del trabajo ---
  y -= 28
  texto('Trabajo', { tamano: 9, negrita: true, color: gris })
  y -= 15
  texto(`${datos.trabajo.numero} — ${ETIQUETAS_RUBRO_TRABAJO[datos.trabajo.rubro]}`, { tamano: 11 })
  y -= 16
  textoConWrap(datos.trabajo.descripcion, { tamano: 9, color: gris })

  // --- Monto ---
  y -= 26
  const alturaRecuadro = 52
  page.drawRectangle({
    x: margenIzq,
    y: y - alturaRecuadro + 20,
    width: 595.28 - margenIzq * 2,
    height: alturaRecuadro,
    color: rgb(0.96, 0.96, 0.96),
  })
  texto('Monto total', { tamano: 9, color: gris, x: margenIzq + 14 })
  y -= 22
  texto(formatearMoneda(datos.monto), { tamano: 18, negrita: true, x: margenIzq + 14 })

  // --- Pie de página ---
  page.drawText(
    'Comprobante interno de la gráfica. No constituye factura ni tiene validez fiscal ante AFIP.',
    { x: margenIzq, y: 50, size: 8, font, color: gris }
  )

  return doc.save()
}