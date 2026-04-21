/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
/* eslint-disable react-x/no-array-index-key */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ReportCreate.css";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { Select } from "antd";
import {
  FileText,
  FlaskConical,
  Microscope,
  Stethoscope,
  ClipboardList,
  Plus,
  Trash2,
  Send,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SampleStage {
  id: string;
  name: string;
}

interface AnalyticResult {
  id: string;
  name: string;
}

interface Disease {
  id: string;
  name: string;
}

interface StageRequirementDef {
  id: string;
  name: string;
  unit?: string;
}

interface LogDetail {
  stageRequirementDefinitionId: string;
  measuredValue: number;
}

interface ReportCreateForm {
  name: string;
  sampleStageId: string;
  analyticResultId: string;
  diseaseId: string;
  notes: string;
  logDetailsDtos: LogDetail[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Dropdown data
  const [sampleStages, setSampleStages] = useState<SampleStage[]>([]);
  const [analyticResults, setAnalyticResults] = useState<AnalyticResult[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [stageDefs, setStageDefs] = useState<StageRequirementDef[]>([]);

  const [form, setForm] = useState<ReportCreateForm>({
    name: "",
    sampleStageId: "",
    analyticResultId: "",
    diseaseId: "",
    notes: "",
    logDetailsDtos: [],
  });

  // ── Fetch dropdown data ──────────────────────────────────────────────────

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [stagesRes, resultsRes, diseasesRes, stageDefsRes] = await Promise.allSettled([
          axiosInstance.get("/api/sample-stage?pageNumber=1&pageSize=1000"),
          axiosInstance.get("/api/analytic-result?pageNumber=1&pageSize=1000"),
          axiosInstance.get("/api/disease?pageNumber=1&pageSize=1000"),
          axiosInstance.get("/api/stage-requirement-definition?pageNumber=1&pageSize=1000"),
        ]);

        if (stagesRes.status === "fulfilled") {
          const d = stagesRes.value.data as { data?: SampleStage[]; items?: SampleStage[]; value?: { data?: SampleStage[] } };
          setSampleStages(d?.data ?? d?.items ?? d?.value?.data ?? []);
        }
        if (resultsRes.status === "fulfilled") {
          const d = resultsRes.value.data as { data?: AnalyticResult[]; items?: AnalyticResult[]; value?: { data?: AnalyticResult[] } };
          setAnalyticResults(d?.data ?? d?.items ?? d?.value?.data ?? []);
        }
        if (diseasesRes.status === "fulfilled") {
          const d = diseasesRes.value.data as { data?: Disease[]; items?: Disease[]; value?: { data?: Disease[] } };
          setDiseases(d?.data ?? d?.items ?? d?.value?.data ?? []);
        }
        if (stageDefsRes.status === "fulfilled") {
          const d = stageDefsRes.value.data as { data?: StageRequirementDef[]; items?: StageRequirementDef[]; value?: { data?: StageRequirementDef[] } };
          setStageDefs(d?.data ?? d?.items ?? d?.value?.data ?? []);
        }
      } catch {
        // silent
      }
    };
    void fetchAll();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddLogDetail = () => {
    setForm((prev) => ({
      ...prev,
      logDetailsDtos: [
        ...prev.logDetailsDtos,
        { stageRequirementDefinitionId: "", measuredValue: 0 },
      ],
    }));
  };

  const handleRemoveLogDetail = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      logDetailsDtos: prev.logDetailsDtos.filter((_, i) => i !== idx),
    }));
  };

  const handleLogDetailChange = (
    idx: number,
    field: keyof LogDetail,
    value: string | number
  ) => {
    setForm((prev) => {
      const details = [...prev.logDetailsDtos];
      details[idx] = { ...details[idx], [field]: value };
      return { ...prev, logDetailsDtos: details };
    });
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (!form.name.trim()) {
      setError(t("monitoringLog.errorName", { defaultValue: "Tên báo cáo không được để trống" }));
      return false;
    }
    if (!form.sampleStageId) {
      setError(t("monitoringLog.errorSampleStage", { defaultValue: "Vui lòng chọn giai đoạn mẫu" }));
      return false;
    }
    for (const detail of form.logDetailsDtos) {
      if (!detail.stageRequirementDefinitionId) {
        setError(t("monitoringLog.errorDetailDef", { defaultValue: "Vui lòng chọn chỉ tiêu cho tất cả chi tiết nhật ký" }));
        return false;
      }
    }
    setError("");
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent, submitImmediately: boolean) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const payload = {
      name: form.name,
      sampleStageId: form.sampleStageId || undefined,
      analyticResultId: form.analyticResultId || undefined,
      diseaseId: form.diseaseId ? parseInt(form.diseaseId) : 0,
      notes: form.notes,
      ...(form.logDetailsDtos.length > 0 && { logDetailsDtos: form.logDetailsDtos }),
      submitImmediately,
    };

    try {
      await axiosInstance.post("/api/monitoring-log", payload);
      enqueueSnackbar(
        submitImmediately
          ? t("monitoringLog.submitSuccess", { defaultValue: "Tạo và gửi báo cáo thành công!" })
          : t("monitoringLog.saveSuccess", { defaultValue: "Lưu nháp thành công!" }),
        { variant: "success", autoHideDuration: 3000, preventDuplicate: true }
      );
      void navigate("/reports");
    } catch (error) {
      const apiError = error as { response?: { data?: string }; message?: string };
      enqueueSnackbar(
        apiError.response?.data ??
          apiError.message ??
          t("monitoringLog.createFailed", { defaultValue: "Tạo báo cáo thất bại!" }),
        { variant: "error", autoHideDuration: 5000, preventDuplicate: true }
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="report-create-page ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F0F8FF] p-6">
      <div className="max-w-3xl mx-auto">

        {/* ── Header Card ── */}
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-blue-100 rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-[#005792] font-medium hover:text-blue-700 transition flex items-center gap-1.5 text-sm"
              onClick={() => void navigate(-1)}
            >
              ← {t("common.back")}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#005792]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#005792]">
                  {t("monitoringLog.createNew", { defaultValue: "Tạo nhật ký giám sát" })}
                </h2>
                <p className="text-blue-900/50 text-xs mt-0.5">
                  {t("monitoringLog.createSubtitle", { defaultValue: "Điền thông tin để tạo báo cáo mới" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form Card ── */}
        <form
          onSubmit={(e) => { void handleSubmit(e, false); }}
          className="bg-white/80 backdrop-blur-sm shadow-sm border border-blue-100 rounded-2xl p-6 md:p-8 space-y-6"
        >

          {/* ── Section: Thông tin cơ bản ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-4 h-4 text-[#005792]" />
              </div>
              <h3 className="text-base font-semibold text-[#005792]">
                {t("monitoringLog.basicInfo", { defaultValue: "Thông tin cơ bản" })}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Tên báo cáo */}
              <div>
                <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                  {t("monitoringLog.reportName", { defaultValue: "Tên báo cáo" })}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("monitoringLog.reportNamePlaceholder", { defaultValue: "Nhập tên báo cáo..." })}
                  className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 placeholder-blue-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
                />
              </div>

              {/* Giai đoạn mẫu */}
              <div>
                <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                  <span className="inline-flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-[#005792]" />
                    {t("monitoringLog.sampleStage", { defaultValue: "Giai đoạn mẫu" })}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  name="sampleStageId"
                  required
                  value={form.sampleStageId}
                  onChange={handleChange}
                  className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
                >
                  <option value="">-- {t("common.select", { defaultValue: "Chọn" })} --</option>
                  {sampleStages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Kết quả phân tích */}
              <div>
                <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                  <span className="inline-flex items-center gap-1.5">
                    <Microscope className="w-3.5 h-3.5 text-[#005792]" />
                    {t("monitoringLog.analyticResult", { defaultValue: "Kết quả phân tích" })}
                    <span className="text-blue-400 font-normal text-xs ml-1">
                      ({t("common.optional", { defaultValue: "Tuỳ chọn" })})
                    </span>
                  </span>
                </label>
                <select
                  name="analyticResultId"
                  value={form.analyticResultId}
                  onChange={handleChange}
                  className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
                >
                  <option value="">-- {t("common.select", { defaultValue: "Chọn" })} --</option>
                  {analyticResults.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Bệnh */}
              <div>
                <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                  <span className="inline-flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#005792]" />
                    {t("monitoringLog.disease", { defaultValue: "Bệnh" })}
                    <span className="text-blue-400 font-normal text-xs ml-1">
                      ({t("common.optional", { defaultValue: "Tuỳ chọn" })})
                    </span>
                  </span>
                </label>
                <select
                  name="diseaseId"
                  value={form.diseaseId}
                  onChange={handleChange}
                  className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
                >
                  <option value="">-- {t("common.select", { defaultValue: "Chọn" })} --</option>
                  {diseases.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="text-sm font-semibold text-blue-900 mb-1.5 block">
                  {t("monitoringLog.notes", { defaultValue: "Ghi chú" })}
                  <span className="text-blue-400 font-normal text-xs ml-1">
                    ({t("common.optional", { defaultValue: "Tuỳ chọn" })})
                  </span>
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder={t("monitoringLog.notesPlaceholder", { defaultValue: "Ghi chú thêm về báo cáo..." })}
                  className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 placeholder-blue-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792] resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-blue-100" />

          {/* ── Section: Chi tiết nhật ký ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-4 h-4 text-[#005792]" />
              </div>
              <h3 className="text-base font-semibold text-[#005792]">
                {t("monitoringLog.logDetails", { defaultValue: "Chi tiết nhật ký" })}
              </h3>
              <span className="text-blue-400 font-normal text-xs">
                ({t("common.optional", { defaultValue: "Tuỳ chọn" })})
              </span>
            </div>

            {/* Log detail rows */}
            {form.logDetailsDtos.length > 0 && (
              <div className="space-y-3 mb-4">
                {form.logDetailsDtos.map((detail, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F0F8FF]/60 border border-blue-100 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-[#005792]">
                        {t("monitoringLog.logDetail", { defaultValue: "Chi tiết" })} {idx + 1}
                      </span>
                      <button
                        type="button"
                        className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs font-medium"
                        onClick={() => handleRemoveLogDetail(idx)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t("common.delete", { defaultValue: "Xóa" })}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Stage requirement definition */}
                      <div>
                        <label className="text-xs font-semibold text-blue-900 mb-1.5 block">
                          {t("monitoringLog.stageRequirementDef", { defaultValue: "Chỉ tiêu" })}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Select
                          showSearch
                          allowClear
                          style={{ width: "100%" }}
                          placeholder={t("monitoringLog.selectDef", { defaultValue: "Chọn chỉ tiêu..." })}
                          value={detail.stageRequirementDefinitionId || undefined}
                          onChange={(val: string) =>
                            handleLogDetailChange(idx, "stageRequirementDefinitionId", val ?? "")
                          }
                          options={stageDefs.map((sd) => ({
                            label: sd.unit ? `${sd.name} (${sd.unit})` : sd.name,
                            value: sd.id,
                          }))}
                          filterOption={(input, option) =>
                            (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </div>

                      {/* Measured value */}
                      <div>
                        <label className="text-xs font-semibold text-blue-900 mb-1.5 block">
                          {t("monitoringLog.measuredValue", { defaultValue: "Giá trị đo được" })}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={detail.measuredValue}
                          onChange={(e) =>
                            handleLogDetailChange(idx, "measuredValue", Number(e.target.value))
                          }
                          placeholder="0"
                          className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-950 placeholder-blue-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#005792]/20 focus:border-[#005792]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add log detail button */}
            <button
              type="button"
              className="w-full border-2 border-dashed border-[#00CED1] text-[#005792] bg-cyan-50/30 hover:bg-cyan-50 rounded-xl py-3 font-medium transition-colors flex items-center justify-center gap-2"
              onClick={handleAddLogDetail}
            >
              <Plus className="w-4 h-4" />
              {t("monitoringLog.addLogDetail", { defaultValue: "Thêm chi tiết nhật ký" })}
            </button>
          </div>

          {/* ── Error message ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            {/* Save draft */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 border border-[#005792] text-[#005792] bg-white hover:bg-[#E0F2FE] px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              {loading
                ? t("common.saving", { defaultValue: "Đang lưu..." })
                : t("monitoringLog.saveDraft", { defaultValue: "Lưu nháp" })}
            </button>

            {/* Submit immediately */}
            <button
              type="button"
              disabled={loading}
              onClick={(e) => { void handleSubmit(e as unknown as React.FormEvent, true); }}
              className="inline-flex items-center justify-center gap-2 bg-[#005792] text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-blue-900/20 hover:bg-[#004370] hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {loading
                ? t("common.saving", { defaultValue: "Đang lưu..." })
                : t("monitoringLog.submitImmediately", { defaultValue: "Tạo và gửi duyệt" })}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}