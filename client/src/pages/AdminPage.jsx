import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api, {
  getRoles,
  getPermissions,
  updateRolePermissions,
  getAllPayments,
} from "../api/api";
import {
  getUsers,
  createStaffUser,
  deleteUser,
  assignUserRole,
} from "../api/admin.api";
import { formatDate, formatPrice, getErrorMessage } from "../utils/formatters";
import ConfirmModal from "../components/ui/ConfirmModal";

function formatUptime(totalSeconds) {
  const sec = Number(totalSeconds || 0);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}д`);
  parts.push(`${hours}ч`, `${minutes}м`, `${seconds}с`);
  return parts.join(" ");
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [usersSuccess, setUsersSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "instructor",
    bio: "",
    specialization: "",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Payments state
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);

  // System metrics state
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [responseTimeMs, setResponseTimeMs] = useState(null);

  const loadMetrics = async (silent = false) => {
    try {
      if (!silent) setLoadingMetrics(true);
      setMetricsError(null);
      const start = performance.now();
      const res = await api.get("/system/metrics");
      const elapsed = Math.round(performance.now() - start);
      setResponseTimeMs(elapsed);
      setMetrics(res?.data?.data || res?.data || res);
    } catch (err) {
      setMetricsError(getErrorMessage(err));
    } finally {
      if (!silent) setLoadingMetrics(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setUsersError(null);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter) params.role = roleFilter;

      const res = await getUsers(params);
      const list = Array.isArray(res)
        ? res
        : res?.data?.users || res?.data || res?.users || [];
      setUsers(list);
    } catch (err) {
      setUsersError(getErrorMessage(err));
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPayments = async () => {
    try {
      setLoadingPayments(true);
      setPaymentsError(null);
      const res = await getAllPayments();
      const list = Array.isArray(res)
        ? res
        : res?.data?.payments || res?.payments || res?.data || [];
      setPayments(list);
    } catch (err) {
      setPaymentsError(getErrorMessage(err));
    } finally {
      setLoadingPayments(false);
    }
  };

  // RBAC state
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loadingRbac, setLoadingRbac] = useState(false);
  const [rbacError, setRbacError] = useState(null);
  const [rolePermissionsMap, setRolePermissionsMap] = useState({});
  const [savingRoleId, setSavingRoleId] = useState(null);

  const loadRbacData = async () => {
    try {
      setLoadingRbac(true);
      setRbacError(null);
      const [rolesRes, permsRes] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);
      const rolesList = Array.isArray(rolesRes)
        ? rolesRes
        : rolesRes?.data || rolesRes?.roles || [];
      const permsList = Array.isArray(permsRes)
        ? permsRes
        : permsRes?.data || permsRes?.permissions || [];

      setRoles(rolesList);
      setPermissions(permsList);

      const map = {};
      rolesList.forEach((role) => {
        const pIds = new Set();
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach((p) => {
            if (typeof p === "object" && p !== null && p.id) {
              pIds.add(p.id);
            } else if (typeof p === "string" || typeof p === "number") {
              const found = permsList.find((x) => x.id === p || x.slug === p);
              if (found) pIds.add(found.id);
            }
          });
        }
        map[role.id] = pIds;
      });
      setRolePermissionsMap(map);
    } catch (err) {
      const msg = getErrorMessage(err);
      setRbacError(msg);
      toast.error(msg);
    } finally {
      setLoadingRbac(false);
    }
  };

  const handleTogglePermission = (roleId, permissionId) => {
    setRolePermissionsMap((prev) => {
      const currentSet = new Set(prev[roleId] || []);
      if (currentSet.has(permissionId)) {
        currentSet.delete(permissionId);
      } else {
        currentSet.add(permissionId);
      }
      return { ...prev, [roleId]: currentSet };
    });
  };

  const handleSaveRolePermissions = async (roleId) => {
    try {
      setSavingRoleId(roleId);
      const permissionIds = Array.from(rolePermissionsMap[roleId] || []);
      await updateRolePermissions(roleId, permissionIds);
      toast.success("Права роли успешно сохранены!");
      loadRbacData();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      toast.error(`Ошибка сохранения прав: ${errMsg}`);
    } finally {
      setSavingRoleId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "payments") {
      loadPayments();
    } else if (activeTab === "roles") {
      loadRbacData();
    } else if (activeTab === "system") {
      loadMetrics();
      const interval = setInterval(() => loadMetrics(true), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, searchQuery, roleFilter]);

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateSubmitting(true);
      setCreateError(null);
      await createStaffUser({
        email: createForm.email,
        password: createForm.password,
        full_name: createForm.full_name,
        role: createForm.role,
        bio: createForm.bio || undefined,
        specialization: createForm.specialization || undefined,
      });
      setShowCreateModal(false);
      setCreateForm({
        email: "",
        password: "",
        full_name: "",
        role: "instructor",
        bio: "",
        specialization: "",
      });
      toast.success("Сотрудник успешно создан!");
      loadUsers();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setCreateError(errMsg);
      toast.error(errMsg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const [userToDelete, setUserToDelete] = useState(null);

  const handleDeleteUser = async (userId, userEmail) => {
    setUserToDelete({ id: userId, email: userEmail });
  };

  const confirmDeleteUser = async () => {
    const target = userToDelete;
    setUserToDelete(null);
    if (!target) return;

    try {
      setUsersError(null);
      await deleteUser(target.id);
      toast.success("Пользователь успешно удален");
      loadUsers();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setUsersError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUsersError(null);
      await assignUserRole(userId, newRole);
      toast.success("Роль пользователя успешно обновлена");
      loadUsers();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setUsersError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Панель администратора
          </h1>
          <p className="text-slate-400 mt-1">
            Управление пользователями, ролями, платежами и мониторинг системы
          </p>
        </div>
      </div>

      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          👤 Пользователи
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("roles")}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "roles"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          🛡️ Роли и права
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "payments"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          💳 Все платежи
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "system"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          🖥️ Система
        </button>
      </div>

      {usersSuccess && (
        <div className="mb-6 p-4 bg-emerald-900/40 border border-emerald-700 text-emerald-200 rounded-xl text-sm">
          {usersSuccess}
        </div>
      )}
      {usersError && (
        <div className="mb-6 p-4 bg-red-900/40 border border-red-700 text-red-200 rounded-xl text-sm">
          {usersError}
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
              <input
                type="text"
                placeholder="Поиск по email или ФИО..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-48 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">Все роли</option>
                <option value="student">Студент</option>
                <option value="instructor">Преподаватель</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>+ Создать сотрудника</span>
            </button>
          </div>

          {loadingUsers ? (
            <div className="text-center py-12 text-slate-400">
              Загрузка пользователей...
            </div>
          ) : users.length === 0 ? (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
              Пользователи не найдены.
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">Пользователь</th>
                      <th className="p-4 font-semibold">Роль</th>
                      <th className="p-4 font-semibold">Дата регистрации</th>
                      <th className="p-4 font-semibold text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                    {users.map((u) => {
                      const roleVal = u.role?.name || u.role || "student";
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-semibold text-white">
                              {u.full_name || "Без имени"}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {u.email}
                            </div>
                            {u.specialization && (
                              <div className="text-indigo-400 text-xs mt-0.5">
                                Специализация: {u.specialization}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <select
                              value={roleVal}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value)
                              }
                              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="student">student</option>
                              <option value="instructor">instructor</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="p-4 text-slate-400 text-xs">
                            {formatDate(u.created_at || u.createdAt)}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-lg text-xs transition-colors"
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 my-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white">
                    Создать преподавателя / админа
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                {createError && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">
                    {createError}
                  </div>
                )}

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      ФИО *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      value={createForm.full_name}
                      onChange={handleCreateChange}
                      placeholder="Иван Иванов"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={createForm.email}
                      onChange={handleCreateChange}
                      placeholder="staff@course-platform.local"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Пароль *
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={createForm.password}
                      onChange={handleCreateChange}
                      placeholder="Минимум 6 символов"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Роль *
                    </label>
                    <select
                      name="role"
                      value={createForm.role}
                      onChange={handleCreateChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="instructor">Преподаватель</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                  {createForm.role === "instructor" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Специализация
                        </label>
                        <input
                          type="text"
                          name="specialization"
                          value={createForm.specialization}
                          onChange={handleCreateChange}
                          placeholder="Backend Development"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Биография
                        </label>
                        <textarea
                          name="bio"
                          rows={3}
                          value={createForm.bio}
                          onChange={handleCreateChange}
                          placeholder="О преподавателе..."
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={createSubmitting}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm"
                    >
                      {createSubmitting ? "Создание..." : "Создать"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Матрица ролей и прав доступа (RBAC)
              </h2>
              <p className="text-sm text-slate-400">
                Настройте атомарные права для ролей системы (admin, instructor,
                student).
              </p>
            </div>
            <button
              onClick={loadRbacData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all self-start md:self-auto flex items-center gap-2 border border-slate-700"
            >
              Обновить
            </button>
          </div>

          {rbacError && (
            <div className="p-4 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-sm">
              {rbacError}
            </div>
          )}

          {loadingRbac ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
              Загрузка ролей и прав...
            </div>
          ) : roles.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
              Роли не найдены
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {roles.map((role) => {
                const assignedSet = rolePermissionsMap[role.id] || new Set();
                const isSaving = savingRoleId === role.id;

                return (
                  <div
                    key={role.id}
                    className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="mb-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/50">
                          {role.name}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-2">
                          {role.display_name || role.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mb-6">
                        {role.description || "Системная роль платформы."}
                      </p>

                      <div className="space-y-3 mb-6">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                          Права доступа ({assignedSet.size} /{" "}
                          {permissions.length})
                        </div>
                        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                          {permissions.map((perm) => {
                            const isChecked = assignedSet.has(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${isChecked ? "bg-slate-800/80 border-indigo-500/50 text-white" : "bg-slate-950/40 border-slate-800 text-slate-400"}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    handleTogglePermission(role.id, perm.id)
                                  }
                                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                />
                                <div className="text-xs">
                                  <div className="font-medium text-slate-200">
                                    {perm.slug || perm.code}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {perm.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {isSaving
                          ? "Сохранение..."
                          : `Выбрано: ${assignedSet.size}`}
                      </span>
                      <button
                        onClick={() => handleSaveRolePermissions(role.id)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                      >
                        {isSaving ? "Сохранение..." : "Сохранить права"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div className="space-y-6">
          {paymentsError && (
            <div className="p-4 bg-red-900/40 border border-red-700 text-red-200 rounded-xl text-sm">
              {paymentsError}
            </div>
          )}

          {(() => {
            const successfulPayments = payments.filter(
              (p) => p.status === "succeeded" || p.status === "completed",
            );
            const totalRevenue = successfulPayments.reduce(
              (acc, p) => acc + Number(p.amount || 0),
              0,
            );
            const totalCount = payments.length;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">
                      Общая выручка (успешные)
                    </p>
                    <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">
                      {formatPrice(totalRevenue)}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">
                    💵
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">
                      Всего транзакций
                    </p>
                    <h3 className="text-3xl font-extrabold text-white mt-1">
                      {totalCount}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-bold">
                    📊
                  </div>
                </div>
              </div>
            );
          })()}

          {loadingPayments ? (
            <div className="text-center py-12 text-slate-400">
              Загрузка всех платежей...
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
              Транзакции не найдены.
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">
                        ID / Референс транзакции
                      </th>
                      <th className="p-4 font-semibold">Студент</th>
                      <th className="p-4 font-semibold">Курс</th>
                      <th className="p-4 font-semibold">Сумма</th>
                      <th className="p-4 font-semibold">Статус</th>
                      <th className="p-4 font-semibold">Дата оплаты</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                    {payments.map((p) => {
                      const ref = p.transaction_ref || p.id;
                      const studentName =
                        p.user?.full_name ||
                        p.student?.full_name ||
                        p.user_name ||
                        "Неизвестный студент";
                      const studentEmail =
                        p.user?.email ||
                        p.student?.email ||
                        p.user_email ||
                        "—";
                      const courseTitle =
                        p.enrollment?.course?.title || p.course?.title || "—";
                      const amountFormatted = formatPrice(p.amount);
                      const status = p.status;
                      const paidAtFormatted = formatDate(
                        p.paid_at || p.createdAt || p.created_at,
                      );

                      return (
                        <tr
                          key={p.id || ref}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-4 font-mono text-xs text-indigo-400">
                            {ref}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-white">
                              {studentName}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {studentEmail}
                            </div>
                          </td>
                          <td className="p-4 font-medium text-white">
                            {courseTitle}
                          </td>
                          <td className="p-4 font-semibold text-emerald-400">
                            {amountFormatted}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${
                                status === "succeeded" || status === "completed"
                                  ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                                  : status === "pending"
                                    ? "bg-amber-900/50 text-amber-300 border border-amber-700"
                                    : "bg-red-900/50 text-red-300 border border-red-700"
                              }`}
                            >
                              {status === "succeeded" || status === "completed"
                                ? "Успешно"
                                : status === "pending"
                                  ? "В обработке"
                                  : status === "failed"
                                    ? "Ошибка"
                                    : status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 text-xs">
                            {paidAtFormatted}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "system" && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Мониторинг и метрики сервера
              </h2>
              <p className="text-sm text-slate-400">
                Обновляется автоматически каждые 5 секунд{" "}
                {responseTimeMs !== null
                  ? `• Отклик API: ${responseTimeMs} мс`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadMetrics(false)}
              disabled={loadingMetrics}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all self-start sm:self-auto border border-slate-700"
            >
              {loadingMetrics ? "Обновление..." : "Обновить"}
            </button>
          </div>

          {metricsError && (
            <div className="p-4 bg-red-900/40 border border-red-700 text-red-200 rounded-xl text-sm">
              {metricsError}
            </div>
          )}

          {loadingMetrics && !metrics ? (
            <div className="text-center py-12 text-slate-400">
              Загрузка системных метрик...
            </div>
          ) : metrics ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                  <p className="text-sm font-medium text-slate-400">
                    Время работы (Uptime)
                  </p>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">
                    {formatUptime(metrics.uptime_seconds)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {metrics.uptime_seconds} сек.
                  </p>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                  <p className="text-sm font-medium text-slate-400">
                    Обработано запросов
                  </p>
                  <h3 className="text-2xl font-extrabold text-white mt-2">
                    {metrics.total_requests_served ?? 0}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    С момента запуска процесса
                  </p>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                  <p className="text-sm font-medium text-slate-400">
                    Память RSS / Heap Used
                  </p>
                  <h3 className="text-2xl font-extrabold text-indigo-400 mt-2">
                    {metrics.memory_usage?.rss_mb} МБ
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Heap: {metrics.memory_usage?.heap_used_mb} /{" "}
                    {metrics.memory_usage?.heap_total_mb} МБ
                  </p>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                  <p className="text-sm font-medium text-slate-400">
                    Среда выполнения
                  </p>
                  <h3 className="text-2xl font-extrabold text-white mt-2">
                    {metrics.node_version || "—"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Платформа: {metrics.platform || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-800/40">
                  <h3 className="text-sm font-semibold text-white">
                    Последние события аудита безопасности
                  </h3>
                </div>
                {Array.isArray(metrics.recent_audit_logs) &&
                metrics.recent_audit_logs.length > 0 ? (
                  <div className="divide-y divide-slate-800 text-xs font-mono">
                    {metrics.recent_audit_logs.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 text-slate-300 hover:bg-slate-800/30"
                      >
                        {typeof log === "string" ? log : JSON.stringify(log)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    Записи аудита отсутствуют.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      <ConfirmModal
        isOpen={userToDelete !== null}
        title="Удаление пользователя"
        message={`Вы уверены, что хотите удалить пользователя ${userToDelete?.email || ""}?`}
        onConfirm={confirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
}
