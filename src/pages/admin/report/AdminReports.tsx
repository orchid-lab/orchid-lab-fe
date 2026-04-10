/* eslint-disable react-x/no-array-index-key */
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
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      <div className="w-full px-8 py-6">
        {/* ─ Page Header: Title + Intro */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-50">
            📋 {t("report.reportManagement")}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("common.manageAndViewApplicationReports")}
          </p>
        </div>

        {/* ─ Search Bar & Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="search-bar">
              <input
                type="text"
                className="w-full border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-full px-4 py-3 pl-12 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orchid-500 focus:border-transparent transition-all duration-200"
                placeholder={t("report.searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ─ Reports Table: Pro Max Card Style */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
                  <th className="px-6 py-4 text-xs font-semibold uppercase letter-spacing tracking-wide text-neutral-700 dark:text-neutral-200">
                    {t("report.taskName")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-200">
                    {t("report.description")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-200">
                    {t("report.writer")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-200">
                    {t("report.status")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-200 text-center">
                    {t("report.action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-neutral-100 dark:border-neutral-700 animate-pulse"
                    >
                      <td className="px-6 py-4">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-3/4"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-2/3"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-2/3"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-1/3 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-neutral-500 dark:text-neutral-400"
                    >
                      <p className="text-base font-medium">
                        {t("report.noReports")}
                      </p>
                      <p className="text-sm mt-1">
                        {t("common.tryModifyingYourSearchCriteria")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-50">
                        {r.name}
                      </td>
                      <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300 text-sm">
                        {r.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                        {r.technician}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                            r.status === "Seen"
                              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700"
                              : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                          }`}
                        >
                          {r.status === "Seen" ? "✓" : "⏳"}
                          {r.status === "Seen"
                            ? t("report.seen")
                            : t("report.notSeen")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-4 py-2 border-2 border-orchid-500 text-orchid-500 dark:text-orchid-400 dark:border-orchid-400 rounded-lg font-medium text-sm transition-all duration-200 hover:bg-orchid-50 dark:hover:bg-orchid-900/20 hover:shadow-pro-md active:shadow-pro-sm hover:-translate-y-0.5"
                          onClick={() =>
                            void navigate(`/admin/report/${r.id}?page=${page}`)
                          }
                        >
                          →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>

        {/* ─ Summary Cards: Total Reports (Pro Max Style) */}
        <div className="mt-8 mb-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="data-card card bg-gradient-to-br from-orchid-50 to-orchid-100 dark:from-orchid-900/20 dark:to-orchid-900/10 border border-orchid-200 dark:border-orchid-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="data-card-label text-orchid-700 dark:text-orchid-300">
                  {t("report.totalReports")}
                </p>
                <p className="data-card-value text-orchid-600 dark:text-orchid-400 mt-2">
                  {total}
                </p>
              </div>
              <div className="data-card-icon bg-orchid-200 dark:bg-orchid-800 text-orchid-600 dark:text-orchid-300">
                📋
              </div>
            </div>
          </div>

          {/* Optional: Additional Summary Cards */}
          <div className="data-card card bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-900/10 border border-success-200 dark:border-success-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="data-card-label text-success-700 dark:text-success-300">
                  {t("report.seen")}
                </p>
                <p className="data-card-value text-success-600 dark:text-success-400 mt-2">
                  {data.filter((r) => r.status === "Seen").length}
                </p>
              </div>
              <div className="data-card-icon bg-success-200 dark:bg-success-800 text-success-600 dark:text-success-300">
                ✓
              </div>
            </div>
          </div>

          <div className="data-card card bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-900/10 border border-warning-200 dark:border-warning-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="data-card-label text-warning-700 dark:text-warning-300">
                  {t("report.notSeen")}
                </p>
                <p className="data-card-value text-warning-600 dark:text-warning-400 mt-2">
                  {data.filter((r) => r.status !== "Seen").length}
                </p>
              </div>
              <div className="data-card-icon bg-warning-200 dark:bg-warning-800 text-warning-600 dark:text-warning-300">
                ⏳
              </div>
            </div>
          </div>
        </div>

        {/* ─ Pagination: Pro Max Style */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              {t("common.showing")}{" "}
              <span className="text-neutral-900 dark:text-neutral-50 font-semibold">
                {filteredReports.length}
              </span>{" "}
              {t("report.reportsOutOf")}{" "}
              <span className="text-neutral-900 dark:text-neutral-50 font-semibold">
                {total}
              </span>{" "}
              {t("report.reports")}
            </p>

            <div className="pagination flex gap-2 items-center justify-center">
              {/* ─ Previous Button */}
              {page > 1 && (
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  className="inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-orchid-500 dark:hover:border-orchid-400 transition-all duration-200 hover:shadow-sm"
                  title="Previous page"
                >
                  ←
                </button>
              )}

              {/* ─ Page Numbers */}
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
                    className={`inline-flex items-center justify-center min-w-10 h-10 px-3 rounded-lg font-medium transition-all duration-200 ${
                      page === pageNum
                        ? "bg-orchid-500 dark:bg-orchid-600 text-white shadow-pro-md hover:shadow-pro-lg"
                        : "border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-orchid-500 dark:hover:border-orchid-400"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* ─ Next Button */}
              {page < totalPages && (
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  className="inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-orchid-500 dark:hover:border-orchid-400 transition-all duration-200 hover:shadow-sm"
                  title="Next page"
                >
                  →
                </button>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}