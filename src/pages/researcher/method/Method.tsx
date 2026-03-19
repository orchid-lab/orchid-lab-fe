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
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-black">
          {t("method.methodManagement")}
        </h1>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
        <div className="text-sm font-medium text-gray-600 mb-1">{t("method.totalMethods")}</div>
        <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder={t("method.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 text-sm font-semibold text-gray-700">{t("method.methodName")}</th>
              <th className="px-4 text-sm font-semibold text-gray-700">{t("common.description")}</th>
              <th className="px-4 text-sm font-semibold text-gray-700">{t("common.duration")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, idx) => (
                <tr key={`method-skeleton-${idx}`} className="border-t animate-pulse">
                  <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                  <td className="px-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                  <td className="px-4"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-400">{t("common.noData")}</td>
              </tr>
            ) : (
              filteredData.map((method) => (
                <tr 
                  key={method.id} 
                  className="border-t hover:bg-green-50 cursor-pointer transition"
                  onClick={() => void navigate(`/researcher/method/${method.id}`)}
                >
                  <td className="py-3 px-4 font-medium">{method.name}</td>
                  <td className="px-4 text-gray-700 max-w-[440px]">
                    <div className="line-clamp-2" title={method.description}>
                      {method.description}
                    </div>
                  </td>
                  <td className="px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                      {method.totalDurationDays} {t("common.days")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
