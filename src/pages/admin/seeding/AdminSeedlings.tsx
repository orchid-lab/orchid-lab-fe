import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import type { Seedling, SeedlingApiResponse } from "../../../types/Seedling";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 5;

export default function AdminSeedlings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;
  const [page, setPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [allSeedlings, setAllSeedlings] = useState<Seedling[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allRes = await axiosInstance.get(
          "/api/seedlings?pageNumber=1&pageSize=1000"
        );
        const allJson = allRes.data as SeedlingApiResponse;
        setAllSeedlings((allJson.value.data || []).reverse());
      } catch {
        setAllSeedlings([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const filteredSeedlings = allSeedlings
    .filter((s) => s.delete_date === null)
    .filter((s) => {
      const searchMatch =
        !searchTerm ||
        s.localName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.parent1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.parent2?.toLowerCase().includes(searchTerm.toLowerCase());
      return searchMatch;
    });

  const getSeedlingNameById = (id: string | null) => {
    if (!id) return "";
    const found = allSeedlings.find((s) => s.id === id);
    return found ? found.localName : id;
  };

  const total = filteredSeedlings.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagedSeedlings = filteredSeedlings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-green-800">
          {t("seedling.orchidSeedlings")}
        </h1>
      </div>
      <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-800"
              placeholder={t("seedling.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
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
      </div>
      <div className="bg-white rounded shadow p-0 overflow-x-auto">
        <table className="w-full text-left table-fixed min-w-[600px]">
          <thead>
            <tr className="bg-green-50 text-green-800 font-semibold">
              <th className="py-3 px-4">{t("seedling.seedlingName")}</th>
              <th className="px-4 text-center">{t("seedling.parent1")}</th>
              <th className="px-4 text-center">{t("seedling.parent2")}</th>
              <th className="px-4">{t("seedling.dateOfBirth")}</th>
              <th className="px-4 text-center">{t("seedling.createdDate")}</th>
              <th className="px-4 text-center">{t("seedling.createdBy")}</th>
              <th className="px-4">{t("common.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, idx) => (
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
                  <td className="px-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </td>
                  <td className="px-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </td>
                </tr>
              ))
            ) : pagedSeedlings.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">
                  {t("seedling.noSeedlings")}
                </td>
              </tr>
            ) : (
              pagedSeedlings.map((s) => (
                <tr key={s.id} className="border-t hover:bg-green-50">
                  <td className="py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                    {s.localName}
                  </td>
                  <td className="px-4 whitespace-nowrap overflow-hidden text-ellipsis text-center">
                    {getSeedlingNameById(s.parent1) || "-"}
                  </td>
                  <td className="px-4 whitespace-nowrap overflow-hidden text-ellipsis text-center">
                    {getSeedlingNameById(s.parent2) || "-"}
                  </td>
                  <td className="px-4">{s.doB}</td>
                  <td className="px-4 text-center">
                    {s.create_date
                      ? new Date(s.create_date).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 text-center">{s.create_by || "-"}</td>
                  <td className="px-4 flex gap-2 mt-2">
                    <button
                      type="button"
                      className="border cursor-pointer border-green-800 text-green-800 rounded-full px-4 py-1 hover:bg-green-800 hover:text-white transition"
                      onClick={() =>
                        void navigate(`/admin/seedling/${s.id}?page=${page}`)
                      }
                    >
                      {t("common.details")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary cards */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-2">
        <div className="bg-green-100 rounded p-4 w-1/4">
          <div className="font-semibold text-green-800">
            {t("seedling.totalSeedlings")}
          </div>
          <div className="text-2xl font-bold text-green-800">{total}</div>
        </div>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
          <span>
            {t("common.showing")} {pagedSeedlings.length} {t("seedling.seedlingsOutOf")}{" "}
            {total} {t("seedling.seedlings")}
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
    </main>
  );
}