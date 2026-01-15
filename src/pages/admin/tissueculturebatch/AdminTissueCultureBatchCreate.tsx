import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

interface LabRoom {
  id: string;
  name: string;
}

interface LabRoomResponse {
  value?: { data?: LabRoom[] };
  data?: LabRoom[];
}

const AdminTissueCultureBatchCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [labRooms, setLabRooms] = useState<LabRoom[]>([]);
  const [selectedLab, setSelectedLab] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/api/labroom?pageNumber=1&pageSize=100")
      .then((res) => {
        const raw = res.data as LabRoomResponse | LabRoom[];
        let arr: LabRoom[] = [];
        if ((raw as LabRoomResponse)?.value?.data)
          arr = (raw as LabRoomResponse).value!.data!;
        else if ((raw as LabRoomResponse)?.data)
          arr = (raw as LabRoomResponse).data!;
        else if (Array.isArray(raw)) arr = raw as LabRoom[];
        setLabRooms(arr);
      })
      .catch(() => setLabRooms([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedLab) return;
    setLoading(true);
    try {
      await axiosInstance.post("/api/tissue-culture-batch", {
        name,
        labRoom: selectedLab,
        description,
      });
      navigate("/admin/tissue-culture-batches");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">
          {t("tissueCultureBatch.createBatch")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("tissueCultureBatch.batchName")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("tissueCultureBatch.labRoom")}
            </label>
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">{t("tissueCultureBatch.selectLabRoom")}</option>
              {labRooms.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("common.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded border"
              onClick={() => navigate("/admin/tissue-culture-batches")}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-green-600 text-white"
            >
              {loading ? t("tissueCultureBatch.creating") : t("tissueCultureBatch.create")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AdminTissueCultureBatchCreate;