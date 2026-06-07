/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-floating-promises */

import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";
import "./AdminDisease.css";

const PAGE_SIZE = 5;

type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: (i as number) * 0.08, ease: EASE_OUT },
  }),
};

const tableRow: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.32, delay: (i as number) * 0.045, ease: EASE_OUT },
  }),
  exit: { opacity: 0, x: 14, transition: { duration: 0.18 } },
};

interface Disease {
  id: number;
  name: string;
  description?: string;
  code?: string;
  onnxClassName?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface DiseaseApiResponse {
  data?: Disease[];
  value?: Disease[];
  items?: Disease[];
}

export default function AdminDisease() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;

  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [allDiseases, setAllDiseases] = useState<Disease[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const progressRef = useRef<HTMLDivElement>(null);
  const runProgress = () => {
    if (!progressRef.current) return;
    gsap.set(progressRef.current, { scaleX: 0, opacity: 1 });
    gsap.to(progressRef.current, { scaleX: 1, duration: 0.9, ease: "power3.out" });
    gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1.1 });
  };

  useEffect(() => {
    runProgress();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      runProgress();
      try {
        const res = await axiosInstance.get("/api/diseases?pageNo=1&pageSize=1000");
        const json = res.data as DiseaseApiResponse;
        const list =
          json.data ?? json.value ?? json.items ?? (Array.isArray(res.data) ? res.data : []);
        setAllDiseases((list as Disease[]).reverse());
      } catch {
        setAllDiseases([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const handleToggleActive = async (e: React.MouseEvent, disease: Disease) => {
    // Ngăn click row navigate sang detail
    e.stopPropagation();
    if (togglingId !== null) return;

    setTogglingId(disease.id);
    try {
      await axiosInstance.patch(`/api/diseases/${disease.id}/active`, {
        isActive: !disease.isActive,
      });
      // Cập nhật local state, không cần fetch lại
      setAllDiseases((prev) =>
        prev.map((d) =>
          d.id === disease.id ? { ...d, isActive: !d.isActive } : d,
        ),
      );
    } catch {
      // Giữ nguyên nếu lỗi
    } finally {
      setTogglingId(null);
    }
  };

  const filteredDiseases = allDiseases.filter((d) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        d.name?.toLowerCase().includes(q) ??
        d.description?.toLowerCase().includes(q) ??
        d.code?.toLowerCase().includes(q) ??
        d.onnxClassName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredDiseases.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentDiseases = filteredDiseases.slice(startIndex, startIndex + PAGE_SIZE);
  const hasActiveFilter = searchTerm.trim().length > 0;

  useEffect(() => {
    setPage(1);
    navigate("?page=1", { replace: true });
  }, [searchTerm]);

  const handlePageChange = (p: number) => {
    setPage(p);
    navigate(`?page=${p}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
  };

  const tableHeaders = [
    "#",
    t("common.name") || "Name",
    t("common.description") || "Description",
    t("common.status") || "Status",
    t("common.createdAt") || "Created At",
  ];

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <main className="admin-disease-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] text-slate-900">
      <div
        ref={progressRef}
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#0f766e] to-[#16a34a] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      <div className="p-6 space-y-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                {t("adminDisease.diseaseManagement") || "Disease Management"}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {t("adminDisease.diseaseManagementDesc") ||
                  "Track and manage orchid disease profiles in the system."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm p-6"
        >
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            {t("common.search") || "Search"}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={
                  t("adminDisease.searchPlaceholder") ||
                  "Search by disease name, code or ONNX class..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-xl pl-10 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {hasActiveFilter && (
              <motion.button
                type="button"
                onClick={clearFilters}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                {t("common.clearFilters") || "Clear Filters"}
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {hasActiveFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-slate-200"
              >
                <span className="text-xs text-slate-400">
                  {t("seedling.appliedFilters") || "Applied filters"}
                </span>
                {searchTerm.trim() && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-50 text-slate-900 border border-slate-200">
                    Search: "{searchTerm}"
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Table */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <motion.th
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className="text-center p-4 font-semibold text-slate-900"
                    >
                      {h}
                    </motion.th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <motion.tr
                      key={`sk-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-slate-200 animate-pulse"
                    >
                      {Array.from({ length: 5 }).map((__, ci) => (
                        <td key={ci} className="p-4">
                          <div className="h-4 bg-slate-100 rounded w-full mx-auto" />
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : currentDiseases.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={5} className="text-center p-12 text-slate-500">
                      <div className="text-6xl mb-4">🦠</div>
                      <div className="text-lg font-medium">
                        {t("adminDisease.noDiseases") || "No diseases found"}
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {currentDiseases.map((d, idx) => (
                      <motion.tr
                        key={d.id}
                        custom={idx}
                        variants={tableRow}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        whileHover={{
                          backgroundColor: "rgba(241,245,249,0.85)",
                          transition: { duration: 0.15 },
                        }}
                        className="border-b border-slate-200 cursor-pointer"
                        onClick={() => navigate(`/admin/disease/${d.id}?page=${page}`)}
                      >
                        <td className="p-4 text-center text-slate-500 text-sm">
                          {startIndex + idx + 1}
                        </td>
                        <td className="p-4 text-center font-medium text-slate-900">{d.name}</td>
                        <td className="p-4 text-center text-slate-600 text-sm max-w-[200px]">
                          <span className="line-clamp-2 block" title={d.description}>
                            {d.description ?? "-"}
                          </span>
                        </td>

                        {/* ── Status + Toggle ── */}
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                d.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  d.isActive ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />
                              {d.isActive
                                ? t("status.active") || "Active"
                                : t("status.inactive") || "Inactive"}
                            </span>

                            {/* Toggle switch */}
                            <button
                              type="button"
                              disabled={togglingId === d.id}
                              onClick={(e) => handleToggleActive(e, d)}
                              title={d.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed ${
                                d.isActive
                                  ? "bg-emerald-500 focus:ring-emerald-400"
                                  : "bg-slate-300 focus:ring-slate-400"
                              }`}
                            >
                              {togglingId === d.id ? (
                                <Loader2 className="w-3 h-3 text-white animate-spin mx-auto" />
                              ) : (
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                    d.isActive ? "translate-x-[18px]" : "translate-x-[3px]"
                                  }`}
                                />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="p-4 text-center text-slate-500 text-sm">
                          {formatDate(d.createdAt)}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredDiseases.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-between items-center text-sm text-slate-600 p-6 bg-slate-50 border-t border-slate-200"
            >
              <span className="font-medium">
                {t("common.showing") || "Showing"} {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filteredDiseases.length)}{" "}
                {t("common.of") || "of"} {filteredDiseases.length}
              </span>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  {page > 1 && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handlePageChange(page - 1)}
                      className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 transition-all font-medium shadow-sm"
                    >
                      Prev
                    </motion.button>
                  )}
                  {page < totalPages && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handlePageChange(page + 1)}
                      className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 transition-all font-medium shadow-sm"
                    >
                      Next
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}