/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-x/no-array-index-key */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable react-dom/no-missing-button-type */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import ExperimentSteps from "./ExperimentSteps";
import { useExperimentLogForm } from "../../../../context/ExperimentLogFormContext";
import axiosInstance from "../../../../api/axiosInstance";

interface Batch {
  id: string;
  name: string;
  labName?: string;
  description?: string;
  status?: string; // "Ready" | other statuses from API
}

interface Technician {
  id: string;
  name: string;
  email?: string;
  roleID: string | number;
}

const CreateExperimentStep1 = () => {
  const DEV_OFFLINE = false;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { form, setForm } = useExperimentLogForm();

  // Local state initialized from context
  const [selectedBatch, setSelectedBatch] = useState(
    form.tissueCultureBatchID ?? "",
  );
  const [selectedMethod, setSelectedMethod] = useState(form.methodID ?? "");
  const [name, setName] = useState(form.name ?? "");
  const [startDate, setStartDate] = useState(form.startDate ?? "");
  const [endDate, setEndDate] = useState(form.endDate ?? "");
  const [numberOfSample, _setNumberOfSample] = useState(
    form.numberOfSample ?? 1,
  );
  const [objective, setObjective] = useState(form.objective ?? "");

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [batchError, setBatchError] = useState<string | null>(null);

  const [methods, setMethods] = useState<
    {
      id: string;
      name: string;
      description: string;
      type?: string;
      stages?: {
        id: string;
        name: string;
        description: string;
        dateOfProcessing: number;
        step: number;
        status: boolean;
      }[];
    }[]
  >([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>(
    typeof form.technicianID === "string"
      ? form.technicianID
      : Array.isArray(form.technicianID) && form.technicianID.length > 0
        ? form.technicianID[0]
        : "",
  );

  // Store detailed stages for the selected method fetched from /api/methods/{id}
  const [methodStages, setMethodStages] = useState<
    { name: string; description: string }[]
  >([]);

  // Fetch batches from API
  useEffect(() => {
    if (DEV_OFFLINE) {
      setBatchError(null);
      setBatches([
        {
          id: "mock-b1",
          name: "Lô mẫu A",
          labName: "Lab A",
          description: "Lô mẫu dùng để dev",
          status: "Ready",
        },
        {
          id: "mock-b2",
          name: "Lô mẫu B",
          labName: "Lab B",
          description: "Lô mẫu B",
          status: "InUse",
        },
      ]);
      setLoadingBatch(false);
      return;
    }
    setLoadingBatch(true);
    setBatchError(null);
    void axiosInstance
      .get("/api/batches", { params: { pageNo: 1, pageSize: 100 } })
      .then((res) => {
        const raw = res.data as { data?: any[] };
        const arr: Batch[] = Array.isArray(raw.data)
          ? raw.data.map((b) => ({
              id: String(b.id),
              name: b.batchName,
              labName: b.labRoomName,
              status: b.status,         // ✅ map status correctly
              description: b.description ?? "",
            }))
          : [];
        setBatches(arr);
      })
      .catch(async (err) => {
        const detail = err?.response?.data?.detail ?? "";
        // Retry without params if server complains about OFFSET negative
        if (typeof detail === "string" && detail.includes("OFFSET")) {
          try {
            const r2 = await axiosInstance.get("/api/batches");
            const raw2 = r2.data as { data?: any[] };
            const arr2: Batch[] = Array.isArray(raw2.data)
              ? raw2.data.map((b) => ({
                  id: String(b.id),
                  name: b.batchName,
                  labName: b.labRoomName,
                  status: b.status,
                  description: b.description ?? "",
                }))
              : [];
            setBatches(arr2);
            return;
          } catch {
            // fall through to error handler below
          }
        }
        setBatchError(t("experimentLog.batchLoadError"));
        setBatches([]);
      })
      .finally(() => setLoadingBatch(false));
  }, []);

  // Fetch methods from API
  useEffect(() => {
    if (DEV_OFFLINE) {
      setMethods([
        {
          id: "1",
          name: "Nuôi cấy mô tế bào (Invitro)",
          description: "Clonal",
          type: "Clonal",
        },
        {
          id: "2",
          name: "Nhân giống bằng thân giả",
          description: "Sexual",
          type: "Sexual",
        },
      ] as any);
      return;
    }
    void axiosInstance
      .get("/api/methods", { params: { pageNumber: 1, pageSize: 100 } })
      .then((res) => {
        const raw = res.data as { data?: any[] };
        const arr = Array.isArray(raw.data)
          ? raw.data.map((m) => ({
              id: String(m.id),
              name: m.name,
              description: m.description,
            }))
          : [];
        setMethods(arr as any);
      })
      .catch(() => setMethods([]));
  }, []);

  // Fetch detailed method info (stages) when a method is selected
  useEffect(() => {
    if (!selectedMethod) {
      setMethodStages([]);
      return;
    }
    if (DEV_OFFLINE) {
      setMethodStages([]);
      return;
    }
    void axiosInstance
      .get(`/api/methods/${selectedMethod}`)
      .then((res) => {
        const data = res.data as any;
        const stages = Array.isArray(data.methodStages)
          ? data.methodStages.map((s: any) => ({
              name: s.stageDefinition?.name ?? "",
              description: s.stageDefinition?.description ?? "",
            }))
          : [];
        setMethodStages(stages);
      })
      .catch(() => setMethodStages([]));
  }, [selectedMethod]);

  // Fetch technicians from API
  useEffect(() => {
    if (DEV_OFFLINE) {
      setTechnicians([
        {
          id: "66929930-eae7-49b4-8fbc-e10883fdcc3d",
          name: "Technician Phat",
          email: "a@example.com",
          roleID: "Lab Technician",
        },
        {
          id: "9a88a231-b8e9-422b-8a7d-4ed944b5c928",
          name: "Admin Lam",
          email: "tech@example.com",
          roleID: "Lab Technician",
        },
      ]);
      return;
    }
    void axiosInstance
      .get("/api/user", { params: { PageNumber: 1, PageSize: 100 } })
      .then((res) => {
        const raw = res.data as { data?: any[] };
        const data: Technician[] = Array.isArray(raw.data)
          ? raw.data
              .filter((u) =>
                String(u.role).toLowerCase().includes("technician"),
              )
              .map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                roleID: u.role,
              }))
          : [];
        setTechnicians(data);
      })
      .catch(async (err) => {
        console.error(
          "Fetch users failed:",
          err?.response?.data ?? err?.message,
          "request:",
          err?.config?.url,
          err?.config?.params,
        );
        const detail = err?.response?.data?.detail ?? "";
        if (
          typeof detail === "string" &&
          detail.includes("Không tìm thấy người dùng")
        ) {
          try {
            const r2 = await axiosInstance.get("/api/user");
            const raw2 = r2.data as { data?: any[] };
            const data2: Technician[] = Array.isArray(raw2.data)
              ? raw2.data
                  .filter((u) =>
                    String(u.role).toLowerCase().includes("technician"),
                  )
                  .map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    roleID: u.role,
                  }))
              : [];
            setTechnicians(data2);
            return;
          } catch (err2) {
            console.error(
              "Retry fetch users failed:",
              (err2 as any)?.response?.data ?? (err2 as any)?.message,
            );
          }
        }
        setTechnicians([]);
      });
  }, []);

  // Update context when local state changes
  useEffect(() => {
    const methodObj = methods.find((m) => m.id === selectedMethod);
    const batchObj = batches.find((b) => b.id === selectedBatch);
    const tech = technicians.find((t) => t.id === selectedTechnician);
    setForm((prev) => ({
      ...prev,
      name,
      startDate,
      endDate,
      numberOfSample,
      objective,
      tissueCultureBatchID: selectedBatch,
      batchName: batchObj?.name ?? "",
      methodID: methodObj?.id ?? "",
      methodName: methodObj?.name ?? "",
      methodType: methodObj?.type ?? "",
      technicianID: selectedTechnician ? [selectedTechnician] : [],
      technicianNames: tech ? [tech.name] : [],
    }));
  }, [
    selectedBatch,
    selectedMethod,
    batches,
    setForm,
    methods,
    name,
    startDate,
    endDate,
    numberOfSample,
    objective,
    selectedTechnician,
    technicians,
  ]);

  // Check if a batch is available based on its status from the API
  const isBatchAvailable = (
    batchId: string,
  ): { available: boolean; reason?: string } => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) {
      return { available: false, reason: t("experimentLog.batchInUse") };
    }
    if (batch.status === "Ready") {
      return { available: true };
    }
    return {
      available: false,
      reason: t("experimentLog.batchNotReady", {
        status: batch.status ?? "unknown",
      }),
    };
  };

  const isStep1Valid = Boolean(
    name && selectedBatch && selectedMethod && selectedTechnician,
  );

  const handleNext = () => {
    if (!isStep1Valid) return;
    void navigate("/researcher/experiment-log/create/step-2");
  };

  return (
    <main className="ml-64 mt-6 min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ExperimentSteps currentStep={1} />
      <div className="px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg animate-fade-in-up">
            <div className="p-8 border-b">
              <h1 className="text-3xl font-bold text-gray-900">
                {t("experimentLog.createTitle")}
              </h1>
              <p className="text-gray-600 mt-2">
                {t("experimentLog.step1Subtitle")}
              </p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main form */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Experiment log name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("experimentLog.name")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      placeholder={t("experimentLog.namePlaceholder")}
                      required
                    />
                  </div>

                  {/* Start / End date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("experimentLog.startDate")}
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("experimentLog.endDate")}
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>

                  {/* Batch selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("experimentLog.batch")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBatch}
                        onChange={(e) => {
                          setSelectedBatch(e.target.value);
                          setBatchError(null);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        disabled={loadingBatch}
                      >
                        <option value="">{t("experimentLog.selectBatch")}</option>
                        {batches.map((batch) => {
                          const isReady = batch.status === "Ready";
                          return (
                            <option
                              key={batch.id}
                              value={batch.id}
                              disabled={!isReady}
                            >
                              {batch.name || batch.id}{" "}
                              {!isReady
                                ? `(${t("experimentLog.batchInUse")})`
                                : ""}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>

                    {loadingBatch && (
                      <div className="text-xs text-gray-400 mt-1">
                        {t("experimentLog.batchLoading")}
                      </div>
                    )}

                    {batchError && (
                      <div className="text-xs text-red-500 mt-1">
                        {batchError}
                      </div>
                    )}

                    {/* Batch availability feedback */}
                    {selectedBatch && !loadingBatch && (() => {
                      const validation = isBatchAvailable(selectedBatch);
                      return validation.available ? (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ {t("experimentLog.batchAvailable")}
                        </div>
                      ) : (
                        <div className="text-xs text-red-500 mt-1">
                          ✗ {validation.reason}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Method selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("experimentLog.method")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      >
                        <option value="">{t("experimentLog.selectMethod")}</option>
                        {methods.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("experimentLog.objective")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      placeholder={t("experimentLog.objectivePlaceholder")}
                    />
                  </div>

                  {/* Method detail */}
                  {selectedMethod && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {t("experimentLog.methodDetail")}:{" "}
                        {
                          methods.find((m) => String(m.id) === selectedMethod)
                            ?.name
                        }
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>
                          <strong>{t("experimentLog.description")}:</strong>
                          <p>
                            {
                              methods.find(
                                (m) => String(m.id) === selectedMethod,
                              )?.description
                            }
                          </p>
                        </div>
                        <div>
                          <strong>{t("experimentLog.stages")}:</strong>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            {methodStages.length > 0
                              ? methodStages.map((stage, index) => (
                                  <li key={index}>
                                    <strong>{stage.name}</strong>
                                    {stage.description &&
                                      `: ${stage.description}`}
                                  </li>
                                ))
                              : (
                                <li>{t("experimentLog.noStageInfo")}</li>
                              )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Technician selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("experimentLog.technician")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedTechnician}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    >
                      <option value="">
                        {t("experimentLog.selectTechnician")}
                      </option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name ?? tech.email ?? tech.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
              <Link
                to="/researcher/experiment-log"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t("common.cancel")}
              </Link>
              <div className="flex gap-4">
                <button
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isStep1Valid
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {t("common.continue")}{" "}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateExperimentStep1;