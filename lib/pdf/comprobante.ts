import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import { formatearMoneda } from '@/lib/utils/formato'
import { ETIQUETAS_RUBRO_TRABAJO, type RubroTrabajo } from '@/lib/types/trabajo'
import type { Empresa } from '@/lib/types/empresa'
import { LOGO_PNG_BASE64 } from '@/lib/pdf/logo-base64'

// ---------------------------------------------------------------------------
// Diseño de la factura (A4). Todas las medidas de abajo están en puntos y
// medidas "desde arriba" (como en un editor de diseño); la función `py()`
// las convierte a la coordenada de pdf-lib, que cuenta desde abajo.
// ---------------------------------------------------------------------------
const ANCHO = 595.28
const ALTO = 841.89

const ROJO = rgb(237 / 255, 50 / 255, 55 / 255)
const BLANCO = rgb(1, 1, 1)
const TEXTO = rgb(0.16, 0.16, 0.16)
const TEXTO_SUAVE = rgb(0.35, 0.35, 0.35)
const LINEA = rgb(0.45, 0.45, 0.45)
const GRIS_TOTAL = rgb(174 / 255, 174 / 255, 174 / 255)

// Tabla de conceptos
const TABLA_X0 = 60.6
const TABLA_X1 = 535.6
const TABLA_DIV = 429.2 // divisor entre "Concepto" y "Precio"
const TABLA_TOP = 277.1
const ALTO_ENCABEZADO = 33
const ALTO_FILA = 27.7
const CANTIDAD_FILAS = 12

// Pie rojo
const PIE_TOP = 727.6

const py = (desdeArriba: number) => ALTO - desdeArriba

// Íconos (Material Design Icons, Apache 2.0), caja de 24x24
const ICONO_UBICACION =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
const ICONO_MAIL =
  'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'
const ICONO_TELEFONO =
  'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'

