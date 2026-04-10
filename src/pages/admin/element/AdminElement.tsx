/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { FlaskConical, TestTube2, Layers } from "lucide-react";
import ChemicalList from "../../../components/AdminChemical";
import MaterialList from "../../../components/AdminMaterial";
import gsap from "gsap";
import "./AdminElement.css";

/* ─── Animation variants (đồng bộ với ExperimentLog) ──── */
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

const tabContent: Variants = {
  enter: { opacity: 0, y: 10 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: [0.36, 0, 1, 0] },
  },
};

/* ─── Tab config ──────────────────────────────────────── */
const TAB_IDS = ["chemical", "material"] as const;
type TabId = (typeof TAB_IDS)[number];

export default function AdminElement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("chemical");

  const tabs: { id: TabId; labelKey: string; icon: typeof TestTube2 }[] = [
    { id: "chemical", labelKey: "element.chemical", icon: TestTube2 },
    { id: "material", labelKey: "element.material", icon: Layers },
  ];

  /* ── GSAP progress bar (giống ExperimentLog) ── */
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!progressRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        progressRef.current,
        { scaleX: 0, opacity: 1 },
        { scaleX: 1, duration: 1, ease: "power3.out" }
      );
      gsap.to(progressRef.current, { opacity: 0, duration: 0.5, delay: 1.2 });
    });
    return () => ctx.revert();
  }, []);

  /* Replay progress bar khi đổi tab */
  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    if (progressRef.current) {
      gsap.set(progressRef.current, { scaleX: 0, opacity: 1 });
      gsap.to(progressRef.current, {
        scaleX: 1,
        duration: 0.7,
        ease: "power3.out",
      });
      gsap.to(progressRef.current, {
        opacity: 0,
        duration: 0.4,
        delay: 0.9,
      });
    }
  };

  return (
    <main className="admin-element-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] text-slate-900">

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 shadow-sm">
                <FlaskConical className="w-6 h-6 text-[#9f1239]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-[#9f1239]">
                  {t("element.elementManagement") || "Quản lý Yếu tố Thí nghiệm"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {t("element.elementManagementDescription") ||
                    "Quản lý danh sách hóa chất và vật tư tiêu hao trong hệ thống"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Animated Tab Bar (trong header card) ── */}
          <div className="mt-6 flex">
            <div className="flex p-1.5 gap-1 bg-rose-50/60 border border-rose-100 rounded-2xl shadow-inner">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#f43f5e] ${
                      isActive
                        ? "text-[#9f1239]"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBg"
                        className="absolute inset-0 bg-white border border-rose-100 rounded-xl shadow-sm"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 28,
                        }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {t(tab.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Tab content card ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContent}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-6"
            >
              {activeTab === "chemical" ? (
                <ChemicalList t={t} />
              ) : (
                <MaterialList t={t} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </div>
    </main>
  );
}