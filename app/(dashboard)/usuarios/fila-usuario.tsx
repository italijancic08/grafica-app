'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { editarUsuario } from '@/lib/services/usuarios'
import type { Rol, Usuario } from '@/lib/types/usuario'
import BotonEliminarUsuario from './boton-eliminar-usuario'

export default function FilaUsuario({
  usuario,
  esPropio,
}: {
  usuario: Usuario
  esPropio: boolean
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState(usuario.nombre)
  const [email, setEmail] = useState(usuario.email)
  const [rol, setRol] = useState<Rol>(usuario.rol)
  const [activo, setActivo] = useState(usuario.activo)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  function abrir() {
    setNombre(usuario.nombre)
    setEmail(usuario.email)
    setRol(usuario.rol)
    setActivo(usuario.activo)
    setPassword('')
    setError(null)
    setAbierto(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const resultado = await editarUsuario(usuario.id, {
        nombre,
        email,
        rol,
        activo,
        password,
      })

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setPassword('')
      setAbierto(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-2">{usuario.nombre}</td>
        <td className="px-4 py-2">{usuario.email}</td>
        <td className="px-4 py-2 capitalize">{usuario.rol}</td>
        <td className="px-4 py-2">{usuario.activo ? 'Sí' : 'No'}</td>
        <td className="px-4 py-2 text-right">
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => (abierto ? setAbierto(false) : abrir())}
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              {abierto ? 'Cerrar' : 'Editar'}
            </button>
            <BotonEliminarUsuario
              id={usuario.id}
              nombre={usuario.nombre}
              esPropio={esPropio}
            />
          </div>
        </td>
      </tr>

      {abierto && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-4 py-3">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Nombre</label>
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Rol</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as Rol)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="empleado">Empleado</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Vacío = no cambiar"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 pb-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={activo}
                  disabled={esPropio}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                Activo
              </label>

              <button
                type="submit"
                disabled={cargando}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : 'Guardar cambios'}
              </button>

              {error && <p className="w-full text-sm text-red-600">{error}</p>}
            </form>
          </td>
        </tr>
      )}
    </>
  )
}