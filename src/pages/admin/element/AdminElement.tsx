import { useState } from "react";
import { useTranslation } from "react-i18next";
import ChemicalList from "../../../components/AdminChemical";
import MaterialList from "../../../components/AdminMaterial";

export default function AdminElement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"chemical" | "material">("chemical");

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-green-800 mb-6">
        {t("element.elementManagement") || "Element Management"}
      </h1>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-300">
          <nav className="flex gap-4">
            <button
              type="button"
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === "chemical"
                  ? "border-green-800 text-green-800"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("chemical")}
            >
              {t("element.chemical") || "Chemical"}
            </button>
            <button
              type="button"
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === "material"
                  ? "border-green-800 text-green-800"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("material")}
            >
              {t("element.material") || "Material"}
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "chemical" && <ChemicalList t={t} />}
        {activeTab === "material" && <MaterialList t={t} />}
      </div>
    </main>
  );
}