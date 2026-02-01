import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "react-i18next";

interface Sample {
  id: string;
  name: string;
  description?: string;
  dob: string;
  statusEnum: string;
  stage?: string;
  medium?: string;
  pH?: number;
  temp?: number;
  humidity?: number;
  ageDays?: number;
  // measured metrics requested
  leaves?: number;
  roots?: number;
  stemHeightCm?: number;
  rootLengthCm?: number;
  note?: string;
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
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any | null>(null);
  const [sample, setSample] = useState<Sample | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(
    null,
  );

  // --- Mock data (for quick mockup / demo) ---
  const mockSample: Sample = {
    id: "SMP-2026-0012",
    name: "Phalaenopsis 'Sunrise' #12",
    description: "Mẫu nuôi cấy trên môi trường MS, giai đoạn cây con.",
    dob: "2025-11-10",
    statusEnum: "Process",
    stage: "Coppice",
    medium: "MS",
    pH: 5.8,
    temp: 24,
    humidity: 78,
    ageDays: 69,
    leaves: 6,
    roots: 3,
    stemHeightCm: 2.4,
    rootLengthCm: 1.8,
  };

  // standard/reference conditions per stage (mock)
  const standardConditions: Record<
    string,
    {
      leavesRange: [number, number];
      rootsRange: [number, number];
      stemHeightRangeCm: [number, number];
      rootLengthRangeCm: [number, number];
      pHRange?: [number, number];
      tempRangeC?: [number, number];
      humidityRange?: [number, number];
    }
  > = {
    Coppice: {
      leavesRange: [4, 10],
      rootsRange: [2, 6],
      stemHeightRangeCm: [1, 5],
      rootLengthRangeCm: [0.5, 4],
      pHRange: [5.6, 6.0],
      tempRangeC: [22, 25],
      humidityRange: [70, 85],
    },
    // fallback
    default: {
      leavesRange: [0, 99],
      rootsRange: [0, 99],
      stemHeightRangeCm: [0, 999],
      rootLengthRangeCm: [0, 999],
      pHRange: [0, 14],
      tempRangeC: [0, 50],
      humidityRange: [0, 100],
    },
  };

  useEffect(() => {
    // Simulate fetching and populate with mock data for a design mockup
    setLoading(true);
    setTimeout(() => {
      setReport({
        id: id ?? "RPT-MOCK-001",
        author: { id: "u01", name: "Nguyễn Văn A" },
        createdAt: "2026-01-10T09:24:00Z",
        status: "Open",
        note: "Quan sát thấy một vài đốm nâu nhỏ trên phiến lá. Đã lấy ảnh để phân tích và theo dõi.",
        sampleId: mockSample.id,
      });
      setSample(mockSample);
      setImages([
        "https://images.unsplash.com/photo-1524594154908-36f5342b7314?w=1200&q=60&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1536170724940-3f5b1d9c9f85?w=1200&q=60&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&q=60&auto=format&fit=crop",
      ]);
      setSelectedImg(
        "https://images.unsplash.com/photo-1524594154908-36f5342b7314?w=1200&q=60&auto=format&fit=crop",
      );
      setLoading(false);
    }, 350);
  }, [id]);

  const diseaseNameMap: Record<string, string> = {
    anthracnose: t("diseases.anthracnose") || "Thán thư",
    bacterialwilt: t("diseases.bacterialWilt") || "Héo vi khuẩn",
    blackrot: t("diseases.blackrot") || "Thối đen",
    brownspots: t("diseases.brownspots") || "Đốm nâu",
    moldbacterial: t("diseases.moldBacterial") || "Mốc vi khuẩn",
    moldfungus: t("diseases.moldFungus") || "Mốc nấm",
    softrot: t("diseases.softRot") || "Thối mềm",
    stemrot: t("diseases.stemRot") || "Thối thân",
    witheredyellowroot: t("diseases.witheredYellowRoot") || "Vàng rễ héo",
    healthy: t("diseases.healthy") || "Khỏe mạnh",
    oxidation: t("diseases.oxidation") || "Oxy hóa",
    virus: t("diseases.virus") || "Virus",
  };

  function formatDate(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString();
  }

  // Simulated analyze function: generate fake probabilities and a top prediction
  const analyzeImageFromUrl = async () => {
    setAnalyzeLoading(true);
    setAnalyzeResult(null);
    // simulate network
    await new Promise((r) => setTimeout(r, 900));
    // create fake probabilities
    const classes = [
      "brownspots",
      "anthracnose",
      "blackrot",
      "moldfungus",
      "healthy",
    ];
    const probs: Record<string, number> = {};
    let sum = 0;
    for (const c of classes) {
      const v = Math.random();
      probs[c] = v;
      sum += v;
    }
    // normalize
    Object.keys(probs).forEach(
      (k) => (probs[k] = +(probs[k] / sum).toFixed(3)),
    );
    // pick top
    const top = Object.entries(probs).sort((a, b) => b[1] - a[1])[0];
    setAnalyzeResult({
      stage: sample
        ? sample.stage || sample.statusEnum || "unknown"
        : "unknown",
      disease: {
        predict: top?.[0] ?? "healthy",
        probability: probs,
      },
    });
    setAnalyzeLoading(false);
  };