export async function generarPdfComprobante(datos: {
  numero: string
  fecha: string
  monto: number
  empresa: Empresa | null
  cliente: {
    nombre_razon_social: string
    cuit_cuil: string | null
    domicilio: string | null
    telefono?: string | null
    email?: string | null
  }
  trabajo: {
    numero: string
    descripcion: string
    rubro: RubroTrabajo
  }
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([ANCHO, ALTO])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  // Helvetica solo dibuja caracteres Latin-1: cualquier otro (emojis, etc.)
  // haría fallar la generación, así que se reemplaza por "?".
  const permitidos = new Set(font.getCharacterSet())
  const limpiar = (t: string) =>
    Array.from(t).map((c) => (permitidos.has(c.codePointAt(0)!) ? c : '?')).join('')

  function ancho(t: string, tamano: number, f: PDFFont = font) {
    return f.widthOfTextAtSize(t, tamano)
  }

  // Acorta con "…" un texto que no entra en `max` puntos de ancho
  function recortar(t: string, tamano: number, max: number, f: PDFFont = font) {
    if (ancho(t, tamano, f) <= max) return t
    let corte = t
    while (corte.length > 1 && ancho(`${corte}…`, tamano, f) > max) corte = corte.slice(0, -1)
    return `${corte.trimEnd()}…`
  }

  // Parte un texto en líneas que entren en `max` puntos (pdf-lib no hace word-wrap)
  function envolver(t: string, tamano: number, max: number, f: PDFFont = font): string[] {
    const lineas: string[] = []
    for (const parrafo of t.split(/\r?\n/)) {
      let actual = ''
      for (let palabra of parrafo.split(' ')) {
        // Palabra más larga que el ancho disponible: se corta en pedazos
        while (ancho(palabra, tamano, f) > max) {
          let n = palabra.length
          while (n > 1 && ancho(palabra.slice(0, n), tamano, f) > max) n--
          if (actual) { lineas.push(actual); actual = '' }
          lineas.push(palabra.slice(0, n))
          palabra = palabra.slice(n)
        }
        const intento = actual ? `${actual} ${palabra}` : palabra
        if (ancho(intento, tamano, f) > max && actual) {
          lineas.push(actual)
          actual = palabra
        } else {
          actual = intento
        }
      }
      lineas.push(actual)
    }
    return lineas
  }

  function texto(
    t: string,
    x: number,
    baseDesdeArriba: number,
    o: { tamano?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {}
  ) {
    const { tamano = 10, f = font, color = TEXTO } = o
    page.drawText(t, { x, y: py(baseDesdeArriba), size: tamano, font: f, color })
  }

  function textoDerecha(
    t: string,
    xDerecha: number,
    baseDesdeArriba: number,
    o: { tamano?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {}
  ) {
    texto(t, xDerecha - ancho(t, o.tamano ?? 10, o.f ?? font), baseDesdeArriba, o)
  }

  function textoCentrado(
    t: string,
    xIzq: number,
    xDer: number,
    baseDesdeArriba: number,
    o: { tamano?: number; f?: PDFFont; color?: ReturnType<typeof rgb> } = {}
  ) {
    const w = ancho(t, o.tamano ?? 10, o.f ?? font)
    texto(t, xIzq + (xDer - xIzq - w) / 2, baseDesdeArriba, o)
  }

  function linea(x1: number, yArriba1: number, x2: number, yArriba2: number, grosor = 0.6) {
    page.drawLine({
      start: { x: x1, y: py(yArriba1) },
      end: { x: x2, y: py(yArriba2) },
      thickness: grosor,
      color: LINEA,
    })
  }

  // --- Logo (arriba a la izquierda) ---
  const logo = await doc.embedPng(Buffer.from(LOGO_PNG_BASE64, 'base64'))
  const TAMANO_LOGO = 138
  page.drawImage(logo, { x: 59.3, y: py(17.4 + TAMANO_LOGO), width: TAMANO_LOGO, height: TAMANO_LOGO })

  // --- "Factura N° ..." (arriba a la derecha) ---
  const X_DERECHA = 548.6
  textoDerecha('Factura', X_DERECHA, 70, { tamano: 15 })
  textoDerecha(`N° ${limpiar(datos.numero)}`, X_DERECHA, 92, { tamano: 16, f: bold, color: ROJO })

  // --- Casillero de fecha: FECHA | día | mes | año ---
  const FECHA_TOP = 107
  const FECHA_BOTTOM = 134.7
  const cortesFecha = [395, 460.2, 489.2, 518.8, X_DERECHA]
  page.drawRectangle({
    x: cortesFecha[0],
    y: py(FECHA_BOTTOM),
    width: X_DERECHA - cortesFecha[0],
    height: FECHA_BOTTOM - FECHA_TOP,
    borderColor: LINEA,
    borderWidth: 0.75,
  })
  for (const x of cortesFecha.slice(1, 4)) linea(x, FECHA_TOP, x, FECHA_BOTTOM, 0.75)

  const [anio, mes, dia] = datos.fecha.split('T')[0].split('-')
  const baseFecha = FECHA_TOP + (FECHA_BOTTOM - FECHA_TOP) / 2 + 3.6
  textoCentrado('FECHA', cortesFecha[0], cortesFecha[1], baseFecha, { tamano: 11, color: TEXTO_SUAVE })
  ;[dia, mes, anio].forEach((valor, i) => {
    textoCentrado(valor ?? '', cortesFecha[i + 1], cortesFecha[i + 2], baseFecha, { tamano: 10 })
  })

  // --- Datos del cliente (Cliente / Teléfono / Dirección / Correo) ---
  const TAM_ETIQUETA = 10
  const campos: { etiqueta: string; valor: string; xEtiqueta: number; xFin: number; baseArriba: number }[] = [
    { etiqueta: 'Cliente:', valor: datos.cliente.nombre_razon_social, xEtiqueta: 60.3, xFin: 310.6, baseArriba: 220 },
    { etiqueta: 'Teléfono:', valor: datos.cliente.telefono ?? '', xEtiqueta: 345.4, xFin: 537.5, baseArriba: 220 },
    { etiqueta: 'Dirección:', valor: datos.cliente.domicilio ?? '', xEtiqueta: 60.3, xFin: 310.6, baseArriba: 246.5 },
    { etiqueta: 'Correo:', valor: datos.cliente.email ?? '', xEtiqueta: 345.4, xFin: 537.5, baseArriba: 246.5 },
  ]
  // El renglón empieza después de la etiqueta más ancha de su columna
  const inicioRenglon = (xEtiqueta: number) =>
    xEtiqueta +
    Math.max(...campos.filter((c) => c.xEtiqueta === xEtiqueta).map((c) => ancho(c.etiqueta, TAM_ETIQUETA))) +
    6

  for (const c of campos) {
    const xInicio = inicioRenglon(c.xEtiqueta)
    texto(c.etiqueta, c.xEtiqueta, c.baseArriba, { tamano: TAM_ETIQUETA, color: TEXTO_SUAVE })
    linea(xInicio, c.baseArriba + 1.8, c.xFin, c.baseArriba + 1.8, 0.6)
    if (c.valor) {
      const valor = recortar(limpiar(c.valor), 10, c.xFin - xInicio - 6)
      texto(valor, xInicio + 3, c.baseArriba - 2, { tamano: 10 })
    }
  }

  // --- Tabla de conceptos ---
  const tablaBottom = TABLA_TOP + ALTO_ENCABEZADO + ALTO_FILA * CANTIDAD_FILAS
  page.drawRectangle({
    x: TABLA_X0,
    y: py(tablaBottom),
    width: TABLA_X1 - TABLA_X0,
    height: tablaBottom - TABLA_TOP,
    borderColor: LINEA,
    borderWidth: 0.6,
  })
  linea(TABLA_DIV, TABLA_TOP, TABLA_DIV, tablaBottom)
  for (let i = 0; i < CANTIDAD_FILAS; i++) {
    const yLinea = TABLA_TOP + ALTO_ENCABEZADO + ALTO_FILA * i
    linea(TABLA_X0, yLinea, TABLA_X1, yLinea)
  }

  const baseEncabezado = TABLA_TOP + ALTO_ENCABEZADO / 2 + 3.8
  textoCentrado('Concepto', TABLA_X0, TABLA_DIV, baseEncabezado, { tamano: 11, f: bold, color: TEXTO_SUAVE })
  textoCentrado('Precio', TABLA_DIV, TABLA_X1, baseEncabezado, { tamano: 11, f: bold, color: TEXTO_SUAVE })

  // Fila 1: número y rubro del trabajo (con el precio). Filas siguientes: descripción.
  const PAD = 10
  const anchoConcepto = TABLA_DIV - TABLA_X0 - PAD * 2
  const baseFila = (i: number) => TABLA_TOP + ALTO_ENCABEZADO + ALTO_FILA * i + ALTO_FILA / 2 + 3.5

  const titulo = recortar(
    limpiar(`${datos.trabajo.numero} — ${ETIQUETAS_RUBRO_TRABAJO[datos.trabajo.rubro]}`),
    10,
    anchoConcepto,
    bold
  )
  texto(titulo, TABLA_X0 + PAD, baseFila(0), { tamano: 10, f: bold })
  textoDerecha(formatearMoneda(datos.monto), TABLA_X1 - PAD, baseFila(0), { tamano: 10 })

  let lineasDescripcion = envolver(limpiar(datos.trabajo.descripcion ?? ''), 10, anchoConcepto)
  if (lineasDescripcion.length === 1 && lineasDescripcion[0] === '') lineasDescripcion = []
  const maxDescripcion = CANTIDAD_FILAS - 1
  if (lineasDescripcion.length > maxDescripcion) {
    lineasDescripcion = lineasDescripcion.slice(0, maxDescripcion)
    lineasDescripcion[maxDescripcion - 1] = recortar(`${lineasDescripcion[maxDescripcion - 1]} …`, 10, anchoConcepto)
  }
  lineasDescripcion.forEach((l, i) => {
    texto(l, TABLA_X0 + PAD, baseFila(i + 1), { tamano: 10, color: TEXTO_SUAVE })
  })

  // --- Total ---
  const TOTAL_X0 = 380.9
  const TOTAL_TOP = 661.9
  const TOTAL_BOTTOM = 692.2
  page.drawRectangle({
    x: TOTAL_X0,
    y: py(TOTAL_BOTTOM),
    width: TABLA_X1 - TOTAL_X0,
    height: TOTAL_BOTTOM - TOTAL_TOP,
    color: GRIS_TOTAL,
  })
  const baseTotal = TOTAL_TOP + (TOTAL_BOTTOM - TOTAL_TOP) / 2 + 4.8
  texto('Total', TOTAL_X0 + 14, baseTotal, { tamano: 14, f: bold })
  // El monto se achica si es tan grande que chocaría con la palabra "Total"
  const montoTotal = formatearMoneda(datos.monto)
  const anchoDisponible = TABLA_X1 - 12 - (TOTAL_X0 + 14 + ancho('Total', 14, bold) + 10)
  let tamanoMonto = 13
  while (tamanoMonto > 8 && ancho(montoTotal, tamanoMonto, bold) > anchoDisponible) tamanoMonto -= 0.5
  textoDerecha(montoTotal, TABLA_X1 - 12, baseTotal, { tamano: tamanoMonto, f: bold })

  texto(
    'Comprobante interno de la gráfica. No tiene validez fiscal ante AFIP.',
    TABLA_X0,
    TOTAL_BOTTOM + 14,
    { tamano: 7.5, color: TEXTO_SUAVE }
  )

  // --- Pie rojo con los datos de contacto de la empresa ---
  page.drawRectangle({ x: 0, y: 0, width: ANCHO, height: ALTO - PIE_TOP, color: ROJO })

  const contactos = [
    { icono: ICONO_UBICACION, texto: datos.empresa?.direccion, separacion: 19 },
    { icono: ICONO_MAIL, texto: datos.empresa?.email, separacion: 21 },
    { icono: ICONO_TELEFONO, texto: datos.empresa?.telefono, separacion: 18 },
  ].filter((c): c is { icono: string; texto: string; separacion: number } => Boolean(c.texto))

  // Posición de cada ícono (se usan los primeros según cuántos datos haya cargados)
  const posiciones = [51.6, 269, 444.7]
  const slots = posiciones.slice(0, contactos.length)
  const ESCALA_ICONO = 0.6
  const BASE_PIE = 788.5 // línea base del texto, desde arriba

  contactos.forEach((c, i) => {
    const xIcono = slots[i]
    const xTexto = xIcono + c.separacion
    const xLimite = i < contactos.length - 1 ? slots[i + 1] - 12 : TABLA_X1
    page.drawSvgPath(c.icono, {
      x: xIcono,
      y: py(BASE_PIE - 10.5),
      scale: ESCALA_ICONO,
      color: BLANCO,
      borderWidth: 0,
    })
    texto(recortar(limpiar(c.texto), 10, xLimite - xTexto), xTexto, BASE_PIE, { tamano: 10, color: BLANCO })
  })

  return doc.save()
}