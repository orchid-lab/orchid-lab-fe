import { useParams, useNavigate } from "react-router-dom";

export default function SeedlingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // In a real app, fetch data by id
  const seedling = {
    name: "Dendrobium Mix",
    parent: "Dendrobium Nobile",
    parent1: "Dendrobium Biggibum",
    description:
      "A beautiful hybrid orchid seedling with promising characteristics inherited from both parent species. Shows excellent growth potential with vibrant coloration and strong root development.",
    dateOfBirth: "January 15, 2024",
    createdAt: "January 16, 2024 - 10:30 AM",
    createdBy: "John Smith",
    status: "ACTIVE & HEALTHY",
    growth: {
      stage: "Juvenile",
      height: "8.5 cm",
      leafCount: "6 leaves",
      root: "Excellent",
      bloom: "2-3 years",
      lastWatered: "May 28, 2024",
      nextCare: "June 1, 2024",
    },
  };

  return (
    <div>
      <button
        type="button"
        className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-4 hover:bg-green-800 hover:text-white transition"
        onClick={() => navigate("/seedlings")}
      >
        &larr; Back to List
      </button>
      <h1 className="text-3xl font-bold text-green-800 mb-1">
        {seedling.name}
      </h1>
      <div className="text-gray-500 mb-4">Detailed Information</div>
      <div className="bg-white rounded shadow p-6 flex gap-8">
        <div className="flex-1">
          <div className="mb-2">
            <span className="font-semibold">Name:</span> {seedling.name}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Parent:</span> {seedling.parent}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Parent1:</span> {seedling.parent1}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Description:</span>{" "}
            {seedling.description}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Date of Birth:</span>{" "}
            {seedling.dateOfBirth}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Created At:</span>{" "}
            {seedling.createdAt}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Created By:</span>{" "}
            {seedling.createdBy}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Status:</span>{" "}
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
              {seedling.status}
            </span>
          </div>
        </div>
        <div className="w-80 bg-green-50 rounded p-4">
          <div className="font-semibold text-green-800 mb-2">
            Growth Information
          </div>
          <div className="mb-1">
            <span className="font-semibold">Current Stage:</span>{" "}
            {seedling.growth.stage}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Height:</span>{" "}
            {seedling.growth.height}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Leaf Count:</span>{" "}
            {seedling.growth.leafCount}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Root Development:</span>{" "}
            {seedling.growth.root}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Expected Bloom:</span>{" "}
            {seedling.growth.bloom}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Last Watered:</span>{" "}
            {seedling.growth.lastWatered}
          </div>
          <div className="mb-1">
            <span className="font-semibold">Next Care Date:</span>{" "}
            {seedling.growth.nextCare}
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-8">
        <button
          type="button"
          className="border cursor-pointer border-green-800 text-green-800 px-8 py-2 rounded font-semibold hover:bg-green-800 hover:text-white transition"
        >
          Edit
        </button>
        <button
          type="button"
          className="border cursor-pointer border-green-800 text-green-800 px-8 py-2 rounded font-semibold hover:bg-green-800 hover:text-white transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