  const getStatusDisplay = (status?: string) => {
    if (!status) return t("common.noData") || "Không có dữ liệu";
    const statusMap: Record<string, string> = {
      Process: t("status.inProgress") || "Đang tiến hành",
      Suspended: t("experimentLog.suspended") || "Tạm dừng",
      Destroyed: t("experimentLog.destroyed") || "Đã hủy",
    };
    return statusMap[status] || status;
  };

  function metricStatus(
    value: number | undefined,
    range: [number, number],
  ): "ok" | "warning" | "bad" | "na" {
    if (value == null) return "na";
    const [min, max] = range;
    if (value >= min && value <= max) return "ok";
    // small deviation => warning, large deviation => bad
    const span = max - min || Math.abs(min) || 1;
    const diff = value < min ? min - value : value - max;
    if (diff <= span * 0.3) return "warning";
    return "bad";
  }

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-500">
          {t("common.loadingData") || "Đang tải..."}
        </div>
      </main>
    );
  }

  // pick standard for sample.stage or fallback default
  const std =
    standardConditions[sample?.stage ?? "default"] ??
    standardConditions.default;

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t("report.reportDetails") || "Chi tiết báo cáo"}
            </h1>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(report?.createdAt)} • {report?.author?.name}
            </div>
          </div>
        </div>

        {/* Sample summary (vertical, full width) */}
        <section className="w-full bg-white rounded-lg shadow-sm p-6">
          <div className="md:flex md:items-start md:gap-6">
            <div className="flex-1 mt-4 md:mt-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    Mẫu vật: {sample?.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{sample?.id}</div>
                </div>
                <div className="text-right">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700">
                      {getStatusDisplay(sample?.statusEnum)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div>
                  <strong>Nhật ký thí nghiệm:</strong> EL1
                </div>
                <div>
                  <strong>Giai đoạn:</strong>{" "}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sky-50 text-sky-700">
                    {sample?.stage ?? "—"}
                  </span>
                </div>
              </div>

              {/* measured metrics block */}
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Số liệu đo được
                </h4>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <MetricRow
                    label="Số lá"
                    value={sample?.leaves}
                    range={std.leavesRange}
                    unit=""
                    metricStatus={metricStatus}
                  />
                  <MetricRow
                    label="Số rễ"
                    value={sample?.roots}
                    range={std.rootsRange}
                    unit=""
                    metricStatus={metricStatus}
                  />
                  <MetricRow
                    label="Chiều cao thân"
                    value={sample?.stemHeightCm}
                    range={std.stemHeightRangeCm}
                    unit="cm"
                    metricStatus={metricStatus}
                  />
                  <MetricRow
                    label="Chiều dài rễ"
                    value={sample?.rootLengthCm}
                    range={std.rootLengthRangeCm}
                    unit="cm"
                    metricStatus={metricStatus}
                  />
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Điều kiện tiêu chuẩn tại giai đoạn {sample?.stage ?? "—"}
                </h4>
                <div className="mt-3 text-sm text-gray-600 grid grid-cols-2 gap-2">
                  <div>
                    <strong>pH:</strong> {std.pHRange?.[0]} - {std.pHRange?.[1]}
                  </div>
                  <div>
                    <strong>Nhiệt độ:</strong> {std.tempRangeC?.[0]} -{" "}
                    {std.tempRangeC?.[1]}°C
                  </div>
                  <div>
                    <strong>Độ ẩm:</strong> {std.humidityRange?.[0]} -{" "}
                    {std.humidityRange?.[1]}%
                  </div>
                  <div />
                  <div>
                    <strong>Leaves:</strong> {std.leavesRange[0]} -{" "}
                    {std.leavesRange[1]}
                  </div>
                  <div>
                    <strong>Roots:</strong> {std.rootsRange[0]} -{" "}
                    {std.rootsRange[1]}
                  </div>
                  <div>
                    <strong>Stem H (cm):</strong> {std.stemHeightRangeCm[0]} -{" "}
                    {std.stemHeightRangeCm[1]}
                  </div>
                  <div>
                    <strong>Root L (cm):</strong> {std.rootLengthRangeCm[0]} -{" "}
                    {std.rootLengthRangeCm[1]}
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900">Ghi chú</h4>
                <div className="text-sm">
                  {sample?.note ?? "Notes của báo cáo"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery + Analysis and Activity sections remain unchanged */}
        <section className="w-full bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col gap-4">
            <div className="w-full rounded-md overflow-hidden bg-gray-100">
              <img
                src={selectedImg ?? images[0]}
                alt="Selected"
                className="w-full h-64 object-cover"
              />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto">
              {images.map((src) => (
                <button
                  key={src}
                  onClick={() => setSelectedImg(src)}
                  className={`w-24 h-16 rounded-md overflow-hidden border ${selectedImg === src ? "border-emerald-500 ring-2 ring-emerald-100" : "border-gray-200"} `}
                >
                  <img
                    src={src}
                    alt="thumb"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => selectedImg && analyzeImageFromUrl()}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm flex items-center gap-2"
                  disabled={!selectedImg || analyzeLoading}
                >
                  {analyzeLoading ? "Đang phân tích..." : "Phân tích ảnh"}
                </button>
                <button
                  onClick={() => {
                    /* open modal view */
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm"
                >
                  Xem chi tiết ảnh
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-800">
                Kết quả phân tích
              </h4>

              {!analyzeResult && (
                <div className="text-sm text-gray-500 mt-3">
                  Chưa có kết quả. Chọn ảnh và nhấn "Phân tích ảnh" để xem dự
                  đoán.
                </div>
              )}

              {analyzeResult && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Giai đoạn</div>
                      <div className="text-base font-medium text-gray-900">
                        {analyzeResult.stage}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Dự đoán chính</div>
                      <div className="text-base font-semibold text-rose-600">
                        {diseaseNameMap[analyzeResult.disease.predict] ??
                          analyzeResult.disease.predict}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600">
                      Xác suất các lớp
                    </div>
                    <div className="mt-2 space-y-2">
                      {Object.entries(analyzeResult.disease.probability)
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v]) => (
                          <div key={k} className="flex items-center gap-3">
                            <div className="w-28 text-sm text-gray-700">
                              {diseaseNameMap[k] ?? k}
                            </div>
                            <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                              <div
                                style={{ width: `${Math.round(v * 100)}%` }}
                                className="h-full bg-emerald-500"
                              />
                            </div>
                            <div className="w-12 text-right text-xs text-gray-600">
                              {Math.round(v * 100)}%
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="w-full bg-white rounded-lg shadow-sm p-6">
          <div className="md:flex md:justify-between md:items-start md:gap-6">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-800">Hoạt động</h4>
              <ul className="mt-3 space-y-3 text-sm text-gray-600">
                <li>
                  <div className="text-gray-700 font-medium">Tạo báo cáo</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(report?.createdAt)} • {report?.author?.name}
                  </div>
                </li>
                <li>
                  <div className="text-gray-700 font-medium">Lần quét ảnh</div>
                  <div className="text-xs text-gray-500">2026-01-12 10:12</div>
                </li>
                <li>
                  <div className="text-gray-700 font-medium">
                    Cập nhật trạng thái
                  </div>
                  <div className="text-xs text-gray-500">
                    Đã đánh dấu cần theo dõi
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-6 md:mt-0 md:w-64">
              <h4 className="text-sm font-medium text-gray-800">
                Hành động nhanh
              </h4>
              <div className="mt-3 flex flex-col gap-2">
                <button className="px-3 py-2 bg-red-600 text-white rounded-md text-sm">
                  Đánh dấu nhiễm
                </button>
                <button className="px-3 py-2 bg-amber-500 text-white rounded-md text-sm">
                  Gửi cảnh báo
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm">
                  Thêm ghi chú
                </button>
              </div>

              <div className="mt-6 text-sm text-gray-600 space-y-2">
                <div>
                  <strong>Page:</strong> {page}
                </div>
                <div>
                  <strong>Report ID:</strong> {report?.id}
                </div>
                <div>
                  <strong>Assigned:</strong> {user?.name ?? "—"}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* small helper component placed in same file for compactness */
function MetricRow(props: {
  label: string;
  value?: number;
  range: [number, number];
  unit?: string;
  metricStatus: (
    value: number | undefined,
    range: [number, number],
  ) => "ok" | "warning" | "bad" | "na";
}) {
  const { label, value, range, unit = "", metricStatus } = props;
  const status = metricStatus(value, range);
  const color =
    status === "ok"
      ? "text-emerald-700 bg-emerald-50"
      : status === "warning"
        ? "text-amber-700 bg-amber-50"
        : status === "bad"
          ? "text-rose-700 bg-rose-50"
          : "text-gray-500 bg-gray-50";

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-gray-700">{label}</div>
      <div className="text-right">
        <div
          className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${color}`}
        >
          {value == null ? "—" : `${value}${unit}`}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          ref: {range[0]}–{range[1]}
          {unit}
        </div>
      </div>
    </div>
  );
}
