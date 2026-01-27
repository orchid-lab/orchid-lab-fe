import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

interface TissueCultureBatch {
  id: string;
  name?: string;
  labName?: string;
  labRoomId?: number;
  labRoomName?: string;
  batchName?: string;
  batchSizeWidth?: number;
  batchSizeHeight?: number;
  widthUnit?: string;
  heightUnit?: string;
  description?: string;
  inUse?: string;
  status?: string | boolean;
  isBatching?: boolean;
}

interface ApiListResponse {
  value?: {
    data?: TissueCultureBatch[];
    totalCount?: number;
  };
  data?: TissueCultureBatch[];
  totalCount?: number;
}

const AdminTissueCultureBatchList = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<TissueCultureBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance
      .get("/api/batches?pageNo=1&pageSize=100")
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
          const idA = typeof a.id === 'string' ? parseInt(a.id) : a.id;
          const idB = typeof b.id === 'string' ? parseInt(b.id) : b.id;
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

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-6">
      <div className="max-w-full mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("tissueCultureBatch.tissueCultureBatchList")}
            </h1>
            <p className="text-gray-600">
              {t("tissueCultureBatch.manageBatches")}
            </p>
          </div>
          <Link
            to="/admin/tissue-culture-batches/create"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            {t("tissueCultureBatch.createBatch")}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("tissueCultureBatch.labRoomId")}
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
                    {t("tissueCultureBatch.noBatches")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.labRoomId ?? "-"}
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
                        {typeof item.status === 'string' 
                          ? item.status 
                          : (item.status || item.isBatching
                              ? t("tissueCultureBatch.operating")
                              : t("tissueCultureBatch.notOperating"))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/tissue-culture-batches/${item.id}`}
                        className="text-green-700 hover:underline"
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

export default AdminTissueCultureBatchList;