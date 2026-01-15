import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Report } from "../../../types/Report";
import axiosInstance from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";

interface Sample {
  id: string;
  name: string;
  description?: string;
  dob: string;
  statusEnum: string;
}

interface AnalyzeResult {
  stage: string;
  disease: {
    predict: string;
    probability: Record<string, number>;
  };
}

export default function ReportsDetails() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [report, setReport] = useState<Report | null>(null);
  const [sample, setSample] = useState<Sample | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<string>("");

  // Disease names - keep in Vietnamese as they're technical terms
  const diseaseNameMap: Record<string, string> = {
    Anthracnose: "Thán thư",
    "Bacterial Wilt": "Héo vi khuẩn",
    Blackrot: "Thối đen",
    Brownspots: "Đốm nâu",
    "Mold Bacterial": "Mốc vi khuẩn",
    "Mold Fungus": "Mốc nấm",
    "Soft Rot": "Thối mềm",
    "Stem Rot": "Thối thân",
    "Withered Yellow Root": "Vàng rễ héo",
    healthy: "Khỏe mạnh",
    Oxidation: "Oxy hóa",
    Virus: "Virus",
  };

  const stageNameMap: Record<string, string> = {
    coppice: "Giai đoạn chồi",
    tree: "Giai đoạn cây con",
    tissue: "Giai đoạn mô",
  };

  const predictNameMap: Record<string, string> = {
    brownspots: "Đốm nâu",
    anthracnose: "Thán thư",
    blackrot: "Thối đen",
    bacterialwilt: "Héo vi khuẩn",
    moldbacterial: "Mốc vi khuẩn",
    moldfungus: "Mốc nấm",
    softrot: "Thối mềm",
    stemrot: "Thối thân",
    witheredyellowroot: "Vàng rễ héo",
    healthy: "Khỏe mạnh",
    oxidation: "Oxy hóa",
    virus: "Virus",
  };

  function getPredictVietnamese(predict: string) {
    const key = predict.replace(/^disease_/, "").toLowerCase();
    return predictNameMap[key] || predict;
  }

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/report/${id}?id=${id}`);
        const data = res.data as { value: Report };
        setReport(data.value || null);

        if (data.value?.sample) {
          const sampleRes = await axiosInstance.get(
            `/api/sample/${data.value.sample}?id=${data.value.sample}`
          );
          const sampleData = sampleRes.data as { value: Sample };
          setSample(sampleData.value || null);
        } else {
          setSample(null);
        }
        const imgRes = await axiosInstance.get<{
          value?: { data?: { url: string }[] };
        }>(`/api/images?pageNumber=1&pageSize=100&reportId=${id}`);
        const imgList = imgRes.data?.value?.data ?? [];
        setImages(imgList.map((img) => img.url));
      } catch (error) {
        console.error("Error fetching report details:", error);
        setReport(null);
        setSample(null);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [id]);

  const analyzeImageFromUrl = async (imgUrl: string) => {
    setAnalyzeLoading(true);
    setAnalyzeResult(null);
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const file = new File([blob], "image.jpg", { type: blob.type });
      const formData = new FormData();
      formData.append("imageFile", file);
      const res = await axiosInstance.post("/api/disease/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalyzeResult(res.data as AnalyzeResult);
    } catch (error) {
      console.error("Error analyzing image:", error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? t("report.analyzeError");

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const getStatusDisplay = (status?: string) => {
    if (!status) return t("experimentLog.notAvailable");

    const statusMap: Record<string, string> = {
      Process: t("experimentLog.processing"),
      Suspended: t("experimentLog.suspended"),
      Destroyed: t("experimentLog.destroyed"),
    };

    return statusMap[status] || status;
  };

  const handleSendReview = async () => {
    if (!id) return;
    try {
      await axiosInstance.put("/api/report/review-report-change", {
        id,
        reviewReportText: evaluation,
      });

      setReport((prev) => (prev ? { ...prev, reviewReport: evaluation } : prev));
      enqueueSnackbar(t("report.evaluationSent"), { variant: "success" });
    } catch (error) {
      console.error("Error sending review:", error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? t("report.evaluationFailed");

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    }
  };

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-500">{t("common.loadingData")}</div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-10 min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="max-w-5xl mx-auto py-8">
        <button
          type="button"
          className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-6 hover:bg-green-800 hover:text-white transition"
          onClick={() =>
            void navigate(
              user?.roleId === 3
                ? `/technician/reports?page=${page}`
                : `/reports?page=${page}`
            )
          }
        >
          &larr; {t("common.back")}
        </button>
        <h1 className="text-3xl font-bold mb-6 text-green-900">
          {t("report.reportDetails")}
        </h1>
        <div className="bg-white rounded-xl shadow p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="font-semibold text-gray-700 mb-1">
                {t("report.taskName")}
              </div>
              <div className="text-lg">{report?.name}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">
                {t("report.writer")}
              </div>
              <div>{report?.technician}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">
                {t("common.status")}
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  report?.status === "Seen"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {report?.status === "Seen" ? t("report.seen") : t("report.notSeen")}
              </span>
            </div>

            <div>
              <div className="font-semibold text-gray-700 mb-1">
                {t("report.attributeInfo")}
              </div>
              {report?.reportAttributes.map((attr, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="font-normal">
                    {attr.name}-({attr.measurementUnit}):
                  </span>
                  <span>
                    {t("report.expected")}: {attr.valueFrom} - {attr.valueTo}
                  </span>
                  <span className="ml-2">
                    {t("report.actual")}:{" "}
                    <span
                      className={
                        attr.value < attr.valueFrom || attr.value > attr.valueTo
                          ? "font-bold"
                          : "font-normal"
                      }
                    >
                      {attr.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-green-800 mb-2">
              {t("report.reportContent")}
            </h3>
            <div className="bg-gray-50 p-4 rounded text-gray-800 whitespace-pre-line">
              {report?.description}
            </div>
          </div>

          {report?.reviewReport && (
            <div className="mb-6">
              <h3 className="font-semibold text-green-800 mb-2">
                {t("report.reportEvaluation")}
              </h3>
              <div className="bg-gray-50 p-4 rounded text-gray-800 whitespace-pre-line">
                {report.reviewReport}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-green-800 mb-2">
              {t("report.attachedImages")}{" "}
              <span className="text-sm font-normal text-gray-500">
                {t("report.selectImageNote")}
              </span>
            </h3>
            <div className="flex gap-4 flex-wrap">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`report-img-${idx}`}
                  className={`w-32 h-32 object-cover rounded border cursor-pointer transition ${
                    selectedImg === img ? "border-4 border-green-600 scale-105" : "border"
                  }`}
                  onClick={() => setSelectedImg(img)}
                />
              ))}
            </div>
            {selectedImg && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition cursor-pointer"
                  disabled={!selectedImg || analyzeLoading}
                  onClick={() => void analyzeImageFromUrl(selectedImg)}
                >
                  {analyzeLoading ? t("report.analyzing") : t("report.analyzeDisease")}
                </button>
              </div>
            )}
            {analyzeResult && (
              <div className="mt-4 bg-gray-50 p-4 rounded">
                <div className="font-semibold mb-2 text-green-700">
                  {t("report.analysisResult")}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">{t("experimentLog.stage")}:</span>{" "}
                  {stageNameMap[analyzeResult.stage] || analyzeResult.stage}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">{t("report.diseasePrediction")}:</span>{" "}
                  {getPredictVietnamese(analyzeResult.disease.predict)}
                </div>
                <div>
                  <span className="font-semibold">{t("report.diseaseProbability")}:</span>
                  <ul className="mt-2">
                    {Object.entries(analyzeResult.disease.probability)
                      .filter(([, value]) => value > 0.0001)
                      .sort((a, b) => b[1] - a[1])
                      .map(([key, value]) => (
                        <li key={key} className="flex justify-between">
                          <span>{diseaseNameMap[key] || key}</span>
                          <span>{(value * 100).toFixed(2)}%</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-8">
          <h2 className="text-xl font-bold text-green-900 mb-4">
            {t("report.sampleInfo")}
          </h2>
          {sample ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-semibold text-gray-700 mb-1">
                  {t("report.sampleName")}
                </div>
                <div className="text-lg">{sample.name}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">
                  {t("common.createdAt")}
                </div>
                <div>{sample.dob ? new Date(sample.dob).toLocaleDateString() : ""}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">
                  {t("common.status")}
                </div>
                <span
                  className={`px-2 py-1 rounded-full font-semibold text-xs ${
                    sample.statusEnum === "Process"
                      ? "bg-yellow-100 text-yellow-800"
                      : sample.statusEnum === "Suspended"
                      ? "bg-green-100 text-gray-800"
                      : sample.statusEnum === "Destroyed"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {getStatusDisplay(sample.statusEnum)}
                </span>
              </div>
              <div className="md:col-span-2">
                <div className="font-semibold text-gray-700 mb-1">
                  {t("common.description")}
                </div>
                <div className="bg-gray-50 p-3 rounded text-gray-800 whitespace-pre-line">
                  {sample.description ?? (
                    <span className="text-gray-400">{t("common.noData")}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">{t("report.noSample")}</div>
          )}

          {sample && user?.roleId === 2 && (
            <div className="mt-6">
              <button
                type="button"
                className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
                onClick={() => {
                  void navigate(`/create-task/step-1?sampleId=${sample.id}`);
                }}
              >
                {t("report.createNewTask")}
              </button>
            </div>
          )}

          {user?.roleId === 2 && (
            <div className="mt-6">
              <h3 className="font-semibold text-green-800 mb-2">
                {t("report.reportEvaluation")}
              </h3>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 mb-2"
                rows={4}
                placeholder={t("report.enterEvaluation")}
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
              />
              <button
                type="button"
                className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
                onClick={() => {
                  void handleSendReview();
                }}
              >
                {t("report.sendEvaluation")}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}