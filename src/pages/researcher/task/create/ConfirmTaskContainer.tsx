import React from "react";
import { useNavigate } from "react-router-dom";
import CreateTaskStepper from "./CreateTaskStepper";
import { useCreateTask } from "../../../../context/CreateTaskContext";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";

const ConfirmTaskContainer: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useCreateTask();
  const { enqueueSnackbar } = useSnackbar();

  const handleBack = (): void => {
    void navigate("/create-task/step-2");
  };

  const handleCreate = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    // Chuẩn bị body đúng format
    const body = {
      experimentLogID: state.experimentLog?.id ?? "",
      stageID: state.stage?.id ?? "",
      sampleID: state.sample?.id ?? "",
      name: state.name,
      description: state.description,
      start_date: state.start_date
        ? new Date(state.start_date).toISOString()
        : "",
      end_date: state.end_date ? new Date(state.end_date).toISOString() : "",
      isDaily: state.isDaily,
      attribute: state.attribute.map((attr) => ({
        elementId: attr.elementId,
        name: attr.elementName, // Thêm field name cho API
        measurementUnit: attr.measurementUnit,
        value: attr.value,
        description: attr.description,
      })),
      assignCommand: state.assignCommand,
    };
    try {
      await axiosInstance.post("/api/tasks", body);
      enqueueSnackbar("Task đã được tạo thành công!", { variant: "success" });
      void navigate("/tasks");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(
        "Tạo task thất bại!\n" +
          (error?.response?.data?.message ??
            JSON.stringify(error?.response?.data) ??
            ""),
        { variant: "error" }
      );
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10 px-4">
      <CreateTaskStepper currentStep={3} />
      <form
        className="bg-white rounded-xl px-8 pt-8 pb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] w-full max-w-[900px] mx-auto mt-8"
        onSubmit={(e) => {
          void handleCreate(e);
        }}
      >
        <h2 className="text-2xl font-semibold mb-6">
          Xác nhận thông tin nhiệm vụ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Tên nhiệm vụ</label>
            <input
              type="text"
              value={state.name}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Nhật ký thí nghiệm</label>
            <input
              type="text"
              value={state.experimentLog ? state.experimentLog.name : ""}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Giai đoạn</label>
            <input
              type="text"
              value={state.stage ? state.stage.name : ""}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Mẫu thí nghiệm</label>
            <input
              type="text"
              value={state.sample ? state.sample.name : ""}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Ngày bắt đầu</label>
            <input
              type="text"
              value={state.start_date}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Ngày kết thúc</label>
            <input
              type="text"
              value={state.end_date}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Kỹ thuật viên</label>
            <input
              type="text"
              value={
                state.assignCommand && state.assignCommand.length > 0
                  ? state.assignCommand[0].technicianName ?? ""
                  : ""
              }
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">Nhiệm vụ hàng ngày</label>
            <input
              type="text"
              value={state.isDaily ? "Có" : "Không"}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
        </div>
        {/* Hiển thị mô tả và nguyên vật liệu */}
        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Mô tả nhiệm vụ</label>
          <textarea
            value={state.description}
            disabled
            className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 min-h-[80px] resize-none"
          />
        </div>
        <div className="flex flex-col mb-6">
          <label className="font-medium mb-1.5">Nguyên vật liệu</label>
          <div className="space-y-2">
            {state.attribute.map((mat, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={mat.elementName}
                  disabled
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <input
                  type="number"
                  value={mat.value}
                  disabled
                  className="w-24 py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <input
                  type="text"
                  value={mat.measurementUnit}
                  disabled
                  className="w-20 py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <input
                  type="text"
                  value={mat.description}
                  disabled
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            className="min-w-[90px] px-5 py-2 rounded-lg border-none text-base font-semibold cursor-pointer transition-colors duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400"
            onClick={handleBack}
          >
            Back
          </button>
          <button
            type="submit"
            className="min-w-[90px] px-5 py-2 rounded-lg border-none text-base font-semibold cursor-pointer transition-colors duration-200 bg-green-700 text-white hover:bg-green-800"
          >
            Create
          </button>
        </div>
      </form>
    </main>
  );
};

export default ConfirmTaskContainer;
