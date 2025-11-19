import { useState } from "react";
import { useNavigate } from "react-router-dom";

const seedlings = [
  {
    id: 1,
    name: "Phalaenopsis Mix 1",
    parent: "Phalaenopsis White",
    parent1: "Phalaenopsis Pink",
    dateOfBirth: "2024-01-15",
    createdAt: "2024-03-01 10:30",
    createdBy: "Dr. Lee",
  },
  {
    id: 2,
    name: "Phalaenopsis Mix 2",
    parent: "Phalaenopsis Purple",
    parent1: "Phalaenopsis Yellow",
    dateOfBirth: "2024-01-20",
    createdAt: "2024-03-05 14:15",
    createdBy: "Dr. Chen",
  },
  {
    id: 3,
    name: "Dendrobium Mix",
    parent: "Dendrobium Nobile",
    parent1: "Dendrobium Biggibum",
    dateOfBirth: "2024-02-10",
    createdAt: "2024-03-10 09:45",
    createdBy: "Dr. Wang",
  },
  {
    id: 4,
    name: "Cattleya Mix",
    parent: "Cattleya Warscewiczii",
    parent1: "Cattleya Labiata",
    dateOfBirth: "2024-02-28",
    createdAt: "2024-03-15 16:20",
    createdBy: "Dr. Kim",
  },
  {
    id: 5,
    name: "Vanda Mix",
    parent: "Vanda Coerulea",
    parent1: "Vanda Tricolor",
    dateOfBirth: "2024-03-05",
    createdAt: "2024-03-20 11:10",
    createdBy: "Dr. Park",
  },
  {
    id: 6,
    name: "Vanda Mix 2",
    parent: "Vanda Coerulea Var. Alba",
    parent1: "Vanda Tricolor",
    dateOfBirth: "2024-03-05",
    createdAt: "2024-03-20 11:10",
    createdBy: "Dr. Park Bom",
  },
];

const PAGE_SIZE = 5;

export default function Seedlings() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // For demonstration, filters are not functional
  const filters = [
    { label: "All Parents" },
    { label: "All Ages" },
    { label: "Created By" },
    { label: "Export CSV" },
  ];

  // Filtered and paginated data
  const filtered = seedlings.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.parent.toLowerCase().includes(search.toLowerCase()) ||
      s.parent1.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-800">
          Orchid Seedling Registry
        </h1>
        <button
          type="button"
          onClick={() => navigate("/seedlings/new")}
          className="bg-green-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-950 transition cursor-pointer"
        >
          + New Seedling
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-800"
              placeholder="Search by name, parent, description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"
                />
              </svg>
            </span>
          </div>
        </div>
        {filters.map((f) => (
          <button
            type="button"
            key={f.label}
            className="border cursor-pointer border-green-800 text-green-800 rounded-full px-4 py-2 font-medium hover:bg-green-800 hover:text-white transition"
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded shadow p-0 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-green-50 text-green-800 font-semibold">
              <th className="py-3 px-4">Name</th>
              <th className="px-4">Parent</th>
              <th className="px-4">Parent 1</th>
              <th className="px-4">Date of Birth</th>
              <th className="px-4">Created At</th>
              <th className="px-4">Created By</th>
              <th className="px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((s) => (
              <tr key={s.id} className="border-t hover:bg-green-50">
                <td className="py-3 px-4">{s.name}</td>
                <td className="px-4">{s.parent}</td>
                <td className="px-4">{s.parent1}</td>
                <td className="px-4">{s.dateOfBirth}</td>
                <td className="px-4">{s.createdAt}</td>
                <td className="px-4">{s.createdBy}</td>
                <td className="px-4 flex gap-2 mt-2">
                  <button
                    type="button"
                    className="border cursor-pointer border-green-800 text-green-800 rounded-full px-4 py-1 hover:bg-green-800 hover:text-white transition"
                    onClick={() => navigate(`/seedlings/${s.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No seedlings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Summary cards */}
      <div className="flex gap-4 mt-6 mb-2">
        <div className="bg-green-50 rounded p-4 flex-1">
          <div className="font-semibold text-green-800">Total Seedlings</div>
          <div className="text-2xl font-bold text-green-800">47</div>
          <div className="text-xs text-gray-500">Active records</div>
        </div>
        <div className="bg-green-50 rounded p-4 flex-1">
          <div className="font-semibold text-green-800">This Month</div>
          <div className="text-2xl font-bold text-green-800">12</div>
          <div className="text-xs text-gray-500">New additions</div>
        </div>
        <div className="bg-green-50 rounded p-4 flex-1">
          <div className="font-semibold text-green-800">Varieties</div>
          <div className="text-2xl font-bold text-green-800">8</div>
          <div className="text-xs text-gray-500">Species tracked</div>
        </div>
      </div>
      {/* Pagination */}
      <div className="flex justify-end mt-4 gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            type="button"
            key={i + 1}
            className={`w-8 h-8 cursor-pointer rounded ${
              page === i + 1
                ? "bg-green-800 text-white"
                : "border border-green-800 text-green-800 hover:bg-green-800 hover:text-white"
            } transition`}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
