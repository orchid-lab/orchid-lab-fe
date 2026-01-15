import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import axiosInstance from "../../../api/axiosInstance";
import { useTranslation } from "react-i18next";

const AdminLabRoomCreate: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const canSubmit = name.trim().length > 0 && description.trim().length > 0;

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      await axiosInstance.post("/api/labroom", { name, description });
      enqueueSnackbar(t("labRoom.createSuccess"), {
        variant: "success",
      });
      navigate("/admin/labroom");
    } catch (error) {
      console.error("Create lab room error:", error);
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
        t("labRoom.createFailed");

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold text-green-800 mb-6">
          {t("labRoom.createLabRoomTitle")}
        </h1>
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">{t("common.name")}</label>
            <input
              type="text"
              className="border rounded px-3 py-2"
              placeholder={t("labRoom.enterLabRoomName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="font-medium mb-1.5">{t("common.description")}</label>
            <textarea
              className="border rounded px-3 py-2 min-h-[100px]"
              placeholder={t("labRoom.enterDescription")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
              onClick={() => navigate(-1)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`px-4 py-2 rounded text-white ${
                !canSubmit || submitting
                  ? "bg-green-300"
                  : "bg-green-700 hover:bg-green-800"
              }`}
            >
              {submitting ? t("labRoom.creating") : t("labRoom.createNew")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AdminLabRoomCreate;