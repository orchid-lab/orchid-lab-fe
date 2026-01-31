/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-x/no-array-index-key */
import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
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

function getUserRoleName(user: User): string {
  if (user.role && typeof user.role === 'string') {
    return user.role;
  }
  return getRoleName(user.roleId);
}

const PAGE_SIZE = 10;

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  hover: { scale: 1.03, transition: { duration: 0.2 } }
};

const rowVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

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
    
    // Validation
    if (!editUser.name.trim()) {
      enqueueSnackbar(t('user.nameRequired') || 'Name is required', {
        variant: "error",
        autoHideDuration: 3000,
      });
      return;
    }
    
    if (editUser.roleId === 0) {
      enqueueSnackbar(t('user.roleRequired') || 'Please select a role', {
        variant: "error",
        autoHideDuration: 3000,
      });
      return;
    }
    
    try {
      const { email, avatarUrl, ...userDataToUpdate } = editUser;
      await axiosInstance.put("/api/user", userDataToUpdate);
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
    // Client-side validation
    if (!newUser.name.trim()) {
      enqueueSnackbar(t('user.nameRequired') || 'Name is required', {
        variant: "error",
        autoHideDuration: 3000,
      });
      return;
    }
    
    if (newUser.roleId === 0) {
      enqueueSnackbar(t('user.roleRequired') || 'Please select a role', {
        variant: "error",
        autoHideDuration: 3000,
      });
      return;
    }

    try {
      await axiosInstance.post("/api/authentication/register", newUser);
      setShowAddModal(false);
      setNewUser({ name: "", phoneNumber: "", roleId: 2 });
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
    <motion.main 
      className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50"
      initial="initial"
      animate="animate"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="bg-white shadow-sm border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="px-6 py-4 flex justify-between items-center">
          <motion.h1 
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {t('user.userManagement')}
          </motion.h1>
        </div>
        {/* Controls */}
        <motion.div 
          className="px-6 py-4 flex flex-wrap gap-4 items-center bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="relative flex-1 min-w-[200px]"
            whileHover={{ scale: 1.01 }}
          >
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:border-transparent transition-all"
              placeholder={`${t('common.search')} ${t('common.name').toLowerCase()} ${t('common.or').toLowerCase()} ${t('common.email').toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </motion.div>
          <motion.select
            className="border border-gray-300 rounded-full px-4 py-2 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {getRoleOptions(t).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </motion.select>

          <motion.button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus /> {t('user.addUser')}
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <div className="px-6 py-6 grid grid-cols-4 gap-4">
        {[
          { label: t('user.totalUsers'), value: total, color: 'green' },
          { label: t('user.admins'), value: adminCount, color: 'purple' },
          { label: t('user.researchers'), value: researcherCount, color: 'blue' },
          { label: t('user.technicians'), value: technicianCount, color: 'green' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            className={`bg-${stat.color}-50 p-4 rounded-lg`}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ delay: idx * 0.1 }}
          >
            <div className={`text-${stat.color}-600 text-sm font-medium`}>
              {stat.label}
            </div>
            <motion.div 
              className={`text-2xl font-bold text-${stat.color}-700`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 + 0.3, type: "spring" }}
            >
              {stat.value}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        <motion.div 
          className="bg-white rounded-lg shadow overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                {[
                  t('common.name'),
                  t('common.email'),
                  t('common.phone'),
                  t('common.role'),
                  t('common.createdAt'),
                  t('common.action')
                ].map((header, idx) => (
                  <motion.th
                    key={idx}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                  >
                    {header}
                  </motion.th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                    <motion.tr 
                      key={idx} 
                      className="border-t animate-pulse"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
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
                    </motion.tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      {t('common.noData')}
                    </td>
                  </motion.tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <motion.tr 
                      key={user.id} 
                      className="hover:bg-gray-50 border-t"
                      variants={rowVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ backgroundColor: "#f9fafb" }}
                    >
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
                        <motion.span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(getUserRoleName(user))}`}
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          {getUserRoleName(user)}
                        </motion.span>
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
                          <motion.button
                            className="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded transition"
                            title={t('common.edit')}
                            onClick={() => handleEdit(user)}
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FaEdit />
                          </motion.button>
                          <motion.button
                            className="bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition"
                            title={t('common.delete')}
                            onClick={() => handleDeleteClick(user.id, user.name)}
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FaTrash />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div 
            className="flex justify-between items-center text-sm text-gray-600 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span>
              {t('user.showing')} {filteredUsers.length} {t('user.usersOutOf')} {total}{" "}
              {t('user.users')}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <motion.button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ←
                </motion.button>
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
                  <motion.button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      page === pageNum
                        ? "bg-green-700 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}

              {page < totalPages && (
                <motion.button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  →
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editUser && (
          <motion.div 
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div 
              className="bg-white p-6 rounded shadow-lg w-[350px]"
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <h2 className="text-lg font-bold mb-4">{t('user.editUser')}</h2>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.name')} *
                </label>
                <input
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.name')}
                  value={editUser.name}
                  onChange={(e) =>
                    setEditUser((u) => (u ? { ...u, name: e.target.value } : u))
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.phone')}
                </label>
                <input
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.phone')}
                  value={editUser.phoneNumber ?? ""}
                  onChange={(e) =>
                    setEditUser((u) =>
                      u ? { ...u, phoneNumber: e.target.value } : u
                    )
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.role')} *
                </label>
                <select
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editUser.roleId}
                  onChange={(e) =>
                    setEditUser((u) =>
                      u ? { ...u, roleId: parseInt(e.target.value) } : u
                    )
                  }
                  required
                >
                  <option value={2}>{t('roles.researcher')}</option>
                  <option value={3}>{t('roles.technician')}</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowEditModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('common.cancel')}
                </motion.button>
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => {
                    void handleSaveEdit();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('common.save')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div 
              className="bg-white p-6 rounded shadow-lg w-[350px]"
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <h2 className="text-lg font-bold mb-4">{t('user.addUser')}</h2>
              <input
                className="border rounded px-3 py-2 w-full mb-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={`${t('common.name')} *`}
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, name: e.target.value }))
                }
                required
              />
              <input
                className="border rounded px-3 py-2 w-full mb-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={t('common.phone')}
                value={newUser.phoneNumber}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, phoneNumber: e.target.value }))
                }
              />
              <select
                className="border rounded px-3 py-2 w-full mb-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={newUser.roleId}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, roleId: parseInt(e.target.value) }))
                }
                required
              >
                <option value={0}>{t('common.selectRole')} *</option>
                <option value={2}>{t('roles.researcher')}</option>
                <option value={3}>{t('roles.technician')}</option>
              </select>
              <div className="flex gap-2 justify-end">
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({ name: "", phoneNumber: "", roleId: 2 });
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('common.cancel')}
                </motion.button>
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => {
                    void handleAddUser();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('common.add')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && deleteTarget && (
          <motion.div 
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div 
              className="bg-white p-6 rounded shadow-lg w-[350px]"
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <h2 className="text-lg font-bold mb-4 text-red-700">
                {t('user.deleteUser')}
              </h2>
              <p>
                {t('user.deleteUserConfirm')}
              </p>
              <p className="font-semibold mt-2">{deleteTarget.name}</p>
              <div className="flex gap-2 justify-end mt-6">
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowDeleteModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('common.cancel')}
                </motion.button>
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => {
                    void handleDeleteUser();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('common.delete')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}