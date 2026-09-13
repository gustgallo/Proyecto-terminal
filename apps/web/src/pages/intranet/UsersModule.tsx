/**
 * ============================================================================
 * MÓDULO DE ADMINISTRACIÓN DE USUARIOS Y PERMISOS (PRODISA INTRANET)
 * ============================================================================
 * Este componente permite al Administrador Global (ADMIN_GLOBAL) realizar la
 * gestión completa (CRUD) de los usuarios del sistema:
 *   - C (Create): Crear un nuevo usuario con rol y departamento.
 *   - R (Read): Listar todos los usuarios y sus roles asignados.
 *   - U (Update): Editar información personal, cambiar rol o actualizar contraseña.
 *   - D (Delete): Eliminar permanentemente un usuario (con protección de autosuspensión).
 *   - Toggle Status: Desactivar/activar momentáneamente la cuenta de un usuario.
 * 
 * Diseñado para ser fácil de entender y mantener por desarrolladores Junior.
 */

import React, { useState, useEffect } from 'react';
// Importamos los iconos corporativos desde Lucide React para la interfaz
import { Users, Plus, CheckCircle, XCircle, Edit, Trash2, Power, X, Save, AlertTriangle } from 'lucide-react';
// Cliente HTTP pre-configurado con Axios e interceptores para enviar el token JWT
import api from '../../services/api';
// Contexto de autenticación para consultar los datos del usuario en sesión
import { useAuth } from '../../context/AuthContext';

/**
 * Interface que define la estructura de datos de un Usuario retornado por la API.
 */
interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  department: string;
  role_id: number;
  role_code?: string;
  role_name?: string;
  is_active: boolean | number;
  created_at?: string;
}

/**
 * Interface que define la estructura de datos de un Rol en el sistema (roles de MariaDB).
 */
interface RoleData {
  id: number;
  code: string;
  name: string;
  user_type: string;
  description?: string;
}

