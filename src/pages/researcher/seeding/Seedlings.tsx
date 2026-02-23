import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Seedling, SeedlingApiResponse } from "../../../types/Seedling";
import type { User } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";

const PAGE_SIZE = 5;

type SearchCategory = "localName" | "scientificName";

export default function Seedlings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [allSeedlings, setAllSeedlings] = useState<Seedling[]>([]);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("localName");
  const [creatorFilter, setCreatorFilter] = useState<string>("Tất cả");
  const [allCreators, setAllCreators] = useState<string[]>([]);

  // Fetch seedlings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allRes = await axiosInstance.get(
          "https://net-api.tissuex.me/api/seedlings?PageNumber=1&PageSize=1000"
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

  // Fetch users for creator filter
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/api/user?PageNumber=1&PageSize=1000");
        const users = response.data?.data || [];
        
        // Filter researchers (role = "Researcher")
        const researchers = users
          .filter((user: User) => user.role === "Researcher")
          .map((user: User) => user.name);
        
        console.log("Fetched users:", users);
        console.log("Researchers:", researchers);
        
        // Add "System" option
        setAllCreators(["system", ...researchers]);
      } catch (error) {
        console.error("Error fetching users:", error);
        setAllCreators(["System"]);
      }
    };
    void fetchUsers();
  }, []);

  // Filter and search logic
  const filteredSeedlings = allSeedlings.filter((seedling) => {
    // Filter by creator
    if (creatorFilter !== "Tất cả") {
      if (creatorFilter === "System") {
        if (seedling.createdBy !== "System") return false;
      } else {
        if (seedling.createdBy !== creatorFilter) return false;
      }
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
  const formatDate = (dateString: string) => {
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

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    navigate(`?page=${newPage}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSearchCategory("localName");
    setCreatorFilter("Tất cả");
  };

  return (
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Giống Cây</h1>
            <p className="text-gray-600 mt-1">
              Theo dõi và quản lý các giống cây lai tạo
            </p>
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
                <option value="localName">Tên địa phương</option>
                <option value="scientificName">Tên khoa học</option>
              </select>
              <input
                type="text"
                placeholder={`Tìm kiếm theo ${searchCategory === "localName" ? "tên địa phương" : "tên khoa học"}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Creator Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Người tạo:</span>
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Tất cả">Tất cả</option>
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
              Xóa bộ lọc
            </button>
          </div>

          {/* Active Filters Display */}
          {(searchTerm.trim() || creatorFilter !== "Tất cả") && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Bộ lọc đã chọn:</span>
              {searchTerm.trim() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {searchCategory === "localName" ? "Tên địa phương" : "Tên khoa học"}: "{searchTerm}"
                </span>
              )}
              {creatorFilter !== "Tất cả" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Người tạo: {creatorFilter}
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
                  <th className="text-center p-4 font-semibold text-gray-900">Tên địa phương</th>
                  <th className="text-center p-4 font-semibold text-gray-900">Tên khoa học</th>
                  <th className="text-center p-4 font-semibold text-gray-900">Tên địa phương của cây lai</th>
                  <th className="text-center p-4 font-semibold text-gray-900">Tên khoa học của cây lai</th>
                  <th className="text-center p-4 font-semibold text-gray-900">Ngày tạo</th>
                  <th className="text-center p-4 font-semibold text-gray-900">Người tạo</th>
                </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2">Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : currentSeedlings.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              currentSeedlings.map((seedling, index) => (
                <tr 
                  key={seedling.id} 
                  onClick={() => navigate(`/seedlings/${seedling.id}`)}
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="p-4 text-center">{startIndex + index + 1}</td>
                  <td className="p-4 text-center">{seedling.localName}</td>
                  <td className="p-4 text-center">{seedling.scientificName}</td>
                  <td className="p-4 text-center">{seedling.parent1 || "-"}</td>
                  <td className="p-4 text-center">{seedling.parent2 || "-"}</td>
                  <td className="p-4 text-center">{formatDate(seedling.createdDate)}</td>
                  <td className="p-4 text-center">{seedling.createdBy}</td>
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
              Hiển thị{" "}
              {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filteredSeedlings.length)} của{" "}
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
    </main>
  );
}
