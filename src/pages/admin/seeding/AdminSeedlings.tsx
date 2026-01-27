/* eslint-disable react-x/no-array-index-key */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../api/axiosInstance";
import type { Seedling, SeedlingApiResponse } from "../../../types/Seedling";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  } as const;

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut" as const,
      },
    }),
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("seedling.orchidSeedlings")}
          </h1>
          <p className="text-gray-600">
            Quản lý và theo dõi cây con phong lan
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            variants={statsVariants}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Tổng số cây con
                </p>
                <motion.p
                  className="text-3xl font-bold text-gray-900"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                >
                  {total}
                </motion.p>
              </div>
              <motion.div
                className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            variants={statsVariants}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Hiển thị trên trang
                </p>
                <motion.p
                  className="text-3xl font-bold text-green-600"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
                >
                  {pagedSeedlings.length}
                </motion.p>
              </div>
              <motion.div
                className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            variants={statsVariants}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Tổng số trang
                </p>
                <motion.p
                  className="text-3xl font-bold text-purple-600"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                >
                  {totalPages}
                </motion.p>
              </div>
              <motion.div
                className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Search */}
        <motion.div
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="relative">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={t("seedling.searchPlaceholder") || "Tìm kiếm cây con..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t("seedling.seedlingName")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t("seedling.parent1")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t("seedling.parent2")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t("seedling.dateOfBirth")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t("seedling.createdDate")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t("seedling.createdBy")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t("common.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence mode="wait">
                  {loading ? (
                    Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                      <motion.tr
                        key={`skeleton-${idx}`}
                        className="animate-pulse"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <td className="px-6 py-4">
                          <div className="h-5 bg-gray-200 rounded w-32" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-5 bg-gray-200 rounded w-24 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-5 bg-gray-200 rounded w-24 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-5 bg-gray-200 rounded w-20 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-5 bg-gray-200 rounded w-28 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-5 bg-gray-200 rounded w-20 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-9 bg-gray-200 rounded-lg w-20 mx-auto" />
                        </td>
                      </motion.tr>
                    ))
                  ) : pagedSeedlings.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <motion.svg
                          className="w-12 h-12 text-gray-300 mx-auto mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </motion.svg>
                        <p className="text-gray-500 font-medium">{t("seedling.noSeedlings")}</p>
                      </td>
                    </motion.tr>
                  ) : (
                    pagedSeedlings.map((s, idx) => (
                      <motion.tr
                        key={s.id}
                        className="hover:bg-gray-50 transition-colors"
                        custom={idx}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)" }}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{s.localName}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-600">
                            {getSeedlingNameById(s.parent1) || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-600">
                            {getSeedlingNameById(s.parent2) || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-600">{s.doB || "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-600">
                            {s.create_date
                              ? new Date(s.create_date).toLocaleDateString()
                              : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-600">{s.create_by || "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <motion.button
                            type="button"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors"
                            onClick={() =>
                              void navigate(`/admin/seedling/${s.id}?page=${page}`)
                            }
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 + 0.3 }}
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {t("common.details")}
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            className="mt-6 flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <p className="text-sm text-gray-600">
              Hiển thị <span className="font-medium text-gray-900">{pagedSeedlings.length}</span> trong tổng số{" "}
              <span className="font-medium text-gray-900">{total}</span> cây con
            </p>
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: page === 1 ? 1 : 1.05 }}
                whileTap={{ scale: page === 1 ? 1 : 0.95 }}
              >
                Trước
              </motion.button>
              
              <div className="flex items-center gap-1">
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
                    <motion.button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                        page === pageNum
                          ? "bg-green-600 text-white"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: page === totalPages ? 1 : 1.05 }}
                whileTap={{ scale: page === totalPages ? 1 : 0.95 }}
              >
                Sau
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}