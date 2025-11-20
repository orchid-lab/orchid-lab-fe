import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { Seedling } from "../../../types/Seedling";
import axiosInstance from "../../../api/axiosInstance";

export default function SeedlingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const [seedling, setSeedling] = useState<Seedling | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await axiosInstance.delete(
        `https://net-api.orchid-lab.systems/api/seedling/${id}`
      );
      if (res.status >= 200 && res.status < 300) {
        setShowConfirm(false);
        void navigate("/seedlings");
      } else {
        alert("Xóa không thành công!");
      }
    } catch {
      alert("Có lỗi xảy ra khi xóa!");
    } finally {
      setDeleting(false);
    }
  };

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
        onClick={() => void navigate(`/seedlings?page=${page}`)}
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
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          type="button"
          className="border cursor-pointer border-green-800 text-green-800 px-8 py-2 rounded font-semibold hover:bg-green-800 hover:text-white transition"
          onClick={() => setShowConfirm(true)}
        >
          Xóa
        </button>
      </div>
      {/* Popup xác nhận xóa */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 min-w-[320px]">
            <div className="text-lg font-semibold mb-4 text-red-700">
              Xác nhận xóa cây giống này?
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                onClick={() => {
                  void handleDelete();
                }}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Đồng ý"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
