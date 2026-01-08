import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";
import type { User, UserApiResponse } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from 'react-i18next';
import { getRoleName } from "../../../utils/jwtHelper";

function getRoleOptions(t: (key: string) => string): { value: string; label: string }[] {
  return [
    { value: "", label: t('roles.allRoles') },
    { value: "Admin", label: t('roles.admin') },
    { value: "Researcher", label: t('roles.researcher') },
    { value: "Lab Technician", label: t('roles.technician') },
  ];
}

// Helper function to get user role name (prioritize role string over roleId)
function getUserRoleName(user: User): string {
  // Priority 1: Use role string if available
  if (user.role && typeof user.role === 'string') {
    return user.role;
  }
  // Priority 2: Fall back to roleId
  return getRoleName(user.roleId);
}

const PAGE_SIZE = 10;

export default function DashboardAdmin() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    roleId: 2, 
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/api/user?pageNumber=${page}&pageSize=${PAGE_SIZE}`
      );
      const data = res.data as UserApiResponse;
      setUsers(data.data || []);
      setTotal(Number(data.totalCount) || 0);
      setTotalPages(Number(data.pageCount) || 1);
    } catch {
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    void fetchUsers();
  }, [page]);

  const filteredUsers = users
    .filter((u) => u.id !== user?.id)
    .filter((u) => {
      const matchesSearch =
        (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || getUserRoleName(u) === roleFilter;
      const matchesStatus = !statusFilter || statusFilter === "active";
      return matchesSearch && matchesRole && matchesStatus;
    });

  const adminCount = users.filter((u) => getUserRoleName(u).toLowerCase() === 'admin').length;
  const researcherCount = users.filter((u) => getUserRoleName(u).toLowerCase() === 'researcher').length;
  const technicianCount = users.filter((u) => getUserRoleName(u).toLowerCase() === 'lab technician').length;

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      await axiosInstance.put("/api/user", editUser);
      setShowEditModal(false);
      setEditUser(null);
      await fetchUsers();
      setPage(1);
      enqueueSnackbar(t('user.userUpdated'), {
        variant: "success",
        autoHideDuration: 3000,
        preventDuplicate: true,
      });
    } catch (error) {
      console.log(error);
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        t('user.userUpdateFailed');

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    }
  };
  
  const handleAddUser = async () => {
    try {
      await axiosInstance.post("/api/authentication/register", newUser);
      setShowAddModal(false);
      setNewUser({ name: "", email: "", phoneNumber: "", roleId: 2 });
      await fetchUsers();
      setPage(1);
      enqueueSnackbar(t('user.userAdded'), {
        variant: "success",
        autoHideDuration: 3000,
        preventDuplicate: true,
      });
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        t('user.userAddFailed');

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete("/api/user", {
        data: { id: deleteTarget.id },
      });
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchUsers();
      enqueueSnackbar(t('user.userDeleted'), {
        variant: "success",
        autoHideDuration: 3000,
        preventDuplicate: true,
      });
    } catch (error) {
      console.log(error);
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        t('user.userDeleteFailed');

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    }
  };

  const getRoleBadgeClass = (roleName: string) => {
    const normalized = roleName.toLowerCase();
    if (normalized === 'admin') {
      return "bg-purple-100 text-purple-700";
    } else if (normalized === 'researcher') {
      return "bg-blue-100 text-blue-700";
    } else if (normalized === 'lab technician' || normalized === 'technician') {
      return "bg-green-100 text-green-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('user.userManagement')}
          </h1>
        </div>
        {/* Controls */}
        <div className="px-6 py-4 flex flex-wrap gap-4 items-center bg-white">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:border-transparent"
              placeholder={`${t('common.search')} ${t('common.name').toLowerCase()} ${t('common.or').toLowerCase()} ${t('common.email').toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-full px-4 py-2 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {getRoleOptions(t).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
            type="button"
          >
            <FaPlus /> {t('user.addUser')}
          </button>
        </div>
      </div>
      {/* Stats */}
      <div className="px-6 py-6 grid grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 text-sm font-medium">
            {t('user.totalUsers')}
          </div>
          <div className="text-2xl font-bold text-green-700">{total}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-purple-600 text-sm font-medium">{t('user.admins')}</div>
          <div className="text-2xl font-bold text-purple-700">{adminCount}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-blue-600 text-sm font-medium">{t('user.researchers')}</div>
          <div className="text-2xl font-bold text-blue-700">
            {researcherCount}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 text-sm font-medium">{t('user.technicians')}</div>
          <div className="text-2xl font-bold text-green-700">
            {technicianCount}
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.name')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.email')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.phone')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.role')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.createdAt')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                  <tr key={idx} className="border-t animate-pulse">
                    <td className="py-3 px-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </td>
                    <td className="px-4">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </td>
                    <td className="px-4">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </td>
                    <td className="px-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-4">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </td>
                    <td className="px-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 border-t">
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {user.phoneNumber ?? t('common.noPhoneNumber')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(getUserRoleName(user))}`}
                      >
                        {getUserRoleName(user)}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {user.createdDate
                        ? new Date(user.createdDate).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          className="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded transition"
                          title={t('common.edit')}
                          onClick={() => handleEdit(user)}
                          type="button"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition"
                          title={t('common.delete')}
                          onClick={() => handleDeleteClick(user.id, user.name)}
                          type="button"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
            <span>
              {t('user.showing')} {filteredUsers.length} {t('user.usersOutOf')} {total}{" "}
              {t('user.users')}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  ←
                </button>
              )}

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      page === pageNum
                        ? "bg-green-700 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {page < totalPages && (
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[350px]">
            <h2 className="text-lg font-bold mb-4">{t('user.editUser')}</h2>
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder={t('common.name')}
              value={editUser.name}
              onChange={(e) =>
                setEditUser((u) => (u ? { ...u, name: e.target.value } : u))
              }
            />
            <input
              className="border bg-gray-200 rounded px-3 py-2 w-full mb-2"
              placeholder={t('common.email')}
              value={editUser.email}
              disabled
            />
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder={t('common.phone')}
              value={editUser.phoneNumber || ""}
              onChange={(e) =>
                setEditUser((u) =>
                  u ? { ...u, phoneNumber: e.target.value } : u
                )
              }
            />
            <select
              className="border rounded px-3 py-2 w-full mb-4"
              value={editUser.roleId}
              onChange={(e) =>
                setEditUser((u) =>
                  u ? { ...u, roleId: parseInt(e.target.value) } : u
                )
              }
            >
              <option value={2}>{t('roles.researcher')}</option>
              <option value={3}>{t('roles.technician')}</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowEditModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  void handleSaveEdit();
                }}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[350px]">
            <h2 className="text-lg font-bold mb-4">{t('user.addUser')}</h2>
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder={t('common.name')}
              value={newUser.name}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, name: e.target.value }))
              }
            />
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder={t('common.email')}
              value={newUser.email}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, email: e.target.value }))
              }
            />
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder={t('common.phone')}
              value={newUser.phoneNumber}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, phoneNumber: e.target.value }))
              }
            />
            <select
              className="border rounded px-3 py-2 w-full mb-4"
              value={newUser.roleId}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, roleId: parseInt(e.target.value) }))
              }
            >
              <option value={0}>{t('common.selectRole')}</option>
              <option value={2}>{t('roles.researcher')}</option>
              <option value={3}>{t('roles.technician')}</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowAddModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => {
                  void handleAddUser();
                }}
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[350px]">
            <h2 className="text-lg font-bold mb-4 text-red-700">
              {t('user.deleteUser')}
            </h2>
            <p>
              {t('user.deleteUserConfirm')}
            </p>
            <p className="font-semibold mt-2">{deleteTarget.name}</p>
            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowDeleteModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => {
                  void handleDeleteUser();
                }}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}