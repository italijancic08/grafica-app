'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  obtenerSemanaActual,
  obtenerSemanaAnterior,
  calcularHoras,
  redondearHoras,
} from '@/lib/utils/semana-fichaje'
import { obtenerValorHora } from '@/lib/services/configuracion'
import * as XLSX from 'xlsx'

type Fichaje = {
  id: string
  usuario_id: string
  entrada: string
  salida: string | null
  horas_trabajadas: number | null
  usuarios?: {
    id: string
    nombre: string
    email: string
    rol?: string
    activo?: boolean
  } | null
}

function numero(valor: unknown) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function calcularHorasFichaje(fichaje: Fichaje) {
  if (!fichaje.salida) return 0

  if (fichaje.horas_trabajadas != null) {
    return redondearHoras(numero(fichaje.horas_trabajadas))
  }

  return calcularHoras(fichaje.entrada, fichaje.salida)
}

async function verificarAdministrador() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'No autenticado',
      user: null,
    }
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, rol')
    .eq('id', user.id)
    .single()

  if (
    usuario?.rol !== 'administrador' &&
    usuario?.rol !== 'supervisor'
  ) {
    return {
      error: 'No tenés permisos para consultar las liquidaciones.',
      user,
    }
  }

  return {
    user,
    usuario,
  }
}

export async function obtenerLiquidacionActual() {
  const supabase = await createClient()
  const semana = obtenerSemanaActual()

  const { data, error } = await supabase
    .from('liquidaciones_semanales')
    .select(`
      *,
      liquidaciones_empleados (
        *,
        usuarios (
          id,
          nombre,
          email
        )
      )
    `)
    .eq('semana_inicio', semana.inicio)
    .eq('semana_fin', semana.fin)
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  return {
    data,
    semana,
  }
}

