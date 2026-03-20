/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { motion, AnimatePresence, useInView, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import axiosInstance from "../../../api/axiosInstance";

gsap.registerPlugin(ScrollTrigger);

/* ─── Types ─────────────────────────────────────────────── */
interface Material {
  id: number;
  name: string;
  category: string;
  description: string | null;
  unit: string;
}
interface Chemical {
  id: number;
  name: string;
  category: string;
  description: string | null;
  concentrationUnit: string;
}
interface StageMaterial {
  id: string;
  material: Material;
}
interface StageChemical {
  id: string;
  chemical: Chemical;
}
interface StageDefinition {
  id: number;
  name: string;
  description: string;
}
interface MethodStage {
  id: number;
  durationsDays: number;
  order: number;
  isSampleGenerated: boolean;
  stageDefinition: StageDefinition;
  stageMaterials: StageMaterial[];
  stageChemicals: StageChemical[];
}
interface MethodDetail {
  id: number;
  name: string;
  description: string;
  totalDurationDays: number;
  methodStages: MethodStage[];
}
interface MethodDetailApiResponse {
  id?: number;
  name?: string;
  description?: string;
  totalDurationDays?: number;
  methodStages?: MethodStage[];
}

/* ─── Animation variants ─────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as number[] },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      delay: i * 0.12,
      ease: [0.22, 1, 0.36, 1] as number[],
    },
  }),
};

const chipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      delay: i * 0.06,
      ease: [0.34, 1.56, 0.64, 1] as number[],
    },
  }),
};

/* ─── Sub-components ─────────────────────────────────────── */

/** Skeleton Pulse (same as before but wrapped in motion) */
function SkeletonLoader() {
  return (
    <motion.main
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6"
    >
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </motion.main>
  );
}

/** Animated item chip (material / chemical card) */
function ItemChip({
  name,
  category,
  index,
}: {
  name: string;
  category: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={chipVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -3,
        boxShadow: "0 8px 24px rgba(0,87,146,0.12)",
        borderColor: "#93c5fd",
        transition: { duration: 0.2 },
      }}
      className="flex items-start gap-3 p-4 rounded-xl bg-white border border-blue-50 shadow-sm cursor-default"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.06 + 0.2, type: "spring", stiffness: 300 }}
        className="inline-block w-2 h-2 rounded-full bg-[#00CED1] mt-1.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#005792] truncate">{name}</div>
        <div className="text-xs text-blue-600">{category}</div>
      </div>
    </motion.div>
  );
}

