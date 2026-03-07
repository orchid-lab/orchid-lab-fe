import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../api/axiosInstance";
import type {
  AnalysisResponse,
  ExperimentLogApiResponse,
  Sample,
  SampleApiResponse,
  SampleDetail,
  SampleStageDetail,
  StageRequirementDefinition,
} from "../../../types/Sample";

interface StageRequirementApiResponse {
  totalCount: number;
  pageCount: number;
  pageSize: number;
  pageNumber: number;
  data: StageRequirementDefinition[];
}

interface MonitoringLogCreatePayload {
  name: string;
  sampleStageId: string;
  analyticResultId: string;
  diseaseId: number;
  notes: string;
  logDetailsDtos: Array<{
    stageRequirementDefinitionId: string;
    measuredValue: number;
  }>;
}

const isInProgressSample = (status?: string): boolean => {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return normalized === "inprogress" || normalized === "inprogressed";
};

const getCurrentSampleStage = (
  sampleStageDto: SampleDetail["sampleStageDto"]
): SampleStageDetail | null => {
  if (!sampleStageDto) return null;
  if (!Array.isArray(sampleStageDto)) return sampleStageDto;
  if (sampleStageDto.length === 0) return null;

  return [...sampleStageDto].sort(
    (a, b) => new Date(b.startAt ?? "").getTime() - new Date(a.startAt ?? "").getTime()
  )[0];
};

