import { obtenerEmpresa } from '@/lib/services/empresa'
import {
  obtenerUmbralCajaBaja,
  obtenerValorHora,
} from '@/lib/services/configuracion'

import FormularioEmpresa from './formulario-empresa'
import FormularioUmbral from './formulario-umbral'
import FormularioValorHora from './formulario-valor-hora'

export default async function ConfiguracionPage() {
  const { data: empresa } =
    await obtenerEmpresa()

  const umbralActual =
    await obtenerUmbralCajaBaja()

  const valorHora =
    await obtenerValorHora()

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">
        Configuración
      </h1>

      <p className="mb-6 text-sm text-gray-500">
        Configuración general del sistema,
        empresa, caja y trabajadores.
      </p>

      <FormularioEmpresa
        empresa={empresa ?? null}
      />

      <h2 className="mb-1 mt-8 text-lg font-semibold text-gray-900">
        Fichaje y pagos
      </h2>

      <p className="mb-4 text-sm text-gray-500">
        Configurá cuánto se paga por cada hora
        trabajada.
      </p>

      <FormularioValorHora
        valorActual={valorHora}
      />

      <h2 className="mb-1 mt-8 text-lg font-semibold text-gray-900">
        Alertas de caja
      </h2>

      <FormularioUmbral
        umbralActual={umbralActual}
      />
    </div>
  )
}