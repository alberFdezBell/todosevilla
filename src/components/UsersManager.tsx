"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date | string;
}

interface UsersManagerProps {
  initialUsers: User[];
}

export default function UsersManager({ initialUsers }: UsersManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = editingId ? `/api/usuarios/${editingId}` : "/api/usuarios";
      const method = editingId ? "PUT" : "POST";

      const bodyData: any = { email, role };
      // En edición de usuario, la contraseña es opcional
      if (!editingId || (password && password.trim() !== "")) {
        bodyData.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al guardar el usuario.");
      }

      if (editingId) {
        setUsers(users.map((u) => (u.id === editingId ? data : u)));
        setEditingId(null);
      } else {
        setUsers([...users, data].sort((a, b) => a.email.localeCompare(b.email)));
      }

      setEmail("");
      setPassword("");
      setRole("admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al procesar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEmail(user.email);
    setPassword(""); // Se deja vacío para indicar que no se quiere cambiar la pass
    setRole(user.role);
    setError("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEmail("");
    setPassword("");
    setRole("admin");
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      return;
    }
    setError("");

    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar el usuario.");
      }

      setUsers(users.filter((u) => u.id !== id));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al borrar el usuario.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">👥 Gestión de Usuarios</h1>
        <p className="text-slate-500 text-sm mt-1">
          Crea y administra las cuentas de administradores del panel.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 font-medium">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulario Crear/Editar */}
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-200/60 pb-2">
            {editingId ? "Editar Usuario" : "Nuevo Usuario"}
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@todosevilla.es"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Contraseña {editingId && <span className="text-[10px] text-slate-400 font-normal">(Vacío para no cambiar)</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingId}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
            >
              <option value="admin">Administrador</option>
              <option value="owner">Propietario de Negocio</option>
            </select>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm shadow-md shadow-blue-200 disabled:opacity-50"
            >
              {loading ? "Guardando..." : editingId ? "Guardar" : "Crear"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Listado de Usuarios */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">
            Usuarios registrados ({users.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Rol</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
