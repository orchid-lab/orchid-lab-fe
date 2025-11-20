import React from "react";

interface Step {
  label: string;
}

interface CreateTaskStepperProps {
  currentStep?: number;
}

const steps: Step[] = [
  { label: "Thông tin cơ bản" },
  { label: "Technician" },
  { label: "Review" },
];

const CreateTaskStepper: React.FC<CreateTaskStepperProps> = ({
  currentStep = 1,
}) => (
  <div className="flex items-center my-6">
    {steps.map((step, idx) => (
      <React.Fragment key={step.label}>
        <div className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${
              currentStep === idx + 1
                ? "bg-green-700 text-white"
                : "bg-gray-300 text-green-700"
            }`}
          >
            {idx + 1}
          </div>
          <div
            className={`mt-1 text-sm ${
              currentStep === idx + 1
                ? "text-green-700 font-bold"
                : "text-gray-500"
            }`}
          >
            {step.label}
          </div>
        </div>
        {idx < steps.length - 1 && (
          <div className="w-12 h-0.5 bg-gray-300 mx-2" />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default CreateTaskStepper;