/** A single stage card — uses GSAP ScrollTrigger for the reveal  */
function StageCard({
  stage,
  index,
  t,
}: {
  stage: MethodStage;
  index: number;
  t: (key: string) => string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-80px" });

  /* GSAP timeline for the order badge + timeline connector line */
  const badgeRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isInView) return;

    const ctx = gsap.context(() => {
      /* Badge pop */
      gsap.fromTo(
        badgeRef.current,
        { scale: 0, rotation: -15 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          delay: 0.15,
          ease: "back.out(2)",
        }
      );

      /* Connector line draw-down (if not last) */
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0, transformOrigin: "top center" },
          { scaleY: 1, duration: 0.7, delay: 0.4, ease: "power2.inOut" }
        );
      }
    });

    return () => ctx.revert();
  }, [isInView]);

  return (
    <div ref={cardRef} className="relative flex gap-4">
      {/* Timeline track */}
      <div className="flex flex-col items-center pt-5">
        <span
          ref={badgeRef}
          style={{ display: "inline-flex" }}
          className="items-center justify-center w-9 h-9 rounded-full bg-[#005792] text-white font-bold text-sm shadow-lg z-10"
        >
          {stage.order}
        </span>
        {/* Vertical line — GSAP animates scaleY */}
        <div
          ref={lineRef}
          className="w-0.5 flex-1 bg-gradient-to-b from-[#005792]/40 to-transparent mt-1"
          style={{ minHeight: "32px" }}
        />
      </div>

      {/* Card body */}
      <motion.div
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="flex-1 bg-[#F0F8FF] rounded-2xl shadow-sm border border-blue-100 overflow-hidden mb-4"
      >
        {/* Stage Header */}
        <div className="bg-blue-50/50 border-b border-blue-100 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <motion.h3
                variants={fadeUp}
                custom={0}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="text-lg font-bold text-[#005792] mb-1"
              >
                {stage.stageDefinition.name}
              </motion.h3>
              <motion.p
                variants={fadeUp}
                custom={1}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="text-sm text-blue-800"
              >
                {stage.stageDefinition.description}
              </motion.p>
            </div>

            <div className="flex flex-col items-end gap-2 ml-4">
              <motion.span
                initial={{ opacity: 0, x: 12 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#00CED1]/15 text-[#005792]"
              >
                {stage.durationsDays} {t("common.days")}
              </motion.span>
              {stage.isSampleGenerated && (
                <motion.span
                  initial={{ opacity: 0, x: 12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#00CED1]/15 text-[#005792]"
                >
                  {t("experimentLog.canGenerateSample")}
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Stage Content */}
        <div className="p-6 space-y-6">
          {/* Materials */}
          <div>
            <motion.h4
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {t("task.materialName")} ({stage.stageMaterials.length})
            </motion.h4>

            {stage.stageMaterials.length === 0 ? (
              <p className="text-sm text-blue-400 ml-7">{t("experimentLog.noMaterials")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stage.stageMaterials.map((item, i) => (
                  <ItemChip
                    key={item.id}
                    name={item.material.name}
                    category={item.material.category}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Chemicals */}
          <div>
            <motion.h4
              variants={fadeUp}
              custom={1}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              {t("task.chemicalName")} ({stage.stageChemicals.length})
            </motion.h4>

            {stage.stageChemicals.length === 0 ? (
              <p className="text-sm text-blue-400 ml-7">{t("experimentLog.noChemicals")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stage.stageChemicals.map((item, i) => (
                  <ItemChip
                    key={item.id}
                    name={item.chemical.name}
                    category={item.chemical.category}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function MethodDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<MethodDetail | null>(null);
  const [loading, setLoading] = useState(true);

  /* GSAP: animated progress bar at top of page */
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !progressRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(progressRef.current, {
        scaleX: 1,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.3,
      });
    });
    return () => ctx.revert();
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/methods/${id}`);
        const json = res.data as MethodDetailApiResponse;
        if (json.id && json.name) {
          setData({
            id: json.id,
            name: json.name,
            description: json.description ?? "",
            totalDurationDays: json.totalDurationDays ?? 0,
            methodStages: json.methodStages ?? [],
          });
        }
      } catch (error) {
        const apiError = error as { response?: { data?: string }; message?: string };
        enqueueSnackbar(
          apiError.response?.data ?? apiError.message ?? t("method.fetchFailed"),
          { variant: "error" }
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id, t, enqueueSnackbar]);

  /* ── Loading ── */
  if (loading) return <SkeletonLoader />;

  /* ── No data ── */
  if (!data) {
    return (
      <motion.main
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6"
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-lg p-8 text-center"
        >
          <p className="text-gray-500">{t("common.noData")}</p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 bg-[#005792] text-white px-6 py-2 rounded-full hover:bg-blue-900 transition"
            onClick={() => navigate("/researcher/method")}
          >
            {t("common.back")}
          </motion.button>
        </motion.div>
      </motion.main>
    );
  }

  /* ── Main render ── */
  return (
    <motion.main
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6"
    >
      {/* Top progress bar — GSAP scaleX from 0→1 */}
      <div
        className="fixed top-16 left-64 right-0 h-[3px] bg-gradient-to-r from-[#005792] to-[#00CED1] z-50 origin-left"
        ref={progressRef}
        style={{ transform: "scaleX(0)" }}
      />

      {/* ── Header ── */}
      <div className="mb-6">
        <motion.button
          type="button"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          whileHover={{ x: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-[#005792] hover:text-blue-800 font-medium mb-3 flex items-center gap-1"
          onClick={() => navigate("/researcher/method")}
        >
          ← {t("common.back")}
        </motion.button>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-2xl font-bold text-[#005792] mb-2"
        >
          {data.name}
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-blue-700"
        >
          {data.description}
        </motion.p>
      </div>

      {/* ── Info Card ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3}
        whileHover={{ boxShadow: "0 8px 32px rgba(0,87,146,0.1)" }}
        className="bg-white/80 backdrop-blur-sm shadow-sm border border-blue-100 rounded-2xl p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-blue-900/60 mb-1">{t("method.methodName")}</div>
            <div className="font-bold text-blue-950">{data.name}</div>
          </div>
          <div>
            <div className="text-xs text-blue-900/60 mb-1">{t("common.duration")}</div>
            <div className="font-bold text-blue-950">
              {/* Animated counter */}
              <AnimatedCounter value={data.totalDurationDays} /> {t("common.days")}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stages ── */}
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={4}
        className="text-xl font-bold text-gray-900 mb-6"
      >
        {t("experimentLog.stages")} ({data.methodStages.length})
      </motion.h2>

      <AnimatePresence>
        {data.methodStages.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-lg p-8 text-center text-gray-400"
          >
            {t("common.noData")}
          </motion.div>
        ) : (
          <div className="space-y-0">
            {data.methodStages.map((stage, i) => (
              <StageCard key={stage.id} stage={stage} index={i} t={t} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

/* ─── Animated Counter (GSAP) ───────────────────────────── */
function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(obj.current, {
        val: value,
        duration: 1.2,
        ease: "power2.out",
        delay: 0.5,
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = Math.round(obj.current.val).toString();
          }
        },
      });
    });
    return () => ctx.revert();
  }, [value]);

  return <span ref={ref}>0</span>;
}