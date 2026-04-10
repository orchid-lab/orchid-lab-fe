/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, FlaskConical, Layers, TestTube2 } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";
import "./AdminMethod.css";

const PAGE_SIZE = 5;

/* ─── Types ───────────────────────────────────────────── */
interface MethodStage {
  methodStageId: number;
  order: number;
  durationDays: number;
  stageDefinitionName?: string;
  materials?: unknown[];
  chemicals?: unknown[];
}

interface Method {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
  methodStages?: MethodStage[];
}

interface MethodApiResponse {
  data?: Method[];
  value?: Method[];
  items?: Method[];
}

/* ─── Animation variants ──────────────────────────────── */
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

export default function AdminMethod() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;

  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [allMethods, setAllMethods] = useState<Method[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  /* ── GSAP progress bar ── */
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

  /* ── Fetch methods ── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      runProgress();
      try {
        const res = await axiosInstance.get("/api/methods?pageNumber=1&pageSize=1000");
        const json = res.data as MethodApiResponse;
        const list =
          json.data ?? json.value ?? json.items ?? (Array.isArray(res.data) ? res.data : []);
        setAllMethods((list as Method[]).reverse());
      } catch {
        setAllMethods([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  /* ── Filter logic ── */
  const filteredMethods = allMethods.filter((m) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        m.name?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredMethods.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentMethods = filteredMethods.slice(startIndex, startIndex + PAGE_SIZE);
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

  /* ── Stats helpers ── */
  const getStageCount = (m: Method) => m.methodStages?.length ?? 0;
  const getMaterialCount = (m: Method) =>
    (m.methodStages ?? []).reduce((acc, s) => acc + (s.materials?.length ?? 0), 0);
  const getChemicalCount = (m: Method) =>
    (m.methodStages ?? []).reduce((acc, s) => acc + (s.chemicals?.length ?? 0), 0);

  const tableHeaders = [
    t("sample.number"),
    t("method.nameLabel") || "Tên phương pháp",
    t("method.descriptionLabel") || "Mô tả",
    t("method.totalDurationLabel") || "Tổng thời gian",
    t("method.stageCountLabel") || "Giai đoạn",
    t("method.materialCountLabel") || "Vật tư",
    t("method.chemicalCountLabel") || "Hoá chất",
  ];

  return (
    <main className="admin-method-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] text-slate-900">

      {/* ── GSAP progress bar ── */}
      <div
        ref={progressRef}
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#9f1239] to-[#f43f5e] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      <div className="p-6 space-y-6">

        {/* ── Header card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
              <FlaskConical className="w-5 h-5 text-[#9f1239]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#9f1239]">
                {t("method.methodManagement") || "Quản lý Phương pháp"}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {t("method.methodManagementDesc") ||
                  "Xem và quản lý các phương pháp nuôi cấy trong hệ thống"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Filter card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6"
        >
          <h2 className="text-base font-semibold text-[#9f1239] mb-4">
            {t("seedling.filterAndSearch") || "Lọc & Tìm kiếm"}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`${t("common.search") || "Tìm kiếm"} tên hoặc mô tả...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-rose-100 bg-white rounded-xl pl-10 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
              />
            </div>

            {/* Clear button */}
            {hasActiveFilter && (
              <motion.button
                type="button"
                onClick={clearFilters}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 border border-rose-100 rounded-xl hover:bg-rose-50 hover:text-[#9f1239] transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                {t("common.clearFilters") || "Xoá bộ lọc"}
              </motion.button>
            )}
          </div>

          {/* Active filter chips */}
          <AnimatePresence>
            {hasActiveFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-rose-50"
              >
                <span className="text-xs text-slate-400">
                  {t("seedling.appliedFilters") || "Bộ lọc đang áp dụng"}
                </span>
                {searchTerm.trim() && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-rose-50 text-[#9f1239] border border-rose-100">
                    Tìm kiếm: "{searchTerm}"
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Table card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#fff1f2] to-[#fffbfb] border-b border-rose-100">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <motion.th
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className="text-center p-4 font-semibold text-gray-900"
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
                      className="border-b border-rose-50 animate-pulse"
                    >
                      {Array.from({ length: 7 }).map((__, ci) => (
                        <td key={ci} className="p-4">
                          <div className="h-4 bg-rose-100 rounded w-full mx-auto" />
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : currentMethods.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={7} className="text-center p-12 text-gray-500">
                      <div className="text-6xl mb-4">🧪</div>
                      <div className="text-lg font-medium">
                        {t("common.noData") || "Không có dữ liệu"}
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {currentMethods.map((m, idx) => (
                      <motion.tr
                        key={m.id}
                        custom={idx}
                        variants={tableRow}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        whileHover={{
                          backgroundColor: "rgba(255,241,242,0.85)",
                          transition: { duration: 0.15 },
                        }}
                        className="border-b border-rose-50 cursor-pointer"
                        onClick={() => navigate(`/admin/method/${m.id}?page=${page}`)}
                      >
                        {/* # */}
                        <td className="p-4 text-center text-gray-500 text-sm">
                          {startIndex + idx + 1}
                        </td>

                        {/* Name */}
                        <td className="p-4 text-center font-medium text-gray-900">
                          {m.name}
                        </td>

                        {/* Description */}
                        <td className="p-4 text-center text-gray-600 text-sm max-w-[260px]">
                          <span
                            className="line-clamp-2 block"
                            title={m.description}
                          >
                            {m.description || "-"}
                          </span>
                        </td>

                        {/* Total duration */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#9f1239] border border-rose-100">
                            {m.totalDurationDays ?? "-"} ngày
                          </span>
                        </td>

                        {/* Stages */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                            <FlaskConical className="w-3 h-3" />
                            {getStageCount(m)}
                          </span>
                        </td>

                        {/* Materials */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <Layers className="w-3 h-3" />
                            {getMaterialCount(m)}
                          </span>
                        </td>

                        {/* Chemicals */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            <TestTube2 className="w-3 h-3" />
                            {getChemicalCount(m)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <AnimatePresence>
            {!loading && filteredMethods.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
                className="flex justify-between items-center text-sm text-slate-600 p-6 bg-white/70 border-t border-rose-100"
              >
                <span className="font-medium">
                  {t("common.showing") || "Hiển thị"}{" "}
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredMethods.length)}{" "}
                  {t("common.of") || "trong"} {filteredMethods.length}
                </span>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    {page > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => handlePageChange(page - 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 transition-all font-medium shadow-sm"
                      >
                        ←
                      </motion.button>
                    )}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <motion.button
                          key={pageNum}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                            page === pageNum
                              ? "bg-[#9f1239] text-white"
                              : "bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300"
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    })}
                    {page < totalPages && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => handlePageChange(page + 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 transition-all font-medium shadow-sm"
                      >
                        →
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </main>
  );
}