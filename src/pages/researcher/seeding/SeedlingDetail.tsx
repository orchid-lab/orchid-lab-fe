import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Seedling } from "../../../types/Seedling";
import axiosInstance from "../../../api/axiosInstance";
import { findClosestColorName } from "../../../utils/colorHelper";
import "./SeedlingDetail.css";

// Additional imports can be added here if needed
export default function SeedlingDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const [seedling, setSeedling] = useState<Seedling | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeedlingDetail = async () => {
      if (!id) {
        setError(`${t("seedling.notFound")}`);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get(`/api/seedlings/${id}`);
        
        let seedlingData: Seedling | null = null;
        
        if (response.data?.value) {
          seedlingData = response.data.value;
        } else if (response.data) {
          seedlingData = response.data;
        }
        
        if (seedlingData) {
          setSeedling(seedlingData);
        } else {
          setError(`${t("seedling.notFound")}`);
        }
      } catch (err) {
        console.error("Error loading seedling:", err);
        setError(`${t("seedling.loadingError") || "Failed to load seedling details"}`);
      } finally {
        setLoading(false);
      }
    };

    void fetchSeedlingDetail();
  }, [id, t]);

  if (loading) {
    return (
      <main className="seedling-detail ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-32" />
            <div className="bg-white rounded-xl p-8 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="h-20 bg-gray-200 rounded" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-8 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-2/3" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-gray-200 rounded" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !seedling) {
    return (
      <main className="seedling-detail ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <button
            type="button"
            className="back-button inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            onClick={() => navigate(`/seedlings?page=${page}`)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("common.back")}
          </button>
          <div className="bg-white rounded-xl p-16 text-center border border-gray-200">
            <p className="text-red-600 text-lg">{error || t("seedling.notFound")}</p>
          </div>
        </div>
      </main>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="seedling-detail ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          type="button"
          className="back-button inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          onClick={() => navigate(`/seedlings?page=${page}`)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("common.back")}
        </button>

        {/* Header */}
        <div className="detail-header mb-8">
          <div>
            <h1 className="detail-title text-4xl font-bold text-blue-800 mb-2">
              {seedling.localName || seedling.scientificName}
            </h1>
            <p className="text-gray-600 text-lg">
              <em>{seedling.scientificName}</em>
            </p>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-blue-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full mr-3 font-semibold">
                  ℹ
                </span>
                {t("seedling.basicInfo")}
              </h2>

              <div className="space-y-4">
                <div className="info-row">
                  <span className="info-label font-semibold text-gray-700">
                    {t("seedling.seedlingName")}:
                  </span>
                  <span className="info-value text-gray-900">{seedling.localName}</span>
                </div>

                <div className="info-row">
                  <span className="info-label font-semibold text-gray-700">
                    {t("seedling.scientificName")}:
                  </span>
                  <span className="info-value text-gray-600 italic">
                    {seedling.scientificName}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label font-semibold text-gray-700">
                    {t("seedling.description")}:
                  </span>
                  <span className="info-value text-gray-900">
                    {seedling.description || "-"}
                  </span>
                </div>

                {seedling.parentALocalName && (
                  <div className="info-row">
                    <span className="info-label font-semibold text-gray-700">
                      {t("seedling.parentA")}:
                    </span>
                    <div className="info-value">
                      <div className="text-gray-900">{seedling.parentALocalName}</div>
                      <div className="text-gray-600 text-sm italic">
                        {seedling.parentAScientificName}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-green-500">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded-full mr-3 font-semibold">
                ⏱
              </span>
              {t("seedling.metadata")}
            </h2>

            <div className="space-y-4">
              <div className="metadata-item">
                <div className="text-sm font-semibold text-gray-600 mb-1">
                  {t("seedling.createdDate")}
                </div>
                <div className="text-gray-900 font-medium">
                  {formatDate(seedling.createdDate)}
                </div>
              </div>

              <div className="metadata-item">
                <div className="text-sm font-semibold text-gray-600 mb-1">
                  {t("seedling.createdBy")}
                </div>
                <div className="text-gray-900 font-medium">
                  {seedling.createdBy || "-"}
                </div>
              </div>

              {seedling.updatedDate && (
                <div className="metadata-item">
                  <div className="text-sm font-semibold text-gray-600 mb-1">
                    {t("seedling.updatedDate")}
                  </div>
                  <div className="text-gray-900 font-medium">
                    {formatDate(seedling.updatedDate)}
                  </div>
                </div>
              )}

              {seedling.updatedBy && (
                <div className="metadata-item">
                  <div className="text-sm font-semibold text-gray-600 mb-1">
                    {t("seedling.updatedBy")}
                  </div>
                  <div className="text-gray-900 font-medium">
                    {seedling.updatedBy}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Traits Section */}
        {seedling.traits && seedling.traits.length > 0 && (() => {
          // Hiển thị màu hoa chính/phụ từ trait name "Màu hoa chính"/"Màu hoa phụ" với value dạng RRRGGGBBB
          const colorTraits = seedling.traits.filter(trait => trait.name === "Màu hoa chính" || trait.name === "Màu hoa phụ");
          const colorCards = colorTraits.map(trait => {
            const value = trait.value;
            const r = Math.floor(value / 1_000_000);
            const g = Math.floor((value % 1_000_000) / 1_000);
            const b = value % 1_000;
            const colorName = findClosestColorName(r, g, b);
            return (
              <div key={trait.name} className="trait-card bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 hover:shadow-lg transition-shadow">
                <div className="text-sm font-semibold text-purple-700 mb-4">{trait.name}</div>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-lg border-4 border-gray-300 shadow-md flex-shrink-0"
                    style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                  />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">{colorName}</div>
                    <div className="text-xs text-gray-600 font-mono mt-1">RGB({r}, {g}, {b})</div>
                  </div>
                </div>
              </div>
            );
          });
          // Các trait còn lại (không phải màu hoa chính/phụ)
          const otherTraits = seedling.traits.filter(trait => trait.name !== "Màu hoa chính" && trait.name !== "Màu hoa phụ");
          return (
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-purple-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full mr-3 font-semibold">
                  🌱
                </span>
                {t("seedling.traits")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {colorCards}
                {otherTraits.map((trait, index) => (
                  <div
                    key={trait.name + index}
                    className="trait-card bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="text-sm font-semibold text-purple-700 mb-2 line-clamp-2">
                      {trait.name}
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {trait.value}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {trait.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Empty State for Traits */}
        {(!seedling.traits || seedling.traits.length === 0) && (
          <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full mr-3 font-semibold">
                🌱
              </span>
              {t("seedling.traits")}
            </h2>
            <div className="text-center text-gray-500 py-8">
              {t("seedling.noTraits") || "No traits recorded"}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
