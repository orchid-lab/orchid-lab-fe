import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { Method } from "../../../types/Method";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

export default function AdminMethodDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const [method, setMethod] = useState<Method | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchMethodDetail = async (
      methodId: string
    ): Promise<Method | null> => {
      try {
        const response = await axiosInstance.get<{ value?: Method }>(
          `/api/method/${methodId}`
        );
        if (response.data.value) {
          return response.data.value;
        }
        return null;
      } catch (error) {
        console.error("Error loading method:", error);
        return null;
      }
    };
    void fetchMethodDetail(id ?? "1").then((data) => {
      setMethod(data);
      setLoading(false);
    });
  }, [id]);

  const getMethodType = (type: string) => {
    if (type === "Clonal") return t("method.asexual");
    if (type === "Sexual") return t("method.sexual");
    return type;
  };

  if (loading) return <div>{t("common.loadingData")}</div>;
  if (!method) return <div>{t("common.noData")}</div>;

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100">
      <button
        type="button"
        className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-4 hover:bg-green-800 hover:text-white transition"
        onClick={() => void navigate(`/admin/method?page=${page}`)}
      >
        ← {t("common.back")}
      </button>
      <div className="max-w-full mx-auto bg-white rounded shadow p-6">
        <h2 className="text-2xl font-bold mb-2 text-green-800">
          {method.name}
        </h2>
        <div className="mb-2">
          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {getMethodType(method.type)}
          </span>
        </div>
        <div className="mb-4 text-gray-700">{method.description}</div>
        <h3 className="text-lg font-semibold mb-2">
          {t("method.detailedProcess")}:
        </h3>
        <ol className="ml-6 space-y-3">
          {method.stages?.map((stage, idx) => (
            <li key={stage.name + idx} className="mb-4 list-decimal">
              <div className="font-semibold">{stage.name}</div>
              <div className="text-gray-700">{stage.description}</div>
              <div className="text-gray-700">
                {t("method.processingDays")}: {stage.dateOfProcessing}{" "}
                {t("method.days")}
              </div>
              {stage.elementDTO && stage.elementDTO.length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">
                    {t("method.materials")}:
                  </span>
                  <ul className="list-disc ml-4">
                    {stage.elementDTO.map((el) => (
                      <li key={el.id} className="text-gray-700">
                        {el.name} - {el.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}