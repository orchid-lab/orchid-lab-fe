import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";
import type { User, UserApiResponse } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useAuth } from "../../../context/AuthContext";

const roleOptions: { value: string; label: string }[] = [
  { value: "", label: "Tất cả vai trò" },
  { value: "Admin", label: "Admin" },
  { value: "Researcher", label: "Researcher" },
  { value: "Technician", label: "Technician" },
];

const PAGE_SIZE = 10;

export default function DashboardAdmin() {
  const { user } = useAuth();
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
    role: "Researcher", 
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
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter || statusFilter === "active";
      return matchesSearch && matchesRole && matchesStatus;
    });

  const adminCount = users.filter((u) => u.role === "Admin").length;
  const researcherCount = users.filter((u) => u.role === "Researcher").length;
  const technicianCount = users.filter((u) => u.role === "Lab Technician").length;

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
      enqueueSnackbar("Cập nhật người dùng thành công!", {
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
        "Cập nhật người dùng thất bại!";

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
      setNewUser({ name: "", email: "", phoneNumber: "", role: "Researcher" });
      await fetchUsers();
      setPage(1);
      enqueueSnackbar("Tạo người dùng thành công!", {
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
        "Tạo người dùng thất bại!";

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
      enqueueSnackbar("Xóa người dùng thành công!", {
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
        "Xóa người dùng thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    }
  };

  // lấy màu badge theo role
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-700";
      case "Researcher":
        return "bg-blue-100 text-blue-700";
      case "Technician":
      case "Lab Technician":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Người dùng
          </h1>
        </div>
        {/* Controls */}
        <div className="px-6 py-4 flex flex-wrap gap-4 items-center bg-white">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:border-transparent"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-full px-4 py-2 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {roleOptions.map((opt) => (
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
            <FaPlus /> Thêm người dùng
          </button>
        </div>
      </div>
      {/* Stats */}
      <div className="px-6 py-6 grid grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 text-sm font-medium">
            TỔNG NGƯỜI DÙNG
          </div>
          <div className="text-2xl font-bold text-green-700">{total}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-purple-600 text-sm font-medium">ADMINS</div>
          <div className="text-2xl font-bold text-purple-700">{adminCount}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-blue-600 text-sm font-medium">RESEARCHERS</div>
          <div className="text-2xl font-bold text-blue-700">
            {researcherCount}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 text-sm font-medium">TECHNICIANS</div>
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
                  Tên
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
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
                    Không có người dùng nào phù hợp.
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
                      {user.phoneNumber ?? "Chưa có số điện thoại"}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(user.role)}`}
                      >
                        {user.role}
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
                          title="Chỉnh sửa"
                          onClick={() => handleEdit(user)}
                          type="button"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition"
                          title="Xóa"
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
              Hiển thị {filteredUsers.length} người dùng trên tổng số {total}{" "}
              người dùng
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
            <h2 className="text-lg font-bold mb-4">Chỉnh sửa người dùng</h2>
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Tên"
              value={editUser.name}
              onChange={(e) =>
                setEditUser((u) => (u ? { ...u, name: e.target.value } : u))
              }
            />
            <input
              className="border bg-gray-200 rounded px-3 py-2 w-full mb-2"
              placeholder="Email"
              value={editUser.email}
              disabled
            />
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Số điện thoại"
              value={editUser.phoneNumber || ""}
              onChange={(e) =>
                setEditUser((u) =>
                  u ? { ...u, phoneNumber: e.target.value } : u
                )
              }
            />
            <select
              className="border rounded px-3 py-2 w-full mb-4"
              value={editUser.role}
              onChange={(e) =>
                setEditUser((u) =>
                  u ? { ...u, role: e.target.value } : u
                )
              }
            >
              <option value="Researcher">Researcher</option>
              <option value="Lab Technician">Lab Technician</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  void handleSaveEdit();
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[350px]">
            <h2 className="text-lg font-bold mb-4">Thêm người dùng mới</h2>
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Tên"
              value={newUser.name}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, name: e.target.value }))
              }
            />
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, email: e.target.value }))
              }
            />
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Số điện thoại"
              value={newUser.phoneNumber}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, phoneNumber: e.target.value }))
              }
            />
            <select
              className="border rounded px-3 py-2 w-full mb-4"
              value={newUser.role}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, role: e.target.value }))
              }
            >
              <option value="">Chọn vai trò</option>
              <option value="Researcher">Researcher</option>
              <option value="Lab Technician">Lab Technician</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowAddModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => {
                  void handleAddUser();
                }}
              >
                Thêm
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
              Xác nhận xóa
            </h2>
            <p>
              Bạn có chắc muốn xóa{" "}
              <span className="font-semibold">{deleteTarget.name}</span> không?
            </p>
            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => {
                  void handleDeleteUser();
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}