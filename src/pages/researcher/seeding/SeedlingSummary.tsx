import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useSeedlingForm } from "../../../context/SeedlingFormContext";
import type {
  Seedling,
  SeedlingApiResponse,
  SeedlingCharacteristic,
} from "../../../types/Seedling";
import { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
export default function SeedlingSummary() {
  const navigate = useNavigate();
  const { form } = useSeedlingForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchSeedlings = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          "/api/seedling?pageNumber=1&pageSize=100"
        );
        const data = res.data as SeedlingApiResponse;
        setSeedlings(data.value.data || []);
      } catch {
        setSeedlings([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchSeedlings();
  }, []);

  const father = seedlings.find((s) => String(s.id) === String(form.fatherID));
  const mother = seedlings.find((s) => String(s.id) === String(form.motherID));

  async function handleCreate() {
    setLoading(true);
    setError("");

    const payload = {
      localName: form.localName,
      scientificName: form.scientificName,
      description: form.description,
      motherID: form.motherID,
      fatherID: form.fatherID,
      doB: form.doB,
      characteristics: (form.characteristics || []).map(
        (c: SeedlingCharacteristic) => ({
          value: isNaN(Number(c.value)) ? c.value : Number(c.value),
          seedlingAttribute: {
            name: c.seedlingAttribute.name,
            description: c.seedlingAttribute.description ?? "",
          },
        })
      ),
    };
    try {
      const res = await axiosInstance.post("/api/seedling", payload);
      if (!res.data) throw new Error("Tạo cây giống thất bại");
      enqueueSnackbar("Tạo cây giống thành công!", { variant: "success" });
      void navigate("/seedlings");
    } catch (error) {
      console.error("Error creating seedling:", error);
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        "Tạo phương pháp thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
      setError(apiError.response?.data ?? "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }
  console.log("Form Data:", form);

  return (
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8">
      <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4">
        Thêm cây giống mới
      </h2>
      <div className="bg-white rounded-xl shadow p-4 sm:p-8 max-w-full sm:max-w-2xl md:max-w-4xl mx-auto">
        <h3 className="text-lg sm:text-xl font-semibold text-green-800 mb-6">
          Chi tiết cây giống
        </h3>
        <div className="mb-6">
          <div className="mb-2">
            <span className="font-semibold">Tên:</span> {form.localName}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Tên khoa học:</span>{" "}
            {form.scientificName}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Cây giống 1:</span>{" "}
            {father ? father.localName : form.fatherID}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Cây giống 2:</span>{" "}
            {mother ? mother.localName : form.motherID}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Mô tả:</span> {form.description}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Ngày sinh:</span> {form.doB}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Đặc trưng</h3>
        <div className="overflow-x-auto">
          <table className="w-full border rounded min-w-[400px]">
            <thead>
              <tr className="bg-green-50 text-green-800 font-semibold">
                <th className="py-2">Thuộc tính</th>
                <th className="py-2">Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {form.characteristics.map(
                (c: SeedlingCharacteristic, idx: number) => (
                  <tr key={idx} className="border-t text-center">
                    <td className="py-2 px-4">{c.seedlingAttribute.name}</td>
                    <td className="py-2 px-4">
                      {c.seedlingAttribute.description}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        {error && <div className="text-red-500 mt-4">{error}</div>}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            type="button"
            className="border cursor-pointer border-green-800 text-green-800 px-8 py-2 rounded font-semibold hover:bg-green-800 hover:text-white transition"
            onClick={() => void navigate("/seedlings/new/characteristics")}
          >
            Trở về
          </button>
          <button
            type="button"
            className="bg-green-800 cursor-pointer text-white px-8 py-2 rounded font-semibold hover:bg-green-900 transition"
            onClick={() => void handleCreate()}
            disabled={loading}
          >
            {loading ? "Đang tạo..." : "Tạo"}
          </button>
        </div>
      </div>
    </main>
  );
}
