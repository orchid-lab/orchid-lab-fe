/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Method } from "../../../types/Method";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

export default function AdminMethod() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Method[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/api/methods?PageNumber=${page}&PageSize=${PAGE_SIZE}`
        );
        const json = res.data;
        
        if (json?.data && Array.isArray(json.data)) {
          setData(json.data);
          setTotal(json.totalCount ?? json.data.length);
          setTotalPages(json.pageCount ?? 1);
        } else if (json?.value?.data) {
          setData(json.value.data ?? []);
          setTotal(json.value.totalCount ?? 0);
          setTotalPages(json.value.pageCount ?? 1);
        } else if (Array.isArray(json)) {
          setData(json);
          setTotal(json.length);
          setTotalPages(1);
        } else {
          setData([]);
          setTotal(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Error loading methods:", err);
        setData([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [page]);

  const activeCount = data.filter((m) => m.status === true).length;
  const inactiveCount = data.filter((m) => m.status === false).length;

  const filtered = data.filter((m) => {
    if (!search) return true;
    return m.name && m.name.toLowerCase().includes(search.toLowerCase());
  });

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
            {t("method.methodManagement")}
          </h1>
          <p className="text-gray-600">
            Quản lý và theo dõi các phương pháp sinh sản
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
                  Tổng số phương pháp
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
                className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                  Đang hoạt động
                </p>
                <motion.p
                  className="text-3xl font-bold text-green-600"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
                >
                  {activeCount}
                </motion.p>
              </div>
              <motion.div
                className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  Không hoạt động
                </p>
                <motion.p
                  className="text-3xl font-bold text-gray-400"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                >
                  {inactiveCount}
                </motion.p>
              </div>
              <motion.div
                className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
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
              placeholder={t("method.searchPlaceholder") || "Tìm kiếm theo tên phương pháp..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
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
                    {t("method.methodName")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t("common.status")}
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
                          <div className="h-5 bg-gray-200 rounded w-48" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-gray-200 rounded-full w-24 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-9 bg-gray-200 rounded-lg w-20 mx-auto" />
                        </td>
                      </motion.tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={3} className="px-6 py-16 text-center">
                        <motion.svg
                          className="w-12 h-12 text-gray-300 mx-auto mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </motion.svg>
                        <p className="text-gray-500 font-medium">{t("common.noData")}</p>
                      </td>
                    </motion.tr>
                  ) : (
                    filtered.map((m, idx) => (
                      <motion.tr
                        key={m.id}
                        className="hover:bg-gray-50 transition-colors"
                        custom={idx}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)" }}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{m.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 + 0.2 }}
                          >
                            {m.status ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <motion.span
                                  className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                                {t("status.active")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5" />
                                {t("status.inactive")}
                              </span>
                            )}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <motion.button
                            type="button"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors"
                            onClick={() => navigate(`/admin/method/${m.id}?page=${page}`)}
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
              Hiển thị <span className="font-medium text-gray-900">{filtered.length}</span> trong tổng số{" "}
              <span className="font-medium text-gray-900">{total}</span> phương pháp
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