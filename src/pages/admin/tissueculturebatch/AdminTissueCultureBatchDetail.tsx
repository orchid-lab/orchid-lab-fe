import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

interface TCB {
  id: string;
  name: string;
  labName?: string;
  description?: string;
  inUse?: string;
  status?: boolean;
}

interface LabRoom {
  id: string;
  name: string;
}

const AdminTissueCultureBatchDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<TCB | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [labRooms, setLabRooms] = useState<LabRoom[]>([]);
  const [selectedLab, setSelectedLab] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance
      .get(`/api/tissue-culture-batch/${id}`)
      .then((res) => {
        const raw = res.data as { value?: TCB } | TCB;
        const tcb = (raw as any)?.value ?? raw;
        setData(tcb);
        setName((tcb as TCB).name);
        setDescription((tcb as TCB).description ?? "");
        setSelectedLab("");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    axiosInstance
      .get("/api/labroom?pageNumber=1&pageSize=100")
      .then((res) => {
        const raw = res.data as { value?: { data?: LabRoom[] } } | LabRoom[];
        const arr =
          (raw as any)?.value?.data ?? (Array.isArray(raw) ? raw : []);
        setLabRooms(arr);
      })
      .catch(() => setLabRooms([]));
  }, []);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm(t("tissueCultureBatch.deleteConfirm"))) return;
    await axiosInstance.delete("/api/tissue-culture-batch", { data: { id } });
    navigate("/admin/tissue-culture-batches");
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await axiosInstance.put("/api/tissue-culture-batch", {
        id,
        name,
        labRoomID: selectedLab || undefined,
        status: data?.status ?? true,
        description,
      });
      setEditing(false);
      const res = await axiosInstance.get(`/api/tissue-culture-batch/${id}`);
      const tcb = (res.data as any)?.value ?? res.data;
      setData(tcb);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="ml-64 mt-16 p-8">{t("common.loadingData")}</div>;
  if (!data) return <div className="ml-64 mt-16 p-8">{t("common.noData")}</div>;

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            {t("tissueCultureBatch.tissueCultureBatchDetails")}
          </h1>
          <div className="flex gap-2">
            {!editing && (
              <button
                className="px-4 py-2 rounded bg-gray-600 text-white"
                onClick={() => setEditing(true)}
              >
                {t("tissueCultureBatch.updateBatch")}
              </button>
            )}
            <button
              className="px-4 py-2 rounded bg-red-600 text-white"
              onClick={handleDelete}
            >
              {t("tissueCultureBatch.deleteBatch")}
            </button>
          </div>
        </div>

        {!editing ? (
          <div className="space-y-2">
            <p>
              <b>{t("common.name")}:</b> {data.name}
            </p>
            <p>
              <b>{t("tissueCultureBatch.labRoom")}:</b> {data.labName ?? "-"}
            </p>
            <p>
              <b>{t("common.description")}:</b> {data.description ?? "-"}
            </p>
            <p>
              <b>{t("tissueCultureBatch.usedIn")}:</b> {data.inUse ?? "-"}
            </p>
            <p>
              <b>{t("common.status")}:</b>{" "}
              {data.status
                ? t("tissueCultureBatch.operating")
                : t("tissueCultureBatch.notOperating")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("common.name")}
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("tissueCultureBatch.newLabRoom")}
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
              >
                <option value="">{t("tissueCultureBatch.keepCurrent")}</option>
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
                className="w-full border rounded px-3 py-2"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => setEditing(false)}
              >
                {t("common.cancel")}
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t("tissueCultureBatch.saving") : t("tissueCultureBatch.complete")}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminTissueCultureBatchDetail;