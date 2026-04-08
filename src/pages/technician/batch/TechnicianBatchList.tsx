import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";
import type { TissueCultureBatch, ApiListResponse } from "../../../types/Batch";
import CleaningResultBadge from "../../../components/CleaningResultBadge";

const TechnicianBatchList = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<TissueCultureBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompletingCleaning, setIsCompletingCleaning] = useState<Record<string, boolean>>({});
  const [cleaningResult, setCleaningResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance
      .get("/api/batches?pageNo=1&pageSize=1000")
      .then((res) => {
        const raw = res.data as ApiListResponse | TissueCultureBatch[];
        let arr: TissueCultureBatch[] = [];

        if ((raw as ApiListResponse)?.value?.data) {
          arr = (raw as ApiListResponse).value!.data!;
        } else if ((raw as ApiListResponse)?.data) {
          arr = (raw as ApiListResponse).data!;
        } else if (Array.isArray(raw)) {
          arr = raw;
        }

        arr.sort((a, b) => {
          const idA = typeof a.id === "string" ? parseInt(a.id) : a.id;
          const idB = typeof b.id === "string" ? parseInt(b.id) : b.id;
          return idA - idB;
        });

        setItems(arr);
      })
      .catch((err) => {
        console.error("Error loading batches:", err);
        setError(t("tissueCultureBatch.errorLoadingList"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (cleaningResult) {
      const timer = setTimeout(() => {
        setCleaningResult(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [cleaningResult]);

  const handleCompleteCleaning = async (batchId: string) => {
    setIsCompletingCleaning((prev) => ({ ...prev, [batchId]: true }));
    setCleaningResult(null);

    try {
      const response = await axiosInstance.patch(`/api/batches/${batchId}/complete-cleaning`);
      if (response.status === 200) {
        setCleaningResult({
          success: true,
          message: t("tissueCultureBatch.cleaningCompleteSuccess"),
        });
        // Refresh batch data
        const dataRes = await axiosInstance.get("/api/batches?pageNo=1&pageSize=1000");
        const raw = dataRes.data as ApiListResponse | TissueCultureBatch[];
        let arr: TissueCultureBatch[] = [];

        if ((raw as ApiListResponse)?.value?.data) {
          arr = (raw as ApiListResponse).value!.data!;
        } else if ((raw as ApiListResponse)?.data) {
          arr = (raw as ApiListResponse).data!;
        } else if (Array.isArray(raw)) {
          arr = raw;
        }

        arr.sort((a, b) => {
          const idA = typeof a.id === "string" ? parseInt(a.id) : a.id;
          const idB = typeof b.id === "string" ? parseInt(b.id) : b.id;
          return idA - idB;
        });

        setItems(arr);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || t("tissueCultureBatch.cleaningCompleteFailed");
      setCleaningResult({
        success: false,
        message: errorMessage,
      });
      console.error("Error completing cleaning:", err);
    } finally {
      setIsCompletingCleaning((prev) => ({ ...prev, [batchId]: false }));
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-6">
      <CleaningResultBadge result={cleaningResult} />
      <div className="max-w-full mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("tissueCultureBatch.tissueCultureBatchList")}
            </h1>
            <p className="text-gray-600">
              {t("tissueCultureBatch.viewBatches")}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("tissueCultureBatch.labRoom")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("tissueCultureBatch.batchName")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("tissueCultureBatch.batchSize")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("tissueCultureBatch.dimensions")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.status")}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("common.action")}
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    {t("common.loadingData")}
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-6 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.labRoomName ?? item.labName ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.batchName ?? item.name ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.batchSizeWidth && item.batchSizeHeight
                        ? `${item.batchSizeWidth} × ${item.batchSizeHeight}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.widthUnit && item.heightUnit
                        ? `${item.widthUnit} × ${item.heightUnit}`
                        : item.widthUnit ?? item.heightUnit ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.status || item.isBatching
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {typeof item.status === "string"
                          ? item.status
                          : item.status || item.isBatching
                            ? t("tissueCultureBatch.operating")
                            : t("tissueCultureBatch.notOperating")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof item.status === "string" && item.status === "Cleaning" && (
                        <div>
                          <button
                            onClick={() => handleCompleteCleaning(item.id)}
                            disabled={isCompletingCleaning[item.id]}
                            className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {isCompletingCleaning[item.id]
                              ? t("common.processing")
                              : t("tissueCultureBatch.completeCleaningBtn")}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/technician/batches/${item.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {t("tissueCultureBatch.details")}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default TechnicianBatchList;
