import { useEffect, useState } from "react";
import type { Element, ElementApiResponse } from "../../../types/Element";
import { useSnackbar } from "notistack";
import axiosInstance from "../../../api/axiosInstance";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 5;

export default function AdminElement() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Element[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newElement, setNewElement] = useState({ name: "", description: "" });
  const [addLoading, setAddLoading] = useState(false);

  const [editElement, setEditElement] = useState<Element | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `https://net-api.orchid-lab.systems/api/element?pageNumber=1&pageSize=1000`
      );
      const json = res.data as ElementApiResponse;
      setData((json.value.data || []).filter((el) => el.status === true));
      setTotal(json.value.totalCount || 0);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const reload = () => {
    setPage(1);
    void fetchData();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filteredData = data.filter((el) =>
    el.name.toLowerCase().includes(search.toLowerCase())
  );

  const pagedData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleAddElement = async () => {
    setAddLoading(true);
    try {
      const res = await axiosInstance.post(
        "https://net-api.orchid-lab.systems/api/element",
        newElement
      );
      if (res.status < 200 || res.status >= 300)
        throw new Error(t("element.elementAddFailed"));
      enqueueSnackbar(t("element.elementAdded"), {
        variant: "success",
        preventDuplicate: true,
        autoHideDuration: 2000,
      });
      setShowAdd(false);
      setNewElement({ name: "", description: "" });
      reload();
    } catch (error) {
      console.error(error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        t("element.elementAddFailed");

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditElement = async () => {
    if (!editElement) return;
    setEditLoading(true);
    try {
      const payload = {
        id: editElement.id,
        name: editElement.name,
        description: editElement.description,
      };
      const res = await axiosInstance.put(
        `https://net-api.orchid-lab.systems/api/element`,
        payload
      );
      if (res.status < 200 || res.status >= 300)
        throw new Error(t("element.elementUpdateFailed"));
      enqueueSnackbar(t("element.elementUpdated"), {
        variant: "success",
        preventDuplicate: true,
        autoHideDuration: 2000,
      });
      setEditElement(null);
      reload();
    } catch (error) {
      console.error(error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        t("element.elementUpdateFailed");

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteElement = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await axiosInstance.delete(
        "https://net-api.orchid-lab.systems/api/element",
        {
          data: { id: deleteId },
        }
      );
      if (res.status < 200 || res.status >= 300)
        throw new Error(t("element.elementDeleteFailed"));
      enqueueSnackbar(t("element.elementDeleted"), {
        variant: "success",
        preventDuplicate: true,
        autoHideDuration: 2000,
      });
      setDeleteId(null);
      reload();
    } catch (error) {
      console.error(error);
      const apiError = error as {
        response?: { data?: string; status?: number };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        t("element.elementDeleteFailed");

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-800">
          {t("element.elementManagement")}
        </h1>
        <button
          type="button"
          className="bg-green-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-950 transition cursor-pointer"
          onClick={() => setShowAdd(true)}
        >
          {t("common.addNew")}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-800"
              placeholder={t("element.searchByName")}
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
      </div>
      <div className="bg-white rounded shadow p-0 overflow-x-auto">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="bg-green-50 text-green-800 font-semibold">
              <th className="py-3 px-4 w-1/4">{t("common.name")}</th>
              <th className="px-4 w-3/8">{t("common.description")}</th>
              <th className="px-4 w-1/8">{t("common.status")}</th>
              <th className="px-4 w-1/8">{t("element.usedInStage")}</th>
              <th className="px-4 w-1/8"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="border-t animate-pulse">
                  <td colSpan={5} className="py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                  </td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  {t("common.noData")}
                </td>
              </tr>
            ) : (
              pagedData.map((m) => (
                <tr key={m.id} className="border-t hover:bg-green-50">
                  <td className="py-3 px-4">{m.name}</td>
                  <td className="px-4">{m.description}</td>
                  <td className="px-4">
                    {m.status == true
                      ? t("status.active")
                      : t("status.inactive")}
                  </td>
                  <td className="px-13">{m.currentInStage}</td>
                  <td className="px-4">
                    <button
                      type="button"
                      className="action-btn btn-edit bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition"
                      title={t("common.edit")}
                      onClick={() => setEditElement(m)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="action-btn btn-delete bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-2 py-1 rounded transition"
                      title={t("common.delete")}
                      onClick={() => setDeleteId(m.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Summary cards */}
      <div className="flex gap-4 mt-6 mb-2">
        <div className="bg-green-100 rounded p-4 w-1/4">
          <div className="font-semibold text-green-800">
            {t("element.totalElements")}
          </div>
          <div className="text-2xl font-bold text-green-800">{total}</div>
        </div>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
          <span>
            {t("common.showing")} {pagedData.length} {t("element.elementsOutOf")}{" "}
            {total} {t("element.elements")}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                ←
              </button>
            )}

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded-lg ${
                    page === pageNum
                      ? "bg-green-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {page < totalPages && (
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                →
              </button>
            )}
          </div>
        </div>
      )}
      {/* Modal thêm mới */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h2 className="font-bold mb-4 text-green-800">
              {t("element.addElement")}
            </h2>
            <input
              className="border rounded px-2 py-1 w-full mb-3 break-words"
              placeholder={t("common.name")}
              value={newElement.name}
              onChange={(e) =>
                setNewElement({ ...newElement, name: e.target.value })
              }
            />
            <input
              className="border rounded px-2 py-1 w-full mb-3 break-words"
              placeholder={t("common.description")}
              value={newElement.description}
              onChange={(e) =>
                setNewElement({ ...newElement, description: e.target.value })
              }
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setShowAdd(false)}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-green-700 text-white"
                disabled={addLoading}
                onClick={() => {
                  if (
                    !newElement.name.trim() ||
                    !newElement.description.trim()
                  ) {
                    enqueueSnackbar(t("element.pleaseEnterNameAndDescription"), {
                      variant: "error",
                      preventDuplicate: true,
                      autoHideDuration: 2000,
                    });
                    return;
                  }
                  void handleAddElement();
                }}
              >
                {addLoading ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa */}
      {editElement && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h2 className="font-bold mb-4 text-green-800">
              {t("element.editElement")}
            </h2>
            <input
              className="border rounded px-2 py-1 w-full mb-3 break-words"
              placeholder={t("common.name")}
              value={editElement.name}
              onChange={(e) =>
                setEditElement({ ...editElement, name: e.target.value })
              }
            />
            {!editElement.name.trim() && (
              <div className="text-red-500 text-xs mb-2">
                {t("element.pleaseEnterName")}
              </div>
            )}
            <input
              className="border rounded px-2 py-1 w-full mb-3 break-words"
              placeholder={t("common.description")}
              value={editElement.description}
              onChange={(e) =>
                setEditElement({ ...editElement, description: e.target.value })
              }
            />
            {!editElement?.description?.trim() && (
              <div className="text-red-500 text-xs mb-2">
                {t("element.pleaseEnterDescription")}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setEditElement(null)}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-green-700 text-white"
                disabled={editLoading}
                onClick={() => {
                  void handleEditElement();
                }}
              >
                {editLoading ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal xác nhận xóa */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h2 className="font-bold mb-4 text-red-700">
              {t("common.confirm")}
            </h2>
            <p>{t("element.deleteElementConfirm")}</p>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setDeleteId(null)}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-red-700 text-white"
                disabled={deleteLoading}
                onClick={() => {
                  void handleDeleteElement();
                }}
              >
                {deleteLoading ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}