/* eslint-disable react-x/no-array-index-key */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Seedling } from "../../../types/Seedling";
import type { User } from "../../../types/Auth";
import axiosInstance from "../../../api/axiosInstance";
import { findClosestColorName } from "../../../utils/colorHelper";
import "./AdminSeedlingDetail.css";

export default function AdminSeedlingDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const [seedling, setSeedling] = useState<Seedling | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

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
        const response = await axiosInstance.get<{ value?: Seedling }>(`/api/seedlings/${id}`);

        let seedlingData: Seedling | null = null;

        if (response.data?.value) {
          seedlingData = response.data.value;
        } else if (response.data) {
          seedlingData = response.data as unknown as Seedling;
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

  // Fetch users for mapping IDs to names
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get<{ data: User[] }>("/api/user?PageNumber=1&PageSize=1000");
        const users = response.data?.data ?? [];

        const map: Record<string, string> = {};
        users.forEach((user: User) => {
          if (user.id && user.name) {
            map[user.id] = user.name;
          }
        });
        setUserMap(map);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    void fetchUsers();
  }, []);

  if (loading) {
    return (
      <main className="admin-seedling-detail ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
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
      <main className="admin-seedling-detail ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <button
            type="button"
            className="back-button inline-flex items-center px-4 py-2 mb-6 text-sm font-medium"
            onClick={() => { navigate(`/admin/seedling?page=${page}`); }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("common.back")}
          </button>
          <div className="bg-white rounded-xl p-16 text-center border border-gray-200">
            <p className="text-red-600 text-lg">{error ?? t("seedling.notFound")}</p>
          </div>
        </div>
      </main>
    );
  }

  const formatDate = (dateString: string | null | undefined): string => {
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

  const getUserName = (userId: string | null | undefined): string => {
    if (!userId) return "-";
    if (!userId.includes("-")) return userId;
    return userMap[userId] || userId;
  };

  return (
    <main className="admin-seedling-detail ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          type="button"
          className="back-button inline-flex items-center px-4 py-2 mb-6 text-sm font-medium"
          onClick={() => { navigate(`/admin/seedling?page=${page}`); }}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("common.back")}
        </button>

        {/* Header */}
        <div className="detail-header mb-8">
          <div>
            <h1 className="detail-title text-4xl font-bold mb-2">
              {seedling.localName || seedling.scientificName}
            </h1>
            <p className="detail-subtitle text-lg">
              <em>{seedling.scientificName}</em>
            </p>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2">
            <div className="info-card bg-white rounded-xl shadow-md p-8 border-l-4 border-red-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="section-icon section-icon--info w-8 h-8 flex items-center justify-center rounded-full mr-3 font-semibold">
                  ℹ
                </span>
                {t("seedling.basicInfo")}
              </h2>

              <div className="space-y-4">
                <div className="info-row">
                  <span className="info-label font-semibold">
                    {t("seedling.seedlingName")}:
                  </span>
                  <span className="info-value">{seedling.localName}</span>
                </div>

                <div className="info-row">
                  <span className="info-label font-semibold">
                    {t("seedling.scientificName")}:
                  </span>
                  <span className="info-value italic">
                    {seedling.scientificName}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label font-semibold">
                    {t("seedling.description")}:
                  </span>
                  <span className="info-value">
                    {seedling.description || "-"}
                  </span>
                </div>

                {seedling.parentALocalName && (
                  <div className="info-row">
                    <span className="info-label font-semibold">
                      {t("seedling.parentA")}:
                    </span>
                    <div className="info-value">
                      <div>{seedling.parentALocalName}</div>
                      <div className="text-sm italic mt-0.5 opacity-70">
                        {seedling.parentAScientificName}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="info-card bg-white rounded-xl shadow-md p-8 border-l-4 border-orange-500">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <span className="section-icon section-icon--meta w-8 h-8 flex items-center justify-center rounded-full mr-3 font-semibold">
                ⏱
              </span>
              {t("seedling.metadata")}
            </h2>

            <div className="space-y-4">
              <div className="metadata-item">
                <div className="text-sm font-semibold mb-1 metadata-label">
                  {t("seedling.createdDate")}
                </div>
                <div className="font-medium metadata-value">
                  {formatDate(seedling.createdDate)}
                </div>
              </div>

              <div className="metadata-item">
                <div className="text-sm font-semibold mb-1 metadata-label">
                  {t("seedling.createdBy")}
                </div>
                <div className="font-medium metadata-value">
                  {getUserName(seedling.createdBy)}
                </div>
              </div>

              {seedling.updatedDate && (
                <div className="metadata-item">
                  <div className="text-sm font-semibold mb-1 metadata-label">
                    {t("seedling.updatedDate")}
                  </div>
                  <div className="font-medium metadata-value">
                    {formatDate(seedling.updatedDate)}
                  </div>
                </div>
              )}

              {seedling.updatedBy && (
                <div className="metadata-item">
                  <div className="text-sm font-semibold mb-1 metadata-label">
                    {t("seedling.updatedBy")}
                  </div>
                  <div className="font-medium metadata-value">
                    {getUserName(seedling.updatedBy)}
                  </div>
                </div>
              )}

              {seedling.deletedDate && (
                <div className="metadata-item">
                  <div className="text-sm font-semibold mb-1 metadata-label">
                    {t("seedling.deletedDate")}
                  </div>
                  <div className="font-medium metadata-value">
                    {formatDate(seedling.deletedDate)}
                  </div>
                </div>
              )}

              {seedling.deletedBy && (
                <div className="metadata-item">
                  <div className="text-sm font-semibold mb-1 metadata-label">
                    {t("seedling.deletedBy")}
                  </div>
                  <div className="font-medium metadata-value">
                    {getUserName(seedling.deletedBy)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Traits Section */}
        {seedling.traits && seedling.traits.length > 0 && (() => {
          const colorTraits = seedling.traits.filter(
            (trait) => trait.name === "Màu hoa chính" || trait.name === "Màu hoa phụ"
          );
          const colorCards = colorTraits.map((trait) => {
            const value = trait.value;
            const r = Math.floor(value / 1_000_000);
            const g = Math.floor((value % 1_000_000) / 1_000);
            const b = value % 1_000;
            const colorName = findClosestColorName(r, g, b);
            return (
              <div
                key={trait.name}
                className="trait-card rounded-lg p-6 border hover:shadow-lg transition-shadow"
              >
                <div className="text-sm font-semibold trait-label mb-4">{trait.name}</div>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-lg border-4 border-gray-300 shadow-md flex-shrink-0"
                    style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                  />
                  <div className="flex-1">
                    <div className="text-2xl font-bold trait-value">{colorName}</div>
                    <div className="text-xs font-mono mt-1 trait-rgb">RGB({r}, {g}, {b})</div>
                  </div>
                </div>
              </div>
            );
          });

          const otherTraits = seedling.traits.filter(
            (trait) => trait.name !== "Màu hoa chính" && trait.name !== "Màu hoa phụ"
          );

          return (
            <div className="info-card bg-white rounded-xl shadow-md p-8 border-l-4 border-rose-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="section-icon section-icon--traits w-8 h-8 flex items-center justify-center rounded-full mr-3 font-semibold">
                  🌱
                </span>
                {t("seedling.traits")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {colorCards}
                {otherTraits.map((trait, index) => (
                  <div
                    key={trait.name + index}
                    className="trait-card rounded-lg p-6 border hover:shadow-lg transition-shadow"
                  >
                    <div className="text-sm font-semibold trait-label mb-2 line-clamp-2">
                      {trait.name}
                    </div>
                    <div className="text-3xl font-bold trait-value mb-2">
                      {trait.value}
                    </div>
                    <div className="text-sm font-medium trait-unit">
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
          <div className="info-card bg-white rounded-xl shadow-md p-8 border-l-4 border-rose-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="section-icon section-icon--traits w-8 h-8 flex items-center justify-center rounded-full mr-3 font-semibold">
                🌱
              </span>
              {t("seedling.traits")}
            </h2>
            <div className="text-center py-8 trait-empty">
              {t("seedling.noTraits") || "No traits recorded"}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}