/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-dom/no-missing-button-type */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Seedling, SeedlingApiResponse } from "../../../types/Seedling";
import type { User } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";

const PAGE_SIZE = 5;

type SearchCategory = "localName" | "scientificName";

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
        const users = response.data?.data ?? [];
        
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
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-blue-950">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.5s ease-out forwards; }
        .hover-lift { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .hover-lift:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 10px 20px -8px rgba(0,0,0,0.18); }
      `}</style>

      {/* FIX 3: All sections are correctly nested inside this single container div */}
      <div className="space-y-6 px-6 pb-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#005792]">{t("seedling.seedlingManagement")}</h1>
              <p className="mt-1 text-sm text-blue-900/70">{t("seedling.seedlingManagementDesc")}</p>
            </div>
            <button
              onClick={() => navigate("/researcher/seedlings/create")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005792] px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#004d73] focus:outline-none focus:ring-2 focus:ring-[#005792]/60"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("common.add")}
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 flex items-center justify-between hover-lift">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">{t("seedling.totalSeedlingsCount")}</p>
              <p className="text-3xl font-semibold text-blue-950">{filteredSeedlings.length}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 flex items-center justify-between hover-lift">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">{t("seedling.displayOnPage")}</p>
              <p className="text-3xl font-semibold text-blue-950">{currentSeedlings.length}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 flex items-center justify-between hover-lift">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">{t("seedling.totalPages")}</p>
              <p className="text-3xl font-semibold text-blue-950">{totalPages}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex-1 min-w-[260px] flex gap-2">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value as SearchCategory)}
                className="border border-blue-100 bg-white/90 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
              >
                <option value="localName">{t("seedling.localNameLabel")}</option>
                <option value="scientificName">{t("seedling.scientificNameLabel")}</option>
              </select>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#005792]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={`${t("seedling.searchByName")} ${searchCategory === "localName" ? t("seedling.localNameLabel") : t("seedling.scientificNameLabel")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-blue-100 bg-white/90 rounded-xl px-4 py-2 pl-11 text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#005792] transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700 font-medium">{t("seedling.creatorLabel")}</span>
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
              >
                <option value={t("common.all")}>{t("common.all")}</option>
                {allCreators.map((creator) => (
                  <option key={creator} value={creator}>
                    {creator}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-[#005792] border border-blue-100 rounded-xl hover:bg-blue-50 transition-all duration-200"
            >
              {t("common.clearFilters")}
            </button>
          </div>

          {/* FIX 2: Removed duplicate Active Filters Display — kept only this one instance */}
          {(searchTerm.trim() || creatorFilter !== t("common.all")) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-100">
              <span className="text-xs text-blue-700">{t("seedling.appliedFilters")}</span>
              {searchTerm.trim() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-800">
                  {searchCategory === "localName" ? t("seedling.localNameLabel") : t("seedling.scientificNameLabel")}:
                  "{searchTerm}"
                </span>
              )}
              {creatorFilter !== t("common.all") && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-50 text-cyan-700">
                  {t("seedling.creatorLabel")} {creatorFilter}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">{t("seedling.localNameLabel")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">{t("seedling.scientificNameLabel")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">{t("seedling.parentA")} - {t("seedling.localNameLabel")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">{t("seedling.parentA")} - {t("seedling.scientificNameLabel")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">{t("seedling.createdDate")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">{t("seedling.createdBy")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">{t("common.status")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">{t("common.action")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <span className="ml-2">{t("seedling.loadingText")}</span>
                      </div>
                    </td>
                  </tr>
                ) : currentSeedlings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8 text-blue-900/40">
                      {t("common.noData")}
                    </td>
                  </tr>
                ) : (
                  // FIX 1: Removed the duplicate `) : (` — only one ternary branch here
                  currentSeedlings.map((seedling, index) => {
                    const isDeleted = Boolean(seedling.deletedDate ?? seedling.deletedBy);
                    return (
                      <tr
                        key={seedling.id}
                        onClick={() => navigate(`/researcher/seedlings/${seedling.id}`)}
                        className="border-b border-blue-50 hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                      >
                        <td className="py-4 px-6 font-medium text-blue-950">{startIndex + index + 1}</td>
                        <td className="py-4 px-6 font-medium text-blue-950">{seedling.localName}</td>
                        <td className="py-4 px-6 font-medium text-blue-950">{seedling.scientificName}</td>
                        <td className="py-4 px-6 font-medium text-blue-950">{seedling.parentALocalName ?? "-"}</td>
                        <td className="py-4 px-6 font-medium text-blue-950">{seedling.parentAScientificName ?? "-"}</td>
                        <td className="py-4 px-6 font-medium text-blue-950">{formatDate(seedling.createdDate)}</td>
                        <td className="py-4 px-6 font-medium text-blue-950">{getUserName(seedling.createdBy)}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            isDeleted ? "bg-gray-100 text-gray-700" : "bg-cyan-50 text-cyan-700"
                          }`}>
                            <span className={`h-2 w-2 rounded-full ${isDeleted ? "bg-gray-400" : "bg-cyan-700"}`} />
                            {isDeleted ? t("common.inactive") : t("common.active")}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isDeleted) {
                                  navigate(`/researcher/seedlings/update/${seedling.id}`);
                                }
                              }}
                              disabled={isDeleted}
                              className={`inline-flex items-center justify-center rounded-lg p-2 text-[#005792] transition-all duration-200 ${
                                isDeleted ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50 hover:text-[#003f60]"
                              }`}
                              aria-label={t("common.edit")}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isDeleted) {
                                  handleDelete(seedling.id);
                                }
                              }}
                              disabled={isDeleted}
                              className={`inline-flex items-center justify-center rounded-lg p-2 text-[#005792] transition-all duration-200 ${
                                isDeleted ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50 hover:text-[#003f60]"
                              }`}
                              aria-label={t("common.delete")}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6v14h8V6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 10v6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10v6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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