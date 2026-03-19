/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import axiosInstance from "../../../api/axiosInstance";

interface MethodListItem {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
}

interface MethodApiResponse {
  totalCount?: number;
  pageCount?: number;
  pageSize?: number;
  pageNumber?: number;
  data?: MethodListItem[];
}

const SKELETON_ROWS = 8;

export default function MethodList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<MethodListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        PageNumber: "1",
        PageSize: "1000",
      });

      const res = await axiosInstance.get(`/api/methods?${params.toString()}`);
      const json = res.data as MethodApiResponse;
      const items = json.data ?? [];
      setData(items);
      setTotalCount(json.totalCount ?? items.length);
    } catch (error) {
      const apiError = error as { response?: { data?: string }; message?: string };
      enqueueSnackbar(
        apiError.response?.data ?? apiError.message ?? t("method.fetchFailed"),
        { variant: "error" }
      );
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return [...data].sort((a, b) => a.name.localeCompare(b.name));
    }

    return data
      .filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, searchTerm]);



  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-blue-950">
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

      <div className="space-y-6 px-6 pb-10">
        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#005792]">
                {t("method.methodsManagement")}
              </h1>
              <p className="mt-1 text-sm text-blue-900/70">
                {t("method.methodSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void navigate("/researcher/method/new");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005792] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#004d73] focus:outline-none focus:ring-2 focus:ring-[#005792]/60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("method.createMethod")}
            </button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6">
          <div className="text-sm font-medium text-blue-700 mb-1">{t("method.totalMethods")}</div>
          <div className="text-3xl font-semibold text-blue-950">{totalCount}</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6">
          <div className="relative max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#005792]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <input
              type="text"
              className="w-full border border-blue-100 bg-white/90 rounded-xl px-4 py-2 pl-11 text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#005792] transition-all duration-200"
              placeholder={t("method.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("method.methodName")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("common.description")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("common.duration")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("common.action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, idx) => (
                  <tr key={`method-skeleton-${idx}`} className="border-b border-blue-50 animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-blue-100 rounded w-3/4"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-blue-100 rounded w-full"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-blue-100 rounded w-1/3"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-blue-100 rounded w-1/2"></div></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-blue-900/40">
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                filteredData.map((method) => (
                  <tr
                    key={method.id}
                    className="border-b border-blue-50 hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                    onClick={() => void navigate(`/researcher/method/${method.id}`)}
                  >
                    <td className="py-4 px-6 font-medium text-blue-950">{method.name}</td>
                    <td className="py-4 px-6 text-blue-900 max-w-[440px]">
                      <div className="line-clamp-2" title={method.description}>
                        {method.description}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-100">
                        {method.totalDurationDays} {t("common.days")}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void navigate(`/researcher/method/${method.id}`);
                          }}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-[#005792] transition-all duration-200 hover:bg-blue-50 hover:text-[#003f60]"
                          aria-label={t("common.view")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            className="h-4 w-4"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-[#005792] transition-all duration-200 hover:bg-blue-50 hover:text-[#003f60]"
                          aria-label={t("common.edit")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            className="h-4 w-4"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-[#005792] transition-all duration-200 hover:bg-blue-50 hover:text-[#003f60]"
                          aria-label={t("common.delete")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            className="h-4 w-4"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6v14h8V6" />
                            <path d="M10 10v6" />
                            <path d="M14 10v6" />
                            <path d="M9 6V4h6v2" />
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
      </div>
    </main>
  );
}