/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import { useTranslation } from "react-i18next";
import type { User } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";
import "./AdminSeedlings.css";

// Định nghĩa lại Interface cho đúng với Response API bạn vừa cung cấp
export interface Seedling {
  id: string;
  localName: string | null;
  scientificName: string | null;
  description: string | null;
  parentALocalName: string | null;
  parentAScientificName: string | null;
  createdDate: string;
  createdBy: string;
  deletedDate: string | null;
  deletedBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
}

export interface SeedlingApiResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: Seedling[];
}

const PAGE_SIZE = 5;
type SearchCategory = "localName" | "scientificName";

/* ─── Animation variants ──────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const tableRow: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: (i: number = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.32, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, x: 14, transition: { duration: 0.18 } },
};

export default function AdminSeedlings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  
  const pageParam = searchParams.get("page");
  const initialPage = pageParam ? Number(pageParam) : 1;

  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [allSeedlings, setAllSeedlings] = useState<Seedling[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("localName");
  const [creatorFilter, setCreatorFilter] = useState<string>("all");
  const [allCreators, setAllCreators] = useState<string[]>([]);

  /* ── GSAP progress bar ── */
  const progressRef = useRef<HTMLDivElement>(null);
  const runProgress = () => {
    if (!progressRef.current) return;
    gsap.set(progressRef.current, { scaleX: 0, opacity: 1 });
    gsap.to(progressRef.current, { scaleX: 1, duration: 0.9, ease: "power3.out" });
    gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1.1 });
  };

  useEffect(() => { runProgress(); }, []);

  /* ── Fetch seedlings ── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      runProgress();
      try {
        const res = await axiosInstance.get<SeedlingApiResponse>("/api/seedlings?pageNumber=1&pageSize=1000");
        setAllSeedlings((res.data.data ?? []).reverse());
      } catch {
        setAllSeedlings([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  /* ── Fetch creators ── */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get<{ data: User[] }>("/api/user?pageNumber=1&pageSize=1000");
        const users = res.data?.data ?? [];
        const researchers = users
          .filter((u) => u.role === "Researcher")
          .map((u) => u.name);
        setAllCreators(["system", ...researchers]);
      } catch {
        setAllCreators(["system"]);
      }
    };
    void fetchUsers();
  }, []);

  /* ── Filter logic ── */
  const filteredSeedlings = allSeedlings.filter((s) => {
    if (creatorFilter !== "all") {
      if (creatorFilter === "system" ? s.createdBy !== "system" : s.createdBy !== creatorFilter)
        return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return searchCategory === "localName"
        ? s.localName?.toLowerCase().includes(q)
        : s.scientificName?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredSeedlings.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentSeedlings = filteredSeedlings.slice(startIndex, startIndex + PAGE_SIZE);
  const hasActiveFilter = searchTerm.trim() !== "" || creatorFilter !== "all";

  useEffect(() => {
    setPage(1);
    navigate("?page=1", { replace: true });
  }, [searchTerm, searchCategory, creatorFilter, navigate]);

  const formatDate = (d: string) => {
    if (!d) return "-";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "-";
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    } catch { return "-"; }
  };

  const handlePageChange = (p: number) => { setPage(p); navigate(`?page=${p}`); };
  const clearFilters = () => { setSearchTerm(""); setSearchCategory("localName"); setCreatorFilter("all"); };

  const tableHeaders = [
    t("sample.number") ?? "#",
    t("seedling.localNameLabel") ?? "Tên địa phương",
    t("seedling.scientificNameLabel") ?? "Tên khoa học",
    t("seedling.seedlingLocalNameOfHybrid") ?? "Tên địa phương cây mẹ",
    t("seedling.seedlingScientificNameOfHybrid") ?? "Tên khoa học cây mẹ",
    t("seedling.createdDate") ?? "Ngày tạo",
    t("seedling.createdBy") ?? "Người tạo",
  ];

  const searchCategoryLabel = searchCategory === "localName"
    ? (t("seedling.localNameLabel") ?? "Tên địa phương")
    : (t("seedling.scientificNameLabel") ?? "Tên khoa học");

  return (
    <main className="admin-seedlings-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] text-slate-900">

      {/* ── GSAP progress bar ── */}
      <div
        ref={progressRef}
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#9f1239] to-[#f43f5e] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      <div className="p-6 space-y-6">

        {/* ── Header card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6"
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-[#9f1239]">
            {t("seedling.seedlingManagement") ?? "Quản lý Cây giống"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("seedling.seedlingManagementDesc") ?? "Quản lý và tra cứu thông tin các dòng lan trong phòng thí nghiệm"}
          </p>
        </motion.div>

        {/* ── Filter card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm p-6"
        >
          <h2 className="text-base font-semibold text-[#9f1239] mb-4">
            {t("seedling.filterAndSearch") ?? "Lọc & Tìm kiếm"}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search category */}
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value as SearchCategory)}
              className="border border-rose-100 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e] text-slate-700"
            >
              <option value="localName">{t("seedling.localNameLabel") ?? "Tên địa phương"}</option>
              <option value="scientificName">{t("seedling.scientificNameLabel") ?? "Tên khoa học"}</option>
            </select>

            {/* Search input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`${t("common.search") ?? "Tìm"} ${searchCategoryLabel.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-rose-100 bg-white rounded-xl pl-10 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
              />
            </div>

            {/* Creator filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                {t("seedling.creatorLabel") ?? "Người tạo:"}
              </span>
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="border border-rose-100 bg-white rounded-xl px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f43f5e] text-slate-700"
              >
                <option value="all">{t("common.all") ?? "Tất cả"}</option>
                {allCreators.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Clear button */}
            {hasActiveFilter && (
              <motion.button
                type="button"
                onClick={clearFilters}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 border border-rose-100 rounded-xl hover:bg-rose-50 hover:text-[#9f1239] transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                {t("common.clearFilters") ?? "Xóa lọc"}
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
                <span className="text-xs text-slate-400">{t("seedling.appliedFilters") ?? "Đang lọc:"}</span>
                {searchTerm.trim() && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-rose-50 text-[#9f1239] border border-rose-100">
                    {searchCategoryLabel}: "{searchTerm}"
                  </span>
                )}
                {creatorFilter !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-rose-50 text-[#9f1239] border border-rose-100">
                    {t("seedling.creatorLabel") ?? "Người tạo:"} {creatorFilter}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Table card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
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
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                    <motion.tr key={`sk-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }} className="border-b border-rose-50 animate-pulse">
                      {Array.from({ length: 7 }).map((__, ci) => (
                        <td key={ci} className="p-4">
                          <div className="h-4 bg-rose-100 rounded w-full mx-auto" />
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : currentSeedlings.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={7} className="text-center p-12 text-gray-500">
                      <div className="text-6xl mb-4">🌱</div>
                      <div className="text-lg font-medium">{t("common.noData") ?? "Không có dữ liệu"}</div>
                    </td>
                  </motion.tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {currentSeedlings.map((s, idx) => (
                      <motion.tr
                        key={s.id}
                        custom={idx}
                        variants={tableRow}
                        initial="hidden" animate="visible" exit="exit"
                        layout
                        whileHover={{ backgroundColor: "rgba(255,241,242,0.85)", transition: { duration: 0.15 } }}
                        className="border-b border-rose-50 cursor-pointer"
                        onClick={() => navigate(`/admin/seedling/${s.id}?page=${page}`)}
                      >
                        <td className="p-4 text-center text-gray-500 text-sm">{startIndex + idx + 1}</td>
                        <td className="p-4 text-center font-medium text-gray-900">{s.localName ?? "-"}</td>
                        <td className="p-4 text-center text-gray-700 italic text-sm">{s.scientificName ?? "-"}</td>
                        
                        {/* UPDATE: Sử dụng đúng key từ API mới */}
                        <td className="p-4 text-center text-gray-700">{s.parentALocalName ?? "-"}</td>
                        <td className="p-4 text-center text-gray-700 italic text-sm">{s.parentAScientificName ?? "-"}</td>
                        
                        <td className="p-4 text-center text-gray-500 text-sm">{formatDate(s.createdDate)}</td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-[#9f1239] border border-rose-100">
                            {s.createdBy}
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
            {!loading && filteredSeedlings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
                className="flex justify-between items-center text-sm text-slate-600 p-6 bg-white/70 border-t border-rose-100"
              >
                <span className="font-medium">
                  {t("common.showing") ?? "Hiển thị"} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredSeedlings.length)} {t("common.of") ?? "trong"} {filteredSeedlings.length}
                </span>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    {page > 1 && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => handlePageChange(page - 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 transition-all font-medium shadow-sm">
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
                        <motion.button key={pageNum} type="button"
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                            page === pageNum
                              ? "bg-[#9f1239] text-white"
                              : "bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300"
                          }`}
                        >{pageNum}</motion.button>
                      );
                    })}
                    {page < totalPages && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => handlePageChange(page + 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-rose-50 hover:border-rose-300 transition-all font-medium shadow-sm">
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