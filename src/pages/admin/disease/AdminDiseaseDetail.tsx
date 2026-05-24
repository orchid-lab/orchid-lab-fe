/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronLeft, AlertCircle, Info, ShieldCheck, Box, Layers } from "lucide-react";

interface Disease {
  id: number;
  name: string;
  description?: string;
  diseaseCode?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminDiseaseDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";

  const [disease, setDisease] = useState<Disease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiseaseDetail = async () => {
      if (!id) {
        setError("Invalid disease ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(`/api/diseases/${id}`);
        const payload = response.data?.value ?? response.data;
        setDisease(payload ?? null);
      } catch (err) {
        console.error("Error loading disease:", err);
        setError(t("common.errorLoading") || "Error loading data");
      } finally {
        setLoading(false);
      }
    };
    void fetchDiseaseDetail();
  }, [id, t]);

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 bg-slate-100 rounded-xl w-32" />
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-4 shadow-sm">
            <div className="h-8 bg-slate-100 rounded-xl w-3/4" />
            <div className="h-4 bg-slate-100 rounded-xl w-full" />
            <div className="h-4 bg-slate-100 rounded-xl w-2/3" />
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="h-24 bg-slate-100 rounded-2xl" />
              <div className="h-24 bg-slate-100 rounded-2xl" />
              <div className="h-24 bg-slate-100 rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !disease) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold text-lg mb-2">
            {error ?? t("common.noData")}
          </p>
          <p className="text-slate-400 text-sm mb-6">
            {t("common.errorOccurred") || "An error occurred"}
          </p>
          <button
            type="button"
            className="px-6 py-2.5 font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-700 transition-colors shadow-sm"
            onClick={() => void navigate(`/admin/disease?page=${page}`)}
          >
            {t("common.back") || "Back"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#fffbfb] p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div className="mb-6" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
            onClick={() => void navigate(`/admin/disease?page=${page}`)}
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t("common.back") || "Back"}
          </button>
        </motion.div>

        <motion.div className="space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-slate-50 to-transparent rounded-full opacity-50 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm flex-shrink-0">
                    <ShieldCheck className="w-8 h-8 text-slate-900" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{disease.name}</h1>
                    <p className="text-xs font-mono text-slate-400 mt-1">ID: {disease.id}</p>
                  </div>
                </div>
                <p className="text-slate-600 text-base leading-relaxed max-w-4xl ml-1">
                  {disease.description ?? t("common.noData")}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-sm">
                  <Box className="w-4 h-4 mr-2" />
                  {disease.status ?? t("status.unknown") ?? "Unknown"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-slate-100 transition-colors">
                  <Info className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("disease.diseaseCode") ?? "Disease Code"}</p>
                  <p className="text-2xl font-black text-slate-800">{disease.diseaseCode ?? "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-slate-100 transition-colors">
                  <Layers className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.updatedAt") || "Updated At"}</p>
                  <p className="text-2xl font-black text-slate-800">{disease.updatedAt ? new Date(disease.updatedAt).toLocaleDateString() : "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-slate-100 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.createdAt") || "Created At"}</p>
                  <p className="text-2xl font-black text-slate-800">{disease.createdAt ? new Date(disease.createdAt).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