export const UsersModule: React.FC = () => {
  // 1. OBTENCIÓN DEL USUARIO EN SESIÓN
  // Extraemos el usuario actual para verificar si tiene permisos de Administrador Global (ADMIN_GLOBAL)
  const { user: currentUser } = useAuth();
  const isGlobalAdmin = currentUser?.roleCode === 'ADMIN_GLOBAL';

  // 2. ESTADOS DE DATOS (LISTAS)
  // Almacena el listado de usuarios cargados desde el servidor
  const [usersList, setUsersList] = useState<UserData[]>([]);
  // Almacena el catálogo de roles disponibles (Administrador Global, RRHH, Producción, etc.)
  const [rolesList, setRolesList] = useState<RoleData[]>([]);
  // Estado para controlar el spinner de carga inicial de la tabla
  const [loading, setLoading] = useState(true);

  // 3. ESTADOS DE CONTROL DE MODALES (VENTANAS EMERGENTES)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Almacena el usuario seleccionado sobre el cual se ejecutará una acción (Editar o Eliminar)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // 4. ESTADO DEL FORMULARIO (Campos compartidos entre Crear y Editar)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    roleId: 0,
    password: '',
  });

  // 5. ESTADOS DE RETROALIMENTACIÓN AL USUARIO (Carga, Errores y Éxito)
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /**
   * Hook useEffect: Se ejecuta automáticamente cuando el componente se monta por primera vez.
   * Carga la lista de usuarios y el catálogo de roles en paralelo si el usuario es ADMIN_GLOBAL.
   */
  useEffect(() => {
    if (isGlobalAdmin) {
      fetchUsers();
      fetchRoles();
    } else {
      setLoading(false);
    }
  }, [isGlobalAdmin]);

  // Si el usuario no es Administrador Global (por ejemplo, RRHH), mostramos pantalla de Acceso Restringido
  if (!isGlobalAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 my-12 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Acceso Restringido a Usuarios & Permisos</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Esta sección está reservada exclusivamente para el **Administrador Global**. Los usuarios con rol de RRHH u otros departamentos no tienen permisos para visualizar los roles, credenciales ni lista de usuarios.
        </p>
      </div>
    );
  }

  /**
   * Función para consultar todos los usuarios mediante el endpoint GET /users.
   */
  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsersList(response.data.users || []);
    } catch (err) {
      console.error('Error al cargar la lista de usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para consultar el catálogo de roles mediante el endpoint GET /roles.
   * Estos roles alimentan las opciones del selector (dropdown) en los modales.
   */
  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      const roles = response.data.roles || [];
      setRolesList(roles);
    } catch (err) {
      console.error('Error al consultar los roles disponibles:', err);
    }
  };

  /**
   * Limpia los campos del formulario y reinicia los mensajes de error o éxito.
   */
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      roleId: rolesList.length > 0 ? rolesList[0].id : 0,
      password: '',
    });
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  /**
   * Prepara y abre el modal para crear un nuevo usuario.
   */
  const handleOpenCreateModal = () => {
    resetForm();
    // Aseguramos refrescar los roles si por alguna razón no se habían cargado
    if (rolesList.length === 0) {
      fetchRoles();
    } else {
      setFormData((prev) => ({ ...prev, roleId: rolesList[0].id }));
    }
    setIsCreateModalOpen(true);
  };

  /**
   * Prepara y abre el modal para editar un usuario existente, pre-llenando sus campos.
   */
  const handleOpenEditModal = (u: UserData) => {
    setSelectedUser(u);
    setFormData({
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      email: u.email || '',
      phone: u.phone || '',
      department: u.department || '',
      roleId: u.role_id || (rolesList.length > 0 ? rolesList[0].id : 0),
      password: '', // Se deja vacío; si no se llena, la contraseña no cambia
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditModalOpen(true);
  };

  /**
   * Abre el modal de confirmación antes de eliminar un usuario.
   */
  const handleOpenDeleteModal = (u: UserData) => {
    setSelectedUser(u);
    setErrorMsg(null);
    setIsDeleteModalOpen(true);
  };

  /**
   * Envía la solicitud POST /users a la API PHP para registrar un nuevo usuario.
   */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roleId <= 0) {
      setErrorMsg('Por favor selecciona un rol de acceso válido.');
      return;
    }

    setSubmitLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/users', formData);
      setSuccessMsg('¡Usuario registrado exitosamente en el sistema!');
      setTimeout(() => {
        setIsCreateModalOpen(false);
        resetForm();
        fetchUsers();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'No se pudo crear el usuario. Revisa los datos ingresados.');
    } finally {
      setSubmitLoading(false);
    }
  };

  /**
   * Envía la solicitud PUT /users/{id} a la API PHP para guardar los cambios de un usuario.
   */
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (formData.roleId <= 0) {
      setErrorMsg('Por favor selecciona un rol de acceso válido.');
      return;
    }

    setSubmitLoading(true);
    setErrorMsg(null);
    try {
      await api.put(`/users/${selectedUser.id}`, formData);
      setSuccessMsg('¡Información de usuario actualizada correctamente!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        resetForm();
        setSelectedUser(null);
        fetchUsers();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'No se pudo actualizar la información del usuario.');
    } finally {
      setSubmitLoading(false);
    }
  };

  /**
   * Envía la solicitud DELETE /users/{id} a la API PHP para eliminar un usuario.
   */
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSubmitLoading(true);
    setErrorMsg(null);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'No se pudo eliminar el usuario seleccionado.');
    } finally {
      setSubmitLoading(false);
    }
  };

  /**
   * Envía la solicitud PATCH /users/{id}/toggle-status para alternar entre Activo e Inactivo.
   */
  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/users/${id}/toggle-status`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ocurrió un error al cambiar el estatus del usuario');
    }
  };

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: ENCABEZADO DE LA PÁGINA Y BOTÓN ACCIÓN PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" /> Administración de Usuarios y Permisos
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Gestión centralizada de credenciales, roles (RBAC) y asignación de departamentos.
          </p>
        </div>

        {/* Solo el Administrador Global (ADMIN_GLOBAL) puede ver el botón para crear un nuevo usuario */}
        {isGlobalAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </button>
        )}
      </div>

      {/* SECCIÓN 2: TABLA DE USUARIOS REGISTRADOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Usuario</th>
                <th className="p-4">Correo Electrónico</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">Rol Asignado</th>
                <th className="p-4">Departamento</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Cargando lista de usuarios...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No hay usuarios registrados en el sistema.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Nombre Completo y Badge del usuario actual */}
                    <td className="p-4 font-semibold text-white">
                      {u.first_name} {u.last_name}
                      {currentUser?.id === u.id && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-blue-400 border border-slate-700">
                          Tú (Sesión actual)
                        </span>
                      )}
                    </td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4 text-slate-400">{u.phone || '-'}</td>
                    {/* Badge distintivo del Rol */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded font-bold text-[10px] bg-blue-950 text-blue-400 border border-blue-800/40 inline-block">
                        {u.role_name || u.role_code}
                      </span>
                    </td>
                    <td className="p-4">{u.department}</td>
                    {/* Estado: Activo / Inactivo */}
                    <td className="p-4">
                      {u.is_active ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    {/* Botones de Acción (Solo para ADMIN_GLOBAL) */}
                    <td className="p-4 text-right space-x-2">
                      {isGlobalAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Editar */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 px-2.5 py-1 rounded bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Editar datos del usuario"
                          >
                            <Edit className="w-3.5 h-3.5" /> Editar
                          </button>

                          {/* Botón Desactivar/Activar */}
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            disabled={currentUser?.id === u.id}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                              currentUser?.id === u.id
                                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                                : 'text-slate-300 hover:text-white bg-slate-800 border-slate-700 hover:bg-slate-700 cursor-pointer'
                            }`}
                            title={
                              currentUser?.id === u.id
                                ? 'No puedes desactivar tu propia cuenta'
                                : u.is_active
                                ? 'Desactivar momentáneamente'
                                : 'Activar usuario'
                            }
                          >
                            <Power className="w-3.5 h-3.5" />
                            {u.is_active ? 'Desactivar' : 'Activar'}
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            onClick={() => handleOpenDeleteModal(u)}
                            disabled={currentUser?.id === u.id}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${
                              currentUser?.id === u.id
                                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                                : 'text-red-400 hover:text-red-300 bg-red-950/40 border-red-800/40 hover:bg-red-900/40 cursor-pointer'
                            }`}
                            title={
                              currentUser?.id === u.id
                                ? 'No puedes eliminar tu propia cuenta'
                                : 'Eliminar usuario'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Lectura únicamente</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: CREAR NUEVO USUARIO                                         */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-slate-100">
            {/* Botón X de Cierre */}
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado del Modal */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/40">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Crear Nuevo Usuario</h2>
                <p className="text-xs text-slate-400">Ingresa los datos del empleado para otorgarle acceso a la intranet.</p>
              </div>
            </div>

            {/* Alertas de Error o Éxito */}
            {errorMsg && (
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> {successMsg}
              </div>
            )}

            {/* Formulario de Registro */}
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ej. Carlos"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ej. Mendoza"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="carlos.mendoza@prodisa.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Teléfono (Opcional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="5512345678"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Departamento *</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ej. Producción, RRHH"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SELECTOR DE ROL CON ESTILOS CORREGIDOS */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Rol de Acceso *</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    {rolesList.length === 0 ? (
                      <option value={0} disabled className="bg-slate-900 text-slate-400">
                        Cargando roles de la base de datos...
                      </option>
                    ) : (
                      rolesList.map((r) => (
                        <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100 py-1 font-medium">
                          {r.name} ({r.code})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Contraseña Inicial *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              {/* Botones de acción del Formulario */}
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {submitLoading ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: EDITAR USUARIO EXISTENTE                                   */}
      {/* ==================================================================== */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-slate-100">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/40">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Editar Usuario</h2>
                <p className="text-xs text-slate-400">Modifica los datos del usuario ID: #{selectedUser.id}</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Departamento *</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SELECTOR DE ROL AL EDITAR CON ESTILOS CORREGIDOS */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Rol de Acceso *</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100 py-1 font-medium">
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Nueva Contraseña (Opcional)</label>
                  <input
                    type="password"
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Dejar en blanco para mantener actual"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {submitLoading ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: CONFIRMAR ELIMINACIÓN DE USUARIO                           */}
      {/* ==================================================================== */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0d121f] border border-red-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative text-slate-100">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-950 text-red-400 border border-red-800/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">¿Eliminar usuario permanentemente?</h2>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
              Vas a eliminar al usuario <strong className="text-white">{selectedUser.first_name} {selectedUser.last_name}</strong> ({selectedUser.email}).
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={submitLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> {submitLoading ? 'Eliminando...' : 'Sí, eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
