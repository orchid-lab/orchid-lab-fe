import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import axiosInstance from "../../../api/axiosInstance";

interface LabRoomDetailModel {
  id: string;
  name: string;
  description: string;
  status: boolean;
}

interface ApiSingleResponse<T> {
  value?: T;
}

function isApiSingleResponse<T>(obj: unknown): obj is ApiSingleResponse<T> {
  return typeof obj === "object" && obj !== null && "value" in obj;
}

const AdminLabRoomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<LabRoomDetailModel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetail = async (): Promise<void> => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/labroom/${id}`);
        if (isApiSingleResponse<LabRoomDetailModel>(res.data)) {
          setData(res.data.value ?? null);
        }
      } catch (err) {
        console.error("Fetch phòng thực nghiệm detail error:", err);
        enqueueSnackbar("Không thể tải chi tiết", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [id, enqueueSnackbar]);

  const handleUpdate = async (): Promise<void> => {
    if (!data) return;
    try {
      setSaving(true);
      await axiosInstance.put("/api/labroom", {
        id: data.id,
        name: data.name,
        description: data.description,
      });
      enqueueSnackbar("Cập nhật thành công", { variant: "success" });
    } catch (error) {
      console.error("Update phòng thực nghiệm error:", error);
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? "Cập nhật thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!data) return;
    try {
      setDeleting(true);
      await axiosInstance.delete("/api/labroom", {
        data: { id: data.id },
      });
      enqueueSnackbar("Xóa thành công", { variant: "success" });
      navigate("/admin/labroom");
    } catch (error) {
      console.error("Delete phòng thực nghiệm error:", error);
      const apiError = error as {
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ?? apiError.message ?? "Xóa thất bại!";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !data) {
    return (
      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Đang tải dữ liệu...</div>
      </main>
    );
  }

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white rounded shadow p-8 space-y-5">
        <h1 className="text-2xl font-bold text-green-800">
          Chi tiết phòng thực nghiệm
        </h1>
        <div className="flex flex-col">
          <label className="font-medium mb-1.5">Tên</label>
          <input
            className="border rounded px-3 py-2"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium mb-1.5">Mô tả</label>
          <textarea
            className="border rounded px-3 py-2 min-h-[100px]"
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium mb-1.5">Trạng thái</label>
          <span
            className={`inline-flex w-fit items-center px-3 py-1 rounded-full text-sm ${
              data.status
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {data.status ? "Hoạt động" : "Không hoạt động"}
          </span>
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
          >
            Quay lại
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleUpdate()}
            className={`px-4 py-2 rounded text-white ${
              saving ? "bg-green-300" : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {saving ? "Đang lưu..." : "Cập nhật"}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className={`px-4 py-2 rounded text-white ${
              deleting ? "bg-red-300" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {deleting ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default AdminLabRoomDetail;
