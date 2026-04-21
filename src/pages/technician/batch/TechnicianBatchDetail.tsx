/* eslint-disable @typescript-eslint/no-floating-promises */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import type { TissueCultureBatch } from "../../../types/Batch";

const TechnicianBatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [item, setItem] = useState<TissueCultureBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError(t("common.invalidId"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    axiosInstance
      .get(`/api/batches/${id}`)
      .then((res) => {
        const data = res.data as TissueCultureBatch | { data: TissueCultureBatch };
        const batch = "data" in data ? data.data : data;
        setItem(batch);
      })
      .catch((err) => {
        console.error("Error loading batch details:", err);
        setError(t("tissueCultureBatch.errorLoadingDetail"));
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-gray-500">{t("common.loadingData")}</div>
      </main>
    );
  }

  if (error ?? !item) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="text-red-500 mb-4">{error ?? t("common.noDataFound")}</div>
          <button
            type="button"
            onClick={() => { navigate("/technician/batches"); }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            {t("common.back")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {item.batchName ?? item.name ?? `Batch #${item.id}`}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("tissueCultureBatch.batchDetails")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { navigate("/technician/batches"); }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            {t("common.back")}
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("tissueCultureBatch.basicInfo")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID
                </label>
                <p className="mt-1 text-gray-900">{item.id}</p>
              </div>

              {/* Batch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("tissueCultureBatch.batchName")}
                </label>
                <p className="mt-1 text-gray-900">
                  {item.batchName ?? item.name ?? "-"}
                </p>
              </div>

              {/* Lab Room ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("tissueCultureBatch.labRoomId")}
                </label>
                <p className="mt-1 text-gray-900">{item.labRoomId ?? "-"}</p>
              </div>

              {/* Lab Room Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("tissueCultureBatch.labRoom")}
                </label>
                <p className="mt-1 text-gray-900">
                  {item.labRoomName ?? item.labName ?? "-"}
                </p>
              </div>

              {/* Batch Size Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("tissueCultureBatch.batchSizeWidth")}
                </label>
                <p className="mt-1 text-gray-900">
                  {item.batchSizeWidth ? `${item.batchSizeWidth} ${item.widthUnit ?? ""}` : "-"}
                </p>
              </div>

              {/* Batch Size Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("tissueCultureBatch.batchSizeHeight")}
                </label>
                <p className="mt-1 text-gray-900">
                  {item.batchSizeHeight ? `${item.batchSizeHeight} ${item.heightUnit ?? ""}` : "-"}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("common.status")}
                </label>
                <div className="mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.status ?? item.isBatching
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {typeof item.status === "string"
                      ? item.status
                      : item.status ?? item.isBatching
                        ? t("tissueCultureBatch.operating")
                        : t("tissueCultureBatch.notOperating")}
                  </span>
                </div>
              </div>

              {/* In Use */}
              {item.inUse && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("tissueCultureBatch.inUse")}
                  </label>
                  <p className="mt-1 text-gray-900">{item.inUse}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t("common.description")}
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default TechnicianBatchDetail;