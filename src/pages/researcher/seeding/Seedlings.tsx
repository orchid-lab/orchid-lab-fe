import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Seedling, SeedlingApiResponse } from "../../../types/Seedling";
import type { User } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";

const PAGE_SIZE = 5;

type SearchCategory = "localName" | "scientificName";

/**
 * Component quản lý danh sách cây giống
 * 
 * Chức năng:
 * - Hiển thị danh sách tất cả cây giống với phân trang
 * - Tìm kiếm theo tên địa phương hoặc tên khoa học
 * - Lọc theo người tạo
 * - Ánh xạ user ID sang tên user
 * - Nút Edit để chỉnh sửa cây giống
 * - Nút Delete để xóa cây giống (không thể xóa nếu đã bị xóa)
 * - Modal confirm và success khi xóa
 * - Hỗ trợ đa ngôn ngữ (tiếng Việt, tiếng Anh)
 */
export default function Seedlings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [allSeedlings, setAllSeedlings] = useState<Seedling[]>([]);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("localName");
  const [creatorFilter, setCreatorFilter] = useState<string>(t("common.all"));
  const [allCreators, setAllCreators] = useState<string[]>([]);
  
  // User mapping: ID -> Name
  const [userMap, setUserMap] = useState<{ [userId: string]: string }>({});
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [seedlingToDelete, setSeedlingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /**
   * Fetch tất cả cây giống từ API
   * - Gọi API: GET /api/seedlings?PageNumber=1&PageSize=1000
   * - Đảo ngược thứ tự để hiển thị cây mới nhất trước
   * - Lưu vào state allSeedlings
   * @effect Chỉ chạy khi component mount (dependency: [])
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allRes = await axiosInstance.get(
          "api/seedlings?PageNumber=1&PageSize=1000"
        );
        const allJson = allRes.data as SeedlingApiResponse;
        setAllSeedlings((allJson.data || []).reverse());
      } catch {
        setAllSeedlings([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  /**
   * Fetch danh sách user để map ID → User name
   * - Gọi API: GET /api/user?PageNumber=1&PageSize=1000
   * - Tạo userMap: { userId: userName } để ánh xạ ID sang tên
   * - Trích xuất danh sách tên người tạo độc nhất
   * - Populate dropdown filter "Người tạo"
   * @effect Chỉ chạy khi component mount (dependency: [])
   * @updates userMap, allCreators
   */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/api/user?PageNumber=1&PageSize=1000");
        const users = response.data?.data || [];
        
        // Tạo map: userId -> userName
        const map: { [userId: string]: string } = {};
        users.forEach((user: User) => {
          if (user.id && user.name) {
            map[user.id] = user.name;
          }
        });
        setUserMap(map);
        
        // Lấy danh sách tên người tạo độc nhất
        const creatorNames = users.map((user: User) => user.name);
        
        // Thêm tùy chọn "Tất cả"
        setAllCreators([t("common.all"), ...creatorNames]);
      } catch (error) {
        console.error("Error fetching users:", error);
        setAllCreators([t("common.all")]);
      }
    };
    void fetchUsers();
  }, []);

  /**
   * Ánh xạ user ID sang user name
   * - Nếu không có giá trị → trả về "-"
   * - Nếu giá trị không chứa "-" (đã là tên) → trả về nguyên giá trị
   * - Nếu là UUID → dùng userMap map sang tên, nếu không tìm thấy trả về UUID gốc
   * @param createdBy - ID hoặc tên người dùng (có thể null/undefined)
   * @returns Tên người dùng hoặc "-" nếu không có
   * @example getUserName("abc-123") → "John Doe" (nếu map có)
   * @example getUserName("John Doe") → "John Doe"
   * @example getUserName(null) → "-"
   */
  const getUserName = (createdBy: string | null | undefined): string => {
    if (!createdBy) return "-";
    // If it's already a name (not UUID format), return as is
    if (!createdBy.includes("-")) return createdBy;
    // Try to map ID to name
    return userMap[createdBy] || createdBy;
  };

  // Lọc cây giống theo tìm kiếm và bộ lọc
  const filteredSeedlings = allSeedlings.filter((seedling) => {
    // Lọc theo người tạo
    if (creatorFilter !== t("common.all")) {
      const creatorName = getUserName(seedling.createdBy);
      if (creatorName !== creatorFilter) return false;
    }

    // Search by category
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      if (searchCategory === "localName") {
        return seedling.localName?.toLowerCase().includes(searchLower);
      } else if (searchCategory === "scientificName") {
        return seedling.scientificName?.toLowerCase().includes(searchLower);
      }
    }

    return true;
  });

  // Tính toán pagination
  const totalPages = Math.ceil(filteredSeedlings.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentSeedlings = filteredSeedlings.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    navigate(`?page=1`, { replace: true });
  }, [searchTerm, searchCategory, creatorFilter]);

  // Format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "-";
      
      // Format: dd/MM/yyyy only
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch {
      return "-";
    }
  };

  /**
   * Đổi trang khi click vào nút pagination
   * - Cập nhật state page
   * - Cập nhật URL query params: ?page={newPage}
   * @param newPage - Số trang muốn chuyển tới (bắt đầu từ 1)
   * @example handlePageChange(2) → URL: ?page=2
   */
  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
    navigate(`?page=${newPage}`);
  };

  /**
   * Xóa tất cả bộ lọc và tìm kiếm
   * - Reset searchTerm = ""
   * - Reset searchCategory = "localName"
   * - Reset creatorFilter = "all"
   * - Tự động reset page = 1 qua effect
   * @effect Trigger effect reset page (dependency: clearFilters dependencies)
   */
  const clearFilters = (): void => {
    setSearchTerm("");
    setSearchCategory("localName");
    setCreatorFilter(t("common.all"));
  };

  /**
   * Mở modal xác nhận trước khi xóa cây giống
   * - Lưu ID cây giống vào seedlingToDelete
   * - Hiển thị modal xác nhận
   * - Người dùng có thể click "Xác nhận" (gọi confirmDelete) hoặc "Hủy" (gọi cancelDelete)
   * @param id - ID của cây giống cần xóa
   * @example handleDelete("uuid-123") → Modal appear
   */
  const handleDelete = (id: string): void => {
    setSeedlingToDelete(id);
    setShowDeleteModal(true);
  };

  /**
   * Gọi API DELETE để xóa cây giống và cập nhật state
   * - Gọi API: DELETE /api/seedlings với body { id: seedlingToDelete }
   * - Nếu thành công (status 200):
   *   - Xóa cây giống khỏi allSeedlings
   *   - Đóng modal xác nhận
   *   - Hiển thị success modal 2 giây rồi auto close
   * - Nếu lỗi:
   *   - Đóng modal (không thông báo lỗi)
   * @async
   * @throws Error nếu API call thất bại (lỗi được log nhưng không hiển thị)
   * @updates allSeedlings, showDeleteModal, showSuccessModal, seedlingToDelete
   */
  const confirmDelete = async (): Promise<void> => {
    if (!seedlingToDelete) return;
    
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/api/seedlings`, {
        data: {
          id: seedlingToDelete
        }
      });
      // Remove from local state
      setAllSeedlings(allSeedlings.filter((s) => s.id !== seedlingToDelete));
      setShowDeleteModal(false);
      setSeedlingToDelete(null);
      // Show success modal
      setShowSuccessModal(true);
      // Auto close success modal after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (error) {
      console.error("Error deleting seedling:", error);
      setShowDeleteModal(false);
      setSeedlingToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Hủy bỏ thao tác xóa và đóng modal xác nhận
   * - Đóng modal: setShowDeleteModal(false)
   * - Clear ID: setSeedlingToDelete(null)
   * @updates showDeleteModal, seedlingToDelete
   */
  const cancelDelete = (): void => {
    setShowDeleteModal(false);
    setSeedlingToDelete(null);
  };

  return (

    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("seedling.seedlingManagement")}</h1>
            <p className="text-gray-600 mt-1">
              {t("seedling.seedlingManagementDesc")}
            </p>
          </div>
          <button
            onClick={() => navigate("/researcher/seedlings/create")}
            className="px-6 py-2 bg-blue-300 hover:bg-blue-400 text-blue-900 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t("common.add")}
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Tổng số cây con */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t("seedling.totalSeedlingsCount")}</p>
              <p className="text-3xl font-bold text-gray-900">{filteredSeedlings.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          {/* Hiển thị trên trang */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t("seedling.displayOnPage")}</p>
              <p className="text-3xl font-bold text-green-700">{currentSeedlings.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          {/* Tổng số trang */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t("seedling.totalPages")}</p>
              <p className="text-3xl font-bold text-purple-700">{totalPages}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            {/* Search with Category */}
            <div className="flex-1 min-w-[300px] flex gap-2">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value as SearchCategory)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
              >
                <option value="localName">{t("seedling.localNameLabel")}</option>
                <option value="scientificName">{t("seedling.scientificNameLabel")}</option>
              </select>
              <input
                type="text"
                placeholder={`${t("seedling.searchByName")} ${searchCategory === "localName" ? t("seedling.localNameLabel") : t("seedling.scientificNameLabel")}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Creator Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">{t("seedling.creatorLabel")}</span>
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={t("common.all")}>{t("common.all")}</option>
                {allCreators.map((creator) => (
                  <option key={creator} value={creator}>
                    {creator}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("common.clearFilters")}
            </button>
          </div>

          {/* Active Filters Display */}
          {(searchTerm.trim() || creatorFilter !== t("common.all")) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">{t("seedling.appliedFilters")}</span>
              {searchTerm.trim() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {searchCategory === "localName" ? t("seedling.localNameLabel") : t("seedling.scientificNameLabel")}: "{searchTerm}"
                </span>
              )}
              {creatorFilter !== t("common.all") && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {t("seedling.creatorLabel")} {creatorFilter}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-50 to-blue-50 border-b-2 border-green-200">
                <tr>
                  <th className="text-center p-4 font-semibold text-gray-900">STT</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.localNameLabel")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.scientificNameLabel")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.parentA")} - {t("seedling.localNameLabel")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.parentA")} - {t("seedling.scientificNameLabel")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.createdDate")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.createdBy")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.deletedBy")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.deletedDate")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.updatedDate")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("seedling.updatedBy")}</th>
                  <th className="text-center p-4 font-semibold text-gray-900">{t("common.action")}</th>
                </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="text-center p-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2">{t("seedling.loadingText")}</span>
                  </div>
                </td>
              </tr>
            ) : currentSeedlings.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center p-8 text-gray-500">
                  {t("common.noData")}
                </td>
              </tr>
            ) : (
              currentSeedlings.map((seedling, index) => (
                <tr 
                  key={seedling.id} 
                  onClick={() => navigate(`/researcher/seedlings/${seedling.id}`)}
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="p-4 text-center">{startIndex + index + 1}</td>
                  <td className="p-4 text-center">{seedling.localName}</td>
                  <td className="p-4 text-center">{seedling.scientificName}</td>
                  <td className="p-4 text-center">{seedling.parentALocalName || "-"}</td>
                  <td className="p-4 text-center">{seedling.parentAScientificName || "-"}</td>
                  <td className="p-4 text-center">{formatDate(seedling.createdDate)}</td>
                  <td className="p-4 text-center">{getUserName(seedling.createdBy)}</td>
                  <td className="p-4 text-center">{getUserName(seedling.deletedBy) || "-"}</td>
                  <td className="p-4 text-center">{formatDate(seedling.deletedDate) || "-"}</td>
                  <td className="p-4 text-center">{getUserName(seedling.updatedBy) || "-"}</td>
                  <td className="p-4 text-center">{formatDate(seedling.updatedDate) || "-"}</td>
                  <td className="p-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!seedling.deletedDate && !seedling.deletedBy) {
                            navigate(`/researcher/seedlings/update/${seedling.id}`);
                          }
                        }}
                        disabled={!!seedling.deletedDate || !!seedling.deletedBy}
                        className={`px-3 py-1 text-white text-sm rounded-lg transition-colors ${
                          seedling.deletedDate || seedling.deletedBy
                            ? "bg-gray-400 cursor-not-allowed opacity-50"
                            : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                        }`}
                        title={seedling.deletedDate || seedling.deletedBy ? t("seedling.deletedCannotEdit") : t("common.edit")}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7.5-1.5l4.5-4.5m0 0l-4.5 4.5" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!seedling.deletedDate && !seedling.deletedBy) {
                            handleDelete(seedling.id);
                          }
                        }}
                        disabled={!!seedling.deletedDate || !!seedling.deletedBy}
                        className={`px-3 py-1 text-white text-sm rounded-lg transition-colors ${
                          seedling.deletedDate || seedling.deletedBy
                            ? "bg-gray-400 cursor-not-allowed opacity-50"
                            : "bg-red-500 hover:bg-red-600 cursor-pointer"
                        }`}
                        title={seedling.deletedDate || seedling.deletedBy ? t("seedling.deletedCannotDelete") : t("common.delete")}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
        {!loading && filteredSeedlings.length > 0 && (
          <div className="flex justify-between items-center text-sm text-gray-600 p-6 bg-gray-50">
            <span className="font-medium">
              {t("seedling.displaying")}{" "}
              {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filteredSeedlings.length)} {t("common.of")}{" "}
              {filteredSeedlings.length}
            </span>
            {totalPages > 1 && (
              <div className="flex gap-2">
                {page > 1 && (
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200 font-medium shadow-sm"
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
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium shadow-sm ${
                        page === pageNum
                          ? "bg-green-700 text-white"
                          : "bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {page < totalPages && (
                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200 font-medium shadow-sm"
                  >
                    →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-10.5a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {t("seedling.deleteConfirm")}
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              {t("seedling.cannotBeUndone")}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t("seedling.deleting")}
                  </>
                ) : (
                  t("common.delete")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {t("seedling.deleteSuccess")}
            </h3>
            <p className="text-sm text-gray-600 text-center">
              {t("seedling.deleteSuccessMessage")}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