export async function listarLiquidaciones() {
  const permisos = await verificarAdministrador()

  if (permisos.error) {
    return { error: permisos.error }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('liquidaciones_semanales')
    .select(`
      *,
      liquidaciones_empleados (
        *,
        usuarios (
          id,
          nombre,
          email
        )
      )
    `)
    .order('semana_inicio', { ascending: false })

  if (error) return { error: error.message }

  return { data }
}

export async function generarLiquidacionSemana(
  semanaInicio: string,
  semanaFin: string,
  permitirIncompleta = false
) {
  const permisos = await verificarAdministrador()

  if (permisos.error) {
    return { error: permisos.error }
  }

  const supabase = createAdminClient()

  const inicio = new Date(`${semanaInicio}T00:00:00-03:00`)
  const fin = new Date(`${semanaFin}T12:00:00-03:00`)

  /*
   * Buscamos todos los fichajes cuya entrada pertenece al ciclo.
   */
  const { data: fichajes, error: errorFichajes } = await supabase
    .from('fichajes')
    .select(`
      *,
      usuarios (
        id,
        nombre,
        email,
        rol,
        activo
      )
    `)
    .gte('entrada', inicio.toISOString())
    .lte('entrada', fin.toISOString())
    .order('entrada', { ascending: true })

  if (errorFichajes) {
    return { error: errorFichajes.message }
  }

  const registros = (fichajes ?? []) as Fichaje[]

  /*
   * Si existe una entrada abierta, todavía no podemos cerrar
   * correctamente la liquidación.
   *
   * Esto es especialmente importante para un turno que comienza
   * el viernes por la noche y termina el sábado de madrugada.
   */
  const fichajesAbiertos = registros.filter((f) => !f.salida)

  if (fichajesAbiertos.length > 0 && !permitirIncompleta) {
    return {
      pendiente: true,
      error:
        'Hay fichajes abiertos. La liquidación queda pendiente hasta que se registre la salida.',
      fichajesAbiertos,
    }
  }

  const valorHora = await obtenerValorHora()

  /*
   * Agrupar por empleado.
   */
  const empleados = new Map<
    string,
    {
      id: string
      nombre: string
      email: string
      horas: number
      importe: number
      fichajes: Fichaje[]
    }
  >()

  for (const fichaje of registros) {
    const usuario = fichaje.usuarios

    if (!usuario) continue

    if (!empleados.has(usuario.id)) {
      empleados.set(usuario.id, {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        horas: 0,
        importe: 0,
        fichajes: [],
      })
    }

    const empleado = empleados.get(usuario.id)!

    const horas = calcularHorasFichaje(fichaje)

    empleado.horas += horas
    empleado.importe += horas * valorHora
    empleado.fichajes.push(fichaje)
  }

  const empleadosArray = Array.from(empleados.values())

  const totalHoras = redondearHoras(
    empleadosArray.reduce((total, e) => total + e.horas, 0)
  )

  const totalPagar = redondearHoras(
    empleadosArray.reduce((total, e) => total + e.importe, 0)
  )

  /*
   * Crear o recuperar la liquidación.
   */
  const { data: liquidacionExistente } = await supabase
    .from('liquidaciones_semanales')
    .select('*')
    .eq('semana_inicio', semanaInicio)
    .eq('semana_fin', semanaFin)
    .maybeSingle()

  let liquidacion = liquidacionExistente

  if (!liquidacion) {
    const { data, error } = await supabase
      .from('liquidaciones_semanales')
      .insert({
        semana_inicio: semanaInicio,
        semana_fin: semanaFin,
        estado: fichajesAbiertos.length > 0 ? 'pendiente' : 'liquidada',
        valor_hora: valorHora,
        total_horas: totalHoras,
        total_pagar: totalPagar,
        creado_por: permisos.user?.id,
      })
      .select()
      .single()

    if (error || !data) {
      return {
        error: error?.message ?? 'No se pudo crear la liquidación.',
      }
    }

    liquidacion = data
  } else {
    const { data, error } = await supabase
      .from('liquidaciones_semanales')
      .update({
        estado:
          fichajesAbiertos.length > 0
            ? 'pendiente'
            : 'liquidada',
        valor_hora: valorHora,
        total_horas: totalHoras,
        total_pagar: totalPagar,
        generado_en: new Date().toISOString(),
      })
      .eq('id', liquidacionExistente.id)
      .select()
      .single()

    if (error || !data) {
      return {
        error: error?.message ?? 'No se pudo actualizar la liquidación.',
      }
    }

    liquidacion = data

    await supabase
      .from('liquidaciones_empleados')
      .delete()
      .eq('liquidacion_id', liquidacion.id)
  }

  /*
   * Insertar detalle de empleados.
   */
  if (empleadosArray.length > 0) {
    const detalles = empleadosArray.map((empleado) => ({
      liquidacion_id: liquidacion.id,
      usuario_id: empleado.id,
      horas: redondearHoras(empleado.horas),
      valor_hora: valorHora,
      importe: redondearHoras(
        empleado.horas * valorHora
      ),
    }))

    const { error: errorDetalles } = await supabase
      .from('liquidaciones_empleados')
      .insert(detalles)

    if (errorDetalles) {
      return {
        error: errorDetalles.message,
      }
    }
  }

  /*
   * Generar Excel.
   */
  const workbook = XLSX.utils.book_new()

  const resumen = empleadosArray.map((empleado) => ({
    Empleado: empleado.nombre,
    Email: empleado.email,
    'Horas trabajadas': redondearHoras(empleado.horas),
    'Valor hora': valorHora,
    'Total a pagar': redondearHoras(
      empleado.horas * valorHora
    ),
  }))

  resumen.push({
    Empleado: 'TOTAL',
    Email: '',
    'Horas trabajadas': totalHoras,
    'Valor hora': valorHora,
    'Total a pagar': totalPagar,
  })

  const hojaResumen = XLSX.utils.json_to_sheet(resumen)

  hojaResumen['!cols'] = [
    { wch: 28 },
    { wch: 32 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
  ]

  XLSX.utils.book_append_sheet(
    workbook,
    hojaResumen,
    'Resumen'
  )

  /*
   * Una hoja por empleado.
   */
  for (const empleado of empleadosArray) {
    const detalle = empleado.fichajes.map((fichaje) => {
      const horas = calcularHorasFichaje(fichaje)

      const entrada = new Date(fichaje.entrada)
      const salida = fichaje.salida
        ? new Date(fichaje.salida)
        : null

      const fecha = new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        dateStyle: 'short',
      }).format(entrada)

      const entradaTexto = new Intl.DateTimeFormat(
        'es-AR',
        {
          timeZone: 'America/Argentina/Buenos_Aires',
          timeStyle: 'short',
        }
      ).format(entrada)

      const salidaTexto = salida
        ? new Intl.DateTimeFormat('es-AR', {
            timeZone:
              'America/Argentina/Buenos_Aires',
            timeStyle: 'short',
          }).format(salida)
        : 'Fichaje abierto'

      return {
        Fecha: fecha,
        Entrada: entradaTexto,
        Salida: salidaTexto,
        'Horas trabajadas': horas,
        'Valor hora': valorHora,
        'Paga': redondearHoras(
          horas * valorHora
        ),
      }
    })

    detalle.push({
      Fecha: '',
      Entrada: '',
      Salida: 'TOTAL',
      'Horas trabajadas': redondearHoras(
        empleado.horas
      ),
      'Valor hora': valorHora,
      Paga: redondearHoras(
        empleado.horas * valorHora
      ),
    })

    let nombreHoja = empleado.nombre
      .replace(/[\\/?*[\]:]/g, '')
      .substring(0, 31)

    if (!nombreHoja) {
      nombreHoja = 'Empleado'
    }

    /*
     * Excel no permite dos hojas con el mismo nombre.
     */
    let nombreOriginal = nombreHoja
    let contador = 2

    while (
      workbook.SheetNames.includes(nombreHoja)
    ) {
      nombreHoja =
        `${nombreOriginal.substring(0, 27)}-${contador}`
      contador++
    }

    const hojaEmpleado =
      XLSX.utils.json_to_sheet(detalle)

    hojaEmpleado['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
    ]

    XLSX.utils.book_append_sheet(
      workbook,
      hojaEmpleado,
      nombreHoja
    )
  }

  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  })

  const archivoPath =
    `liquidaciones/${semanaInicio}_${semanaFin}.xlsx`

  const { error: errorStorage } =
    await supabase.storage
      .from('documentos')
      .upload(
        archivoPath,
        buffer,
        {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: true,
        }
      )

  if (errorStorage) {
    return {
      error:
        `La liquidación se calculó pero no se pudo guardar el Excel: ${errorStorage.message}`,
    }
  }

  const { data: liquidacionFinal, error: errorFinal } =
    await supabase
      .from('liquidaciones_semanales')
      .update({
        archivo_path: archivoPath,
        estado:
          fichajesAbiertos.length > 0
            ? 'pendiente'
            : 'liquidada',
        total_horas: totalHoras,
        total_pagar: totalPagar,
        valor_hora: valorHora,
      })
      .eq('id', liquidacion.id)
      .select()
      .single()

  if (errorFinal) {
    return {
      error: errorFinal.message,
    }
  }

  return {
    success: true,
    liquidacion: liquidacionFinal,
    empleados: empleadosArray,
    fichajesAbiertos,
  }
}

export async function generarLiquidacionSemanaAnterior() {
  const semana = obtenerSemanaAnterior()

  return generarLiquidacionSemana(
    semana.inicio,
    semana.fin
  )
}

export async function obtenerUrlExcelLiquidacion(
  liquidacionId: string
) {
  const permisos = await verificarAdministrador()

  if (permisos.error) {
    return { error: permisos.error }
  }

  const supabase = await createClient()

  const { data: liquidacion, error } = await supabase
    .from('liquidaciones_semanales')
    .select('archivo_path')
    .eq('id', liquidacionId)
    .single()

  if (error || !liquidacion?.archivo_path) {
    return {
      error:
        'La liquidación todavía no tiene un Excel generado.',
    }
  }

  const { data: signed, error: errorSigned } =
    await supabase.storage
      .from('documentos')
      .createSignedUrl(
        liquidacion.archivo_path,
        60
      )

  if (errorSigned) {
    return {
      error: errorSigned.message,
    }
  }

  return {
    data: signed.signedUrl,
  }
}