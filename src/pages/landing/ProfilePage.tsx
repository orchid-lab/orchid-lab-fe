import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";
import type { User } from "../../types/Auth";
import { useSnackbar } from "notistack";

function getRoleName(role: string | undefined): string {
  return role || 'User';
}

export default function ProfilePage() {
  const { user: authUser, updateUser, isAuthReady } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState({
    id: "",
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  // Fetch user data from API khi component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching user data for ID:', authUser.id);
        const response = await axiosInstance.get<User>(`/api/user/${authUser.id}`);
        console.log('User data from API:', response.data);
        setUser(response.data);
        setEditUser({
          id: response.data.id ?? "",
          name: response.data.name ?? "",
          email: response.data.email ?? "",
          phoneNumber: response.data.phoneNumber ?? "",
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        enqueueSnackbar("Không thể tải thông tin người dùng", {
          variant: "error",
          autoHideDuration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthReady) {
      fetchUserData();
    }
  }, [authUser?.id, isAuthReady, enqueueSnackbar]);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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

      if (infoChanged) {
        await axiosInstance.put("/api/user", editUser);
      }

      if (avatarFile) {
        const formData = new FormData();
        formData.append("userId", editUser.id);
        formData.append("image", avatarFile);
        await axiosInstance.put("/api/user/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Refresh user data from API
      const userRes = await axiosInstance.get<User>(`/api/user/${editUser.id}`);
      const updatedUser = userRes.data;
      setUser(updatedUser);
      updateUser(updatedUser);

      setIsEditing(false);
      setAvatarFile(null);
      setPreviewUrl(null);
      enqueueSnackbar("Cập nhật thông tin hồ sơ thành công", {
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
        "Cập nhật thông tin hồ sơ thất bại";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setPreviewUrl(null);
    setEditUser({
      id: user?.id ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    });
  };

  // Loading state
  if (!isAuthReady || isLoading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="ml-4 text-gray-600">Đang tải thông tin...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // No user data
  if (!user) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy thông tin người dùng</h3>
              <p className="mt-2 text-sm text-gray-500">Vui lòng đăng nhập lại để tiếp tục.</p>
              <button
                onClick={() => window.location.href = '/login'}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }

        .delay-100 { animation-delay: 0.1s; opacity: 0; }
        .delay-200 { animation-delay: 0.2s; opacity: 0; }
        .delay-300 { animation-delay: 0.3s; opacity: 0; }

        .hover-lift {
          transition: all 0.2s ease;
        }

        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .input-transition {
          transition: all 0.2s ease;
        }

        .input-transition:focus {
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }

        .avatar-container {
          transition: all 0.3s ease;
        }

        .avatar-container:hover {
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
        }

        .button-transition {
          transition: all 0.2s ease;
        }

        .button-transition:hover {
          transform: translateY(-1px);
        }

        .button-transition:active {
          transform: translateY(0);
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 hover-lift animate-fade-in">
          
          {/* Header Section */}
          <div className="border-b border-gray-200 pb-6 mb-8 animate-slide-in">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Thông tin hồ sơ cá nhân
            </h1>
            <p className="text-sm text-gray-600">
              Quản lý và cập nhật thông tin tài khoản của bạn tại Orchid Lab
            </p>
          </div>

          {/* Profile Section */}
          <div className="flex items-start gap-8 mb-8 pb-8 border-b border-gray-200 animate-slide-in delay-100">
            
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 flex items-center justify-center text-green-700 text-3xl font-semibold relative overflow-hidden avatar-container">
                {isEditing ? (
                  <label
                    className="w-full h-full flex items-center justify-center relative cursor-pointer group"
                    title="Thay đổi ảnh đại diện"
                  >
                    {previewUrl || user.avatarUrl ? (
                      <img
                        src={previewUrl || user.avatarUrl || ""}
                        alt="Ảnh đại diện"
                        className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                      />
                    ) : (
                      <span className="select-none">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </label>
                ) : user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Ảnh đại diện"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="select-none">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {user.name || 'Không có tên'}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{user.email || 'Không có email'}</p>
              
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">
                  {getRoleName(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-6 mb-8 animate-slide-in delay-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin chi tiết
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editUser.name}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full border ${
                    isEditing
                      ? "border-gray-300 focus:border-green-500 focus:ring-green-500"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  } rounded-md px-4 py-2.5 text-sm input-transition`}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Số điện thoại
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={editUser.phoneNumber}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full border ${
                    isEditing
                      ? "border-gray-300 focus:border-green-500 focus:ring-green-500"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  } rounded-md px-4 py-2.5 text-sm input-transition`}
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Địa chỉ email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editUser.email}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-md px-4 py-2.5 text-sm text-gray-600"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Email không thể thay đổi và được sử dụng để đăng nhập vào hệ thống
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 animate-slide-in delay-300">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium button-transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSave();
                  }}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium button-transition shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium button-transition shadow-sm"
              >
                Chỉnh sửa thông tin
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}