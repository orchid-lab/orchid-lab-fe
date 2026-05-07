/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import type { Seedling, SeedlingApiResponse } from "../../../types/Seedling";
import type { User } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";
import "./Seedlings.css";
import SuccessRateAnalysis from "./SuccessRateAnalysis";

const PAGE_SIZE = 5;
type SearchCategory = "localName" | "scientificName";

/* ─── Animation variants ─────────────────────────────────── */
type CubicBezier = [number, number, number, number];
const EASE_OUT: CubicBezier = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.48, delay: (i as number) * 0.07, ease: EASE_OUT },
  }),
};

const tableRow: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.32, delay: (i as number) * 0.04, ease: EASE_OUT },
  }),
  exit: { opacity: 0, x: 14, transition: { duration: 0.18 } },
};

const statCard: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, delay: 0.1 + (i as number) * 0.09, ease: EASE_OUT },
  }),
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit:   { opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.2 } },
};

const backdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

/* ─── Animated counter (GSAP) ────────────────────────────── */
function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });

  useEffect(() => {
    obj.current.val = 0;
    const ctx = gsap.context(() => {
      gsap.to(obj.current, {
        val: value, duration: 0.9, ease: "power2.out", delay: 0.25,
        onUpdate: () => {
          if (ref.current) ref.current.textContent = Math.round(obj.current.val).toString();
        },
      });
    });
    return () => ctx.revert();
  }, [value]);

  return <span ref={ref}>0</span>;
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Seedlings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;

  const [activeTab, setActiveTab] = useState<"list" | "analysis">("list");
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [allSeedlings, setAllSeedlings] = useState<Seedling[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("localName");
  const [creatorFilter, setCreatorFilter] = useState<string>(t("common.all"));
  const [allCreators, setAllCreators] = useState<string[]>([]);
  const [userMap, setUserMap] = useState<{ [userId: string]: string }>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [seedlingToDelete, setSeedlingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /* GSAP progress bar */
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (loading || !progressRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(progressRef.current, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.8, ease: "power3.out" });
      gsap.to(progressRef.current, { opacity: 0, duration: 0.4, delay: 1 });
    });
    return () => ctx.revert();
  }, [loading]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allRes = await axiosInstance.get("api/seedlings?PageNumber=1&PageSize=1000");
        const allJson = allRes.data as SeedlingApiResponse;
        setAllSeedlings((allJson.data || []).reverse());
      } catch {
        setAllSeedlings([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/api/user?PageNumber=1&PageSize=1000");
        const users = response.data?.data ?? [];
        const map: { [userId: string]: string } = {};
        users.forEach((user: User) => { if (user.id && user.name) map[user.id] = user.name; });
        setUserMap(map);
        setAllCreators([t("common.all"), ...users.map((u: User) => u.name)]);
      } catch {
        setAllCreators([t("common.all")]);
      }
    };
    void fetchUsers();
  }, []);

  const getUserName = (createdBy: string | null | undefined): string => {
    if (!createdBy) return "-";
    if (!createdBy.includes("-")) return createdBy;
    return userMap[createdBy] || createdBy;
  };

  const filteredSeedlings = allSeedlings.filter((seedling) => {
    if (creatorFilter !== t("common.all") && getUserName(seedling.createdBy) !== creatorFilter) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      if (searchCategory === "localName") return seedling.localName?.toLowerCase().includes(s);
      if (searchCategory === "scientificName") return seedling.scientificName?.toLowerCase().includes(s);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredSeedlings.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentSeedlings = filteredSeedlings.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    navigate(`?page=1`, { replace: true });
  }, [searchTerm, searchCategory, creatorFilter]);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    } catch { return "-"; }
  };

  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
    navigate(`?page=${newPage}`);
  };

  const clearFilters = (): void => {
    setSearchTerm("");
    setSearchCategory("localName");
    setCreatorFilter(t("common.all"));
  };

  const handleDelete = (id: string): void => {
    setSeedlingToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!seedlingToDelete) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/api/seedlings`, { data: { id: seedlingToDelete } });
      setAllSeedlings(allSeedlings.filter((s) => s.id !== seedlingToDelete));
      setShowDeleteModal(false);
      setSeedlingToDelete(null);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch {
      setShowDeleteModal(false);
      setSeedlingToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = (): void => {
    setShowDeleteModal(false);
    setSeedlingToDelete(null);
  };

  const statItems = [
    {
      label: t("seedling.totalSeedlingsCount"),
      value: filteredSeedlings.length,
      icon: (
        <svg className="w-6 h-6 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: t("seedling.displayOnPage"),
      value: currentSeedlings.length,
      icon: (
        <svg className="w-6 h-6 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: t("seedling.totalPages"),
      value: totalPages,
      icon: (
        <svg className="w-6 h-6 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const tableHeaders = [
    "STT",
    t("seedling.localNameLabel"),
    t("seedling.scientificNameLabel"),
    `${t("seedling.parentA")} - ${t("seedling.localNameLabel")}`,
    `${t("seedling.parentA")} - ${t("seedling.scientificNameLabel")}`,
    t("seedling.createdDate"),
    t("seedling.createdBy"),
    t("common.status"),
    t("common.action"),
  ];

  return (
    <main className="seedlings-page ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] text-blue-950">

      {/* GSAP top progress bar */}
      <div
        ref={progressRef}
        className="fixed top-16 left-0 sm:left-64 right-0 h-[3px] bg-gradient-to-r from-[#005792] to-[#00CED1] z-50 origin-left"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />

      <div className="space-y-6 px-6 pb-10">

        {/* ── Header ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#005792]">{t("seedling.seedlingManagement")}</h1>
              <p className="mt-1 text-sm text-blue-900/70">{t("seedling.seedlingManagementDesc")}</p>
            </div>
            {activeTab === "list" && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                onClick={() => navigate("/researcher/seedlings/create")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#005792] px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#004d73] active:bg-[#003f5a] focus:outline-none focus:ring-2 focus:ring-[#005792]/60"
              >
                <motion.svg
                  className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  whileHover={{ rotate: 90 }} transition={{ duration: 0.25 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </motion.svg>
                {t("common.add")}
              </motion.button>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-2 mt-6 border-b border-blue-100">
            <motion.button
              whileHover={{ backgroundColor: activeTab === "list" ? undefined : "rgba(239,246,255,0.5)" }}
              onClick={() => setActiveTab("list")}
              className={`px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === "list"
                  ? "text-[#005792] border-b-2 border-[#005792]"
                  : "text-blue-900/60 hover:text-blue-900/80 border-b-2 border-transparent"
              }`}
            >
              {t("seedling.seedlingList")}
            </motion.button>
            <motion.button
              whileHover={{ backgroundColor: activeTab === "analysis" ? undefined : "rgba(239,246,255,0.5)" }}
              onClick={() => setActiveTab("analysis")}
              className={`px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === "analysis"
                  ? "text-[#005792] border-b-2 border-[#005792]"
                  : "text-blue-900/60 hover:text-blue-900/80 border-b-2 border-transparent"
              }`}
            >
              {t("seedling.successRateAnalysis")}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* ── Stat cards ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statItems.map((item, idx) => (
            <motion.div
              key={item.label}
              custom={idx}
              variants={statCard}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -5, boxShadow: "0 12px 28px -6px rgba(0,0,0,0.12)", transition: { duration: 0.2 } }}
              className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">{item.label}</p>
                <p className="text-3xl font-semibold text-blue-950">
                  <AnimatedCounter value={item.value} />
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                {item.icon}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Search & Filters ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
        >
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex-1 min-w-[260px] flex gap-2">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value as SearchCategory)}
                className="border border-blue-100 bg-white/90 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
              >
                <option value="localName">{t("seedling.localNameLabel")}</option>
                <option value="scientificName">{t("seedling.scientificNameLabel")}</option>
              </select>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#005792]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={`${t("seedling.searchByName")} ${searchCategory === "localName" ? t("seedling.localNameLabel") : t("seedling.scientificNameLabel")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-blue-100 bg-white/90 rounded-xl px-4 py-2 pl-11 text-sm font-medium text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#005792] transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700 font-medium">{t("seedling.creatorLabel")}</span>
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
              >
                <option value={t("common.all")}>{t("common.all")}</option>
                {allCreators.map((creator) => <option key={creator} value={creator}>{creator}</option>)}
              </select>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-[#005792] border border-blue-100 rounded-xl hover:bg-blue-50 transition-all duration-200"
            >
              {t("common.clearFilters")}
            </motion.button>
          </div>

          {/* Active filter tags */}
          <AnimatePresence>
            {(searchTerm.trim() || creatorFilter !== t("common.all")) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-wrap gap-2 pt-2 border-t border-blue-100 overflow-hidden"
              >
                <span className="text-xs text-blue-700">{t("seedling.appliedFilters")}</span>
                {searchTerm.trim() && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-800">
                    {searchCategory === "localName" ? t("seedling.localNameLabel") : t("seedling.scientificNameLabel")}: "{searchTerm}"
                  </motion.span>
                )}
                {creatorFilter !== t("common.all") && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-50 text-cyan-700">
                    {t("seedling.creatorLabel")} {creatorFilter}
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Table ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-[#E6F1FF] to-[#F0F8FF] border-b border-blue-100">
                <tr>
                  {tableHeaders.map((header, i) => (
                    <motion.th
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.04, duration: 0.3, ease: EASE_OUT }}
                      className="text-left px-6 py-4 font-semibold text-[#005792] text-sm"
                    >
                      {header}
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
                      className="border-b border-blue-50 animate-pulse"
                    >
                      {Array.from({ length: 9 }).map((__, ci) => (
                        <td key={ci} className="py-4 px-6">
                          <div className={`h-4 bg-blue-100 rounded ${ci === 0 ? "w-8" : ci === 7 ? "w-16" : ci === 8 ? "w-16" : "w-full"}`} />
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : currentSeedlings.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={9} className="text-center p-8 text-blue-900/40">{t("common.noData")}</td>
                  </motion.tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {currentSeedlings.map((seedling, index) => {
                      const isDeleted = Boolean(seedling.deletedDate ?? seedling.deletedBy);
                      return (
                        <motion.tr
                          key={seedling.id}
                          custom={index}
                          variants={tableRow}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          whileHover={{ backgroundColor: "rgba(239,246,255,0.85)", transition: { duration: 0.15 } }}
                          className="border-b border-blue-50 cursor-pointer"
                          onClick={() => navigate(`/researcher/seedlings/${seedling.id}`)}
                        >
                          <td className="py-4 px-6 font-medium text-blue-950">{startIndex + index + 1}</td>
                          <td className="py-4 px-6 font-medium text-blue-950">{seedling.localName}</td>
                          <td className="py-4 px-6 font-medium text-blue-950">{seedling.scientificName}</td>
                          <td className="py-4 px-6 font-medium text-blue-950">{seedling.parentALocalName ?? "-"}</td>
                          <td className="py-4 px-6 font-medium text-blue-950">{seedling.parentAScientificName ?? "-"}</td>
                          <td className="py-4 px-6 font-medium text-blue-950">{formatDate(seedling.createdDate)}</td>
                          <td className="py-4 px-6 font-medium text-blue-950">{getUserName(seedling.createdBy)}</td>
                          <td className="py-4 px-6">
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.04 + 0.1, duration: 0.28, ease: EASE_OUT }}
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDeleted ? "bg-gray-100 text-gray-700" : "bg-cyan-50 text-cyan-700"}`}
                            >
                              <span className={`h-2 w-2 rounded-full ${isDeleted ? "bg-gray-400" : "bg-cyan-700"}`} />
                              {isDeleted ? t("common.inactive") : t("common.active")}
                            </motion.span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2 justify-center">
                              {/* Edit */}
                              <motion.button
                                whileHover={!isDeleted ? { scale: 1.2, backgroundColor: "rgba(239,246,255,1)" } : {}}
                                whileTap={!isDeleted ? { scale: 0.9 } : {}}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                onClick={(e) => { e.stopPropagation(); if (!isDeleted) navigate(`/researcher/seedlings/update/${seedling.id}`); }}
                                disabled={isDeleted}
                                className={`inline-flex items-center justify-center rounded-lg p-2 text-[#005792] transition-all duration-200 ${isDeleted ? "opacity-50 cursor-not-allowed" : ""}`}
                                aria-label={t("common.edit")}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                </svg>
                              </motion.button>
                              {/* Delete */}
                              <motion.button
                                whileHover={!isDeleted ? { scale: 1.2, backgroundColor: "rgba(254,242,242,1)" } : {}}
                                whileTap={!isDeleted ? { scale: 0.9 } : {}}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                onClick={(e) => { e.stopPropagation(); if (!isDeleted) handleDelete(seedling.id); }}
                                disabled={isDeleted}
                                className={`inline-flex items-center justify-center rounded-lg p-2 text-[#005792] transition-all duration-200 ${isDeleted ? "opacity-50 cursor-not-allowed" : ""}`}
                                aria-label={t("common.delete")}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6v14h8V6" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 10v6" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10v6" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6V4h6v2" />
                                </svg>
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <AnimatePresence>
            {!loading && filteredSeedlings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
                className="flex justify-between items-center text-sm text-gray-600 p-6 bg-white/70 border-t border-blue-100"
              >
                <span className="font-medium">
                  {t("seedling.displaying")} {(page - 1) * PAGE_SIZE + 1}-
                  {Math.min(page * PAGE_SIZE, filteredSeedlings.length)} {t("common.of")} {filteredSeedlings.length}
                </span>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    {page > 1 && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => handlePageChange(page - 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all font-medium shadow-sm">←</motion.button>
                    )}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <motion.button
                          key={pageNum} type="button"
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                            page === pageNum ? "bg-[#005792] text-white" : "bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    })}
                    {page < totalPages && (
                      <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => handlePageChange(page + 1)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all font-medium shadow-sm">→</motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SuccessRateAnalysis />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4"
              >
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-10.5a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{t("seedling.deleteConfirm")}</h3>
              <p className="text-sm text-gray-600 text-center mb-6">{t("seedling.cannotBeUndone")}</p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={cancelDelete} disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t("common.cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={confirmDelete} disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />{t("seedling.deleting")}</>
                  ) : t("common.delete")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success Modal ── */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4"
              >
                {/* Animated checkmark */}
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <motion.path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{t("seedling.deleteSuccess")}</h3>
              <p className="text-sm text-gray-600 text-center">{t("seedling.deleteSuccessMessage")}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}