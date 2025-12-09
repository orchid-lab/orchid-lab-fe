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

function getRoleName(roleID: number) {
  switch (roleID) {
    case 1:
      return "Admin";
    case 2:
      return "Researcher";
    case 3:
      return "Technician";
    default:
      return "Khác";
  }
}

const PAGE_SIZE = 5;

export default function DashboardAdmin() {
  const { user } = useAuth();
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    roleID: 0,
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
        (u.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || getRoleName(u.roleID) === roleFilter;
      // Nếu có status thực tế thì sửa lại dòng dưới
      const matchesStatus = !statusFilter || statusFilter === "active";
      return matchesSearch && matchesRole && matchesStatus;
    });

  // Stats
  // const active = users.length; // Nếu có status thực tế thì filter theo status
  // const inactive = 0; // Nếu có status thực tế thì filter theo status
  const adminCount = users.filter((u) => u.roleID === 1).length;
  const researcherCount = users.filter((u) => u.roleID === 2).length;
  const technicianCount = users.filter((u) => u.roleID === 3).length;

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
      setPage(1); // Reload lại danh sách
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
      await axiosInstance.post("/api/user", newUser);
      setShowAddModal(false);
      setNewUser({ name: "", email: "", phoneNumber: "", roleID: 0 });
      // Reload lại danh sách
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
          {/* <select
            className="border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select> */}
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
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-green-600 text-sm font-medium">TECHNICIANS</div>
          <div className="text-2xl font-bold text-green-700">
            {technicianCount}
          </div>
        </div>
        {/* <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-yellow-600 text-sm font-medium">
            KHÔNG HOẠT ĐỘNG
          </div>
          <div className="text-2xl font-bold text-yellow-700">{inactive}</div>
        </div> */}
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                  // eslint-disable-next-line react-x/no-array-index-key
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
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Không có người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {user.phoneNumber ?? "Chưa có số điện thoại"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold role-badge ${
                          user.roleID === 1
                            ? "bg-purple-100 text-purple-700"
                            : user.roleID === 2
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {getRoleName(user.roleID)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {user.create_at
                        ? new Date(user.create_at).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </td>
                    {/* <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold status-badge ${
                          user. === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {user.status === "active"
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </span>
                    </td> */}
                    <td className="px-3 py-2 whitespace-nowrap text-sm flex gap-1">
                      <button
                        className="action-btn btn-edit bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition"
                        title="Chỉnh sửa"
                        onClick={() => handleEdit(user)}
                        type="button"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn btn-delete bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-2 py-1 rounded transition"
                        title="Xóa"
                        onClick={() =>
                          void handleDeleteClick(user.id, user.name)
                        }
                        type="button"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages >= 1 && (
          <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
            <span>
              Hiển thị {filteredUsers.length} người dùng trên tổng số {total}{" "}
              người dùng
            </span>
            <div className="flex gap-2">
              {/* Previous button */}
              {page > 1 && (
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  ←
                </button>
              )}

              {/* Page numbers (tối đa 5 số, giống task) */}
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

              {/* Next button */}
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
              onChange={(e) =>
                setEditUser((u) => (u ? { ...u, email: e.target.value } : u))
              }
            />
            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Số điện thoại"
              value={editUser.phoneNumber}
              onChange={(e) =>
                setEditUser((u) =>
                  u ? { ...u, phoneNumber: e.target.value } : u
                )
              }
            />
            <select
              className="border rounded px-3 py-2 w-full mb-4"
              value={editUser.roleID}
              onChange={(e) =>
                setEditUser((u) =>
                  u ? { ...u, roleID: Number(e.target.value) } : u
                )
              }
            >
              <option value={1}>Admin</option>
              <option value={2}>Researcher</option>
              <option value={3}>Technician</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded"
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
              value={newUser.roleID}
              onChange={(e) =>
                setNewUser((u) => ({ ...u, roleID: Number(e.target.value) }))
              }
            >
              <option value={0}>Chọn vai trò</option>
              <option value={1}>Admin</option>
              <option value={2}>Researcher</option>
              <option value={3}>Technician</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowAddModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded"
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
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded"
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
