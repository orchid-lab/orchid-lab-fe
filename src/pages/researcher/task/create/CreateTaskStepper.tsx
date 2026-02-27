import React from "react";

interface Step {
  label: string;
  sublabel: string;
}

interface CreateTaskStepperProps {
  currentStep?: number;
}

const steps: Step[] = [
  { label: "Bước 1", sublabel: "Thông tin cơ bản" },
  { label: "Bước 2", sublabel: "Kỹ thuật viên" },
  { label: "Bước 3", sublabel: "Xác nhận" },
];

const CreateTaskStepper: React.FC<CreateTaskStepperProps> = ({
  currentStep = 1,
}) => (
  <div className="w-full max-w-4xl">
    <div className="flex items-start">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base transition-colors ${
                  isCompleted
                    ? "bg-green-600 text-white"
                    : isActive
                      ? "bg-white border-2 border-green-600 text-green-700"
                      : "bg-gray-100 border-2 border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-semibold ${
                    isActive
                      ? "text-green-700"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isActive ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {step.sublabel}
                </p>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mt-5 transition-colors ${
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

export default CreateTaskStepper;
