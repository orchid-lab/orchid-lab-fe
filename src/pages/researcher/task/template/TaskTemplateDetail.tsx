/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react-x/no-array-index-key */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Activity,
  Info,
  CheckCircle2,
  ListChecks,
  Beaker,
} from "lucide-react";

const STAGE_NAME_MAP: Record<number, string> = {
  1: "Chuẩn bị mẫu",
  2: "Khử trùng",
  3: "Nuôi cấy khởi động",
  4: "Nhân nhanh",
  5: "Tạo rễ",
  6: "Ra giá thể",
};

interface TaskAttribute {
  chemicalName: string | null;
  materialName: string | null;
  unit: string;
  value: number;
}

interface CheckListItem {
  id: string;
  name: string;
  description: string | null;
  order: number;
  expectedUnit: string | null;
  expectedMinValue: number | null;
  expectedMaxValue: number | null;
  status: string;
  measurementUnit: string | null;
  mesuredValue: number | null;
  isPass: boolean | null;
  evaluated: unknown;
}

interface TaskCheckList {
  id: string;
  checkListItemDtos: CheckListItem[];
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  stageId: number | null;
  researcherId: string | null;
  status: string;
  createdDate: string;
  createdBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
  taskAttributes: TaskAttribute[] | null;
  taskAssignments: unknown;
  taskCheckList: TaskCheckList | null;
}

