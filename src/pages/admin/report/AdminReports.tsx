import { useState, useMemo, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import type { ReportApiResponse, Report } from "../../../types/Report";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 5;

export default function AdminReport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get<ReportApiResponse>("/api/report", {
          params: {
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
        });
        
        const json = res.data; 
        setData(json.value.data || []);
        setTotal(json.value.totalCount || 0);
        setTotalPages(json.value.pageCount || 1);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setData([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [page]);

  // Lọc dữ liệu
  const filteredReports = useMemo(() => {
    return data.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.technician.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [data, search]);

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gradient-to-b from-stone-50 to-stone-100">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">
            {t("report.reportManagement")}
          </h1>
          <div className="h-1 w-16 bg-gradient-to-r from-red-800 to-red-600 rounded-full"></div>
        </div>

        {/* Filter Section - Pro Max Aesthetic */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-red-700">
          <div className="flex flex-col gap-4">
            <label className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
              {t("report.search")}
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full border-2 border-stone-200 rounded-lg px-5 py-3 pl-12 text-stone-900 placeholder-stone-400 transition-all duration-200 focus:outline-none focus:border-red-700 focus:shadow-md focus:ring-0"
                placeholder={t("report.searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <span className="absolute left-4 top-3.5 text-stone-400">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Data Table - Modern Professional */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-stone-50 to-stone-100 border-b-2 border-red-700">
                  <th className="py-4 px-6 text-sm font-bold text-stone-900 uppercase tracking-wider">{t("report.taskName")}</th>
                  <th className="px-6 text-sm font-bold text-stone-900 uppercase tracking-wider">{t("report.description")}</th>
                  <th className="px-6 text-sm font-bold text-stone-900 uppercase tracking-wider">{t("report.writer")}</th>
                  <th className="px-6 text-sm font-bold text-stone-900 uppercase tracking-wider">{t("report.status")}</th>
                  <th className="px-6 text-sm font-bold text-stone-900 uppercase tracking-wider text-center">{t("report.action")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, idx) => {
                    const skeletonId = `skeleton-row-${page}-${idx}`;
                    return (
                      <tr key={skeletonId} className="border-b border-stone-100 animate-pulse">
                        <td className="py-4 px-6">
                          <div className="h-4 bg-stone-200 rounded-lg w-3/4"></div>
                        </td>
                        <td className="px-6">
                          <div className="h-4 bg-stone-200 rounded-lg w-2/3"></div>
                        </td>
                        <td className="px-6">
                          <div className="h-4 bg-stone-200 rounded-lg w-2/3"></div>
                        </td>
                        <td className="px-6">
                          <div className="h-4 bg-stone-200 rounded-lg w-1/2"></div>
                        </td>
                        <td className="px-6">
                          <div className="h-8 bg-stone-200 rounded-lg w-20 mx-auto"></div>
                        </td>
                      </tr>
                    );
                  })
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-stone-500">
                      <div className="text-lg font-medium">{t("report.noReports")}</div>
                      <div className="text-sm mt-1">Bắt đầu thêm báo cáo để xem chúng ở đây</div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => (
                    <tr key={r.id} className="border-b border-stone-100 hover:bg-red-50 transition-colors duration-200">
                      <td className="py-4 px-6 font-medium text-stone-900">{r.name}</td>
                      <td className="px-6 text-stone-700">{r.description}</td>
                      <td className="px-6 text-stone-600">{r.technician}</td>
                      <td className="px-6">
                        <span
                          className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            r.status === "Seen"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {r.status === "Seen" ? t("report.seen") : t("report.notSeen")}
                        </span>
                      </td>
                      <td className="px-6 text-center">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-red-700 text-red-700 rounded-lg font-slightly-bold hover:bg-red-700 hover:text-white transition-all duration-200 hover:shadow-md cursor-pointer"
                          onClick={() =>
                            void navigate(`/admin/report/${r.id}?page=${page}`)
                          }
                        >
                          {t("report.details")}
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metric Summary Cards - Design Focus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-md border-l-4 border-red-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
                  {t("report.totalReports")}
                </div>
                <div className="text-4xl font-bold text-red-700 mt-2">{total}</div>
              </div>
              <div className="text-5xl opacity-10 text-red-700">📊</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border-l-4 border-red-600 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
                  Báo cáo đã xem
                </div>
                <div className="text-4xl font-bold text-green-700 mt-2">
                  {data.filter((r) => r.status === "Seen").length}
                </div>
              </div>
              <div className="text-5xl opacity-10 text-green-700">✓</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-l-4 border-amber-500 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
                  Chờ xem
                </div>
                <div className="text-4xl font-bold text-amber-600 mt-2">
                  {data.filter((r) => r.status !== "Seen").length}
                </div>
              </div>
              <div className="text-5xl opacity-10 text-amber-600">⏳</div>
            </div>
          </div>
        </div>
        {/* Pagination - Premium Pro Max */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center text-sm text-stone-600 mt-8 bg-white rounded-xl shadow-md p-6 border border-stone-200">
            <div>
              <span className="font-medium text-stone-900">
                {t("common.showing")} <span className="text-red-700 font-bold">{filteredReports.length}</span>{" "}
                {t("report.reportsOutOf")} <span className="text-red-700 font-bold">{total}</span> {t("report.reports")}
              </span>
            </div>
            <div className="flex gap-1.5 items-center">
              {/* Previous button */}
              {page > 1 && (
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 hover:bg-red-700 hover:text-white transition-all duration-200 font-bold flex items-center justify-center hover:shadow-md"
                  title="Previous page"
                >
                  ←
                </button>
              )}

              {/* Page numbers */}
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
                    className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${
                      page === pageNum
                        ? "bg-red-700 text-white shadow-md"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                    aria-current={page === pageNum ? "page" : undefined}
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
                  className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 hover:bg-red-700 hover:text-white transition-all duration-200 font-bold flex items-center justify-center hover:shadow-md"
                  title="Next page"
                >
                  →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}