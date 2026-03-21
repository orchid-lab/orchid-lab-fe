/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../api/axiosInstance";
import {
  getHybridSuccessRates,
  type GetHybridSuccessRatesParams,
} from "../../../api/seedlingApi";
import type { HybridSuccessRate } from "../../../types/Seedling";

interface MethodOption {
  id: number;
  name: string;
}

interface SeedlingParentOption {
  id: string;
  name: string;
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      delay: (i as number) * 0.07,
      ease: EASE_OUT,
    },
  }),
};

const tagAnimation = {
  enter: { opacity: 0, scale: 0.8 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

export default function SuccessRateAnalysis() {
  const { t } = useTranslation();
  const [successRates, setSuccessRates] = useState<HybridSuccessRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [parentFilter, setParentFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [allParents, setAllParents] = useState<SeedlingParentOption[]>([]);
  const [allMethods, setAllMethods] = useState<MethodOption[]>([]);
  const [highestSuccessRate, setHighestSuccessRate] = useState<string>("");

  /* Fetch parent seedlings and methods */
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        /* Fetch seedlings for parent dropdown */
        const seedlingRes = await axiosInstance.get(
          "api/seedlings?PageNumber=1&PageSize=1000",
        );
        const seedlings = (seedlingRes.data?.data as any[] ?? []).map(
          (s: any) => ({
            id: s.id as string,
            name: (s.localName as string) ?? (s.scientificName as string),
          }),
        );
        setAllParents(
          seedlings.filter((s) => s.id && s.name) as SeedlingParentOption[],
        );

        /* Fetch methods for method dropdown */
        const methodRes = await axiosInstance.get(
          "api/methods?PageNumber=1&PageSize=1000",
        );
        const methods = (methodRes.data?.data as any[] ?? []).map(
          (m: any) => ({
            id: m.id as number,
            name: m.name as string,
          }),
        );
        setAllMethods(methods as MethodOption[]);
      } catch (err) {
        console.error("Error fetching filter options:", err);
      }
    };

    void fetchOptions();
  }, []);

  /* Fetch success rates based on filters */
  const fetchSuccessRates = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetHybridSuccessRatesParams = {};
      if (parentFilter) params.seedlingParentId = parentFilter;
      if (methodFilter) params.methodId = parseInt(methodFilter, 10);
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const data = await getHybridSuccessRates(params);
      setSuccessRates(data);

      /* Find highest success rate */
      if (data.length > 0) {
        const highest = Math.max(...data.map((d) => d.successRate));
        const highestItem = data.find((d) => d.successRate === highest);
        if (highestItem) {
          setHighestSuccessRate(
            `${highestItem.seedlingParentName} - ${highestItem.methodName}`,
          );
        }
      } else {
        setHighestSuccessRate("");
      }
    } catch (err) {
      console.error("Error fetching success rates:", err);
      setSuccessRates([]);
      setHighestSuccessRate("");
    } finally {
      setLoading(false);
    }
  }, [parentFilter, methodFilter, fromDate, toDate]);

  useEffect(() => {
    void fetchSuccessRates();
  }, [fetchSuccessRates]);

  const clearFilters = () => {
    setParentFilter("");
    setMethodFilter("");
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilters = Boolean(
    parentFilter || methodFilter || fromDate || toDate,
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
      >
        <div>
          <h2 className="text-2xl font-semibold text-[#005792]">
            {t("seedling.successRateAnalysis")}
          </h2>
          <p className="mt-1 text-sm text-blue-900/70">
            {t("seedling.compareHybridSuccessRates")}
          </p>
        </div>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Parent Seedling Filter */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              {t("seedling.parentSeedling")}
            </label>
            <select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              className="w-full border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
            >
              <option value="">{t("common.all")}</option>
              {allParents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              {t("seedling.method")}
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
            >
              <option value="">{t("common.all")}</option>
              {allMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {/* From Date Filter */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              {t("seedling.fromDate")}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
            />
          </div>

          {/* To Date Filter */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              {t("seedling.toDate")}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-blue-100 bg-white/90 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-[#005792]"
            />
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-full px-4 py-2 text-sm font-medium text-[#005792] border border-blue-100 rounded-xl hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {t("common.clearFilters")}
            </motion.button>
          </div>
        </div>

        {/* Active filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-wrap gap-2 pt-4 border-t border-blue-100 overflow-hidden"
            >
              <span className="text-xs text-blue-700">
                {t("seedling.appliedFilters")}
              </span>
              {parentFilter && (
                <motion.span
                  variants={tagAnimation}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-800 font-medium"
                >
                  {allParents.find((p) => p.id === parentFilter)?.name}
                </motion.span>
              )}
              {methodFilter && (
                <motion.span
                  variants={tagAnimation}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-cyan-50 text-cyan-700 font-medium"
                >
                  {
                    allMethods.find(
                      (m) => m.id.toString() === methodFilter,
                    )?.name
                  }
                </motion.span>
              )}
              {fromDate && (
                <motion.span
                  variants={tagAnimation}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-50 text-purple-700 font-medium"
                >
                  {t("seedling.from")} {fromDate}
                </motion.span>
              )}
              {toDate && (
                <motion.span
                  variants={tagAnimation}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-pink-50 text-pink-700 font-medium"
                >
                  {t("seedling.to")} {toDate}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Highest Success Rate ── */}
      <AnimatePresence>
        {!loading && highestSuccessRate && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="bg-gradient-to-r from-[#005792] to-cyan-600 text-white rounded-2xl shadow-sm p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">
                  {t("seedling.highestSuccessRateCombination")}
                </p>
                <p className="text-lg font-semibold mt-1">{highestSuccessRate}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results Table ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("seedling.localNameLabel")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("seedling.method")}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("seedling.totalExperiments")}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("seedling.completedExperiments")}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("seedling.successRate")}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-blue-900/60">
                  {t("seedling.averageSurvivalRate")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr
                    key={`sk-loading-${idx}`}
                    className="border-b border-blue-50 animate-pulse"
                  >
                    {Array.from({ length: 6 }).map((__, ci) => (
                      <td
                        key={`sk-loading-${idx}-${ci}`}
                        className="py-4 px-6"
                      >
                        <div className="h-4 bg-blue-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : successRates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-blue-900/40">
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {successRates.map((item, index) => {
                    const highest =
                      successRates.length > 0
                        ? Math.max(...successRates.map((d) => d.successRate))
                        : 0;
                    const isHighest = item.successRate === highest;
                    return (
                      <motion.tr
                        key={`${item.seedlingParentId}-${item.methodId}`}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 14 }}
                        layout
                        transition={{
                          duration: 0.32,
                          delay: index * 0.04,
                          ease: EASE_OUT,
                        }}
                        whileHover={{
                          backgroundColor: isHighest
                            ? "rgba(5, 150, 213, 0.08)"
                            : "rgba(239,246,255,0.85)",
                          transition: { duration: 0.15 },
                        }}
                        className={`border-b border-blue-50 ${
                          isHighest
                            ? "bg-cyan-100/20 font-semibold"
                            : "hover:bg-blue-50"
                        }`}
                      >
                        <td
                          className={`px-6 py-4 ${
                            isHighest
                              ? "text-[#005792] font-semibold"
                              : "text-blue-950"
                          }`}
                        >
                          {item.seedlingParentName}
                        </td>
                        <td
                          className={`px-6 py-4 ${
                            isHighest
                              ? "text-[#005792] font-semibold"
                              : "text-blue-950"
                          }`}
                        >
                          {item.methodName}
                        </td>
                        <td
                          className={`px-6 py-4 text-center font-medium ${
                            isHighest
                              ? "text-[#005792] font-semibold"
                              : "text-blue-950"
                          }`}
                        >
                          {item.totalExperiments}
                        </td>
                        <td
                          className={`px-6 py-4 text-center font-medium ${
                            isHighest
                              ? "text-[#005792] font-semibold"
                              : "text-blue-950"
                          }`}
                        >
                          {item.completedExperiments}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              delay: index * 0.04 + 0.1,
                              duration: 0.28,
                              ease: EASE_OUT,
                            }}
                            className={`inline-flex items-center justify-center rounded-lg px-3 py-1 ${
                              isHighest
                                ? "bg-cyan-500 text-white font-semibold shadow-md"
                                : "bg-cyan-100 text-[#005792]"
                            }`}
                          >
                            {item.successRate.toFixed(1)}%
                          </motion.div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              delay: index * 0.04 + 0.1,
                              duration: 0.28,
                              ease: EASE_OUT,
                            }}
                            className={`inline-flex items-center justify-center rounded-lg px-3 py-1 ${
                              isHighest
                                ? "bg-blue-500 text-white font-semibold shadow-md"
                                : "bg-blue-100 text-[#005792]"
                            }`}
                          >
                            {item.averageSurvivalRate.toFixed(1)}%
                          </motion.div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Summary Stats ── */}
      {!loading && successRates.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Total Combinations */}
          <motion.div
            whileHover={{
              y: -5,
              boxShadow: "0 12px 28px -6px rgba(0,0,0,0.12)",
              transition: { duration: 0.2 },
            }}
            className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6"
          >
            <p className="text-sm font-medium text-blue-700 mb-2">
              {t("seedling.totalCombinations")}
            </p>
            <p className="text-3xl font-semibold text-blue-950">
              {successRates.length}
            </p>
          </motion.div>

          {/* Average Success Rate */}
          <motion.div
            whileHover={{
              y: -5,
              boxShadow: "0 12px 28px -6px rgba(0,0,0,0.12)",
              transition: { duration: 0.2 },
            }}
            className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6"
          >
            <p className="text-sm font-medium text-blue-700 mb-2">
              {t("seedling.averageSuccessRate")}
            </p>
            <p className="text-3xl font-semibold text-[#005792]">
              {(
                successRates.reduce((sum, s) => sum + s.successRate, 0) /
                successRates.length
              ).toFixed(1)}
              %
            </p>
          </motion.div>

          {/* Average Survival Rate */}
          <motion.div
            whileHover={{
              y: -5,
              boxShadow: "0 12px 28px -6px rgba(0,0,0,0.12)",
              transition: { duration: 0.2 },
            }}
            className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6"
          >
            <p className="text-sm font-medium text-blue-700 mb-2">
              {t("seedling.averageSurvivalRateOverall")}
            </p>
            <p className="text-3xl font-semibold text-cyan-600">
              {(
                successRates.reduce((sum, s) => sum + s.averageSurvivalRate, 0) /
                successRates.length
              ).toFixed(1)}
              %
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
