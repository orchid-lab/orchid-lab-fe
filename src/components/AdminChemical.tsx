import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import axiosInstance from "../api/axiosInstance";
import { FaEdit, FaTrash } from "react-icons/fa";

interface Chemical {
  id: string;
  name: string;
  category: string;
  description: string;
  concentrationUnit: string;
  status?: boolean;
}


const PAGE_SIZE = 5;

interface ChemicalListProps {
  t: (key: string) => string;
}

export default function ChemicalList({ t }: ChemicalListProps) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Chemical[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newChemical, setNewChemical] = useState({
    name: "",
    category: "",
    description: "",
    unit: "",
  });
  const [addLoading, setAddLoading] = useState(false);

  const [editChemical, setEditChemical] = useState<Chemical | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/chemical", {
        params: {
          PageNo: 1,
          PageSize: 1000,
          // CategoryName: "" // optional filter
        },
      });
      const json = res.data;
      // API response structure: { totalCount, pageCount, pageSize, pageNumber, data: [...] }
      setData(json.data || []);
      setTotal(json.totalCount || 0);
    } catch (error: any) {
      console.error("Error fetching chemicals:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setData([]);
      setTotal(0);
      
      const errorMsg = error.response?.data?.message || 
                       error.response?.statusText || 
                       error.message || 
                       t("chemical.fetchFailed") || 
                       "Failed to fetch chemicals";
      
      enqueueSnackbar(`Error: ${errorMsg}`, {
        variant: "error",
        autoHideDuration: 5000,
      });
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

  const handleAddChemical = async () => {
    setAddLoading(true);
    try {
      const res = await axiosInstance.post("/api/chemical", newChemical);
      if (res.status < 200 || res.status >= 300)
        throw new Error(t("chemical.addFailed") || "Failed to add chemical");
      enqueueSnackbar(t("chemical.added") || "Chemical added successfully", {
        variant: "success",
        preventDuplicate: true,
        autoHideDuration: 2000,
      });
      setShowAdd(false);
      setNewChemical({ name: "", category: "", description: "", unit: "" });
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
        t("chemical.addFailed") ??
        "Failed to add chemical";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditChemical = async () => {
    if (!editChemical) return;
    setEditLoading(true);
    try {
      const res = await axiosInstance.put(`/api/chemical/${editChemical.id}`, {
        name: editChemical.name,
        category: editChemical.category,
        description: editChemical.description,
        unit: editChemical.concentrationUnit,
      });
      if (res.status < 200 || res.status >= 300)
        throw new Error(t("chemical.updateFailed") || "Failed to update chemical");
      enqueueSnackbar(t("chemical.updated") || "Chemical updated successfully", {
        variant: "success",
        preventDuplicate: true,
        autoHideDuration: 2000,
      });
      setEditChemical(null);
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
        t("chemical.updateFailed") ??
        "Failed to update chemical";

      enqueueSnackbar(backendMessage, {
        variant: "error",
        autoHideDuration: 5000,
        preventDuplicate: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteChemical = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await axiosInstance.delete(`/api/chemical/${deleteId}`);
      if (res.status < 200 || res.status >= 300)
        throw new Error(t("chemical.deleteFailed") || "Failed to delete chemical");
      enqueueSnackbar(t("chemical.deleted") || "Chemical deleted successfully", {
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
        t("chemical.deleteFailed") ??
        "Failed to delete chemical";

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-green-800">
          {t("chemical.management") || "Chemical Management"}
        </h2>
        <button
          type="button"
          className="bg-green-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-950 transition cursor-pointer"
          onClick={() => setShowAdd(true)}
        >
          {t("common.addNew") || "Add New"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-800"
              placeholder={t("chemical.searchByName") || "Search by name..."}
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
              <th className="py-3 px-4 w-1/5">{t("common.name") || "Name"}</th>
              <th className="px-4 w-1/6">{t("common.category") || "Category"}</th>
              <th className="px-4 w-1/4">{t("common.description") || "Description"}</th>
              <th className="px-4 w-1/6">{t("chemical.unit") || "Unit"}</th>
              <th className="px-4 w-1/6"></th>
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
                  {t("common.noData") || "No data available"}
                </td>
              </tr>
            ) : (
              pagedData.map((m) => (
                <tr key={m.id} className="border-t hover:bg-green-50">
                  <td className="py-3 px-4">{m.name}</td>
                  <td className="px-4">{m.category}</td>
                  <td className="px-4">{m.description}</td>
                  <td className="px-4">{m.concentrationUnit}</td>
                  <td className="px-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="action-btn btn-edit bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition"
                        title={t("common.edit") || "Edit"}
                        onClick={() => setEditChemical(m)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="action-btn btn-delete bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-2 py-1 rounded transition"
                        title={t("common.delete") || "Delete"}
                        onClick={() => setDeleteId(m.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 mt-6 mb-2">
        <div className="bg-green-100 rounded p-4 w-1/4">
          <div className="font-semibold text-green-800">
            {t("chemical.total") || "Total Chemicals"}
          </div>
          <div className="text-2xl font-bold text-green-800">{total}</div>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
          <span>
            {t("common.showing") || "Showing"} {pagedData.length}{" "}
            {t("chemical.outOf") || "out of"} {total}{" "}
            {t("chemical.chemicals") || "chemicals"}
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
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h2 className="font-bold mb-4 text-green-800">
              {t("chemical.add") || "Add Chemical"}
            </h2>
            <input
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder={t("common.name") || "Name"}
              value={newChemical.name}
              onChange={(e) =>
                setNewChemical({ ...newChemical, name: e.target.value })
              }
            />
            <input
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder={t("common.category") || "Category"}
              value={newChemical.category}
              onChange={(e) =>
                setNewChemical({ ...newChemical, category: e.target.value })
              }
            />
            <input
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder={t("common.description") || "Description"}
              value={newChemical.description}
              onChange={(e) =>
                setNewChemical({ ...newChemical, description: e.target.value })
              }
            />
            <input
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder={t("chemical.unit") || "Unit"}
              value={newChemical.unit}
              onChange={(e) =>
                setNewChemical({ ...newChemical, unit: e.target.value })
              }
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setShowAdd(false)}
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-green-700 text-white"
                disabled={addLoading}
                onClick={() => {
                  if (
                    !newChemical.name.trim() ||
                    !newChemical.category.trim() ||
                    !newChemical.description.trim() ||
                    !newChemical.unit.trim()
                  ) {
                    enqueueSnackbar(
                      t("chemical.fillAllFields") || "Please fill all fields",
                      {
                        variant: "error",
                        preventDuplicate: true,
                        autoHideDuration: 2000,
                      }
                    );
                    return;
                  }
                  void handleAddChemical();
                }}
              >
                {addLoading
                  ? t("common.saving") || "Saving..."
                  : t("common.save") || "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {editChemical && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h2 className="font-bold mb-4 text-green-800">
              {t("chemical.edit") || "Edit Chemical"}
            </h2>
            <input
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder={t("common.name") || "Name"}
              value={editChemical.name}
              onChange={(e) =>
                setEditChemical({ ...editChemical, name: e.target.value })
              }
            />
            <input
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder={t("common.category") || "Category"}
              value={editChemical.category}
              onChange={(e) =>
                setEditChemical({ ...editChemical, category: e.target.value })
              }
            />
            <input
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder={t("common.description") || "Description"}
              value={editChemical.description}
              onChange={(e) =>
                setEditChemical({
                  ...editChemical,
                  description: e.target.value,
                })
              }
            />
            <input
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder={t("chemical.unit") || "Unit"}
              value={editChemical.concentrationUnit}
              onChange={(e) =>
                setEditChemical({
                  ...editChemical,
                  concentrationUnit: e.target.value,
                })
              }
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setEditChemical(null)}
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-green-700 text-white"
                disabled={editLoading}
                onClick={() => {
                  void handleEditChemical();
                }}
              >
                {editLoading
                  ? t("common.saving") || "Saving..."
                  : t("common.save") || "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h2 className="font-bold mb-4 text-red-700">
              {t("common.confirm") || "Confirm"}
            </h2>
            <p>
              {t("chemical.deleteConfirm") ||
                "Are you sure you want to delete this chemical?"}
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setDeleteId(null)}
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-red-700 text-white"
                disabled={deleteLoading}
                onClick={() => {
                  void handleDeleteChemical();
                }}
              >
                {deleteLoading
                  ? t("common.deleting") || "Deleting..."
                  : t("common.delete") || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}