import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";
import type { User } from "../../types/Auth";
import { useSnackbar } from "notistack";

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

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState({
    id: user?.id ?? "",
    name: user?.name ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    roleId: user?.roleID ?? 0,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const infoChanged =
        editUser.name !== user?.name ||
        editUser.email !== user?.email ||
        editUser.phoneNumber !== user?.phoneNumber;

      // 1. Nếu có chỉnh sửa thông tin, gọi PUT /api/user
      if (infoChanged) {
        await axiosInstance.put("/api/user", editUser);
      }

      // 2. Nếu có cập nhật avatar, gọi POST /api/user/avatar
      if (avatarFile) {
        const formData = new FormData();
        formData.append("userId", editUser.id);
        formData.append("image", avatarFile);
        await axiosInstance.put("/api/user/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 3. Gọi lại API lấy user mới nhất
      const userRes = await axiosInstance.get<User>(`/api/user/${editUser.id}`);
      const updatedUser = userRes.data;
      updateUser(updatedUser);

      setIsEditing(false);
      setAvatarFile(null);
      enqueueSnackbar("Thông tin hồ sơ đã được cập nhật", {
        variant: "success",
        preventDuplicate: true,
        autoHideDuration: 2000,
      });
    } catch (error) {
      console.error(error);
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
        "Thông tin hồ sơ cập nhật thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cài đặt hồ sơ
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Quản lý thông tin cá nhân và cài đặt tài khoản của bạn
          </p>

          {/* Profile Picture and Role */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-24 h-24 ml-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-2xl font-bold relative">
              {isEditing ? (
                <label
                  className="w-full h-full flex items-center justify-center rounded-full bg-gray-200 relative cursor-pointer"
                  title="Đổi ảnh"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="User Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase()}</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  {/* Có thể thêm icon camera ở góc nếu muốn */}
                  <span className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow text-green-700">
                    <svg
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2.382a1 1 0 01-.894-.553l-.447-.894A1 1 0 0011.382 3H8.618a1 1 0 00-.894.553l-.447.894A1 1 0 016.382 5H4z" />
                    </svg>
                  </span>
                </label>
              ) : user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="ml-auto flex flex-col items-end">
              <span className="text-sm text-gray-500">Vai trò</span>
              <span className="text-base font-semibold text-green-700 bg-green-50 px-4 py-1 rounded-full border border-green-200 mt-1">
                {getRoleName(user?.roleID ?? 0)}
              </span>
            </div>
          </div>

          {/* Profile Information Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tên đầy đủ
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={editUser?.name ?? ""}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full border ${
                  isEditing
                    ? "border-gray-300 focus:ring-green-500 focus:border-green-500"
                    : "border-transparent bg-gray-100"
                } rounded-lg px-3 py-2 transition-colors`}
              />
            </div>
            {/* <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tên người dùng
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={user?.userName ?? ""}
                readOnly
                className="w-full border border-transparent bg-gray-100 rounded-lg px-3 py-2 text-gray-500"
              />
            </div> */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={editUser?.email ?? ""}
                onChange={handleChange}
                readOnly
                className="w-full border border-transparent bg-gray-100 rounded-lg px-3 py-2 text-gray-500"
              />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Số điện thoại
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={editUser?.phoneNumber ?? ""}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full border ${
                  isEditing
                    ? "border-gray-300 focus:ring-green-500 focus:border-green-500"
                    : "border-transparent bg-gray-100"
                } rounded-lg px-3 py-2 transition-colors`}
              />
            </div>
            <div>
              <label
                htmlFor="joinDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ngày được tạo
              </label>
              <input
                type="text"
                id="joinDate"
                name="joinDate"
                value={user?.create_at ?? ""}
                readOnly
                className="w-full border border-transparent bg-gray-100 rounded-lg px-3 py-2 text-gray-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSave();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Lưu thay đổi
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
