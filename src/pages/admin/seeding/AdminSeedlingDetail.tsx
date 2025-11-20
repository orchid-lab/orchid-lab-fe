import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { Seedling } from "../../../types/Seedling";
import axiosInstance from "../../../api/axiosInstance";

export default function AdminSeedlingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const [seedling, setSeedling] = useState<Seedling | null>(null);
  const [loading, setLoading] = useState(true);
  const [allSeedlings, setAllSeedlings] = useState<Seedling[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `https://net-api.orchid-lab.systems/api/seedling/${id}`
        );
        const data = res.data as { value: Seedling };
        setSeedling(data.value || null);
      } catch {
        setSeedling(null);
      } finally {
        setLoading(false);
      }
    };
    const fetchAllSeedlings = async () => {
      try {
        const res = await axiosInstance.get(
          "https://net-api.orchid-lab.systems/api/seedling?pageNumber=1&pageSize=1000"
        );
        const data = res.data as { value: { data: Seedling[] } };
        setAllSeedlings(data.value.data || []);
      } catch {
        setAllSeedlings([]);
      }
    };
    void fetchAllSeedlings();
    void fetchDetail();
  }, [id]);

  const idToName = Object.fromEntries(
    allSeedlings.map((s) => [s.id, s.localName])
  );

  if (loading) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </main>
    );
  }

  if (!seedling) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">Không tìm thấy cây giống!</div>
      </main>
    );
  }

  return (
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8">
      <button
        type="button"
        className="border cursor-pointer border-green-800 text-green-800 rounded px-4 py-1 mb-4 hover:bg-green-800 hover:text-white transition"
        onClick={() => void navigate(`/admin/seedling?page=${page}`)}
      >
        &larr; Trở về
      </button>
      <h1 className="text-3xl sm:text-3xl font-bold text-green-800 mb-1">
        {seedling.localName || seedling.scientificName} -{" "}
        {seedling.scientificName || seedling.localName}
      </h1>
      <div className="text-gray-500 mb-4">Thông tin chi tiết</div>
      <div className="bg-white rounded shadow p-4 sm:p-6 flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="flex-1">
          <div className="mb-2">
            <span className="font-semibold">Tên:</span> {seedling.localName}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Tên khoa học:</span>{" "}
            {seedling.scientificName}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Cây giống 1:</span>{" "}
            {idToName[seedling.parent1] || seedling.parent1}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Cây giống 2:</span>{" "}
            {idToName[seedling.parent2] || seedling.parent2}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Miêu tả:</span>{" "}
            {seedling.description}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Ngày sinh:</span> {seedling.doB}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Ngày tạo:</span>{" "}
            {seedling.create_date
              ? new Date(seedling.create_date).toLocaleString()
              : ""}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Tạo bởi:</span> {seedling.create_by}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Đặc điểm:</span>
            {seedling.characteristics && seedling.characteristics.length > 0 ? (
              <ul className="list-disc ml-4">
                {seedling.characteristics.map((c, idx) => (
                  // eslint-disable-next-line react-x/no-array-index-key
                  <li key={idx}>
                    <b>{c.seedlingAttribute.name}:</b>{" "}
                    {c.seedlingAttribute.description}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400"> Không có</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