export default function ReportsCreate() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [sampleDetail, setSampleDetail] = useState<SampleDetail | null>(null);
  const [experimentLogMap, setExperimentLogMap] = useState<Record<string, string>>({});
  const [requirements, setRequirements] = useState<StageRequirementDefinition[]>([]);
  const [measuredValues, setMeasuredValues] = useState<Record<string, string>>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSampleDetail, setLoadingSampleDetail] = useState(false);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [sampleRes, experimentRes] = await Promise.all([
          axiosInstance.get<SampleApiResponse>("/api/samples?pageNo=1&pageSize=1000"),
          axiosInstance.get<ExperimentLogApiResponse>(
            "/api/experiment-logs?pageNo=1&pageSize=1000"
          ),
        ]);

        const inProgressSamples = (sampleRes.data.data ?? []).filter((sample) =>
          isInProgressSample(sample.status)
        );

        const logMap: Record<string, string> = {};
        (experimentRes.data.data ?? []).forEach((log) => {
          logMap[log.id] = log.name;
        });

        setSamples(inProgressSamples);
        setExperimentLogMap(logMap);
      } catch (error) {
        console.error("Failed to load initial report-create data", error);
        enqueueSnackbar("Không thể tải dữ liệu ban đầu", { variant: "error" });
      } finally {
        setLoadingInitial(false);
      }
    };

    void loadInitialData();
  }, [enqueueSnackbar]);

  useEffect(() => {
    const loadSampleDetailAndRequirements = async () => {
      if (!selectedSampleId) {
        setSampleDetail(null);
        setRequirements([]);
        setMeasuredValues({});
        setAnalysisResult(null);
        return;
      }

      setLoadingSampleDetail(true);
      setLoadingRequirements(true);
      setAnalysisResult(null);
      setMeasuredValues({});

      try {
        const sampleDetailRes = await axiosInstance.get<SampleDetail>(
          `/api/samples/${selectedSampleId}`
        );

        const detail = (sampleDetailRes.data as { value?: SampleDetail }).value ?? sampleDetailRes.data;
        setSampleDetail(detail);

        const sampleStageDefinitionId =
          getCurrentSampleStage(detail.sampleStageDto)?.sampleStageDefinition?.id;
        if (!sampleStageDefinitionId) {
          setRequirements([]);
          setLoadingRequirements(false);
          return;
        }

        const requirementRes = await axiosInstance.get<StageRequirementApiResponse>(
          `/api/stage-requirement-definition?pageNo=1&pageSize=1000&sampleStageId=${sampleStageDefinitionId}`
        );

        const reqData = requirementRes.data.data ?? [];
        setRequirements(reqData);
      } catch (error) {
        console.error("Failed to load selected sample detail", error);
        setSampleDetail(null);
        setRequirements([]);
        enqueueSnackbar("Không thể tải thông tin mẫu đã chọn", { variant: "error" });
      } finally {
        setLoadingSampleDetail(false);
        setLoadingRequirements(false);
      }
    };

    void loadSampleDetailAndRequirements();
  }, [selectedSampleId, enqueueSnackbar]);

  const requirementRows = useMemo(
    () =>
      requirements.map((req) => ({
        id: req.id,
        name: req.sampleRequirementDefinitionDto?.name ?? "-",
        description: req.sampleRequirementDefinitionDto?.description ?? "-",
        unit: req.sampleRequirementDefinitionDto?.unit ?? "-",
        minValue: req.minValue,
        maxValue: req.maxValue,
        expectedValue: req.expectedValue,
      })),
    [requirements]
  );

  const stageNameMap: Record<string, string> = {
    coppice: "Chồi",
    tissue: "Mầm",
    tree: "Cây hoàn chỉnh",
  };

  const handleMeasuredValueChange = (stageRequirementDefinitionId: string, value: string) => {
    setMeasuredValues((prev) => ({
      ...prev,
      [stageRequirementDefinitionId]: value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview((event.target?.result as string) ?? "");
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeDisease = async () => {
    if (!selectedImage) {
      enqueueSnackbar("Vui lòng chọn ảnh trước khi phân tích", {
        variant: "warning",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await axiosInstance.post<AnalysisResponse>(
        "/api/monitoring-log/analysis",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAnalysisResult(response.data);
      setShowImageModal(false);
      enqueueSnackbar("Phân tích bệnh thành công", { variant: "success" });
    } catch (error) {
      console.error("Failed to analyze disease", error);
      enqueueSnackbar("Phân tích bệnh thất bại", { variant: "error" });
    } finally {
      setAnalyzing(false);
    }
  };

  const validateBeforeSubmit = (): string | null => {
    if (!name.trim()) return "Vui lòng nhập tên báo cáo";
    if (!selectedSampleId) return "Vui lòng chọn sample";

    const currentSampleStage = getCurrentSampleStage(sampleDetail?.sampleStageDto ?? null);
    const sampleStageId = currentSampleStage?.id;
    if (!sampleStageId) return "Sample hiện tại chưa có sample stage";

    if (!analysisResult?.analyticResult?.id || analysisResult?.disease?.id == null) {
      return "Vui lòng phân tích bệnh để lấy analytic result trước khi lưu";
    }

    for (const req of requirements) {
      const rawValue = measuredValues[req.id];
      if (rawValue == null || rawValue.trim() === "") {
        return "Vui lòng nhập đủ measured value cho tất cả requirement";
      }

      const parsed = Number(rawValue);
      if (Number.isNaN(parsed)) {
        return "Measured value phải là số hợp lệ";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateBeforeSubmit();
    if (validationError) {
      enqueueSnackbar(validationError, { variant: "warning" });
      return;
    }

    const currentSampleStage = getCurrentSampleStage(sampleDetail?.sampleStageDto ?? null);

    if (!currentSampleStage?.id || !analysisResult) {
      enqueueSnackbar("Thiếu dữ liệu để tạo monitoring log", { variant: "error" });
      return;
    }

    const payload: MonitoringLogCreatePayload = {
      name: name.trim(),
      sampleStageId: currentSampleStage.id,
      analyticResultId: analysisResult.analyticResult.id,
      diseaseId: analysisResult.disease.id,
      notes: notes.trim(),
      logDetailsDtos: requirements.map((req) => ({
        stageRequirementDefinitionId: req.id,
        measuredValue: Number(measuredValues[req.id]),
      })),
    };

    setSubmitting(true);
    try {
      await axiosInstance.post("/api/monitoring-log", payload);
      enqueueSnackbar("Tạo báo cáo giám sát thành công", { variant: "success" });
      void navigate("/technician/reports");
    } catch (error) {
      console.error("Failed to create monitoring log", error);
      const apiError = error as {
        response?: { data?: string };
        message?: string;
      };
      const message =
        apiError.response?.data ?? apiError.message ?? "Tạo báo cáo giám sát thất bại";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldLabelClass = "block font-medium text-gray-700 mb-1.5";
  const inputClass =
    "w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent";
  const textAreaClass =
    "w-full border border-gray-300 rounded-2xl px-4 py-2 text-sm min-h-24 focus:ring-2 focus:ring-green-500 focus:border-transparent";

  if (loadingInitial) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mx-auto mb-3"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo báo cáo giám sát mới</h1>
            <p className="text-sm text-gray-600 mt-1">
              Điền thông tin báo cáo, chọn sample đang xử lý, nhập chỉ số và phân tích bệnh.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="border cursor-pointer border-green-800 text-green-800 rounded-full px-4 py-2 hover:bg-green-800 hover:text-white transition"
          onClick={() => void navigate(-1)}
        >
          ← Trở về
        </button>

        <form
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6"
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          <section className="space-y-4 border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900">1. Thông tin báo cáo</h2>
            <div>
              <label className={fieldLabelClass}>Tên báo cáo</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Nhập tên báo cáo"
                required
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Ghi chú</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={textAreaClass}
                placeholder="Nhập ghi chú cho báo cáo"
              />
            </div>
          </section>

          <section className="space-y-4 border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900">2. {t("monitoringLog.createForm.selectSampleTitle")}</h2>
            <div>
              <label className={fieldLabelClass}>{t("monitoringLog.createForm.sampleName")}</label>
              <select
                value={selectedSampleId}
                onChange={(e) => setSelectedSampleId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">{t("monitoringLog.createForm.selectSamplePlaceholder")}</option>
                {samples.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    {sample.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {t("monitoringLog.createForm.onlyInProgressSamples")} ({t("monitoringLog.createForm.inProgressStatus")}).
              </p>
            </div>

            {loadingSampleDetail ? (
              <p className="text-gray-600">Đang tải chi tiết sample...</p>
            ) : sampleDetail ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="text-sm text-gray-500">{t("monitoringLog.createForm.sampleName")}</div>
                  <div className="font-medium text-gray-900">{sampleDetail.name}</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="text-sm text-gray-500">{t("monitoringLog.createForm.experimentLogName")}</div>
                  <div className="font-medium text-gray-900">
                    {experimentLogMap[sampleDetail.experimentLogId] ?? sampleDetail.experimentLogId}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="text-sm text-gray-500">{t("monitoringLog.createForm.currentSampleStage")}</div>
                  <div className="font-medium text-gray-900">
                    {getCurrentSampleStage(sampleDetail.sampleStageDto)?.currentSampleStage ?? "-"}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="text-sm text-gray-500">{t("monitoringLog.createForm.sampleNote")}</div>
                  <div className="font-medium text-gray-900">{sampleDetail.notes ?? "-"}</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Chọn sample để xem chi tiết.</p>
            )}
          </section>

          <section className="space-y-4 border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900">3. {t("monitoringLog.createForm.stageRequirementTitle")}</h2>
            {loadingRequirements ? (
              <p className="text-gray-600">Đang tải requirement...</p>
            ) : requirementRows.length === 0 ? (
              <p className="text-gray-500">Không có requirement cho sample stage này.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 text-sm font-semibold text-gray-700">{t("monitoringLog.createForm.requirementName")}</th>
                      <th className="p-3 text-sm font-semibold text-gray-700">Mô tả</th>
                      <th className="p-3 text-sm font-semibold text-gray-700">Đơn vị</th>
                      <th className="p-3 text-sm font-semibold text-gray-700">{t("monitoringLog.createForm.min")}</th>
                      <th className="p-3 text-sm font-semibold text-gray-700">{t("monitoringLog.createForm.max")}</th>
                      <th className="p-3 text-sm font-semibold text-gray-700">{t("monitoringLog.createForm.expected")}</th>
                      <th className="p-3 text-sm font-semibold text-gray-700">{t("monitoringLog.createForm.measuredValue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirementRows.map((req) => (
                      <tr key={req.id} className="border-b border-gray-100 last:border-b-0 hover:bg-green-50/40">
                        <td className="p-3 text-sm text-gray-900 font-medium">{req.name}</td>
                        <td className="p-3 text-sm text-gray-600">{req.description}</td>
                        <td className="p-3 text-sm text-gray-800">{req.unit || "-"}</td>
                        <td className="p-3 text-sm text-gray-800">{req.minValue}</td>
                        <td className="p-3 text-sm text-gray-800">{req.maxValue}</td>
                        <td className="p-3 text-sm text-gray-800">{req.expectedValue}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            step="any"
                            className="w-36 border border-gray-300 rounded-full px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            value={measuredValues[req.id] ?? ""}
                            onChange={(e) =>
                              handleMeasuredValueChange(req.id, e.target.value)
                            }
                            placeholder="Nhập giá trị đo"
                            required
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-4 border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900">4. Phân tích bệnh</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="px-4 py-2 rounded-full transition-colors font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                disabled={!sampleDetail}
              >
                Chọn ảnh và phân tích
              </button>
              {!sampleDetail && (
                <p className="text-sm text-gray-500">Vui lòng chọn sample trước khi phân tích bệnh.</p>
              )}
            </div>

            {analysisResult ? (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200 space-y-3">
                <p className="font-semibold text-green-800">Đã có kết quả phân tích bệnh</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">{t("sample.stageName")}: </span>
                    <span className="font-medium">
                      {stageNameMap[analysisResult.stageName?.toLowerCase?.() ?? ""] ??
                        analysisResult.stageName ??
                        "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t("sample.diseaseName")}: </span>
                    <span className="font-medium">{analysisResult.disease.name || "-"}</span>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-gray-500">{t("sample.diseaseDescription")}: </span>
                  <span className="font-medium text-gray-800">{analysisResult.disease.description || "-"}</span>
                </div>

                <div>
                  <p className="font-medium mb-2">Xác suất từng bệnh</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { key: "healthy", label: t("sample.healthy") },
                      { key: "anthracnose", label: t("sample.anthracnose") },
                      { key: "bacterialWilt", label: t("sample.bacterialWilt") },
                      { key: "blackrot", label: t("sample.blackrot") },
                      { key: "brownspots", label: t("sample.brownspots") },
                      { key: "moldBacterial", label: t("sample.moldBacterial") },
                      { key: "moldFungus", label: t("sample.moldFungus") },
                      { key: "softRot", label: t("sample.softRot") },
                      { key: "stemRot", label: t("sample.stemRot") },
                      { key: "witheredYellowRoot", label: t("sample.witheredYellowRoot") },
                      { key: "oxidation", label: t("sample.oxidation") },
                      { key: "virus", label: t("sample.virus") },
                    ].map((item) => {
                      const value = analysisResult.analyticResult[
                        item.key as keyof typeof analysisResult.analyticResult
                      ];

                      return (
                        <div
                          key={item.key}
                          className="flex justify-between items-center bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        >
                          <span>{item.label}</span>
                          <span className="font-semibold text-blue-700">
                            {typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "-"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Chưa có kết quả phân tích bệnh. Bạn cần phân tích bệnh trước khi lưu báo cáo.
              </p>
            )}
          </section>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded-full font-semibold transition-colors ${
                submitting
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {submitting ? "Đang lưu..." : "Lưu báo cáo"}
            </button>
          </div>
        </form>
      </div>

      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="border-b p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Phân tích bệnh</h3>
              <button
                type="button"
                onClick={() => {
                  if (analyzing) return;
                  setShowImageModal(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl disabled:cursor-not-allowed"
                disabled={analyzing}
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="w-full h-60 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full border border-gray-300 rounded-full px-3 py-2 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview("");
                    }}
                    disabled={analyzing}
                  >
                    Chọn ảnh khác
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-gray-600 text-sm">Nhấn để chọn ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={analyzing}
                  />
                </label>
              )}
            </div>

            <div className="border-t p-5 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                onClick={() => setShowImageModal(false)}
                disabled={analyzing}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-full text-white font-semibold transition-colors ${
                  selectedImage && !analyzing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                onClick={() => {
                  void handleAnalyzeDisease();
                }}
                disabled={!selectedImage || analyzing}
              >
                {analyzing ? "Đang phân tích..." : "Phân tích"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
