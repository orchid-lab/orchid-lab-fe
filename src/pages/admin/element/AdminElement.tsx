import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, TestTube2, Layers } from "lucide-react";
import ChemicalList from "../../../components/AdminChemical";
import MaterialList from "../../../components/AdminMaterial";
import "./AdminElement.css"; // Import CSS riêng biệt

export default function AdminElement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"chemical" | "material">("chemical");

  const tabs = [
    { id: "chemical", label: t("element.chemical") || "Hóa chất", icon: TestTube2 },
    { id: "material", label: t("element.material") || "Vật tư", icon: Layers },
  ] as const;

  // --- Framer Motion Variants ---
  const pageVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  const tabContentVariants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <main className="admin-element-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={pageVariants} 
        className="max-w-[1600px] mx-auto flex flex-col"
      >
        
        {/* ─── Header Section ─── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-rose-50 rounded-xl border border-rose-100 shadow-sm">
            <FlaskConical className="w-6 h-6 text-[#9f1239]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#9f1239] tracking-tight">
              {t("element.elementManagement") || "Quản lý Yếu tố Thí nghiệm"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý danh sách hóa chất và vật tư tiêu hao trong hệ thống
            </p>
          </div>
        </div>

        {/* ─── Modern Animated Tabs ─── */}
        <div className="mb-6 flex">
          <div className="flex p-1.5 space-x-1 bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  type="button" // Đã thêm type="button" để fix lỗi ESLint
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-300 outline-none ${
                    isActive 
                      ? "text-[#9f1239]" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-rose-50/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicatorElement"
                      className="absolute inset-0 bg-rose-50 border border-rose-100/60 rounded-xl shadow-sm"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Tab Content Area (Tự động giãn chiều cao theo nội dung, không có thanh cuộn trong) ─── */}
        <div className="bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full">
          {/* Sử dụng mode="wait" để chờ Component cũ biến mất hẳn rồi Component mới mới xuất hiện, 
              tránh làm khung layout bị giật/đẩy khi thay đổi nội dung */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <div className="p-6">
                {activeTab === "chemical" ? (
                  <ChemicalList t={t} />
                ) : (
                  <MaterialList t={t} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>
    </main>
  );
}