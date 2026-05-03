import React from "react";
import { useTranslation } from "react-i18next";

interface CreateTaskStepperProps {
  currentStep?: number;
}

const CreateTaskStepper: React.FC<CreateTaskStepperProps> = ({
  currentStep = 1,
}) => {
  const { t } = useTranslation();
  const steps = [
    { label: t("task.step1"), sublabel: t("task.stepBasicInfo") },
    { label: t("task.step2"), sublabel: t("task.technician") },
    { label: t("task.step3"), sublabel: t("task.stepConfirm") },
  ];
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-start">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300 shadow-sm ${
                    isCompleted
                      ? "bg-blue-600 text-white border-transparent"
                      : isActive
                        ? "bg-white border-2 border-blue-600 text-blue-700 shadow-blue-100"
                        : "bg-white border-2 border-slate-200 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isActive
                        ? "text-blue-700"
                        : isCompleted
                          ? "text-blue-600"
                          : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      isActive ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {step.sublabel}
                  </p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-5 transition-colors duration-300 ${
                    isCompleted ? "bg-blue-500" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
export default CreateTaskStepper;