/* ─── Animation variants ──────────────────────────────── */
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const TaskTemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [template, setTemplate] = useState<TaskTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    axiosInstance
      .get(`/api/tasks/${id}`)
      .then((res: { data: TaskTemplate }) => {
        if (res.data?.id) {
          setTemplate(res.data);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
        enqueueSnackbar("Không thể tải chi tiết mẫu nhiệm vụ!", {
          variant: "error",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, enqueueSnackbar]);

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    const configMap: Record<
      string,
      { label: string; bg: string; text: string; icon: React.ElementType }
    > = {
      Template: {
        label: "Mẫu nhiệm vụ",
        bg: "bg-[#E4F0E8] border-[#C9E7D2]",
        text: "text-[#2D5A27]",
        icon: CheckCircle2,
      },
    };

    const config = configMap[status] ?? {
      label: status,
      bg: "bg-gray-50 border-gray-200",
      text: "text-gray-700",
      icon: Info,
    };
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] flex items-center justify-center">
        <div className="flex flex-col items-center text-[#2D5A27] animate-pulse">
          <FileText className="w-10 h-10 mb-4 animate-bounce" />
          <p className="font-medium">Đang tải chi tiết mẫu nhiệm vụ...</p>
        </div>
      </main>
    );
  }

  if (error || !template) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] flex items-center justify-center">
        <div className="text-slate-500 text-center">
          <Info className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Không tìm thấy mẫu nhiệm vụ.</p>
          <button
            type="button"
            onClick={() => navigate("/researcher/task-templates")}
            className="mt-4 text-[#2D5A27] hover:underline"
          >
            Quay lại danh sách
          </button>
        </div>
      </main>
    );
  }

  const stageName =
    template.stageId !== null
      ? STAGE_NAME_MAP[template.stageId] ?? `Giai đoạn ${template.stageId}`
      : "—";

  const sortedCheckList = template.taskCheckList?.checkListItemDtos
    ? [...template.taskCheckList.checkListItemDtos].sort(
        (a, b) => a.order - b.order
      )
    : [];

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-[#F4F7F4] p-6 lg:p-8 text-slate-800">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Back Button */}
        <motion.button
          variants={fadeInUp}
          type="button"
          className="flex items-center gap-2 text-slate-500 hover:text-[#2D5A27] transition-colors font-medium w-fit"
          onClick={() => navigate("/researcher/task-templates")}
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </motion.button>

        <div className="grid grid-cols-1 gap-6">
          {/* Main Info Card */}
          <motion.div
            variants={fadeInUp}
            className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#2D5A27] p-1 bg-[#E4F0E8] rounded-lg" />
                <h1 className="text-xl font-bold text-[#1e3e1c]">
                  {template.name}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {renderStatusBadge(template.status)}
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase mb-1">
                    Giai đoạn
                  </span>
                  <div className="text-lg font-medium text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#2D5A27]" />
                    {stageName}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase mb-1">
                    Mô tả
                  </span>
                  <div className="text-base font-medium text-slate-800">
                    {template.description || "Không có mô tả"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">
                      Ngày tạo
                    </span>
                    <span className="text-base font-medium text-slate-800">
                      {new Date(template.createdDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                    {template.createdBy && (
                      <span className="text-xs text-slate-500 ml-2">
                        (bởi {template.createdBy})
                      </span>
                    )}
                  </div>
                </div>
                {template.updatedDate && (
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#E4F0E8] rounded-xl text-[#2D5A27] border border-[#DDEEE0]">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        Cập nhật lần cuối
                      </span>
                      <span className="text-base font-medium text-slate-800">
                        {new Date(template.updatedDate).toLocaleDateString(
                          "vi-VN"
                        )}
                      </span>
                      {template.updatedBy && (
                        <span className="text-xs text-slate-500 ml-2">
                          (bởi {template.updatedBy})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Task Attributes (nguyên vật liệu) */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
            <Beaker className="w-5 h-5 text-[#2D5A27]" />
            <h2 className="text-lg font-bold text-[#1e3e1c]">
              Nguyên vật liệu & Hóa chất
            </h2>
          </div>

          <div className="p-0">
            {template.taskAttributes && template.taskAttributes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#F4F7F4] text-slate-600 font-semibold border-b border-[#DDEEE0]">
                    <tr>
                      <th className="px-6 py-4">Tên vật tư</th>
                      <th className="px-6 py-4">Tên hóa chất</th>
                      <th className="px-6 py-4 text-center">Số lượng</th>
                      <th className="px-6 py-4 text-center">Đơn vị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.taskAttributes.map((attr, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-100 hover:bg-[#F4F7F4] transition-colors ${
                          idx === template.taskAttributes!.length - 1
                            ? "border-none"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {attr.materialName ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {attr.chemicalName ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-[#1e3e1c]">
                          {attr.value}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">
                          {attr.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 italic">
                Không có yêu cầu nguyên vật liệu nào.
              </div>
            )}
          </div>
        </motion.div>

        {/* Checklist */}
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-2xl shadow-sm border border-[#DDEEE0] overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-[#DDEEE0] bg-[#F4F7F4] flex items-center gap-3">
            <ListChecks className="w-5 h-5 text-[#2D5A27]" />
            <h2 className="text-lg font-bold text-[#1e3e1c]">
              Danh sách kiểm tra (Checklist)
            </h2>
          </div>

          <div className="p-0">
            {sortedCheckList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#F4F7F4] text-slate-600 font-semibold border-b border-[#DDEEE0]">
                    <tr>
                      <th className="px-6 py-4 w-16 text-center">TT</th>
                      <th className="px-6 py-4">Tên bước</th>
                      <th className="px-6 py-4 text-center">Giá trị kỳ vọng</th>
                      <th className="px-6 py-4 text-center">Đơn vị</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCheckList.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 hover:bg-[#F4F7F4] transition-colors ${
                          idx === sortedCheckList.length - 1
                            ? "border-none"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-center text-slate-500 font-medium">
                          {item.order}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">
                          {item.expectedMinValue !== null &&
                          item.expectedMaxValue !== null ? (
                            item.expectedMinValue === item.expectedMaxValue ? (
                              <span className="font-bold">
                                {item.expectedMinValue}
                              </span>
                            ) : (
                              <span className="font-bold">
                                {item.expectedMinValue} –{" "}
                                {item.expectedMaxValue}
                              </span>
                            )
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">
                          {item.expectedUnit ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold border ${
                              item.status === "Pending"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : item.status === "Pass"
                                ? "bg-[#E4F0E8] text-[#2D5A27] border-[#C9E7D2]"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {item.status === "Pending"
                              ? "Chờ kiểm tra"
                              : item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 italic">
                Không có danh sách kiểm tra.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default TaskTemplateDetail;