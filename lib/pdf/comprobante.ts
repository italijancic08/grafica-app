import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import type { Empresa } from '@/lib/types/empresa'
import { LOGO_HORIZONTAL_PNG_BASE64 } from '@/lib/pdf/logo-horizontal-base64'

// ---------------------------------------------------------------------------
// Diseño del recibo (A4). Todas las medidas están en puntos y "desde arriba"
// (como en un editor de diseño); la función `py()` las convierte a la
// coordenada de pdf-lib, que cuenta desde abajo.
// ---------------------------------------------------------------------------
const ANCHO = 595.28
const ALTO = 841.89

const ROJO = rgb(1, 0, 0)
const NARANJA = rgb(1, 0.6, 0)
const AZUL = rgb(0.1647, 0.2235, 0.5647)
const NEGRO = rgb(0, 0, 0)
const GRIS_TEXTO = rgb(0.4, 0.4, 0.4)
const GRIS_SUAVE = rgb(0.6, 0.6, 0.6)
const GRIS_LINEA = rgb(0.7176, 0.7176, 0.7176)
const GRIS_FILA = rgb(0.9529, 0.9529, 0.9529)

// Márgenes del contenido
const X0 = 82.6
const X1 = 512.8
const X_TEXTO = 85.25 // los textos arrancan un poco adentro de la línea

// Columnas de la tabla (borde derecho de cada una; los números van alineados a la derecha)
const COL_CANTIDAD = 337.68
const COL_UNITARIO = 435.59
const COL_TOTAL = 510.18

// Tabla de conceptos
const TABLA_TOP = 321.7
const ALTO_FILA = 17.4
const MIN_FILAS = 4

const py = (desdeArriba: number) => ALTO - desdeArriba

type Color = ReturnType<typeof rgb>

