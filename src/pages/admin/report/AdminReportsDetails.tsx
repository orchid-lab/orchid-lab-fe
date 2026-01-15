import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import axiosInstance from "../../../api/axiosInstance";
import type { Report } from "../../../types/Report";
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

export default function AdminReportsDetails() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const { id } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [sample, setSample] = useState<Sample | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(
    null
  );
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const diseaseNameMap: Record<string, string> = {
    Anthracnose: t("diseases.anthracnose") || "Thán thư",
    "Bacterial Wilt": t("diseases.bacterialWilt") || "Héo vi khuẩn",
    Blackrot: t("diseases.blackrot") || "Thối đen",
    Brownspots: t("diseases.brownspots") || "Đốm nâu",
    "Mold Bacterial": t("diseases.moldBacterial") || "Mốc vi khuẩn",
    "Mold Fungus": t("diseases.moldFungus") || "Mốc nấm",
    "Soft Rot": t("diseases.softRot") || "Thối mềm",
    "Stem Rot": t("diseases.stemRot") || "Thối thân",
    "Withered Yellow Root": t("diseases.witheredYellowRoot") || "Vàng rễ héo",
    healthy: t("diseases.healthy") || "Khỏe mạnh",
    Oxidation: t("diseases.oxidation") || "Oxy hóa",
    Virus: t("diseases.virus") || "Virus",
  };

  const stageNameMap: Record<string, string> = {
    coppice: t("stages.coppice") || "Giai đoạn chồi",
    tree: t("stages.tree") || "Giai đoạn cây con",
    tissue: t("stages.tissue") || "Giai đoạn mô",
  };

  const predictNameMap: Record<string, string> = {
    brownspots: t("diseases.brownspots") || "Đốm nâu",
    anthracnose: t("diseases.anthracnose") || "Thán thư",
    blackrot: t("diseases.blackrot") || "Thối đen",
    bacterialwilt: t("diseases.bacterialWilt") || "Héo vi khuẩn",
    moldbacterial: t("diseases.moldBacterial") || "Mốc vi khuẩn",
    moldfungus: t("diseases.moldFungus") || "Mốc nấm",
    softrot: t("diseases.softRot") || "Thối mềm",
    stemrot: t("diseases.stemRot") || "Thối thân",
    witheredyellowroot: t("diseases.witheredYellowRoot") || "Vàng rễ héo",
    healthy: t("diseases.healthy") || "Khỏe mạnh",
    oxidation: t("diseases.oxidation") || "Oxy hóa",
    virus: t("diseases.virus") || "Virus",
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
        const res = await axiosInstance.get(
          `https://net-api.orchid-lab.systems/api/report/${id}?id=${id}`
        );
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
    setAnalyzeError(null);
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
    } catch {
      setAnalyzeError(t("report.analysisFailed"));
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const getStatusDisplay = (status?: string) => {
    if (!status) return t("common.noData");

    const statusMap: Record<string, string> = {
      Process: t("status.inProgress"),
      Suspended: t("experimentLog.suspended"),
      Destroyed: t("experimentLog.destroyed"),
    };

    return statusMap[status] || status;
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
              user?.roleId === 1
                ? `/admin/report?page=${page}`
                : `/reports?page=${page}`
            )
          }
        >
          &larr; {t("report.backToList")}
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
                {t("report.status")}
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

          {/* Hiển thị đánh giá báo cáo (reviewReport) */}
          {report?.reviewReport && (
            <div className="mb-6">
              <h3 className="font-semibold text-green-800 mb-2">
                {t("report.reportReview")}
              </h3>
              <div className="bg-blue-50 p-4 rounded text-gray-800 whitespace-pre-line">
                {report.reviewReport}
              </div>
            </div>
          )}

          {/* Hình ảnh đính kèm nếu có */}
          <div className="mb-6">
            <h3 className="font-semibold text-green-800 mb-2">
              {t("report.attachedImages")}{" "}
              <span className="text-sm font-normal text-gray-500">
                {t("report.selectImageToAnalyze")}
              </span>
            </h3>
            <div className="flex gap-4 flex-wrap">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`report-img-${idx}`}
                  className={`w-32 h-32 object-cover rounded border cursor-pointer transition
          ${
            selectedImg === img
              ? "border-4 border-green-600 scale-105"
              : "border"
          }
        `}
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
            {analyzeError && (
              <div className="text-red-600 mt-2">{analyzeError}</div>
            )}
            {analyzeResult && (
              <div className="mt-4 bg-gray-50 p-4 rounded">
                <div className="font-semibold mb-2 text-green-700">
                  {t("report.analysisResult")}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">{t("report.stage")}:</span>{" "}
                  {stageNameMap[analyzeResult.stage] || analyzeResult.stage}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">{t("report.predictedDisease")}:</span>{" "}
                  {getPredictVietnamese(analyzeResult.disease.predict)}
                </div>
                <div>
                  <span className="font-semibold">{t("report.diseaseProbabilities")}:</span>
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

        {/* Thông tin mẫu vật */}
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
                  {t("report.createdDate")}
                </div>
                <div>
                  {sample.dob ? new Date(sample.dob).toLocaleDateString() : ""}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">
                  {t("report.status")}
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
                  {t("report.description")}
                </div>
                <div className="bg-gray-50 p-3 rounded text-gray-800 whitespace-pre-line">
                  {sample.description ?? (
                    <span className="text-gray-400">{t("report.noDescription")}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              {t("report.noSampleInfo")}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}