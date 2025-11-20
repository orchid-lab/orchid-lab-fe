import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateTaskStepper from "./CreateTaskStepper";
import { useCreateTask } from "../../../../context/CreateTaskContext";
import type {
  Attribute,
  ExperimentLog,
  Sample,
  Element,
} from "../../../../context/CreateTaskContext";
import axiosInstance from "../../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import AutoCreateTaskContainer from "./AutoCreateTaskContainer";

interface ApiElementResponse {
  value?: {
    data?: { id: string; name: string; description: string }[];
  };
}

interface ApiExperimentLogResponse {
  value?: {
    data?: { id: string; name: string }[];
  };
}

interface ApiSampleResponse {
  value?: {
    data?: { id: string; name: string }[];
  };
}

const CreateTaskContainer: React.FC = () => {
  const [name, setName] = useState("");
  const [experimentLogs, setExperimentLogs] = useState<ExperimentLog[]>([]);
  const [selectedEL, setSelectedEL] = useState<string>("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSample, setSelectedSample] = useState<string>("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDaily, setIsDaily] = useState(false);
  const [elements, setElements] = useState<Element[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([
    {
      elementId: "",
      elementName: "",
      measurementUnit: "",
      value: 0,
      description: "",
    },
  ]);

  const [loadingEL, setLoadingEL] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [loadingElements, setLoadingElements] = useState(false);
  const [loadingSampleDetails, setLoadingSampleDetails] = useState(false);
  const navigate = useNavigate();
  const { setState } = useCreateTask();
  const { enqueueSnackbar } = useSnackbar();

  // Fetch elements
  useEffect(() => {
    setLoadingElements(true);
    axiosInstance
      .get("/api/element?pageNumber=1&pageSize=100")
      .then((res: { data: ApiElementResponse }) => {
        const data = Array.isArray(res.data?.value?.data)
          ? res.data.value.data
          : [];
        setElements(
          data.map((el) => ({
            id: el.id,
            name: el.name,
            description: el.description,
          }))
        );
      })
      .catch(() => {
        setElements([]);
        enqueueSnackbar("Không thể tải danh sách nguyên vật liệu!", {
          variant: "error",
        });
      })
      .finally(() => setLoadingElements(false));
  }, [enqueueSnackbar]);

  // Fetch experiment logs (EL)
  useEffect(() => {
    setLoadingEL(true);
    axiosInstance
      .get("/api/experimentlog?pageNumber=1&pageSize=100")
      .then((res: { data: ApiExperimentLogResponse }) => {
        const data = Array.isArray(res.data?.value?.data)
          ? res.data.value.data
          : [];
        setExperimentLogs(data.map((el) => ({ id: el.id, name: el.name })));
      })
      .catch(() => {
        setExperimentLogs([]);
        enqueueSnackbar("Không thể tải danh sách nhật ký thí nghiệm!", {
          variant: "error",
        });
      })
      .finally(() => setLoadingEL(false));
  }, [enqueueSnackbar]);

  // Fetch samples when EL changes
  useEffect(() => {
    if (!selectedEL) {
      setSamples([]);
      setSelectedSample("");
      return;
    }
    setLoadingSample(true);
    axiosInstance
      .get(`/api/sample?pageNo=1&pageSize=100&experimentLogId=${selectedEL}`)
      .then((res: { data: ApiSampleResponse }) => {
        const data = Array.isArray(res.data?.value?.data)
          ? res.data.value.data
          : [];
        setSamples(data.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch(() => {
        setSamples([]);
        enqueueSnackbar("Không thể tải danh sách mẫu thí nghiệm!", {
          variant: "error",
        });
      })
      .finally(() => setLoadingSample(false));
  }, [selectedEL, enqueueSnackbar]);

  // Attribute handlers
  const handleAttributeChange = (
    idx: number,
    field: keyof Attribute,
    value: string | number
  ) => {
    setAttributes((prev) =>
      prev.map((attr, i) => {
        if (i === idx) {
          if (field === "elementId") {
            // Khi chọn element, tự động cập nhật tên và đơn vị
            const selectedElement = elements.find((el) => el.id === value);
            return {
              ...attr,
              elementId: value as string,
              elementName: selectedElement?.name ?? "",
              measurementUnit: selectedElement?.description ?? "",
            };
          }
          return { ...attr, [field]: value };
        }
        return attr;
      })
    );
  };

  const handleAddAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      {
        elementId: "",
        elementName: "",
        measurementUnit: "",
        value: 0,
        description: "",
      },
    ]);
  };

  const handleRemoveAttribute = (idx: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit (Next)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // Chuyển đổi startDate và endDate sang múi giờ Việt Nam (thêm 7 tiếng)
    let startDateWithTimezone = startDate;
    let endDateWithTimezone = endDate;

    if (startDate) {
      // Tạo Date object từ chuỗi YYYY-MM-DD
      const startDateObj = new Date(startDate);
      // Đặt thời gian về 00:00:00 và thêm 7 tiếng
      startDateObj.setHours(7, 0, 0, 0);
      startDateWithTimezone = startDateObj.toISOString();
    }

    if (endDate) {
      // Tạo Date object từ chuỗi YYYY-MM-DD
      const endDateObj = new Date(endDate);
      // Đặt thời gian về 00:00:00 và thêm 7 tiếng
      endDateObj.setHours(7, 0, 0, 0);
      endDateWithTimezone = endDateObj.toISOString();
    }

    setState((prev) => ({
      ...prev,
      name,
      experimentLog: experimentLogs.find((el) => el.id === selectedEL) ?? null,
      stage: null,
      sample: samples.find((s) => s.id === selectedSample) ?? null,
      description,
      start_date: startDateWithTimezone,
      end_date: endDateWithTimezone,
      isDaily,
      attribute: attributes,
    }));
    void navigate("/create-task/step-2");
  };

  // Check if this is auto-create mode
  const [searchParams] = useSearchParams();
  const autoCreate = searchParams.get("autoCreate") === "true";
  const experimentLogId = searchParams.get("experimentLogId");
  const stageId = searchParams.get("stageId");
  const sampleId = searchParams.get("sampleId");

  // Debug: Log URL parameters
  console.log("CreateTaskContainer URL params:", {
    autoCreate,
    experimentLogId,
    stageId,
    sampleId,
  });

  // Fetch sample details when sampleId is provided
  // Fetch sample details khi có sampleId
  useEffect(() => {
    if (!sampleId) return;

    const fetchSampleDetails = async () => {
      setLoadingSampleDetails(true);
      try {
        const res = await axiosInstance.get<{ value: Sample }>(
          `/api/sample/${sampleId}`
        );
        const data = res.data.value;
        if (data) {
          setSelectedSample(data.id);
          setSamples([{ id: data.id, name: data.name }]); // để UI hiển thị
        }
      } catch (err) {
        console.error("Error fetching sample details:", err);
        enqueueSnackbar("Không thể tải thông tin mẫu!", { variant: "error" });
      } finally {
        setLoadingSampleDetails(false);
      }
    };

    void fetchSampleDetails();
  }, [sampleId, enqueueSnackbar]);

  // If auto-create mode, show auto-create component
  if (autoCreate && experimentLogId && stageId) {
    console.log("Rendering AutoCreateTaskContainer");
    return <AutoCreateTaskContainer />;
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center py-10">
      <CreateTaskStepper currentStep={1} />
      <form
        className="bg-white rounded-2xl px-8 pt-8 pb-6 shadow-lg max-w-4xl w-full mx-auto"
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-semibold mb-6">Tạo nhiệm vụ</h2>
        <div className="flex flex-col mb-4 flex-1">
          <label className="font-medium mb-1.5">Tên nhiệm vụ *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        {!sampleId && (
          <div className="flex flex-col mb-4 flex-1">
            <label className="font-medium mb-1.5">
              Chọn nhật ký thí nghiệm
            </label>
            <select
              value={selectedEL}
              onChange={(e) => setSelectedEL(e.target.value)}
              className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Chọn nhật ký thí nghiệm...</option>
              {experimentLogs.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.name}
                </option>
              ))}
            </select>
            {loadingEL && (
              <span className="text-xs text-gray-400">Đang tải...</span>
            )}
          </div>
        )}

        {/* Show sample info when sampleId is provided from URL */}
        {sampleId && (
          <div className="flex flex-col mb-4 flex-1">
            <label className="font-medium mb-1.5">Mẫu thí nghiệm đã chọn</label>
            <div className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-100">
              {samples.find((s) => s.id === selectedSample)?.name ??
                "Đang tải..."}
            </div>
            {loadingSampleDetails && (
              <span className="text-xs text-gray-400">
                Đang tải thông tin mẫu...
              </span>
            )}
          </div>
        )}

        {/* Show sample dropdown when sampleId is not provided and samples are available */}
        {!sampleId && samples.length > 0 && (
          <div className="flex flex-col mb-4 flex-1">
            <label className="font-medium mb-1.5">
              Chọn mẫu thí nghiệm (Tùy chọn)
            </label>
            <select
              value={selectedSample}
              onChange={(e) => setSelectedSample(e.target.value)}
              className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Chọn mẫu thí nghiệm...</option>
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {loadingSample && (
              <span className="text-xs text-gray-400">Đang tải...</span>
            )}
          </div>
        )}
        <div className="flex flex-col mb-4 flex-1">
          <label className="font-medium mb-1.5">Mô tả nhiệm vụ</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 min-h-[60px] resize-y"
          />
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col mb-4 flex-1">
            <label className="font-medium mb-1.5">Ngày bắt đầu *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50"
            />
          </div>
          <div className="flex flex-col mb-4 flex-1">
            <label className="font-medium mb-1.5">Ngày kết thúc *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50"
            />
          </div>
        </div>

        {/* Daily checkbox */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="isDaily"
            checked={isDaily}
            onChange={(e) => setIsDaily(e.target.checked)}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
          />
          <label
            htmlFor="isDaily"
            className="ml-2 text-sm font-medium text-gray-700"
          >
            Nhiệm vụ hàng ngày
          </label>
        </div>
        <div className="flex flex-col mb-4 flex-1">
          <label className="font-medium mb-1.5">Nguyên vật liệu</label>
          {loadingElements && (
            <span className="text-xs text-gray-400 mb-2">
              Đang tải danh sách nguyên vật liệu...
            </span>
          )}
          {/* {selectedTemplateId && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              Đã tự động điền từ mẫu nhiệm vụ "{taskTemplates.find(t => t.id === selectedTemplateId)?.name}"
            </div>
          )} */}
          <div className="space-y-4">
            {attributes.map((attr, idx) => (
              // eslint-disable-next-line react-x/no-array-index-key
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                {/* Dòng 1: Select box nguyên vật liệu */}
                <div className="mb-3">
                  <select
                    value={attr.elementId}
                    onChange={(e) =>
                      handleAttributeChange(idx, "elementId", e.target.value)
                    }
                    className="w-full py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Chọn nguyên vật liệu...</option>
                    {elements.map((element) => (
                      <option key={element.id} value={element.id}>
                        {element.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Dòng 2: 4 field còn lại */}
                <div className="grid grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Tên nguyên vật liệu"
                    value={attr.elementName}
                    readOnly
                    className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-200 cursor-not-allowed"
                  />
                  <input
                    type="text"
                    placeholder="Đơn vị"
                    value={attr.measurementUnit}
                    readOnly
                    className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-200 cursor-not-allowed"
                  />
                  <input
                    type="number"
                    placeholder="Số lượng"
                    value={attr.value}
                    onChange={(e) =>
                      handleAttributeChange(
                        idx,
                        "value",
                        Number(e.target.value)
                      )
                    }
                    className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Mô tả"
                    value={attr.description}
                    onChange={(e) =>
                      handleAttributeChange(idx, "description", e.target.value)
                    }
                    className="py-2 px-3 border border-gray-300 rounded-md text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                {/* Nút xóa/thêm */}
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="text-red-500 px-2 text-lg font-bold hover:text-red-700"
                    disabled={attributes.length === 1}
                  >
                    -
                  </button>
                  {idx === attributes.length - 1 && (
                    <button
                      type="button"
                      onClick={handleAddAttribute}
                      className="text-green-600 px-2 text-lg font-bold hover:text-green-800"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="bg-green-700 text-white border-none py-2.5 px-8 rounded-lg text-base cursor-pointer hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={
              !name ||
              !startDate ||
              !endDate ||
              attributes.some((a) => !a.elementId || !a.value) ||
              loadingElements
            }
          >
            Next
          </button>
        </div>
      </form>
    </main>
  );
};

export default CreateTaskContainer;