// "$108.500,00" (sin espacio, como en el diseño). Los negativos salen "-$1.000,00".
// Se arma a mano porque el separador de miles de toLocaleString('es-AR')
// cambia según la versión de Node/ICU.
function dinero(valor: number): string {
  const n = Math.round(Math.abs(Number(valor) || 0) * 100) / 100
  const [entero, decimales] = n.toFixed(2).split('.')
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${valor < 0 ? '-' : ''}$${conPuntos},${decimales}`
}

export async function generarPdfComprobante(datos: {
  numero: string
  fecha: string
  monto: number
  // Precio del trabajo antes del descuento (null/undefined = sin descuento)
  precio_base?: number | null
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
    rubro?: string | null
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

  const ancho = (t: string, tamano: number, f: PDFFont = font) => f.widthOfTextAtSize(t, tamano)

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
    o: { tamano?: number; f?: PDFFont; color?: Color } = {}
  ) {
    const { tamano = 8.9, f = font, color = NEGRO } = o
    page.drawText(t, { x, y: py(baseDesdeArriba), size: tamano, font: f, color })
  }

  function textoDerecha(
    t: string,
    xDerecha: number,
    baseDesdeArriba: number,
    o: { tamano?: number; f?: PDFFont; color?: Color } = {}
  ) {
    texto(t, xDerecha - ancho(t, o.tamano ?? 8.9, o.f ?? font), baseDesdeArriba, o)
  }

  function rect(x0: number, yArriba0: number, x1: number, yArriba1: number, color: Color) {
    page.drawRectangle({ x: x0, y: py(yArriba1), width: x1 - x0, height: yArriba1 - yArriba0, color })
  }

  function linea(x0: number, x1: number, yArriba: number) {
    page.drawLine({
      start: { x: x0, y: py(yArriba) },
      end: { x: x1, y: py(yArriba) },
      thickness: 0.6,
      color: GRIS_LINEA,
    })
  }

  // --- Barra roja superior ---
  rect(50, 53.3, 545.5, 59.3, ROJO)

  // --- Datos de la empresa (arriba a la izquierda) ---
  const empresa = datos.empresa
  texto(limpiar(empresa?.nombre ?? 'GraffAR'), X_TEXTO, 92.4, { tamano: 17.8, color: ROJO })

  const datosEmpresa: string[] = []
  if (empresa?.cuit) datosEmpresa.push(limpiar(empresa.cuit))
  if (empresa?.direccion) {
    // Si la dirección tiene salto de línea o una coma, se muestra en dos renglones
    const dir = limpiar(empresa.direccion).trim()
    const corte = dir.includes('\n') ? dir.indexOf('\n') : dir.indexOf(',')
    if (corte > 0) {
      datosEmpresa.push(dir.slice(0, corte).trim(), dir.slice(corte + 1).trim())
    } else {
      datosEmpresa.push(dir)
    }
  }
  const MAX_EMPRESA = 195
  let base = 108.6
  datosEmpresa.forEach((l, i) => {
    texto(recortar(l, 8.9, MAX_EMPRESA), X_TEXTO, base, { color: GRIS_TEXTO })
    base += i === 0 ? 14 : 11.3
  })
  if (empresa?.telefono) {
    // El teléfono va separado del resto, como en el diseño
    texto(limpiar(empresa.telefono), X_TEXTO, base + 2.6, { color: GRIS_TEXTO })
  }

  // --- Logo (arriba a la derecha) ---
  const logo = await doc.embedPng(Buffer.from(LOGO_HORIZONTAL_PNG_BASE64, 'base64'))
  page.drawImage(logo, { x: 293.1, y: py(154.5), width: 219.1, height: 68.3 })

  // --- Título, número y fecha ---
  texto('Recibo', X_TEXTO, 182.8, { tamano: 28.4, f: bold, color: ROJO })
  textoDerecha(`N° ${limpiar(datos.numero)}`, X1 - 2.6, 182.8, { tamano: 8.9, color: GRIS_SUAVE })

  const [anio, mes, dia] = datos.fecha.split('T')[0].split('-')
  texto(`Fecha: ${dia}/${mes}/${anio}`, X_TEXTO, 202.6, { tamano: 10.7, f: bold, color: NARANJA })

  // --- Datos del cliente ---
  const cliente = datos.cliente
  const camposCliente: [string, string][] = [
    ['Razón Social:', cliente.nombre_razon_social],
    ['Cuit/Dni:', cliente.cuit_cuil ?? ''],
    ['Dirección:', cliente.domicilio ?? ''],
  ]
  camposCliente.forEach(([etiqueta, valor], i) => {
    const t = recortar(limpiar(`${etiqueta} ${valor}`.trimEnd()), 8.9, X1 - X_TEXTO)
    texto(t, X_TEXTO, 230.5 + 16 * i, { color: GRIS_TEXTO })
  })

  linea(X0, X1, 281.4)

  // --- Encabezado de la tabla ---
  const BASE_ENCABEZADO = 312.5
  const encabezado = { tamano: 10.7, f: bold, color: ROJO }
  texto('Descripción', X_TEXTO, BASE_ENCABEZADO, encabezado)
  textoDerecha('Cantidad', COL_CANTIDAD, BASE_ENCABEZADO, encabezado)
  textoDerecha('Precio unitario', COL_UNITARIO, BASE_ENCABEZADO, encabezado)
  textoDerecha('Precio total', COL_TOTAL, BASE_ENCABEZADO, encabezado)

  // --- Concepto: la descripción del trabajo (una sola línea de detalle) ---
  const total = Number(datos.monto) || 0
  const base0 = datos.precio_base != null ? Number(datos.precio_base) : total
  const subtotal = base0 > 0 ? base0 : total
  const ajuste = Math.round((total - subtotal) * 100) / 100 // negativo si hubo descuento

  const anchoDescripcion = COL_CANTIDAD - 50 - X_TEXTO // deja lugar a la columna "Cantidad"
  let lineasDescripcion = envolver(limpiar(datos.trabajo.descripcion ?? '').trim(), 8.9, anchoDescripcion)
  const MAX_LINEAS = 8
  if (lineasDescripcion.length > MAX_LINEAS) {
    lineasDescripcion = lineasDescripcion.slice(0, MAX_LINEAS)
    lineasDescripcion[MAX_LINEAS - 1] = recortar(`${lineasDescripcion[MAX_LINEAS - 1]} …`, 8.9, anchoDescripcion)
  }

  // La fila del concepto ocupa tantas "filas" de tabla como renglones tenga la descripción
  const LINEA_DESC = 11.2
  const filasConcepto = Math.max(1, Math.ceil((lineasDescripcion.length * LINEA_DESC + 6.2) / ALTO_FILA))
  const filasRelleno = Math.max(0, MIN_FILAS - filasConcepto)
  const tablaBottom = TABLA_TOP + ALTO_FILA * (filasConcepto + filasRelleno)

  // Franjas grises alternadas: concepto, (blanco), gris, (blanco)...
  rect(X0, TABLA_TOP, X1, TABLA_TOP + ALTO_FILA * filasConcepto, GRIS_FILA)
  for (let i = 1; i <= filasRelleno; i++) {
    if (i % 2 === 0) {
      const top = TABLA_TOP + ALTO_FILA * (filasConcepto + i - 1)
      rect(X0, top, X1, top + ALTO_FILA, GRIS_FILA)
    }
  }

  lineasDescripcion.forEach((l, i) => {
    texto(l, X_TEXTO, TABLA_TOP + 12 + LINEA_DESC * i, { color: NEGRO })
  })
  const baseNumeros = TABLA_TOP + 15.4
  textoDerecha('1', COL_CANTIDAD, baseNumeros, { color: GRIS_TEXTO })
  textoDerecha(dinero(subtotal), COL_UNITARIO, baseNumeros, { color: GRIS_TEXTO })
  textoDerecha(dinero(subtotal), COL_TOTAL, baseNumeros, { color: GRIS_TEXTO })

  linea(X0, X1, tablaBottom)

  // --- Notas, subtotal, ajustes y total ---
  const baseNotas = tablaBottom + 19.1
  texto(limpiar(`Notas: Trabajo ${datos.trabajo.numero}`), X_TEXTO, baseNotas, { color: GRIS_SUAVE })

  textoDerecha('Subtotal', COL_UNITARIO, baseNotas, { color: AZUL })
  textoDerecha(dinero(subtotal), COL_TOTAL, baseNotas, { f: bold, color: NEGRO })

  const baseAjustes = baseNotas + 17.3
  textoDerecha('Ajustes', COL_UNITARIO, baseAjustes, { color: AZUL })
  textoDerecha(dinero(ajuste), COL_TOTAL, baseAjustes, { f: bold, color: GRIS_TEXTO })

  // El monto total se achica si es tan grande que se saldría de la hoja
  const montoTotal = dinero(total)
  let tamanoTotal = 17.8
  while (tamanoTotal > 10 && ancho(montoTotal, tamanoTotal, bold) > COL_TOTAL - 300) tamanoTotal -= 0.5
  textoDerecha(montoTotal, COL_TOTAL, baseAjustes + 20.2, { tamano: tamanoTotal, f: bold, color: NARANJA })

  return doc.save()
}
