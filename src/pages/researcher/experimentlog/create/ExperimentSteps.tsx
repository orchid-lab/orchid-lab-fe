import { Check } from "lucide-react";

const ExperimentSteps = ({ currentStep = 1 }) => {
  const steps = [
    {
      id: 1,
      name: "Thông tin lô nuôi cấy",
      description: "Chọn Lô nuôi cấy và Phương pháp lai",
    },
    { id: 2, name: "Mẫu", description: "Chọn cây bố và cây mẹ cho thí nghiệm" },
    {
      id: 3,
      name: "Review",
      description: "Kiểm tra thông tin và hoàn thành tạo Experiment Log",
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-lg mb-3">
      <div className="max-w-7xl mx-auto">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li
                key={step.id}
                className={`${
                  stepIdx !== steps.length - 1 ? "flex-1" : ""
                } flex items-center`}
              >
                <div className="flex items-center">
                  <div className="flex items-center">
                    {step.id < currentStep ? (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    ) : step.id === currentStep ? (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {step.id}
                        </span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {step.id}
                        </span>
                      </div>
                    )}
                    <div className="ml-4">
                      <div
                        className={`text-sm font-medium ${
                          step.id <= currentStep
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {step.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {step.description}
                      </div>
                    </div>
                  </div>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="flex-1 ml-4 mr-4">
                    <div
                      className={`h-0.5 ${
                        step.id < currentStep ? "bg-green-600" : "bg-gray-300"
                      }`}
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default ExperimentSteps;
