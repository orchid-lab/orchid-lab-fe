import { useEffect, useState } from "react";
import type { Element, ElementApiResponse } from "../../../types/Element";
import { useSnackbar } from "notistack";
import axiosInstance from "../../../api/axiosInstance";
import { FaEdit, FaTrash } from "react-icons/fa";

const PAGE_SIZE = 5;

export default function AdminElement() {
  const [search, setSearch] = useState("");
  //   const [filterType, setFilterType] = useState("");
  const [data, setData] = useState<Element[]>([]);
  const [total, setTotal] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Phân trang trên dữ liệu đã lọc
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
        throw new Error("Thêm thất bại");
      enqueueSnackbar("Thêm nguyên vật liệu thành công!", {
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
        response?: {
          data?: string;
          status?: number;
        };
        message?: string;
      };
      const backendMessage =
        apiError.response?.data ??
        apiError.message ??
        "Thêm nguyên vật liệu thất bại!";

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
        throw new Error("Sửa thất bại");
      enqueueSnackbar("Sửa nguyên vật liệu thành công!", {
        variant: "success",
        preventDuplicate: true,
        autoHideDuration: 2000,
      });
      setEditElement(null);
      reload();
    } catch (error) {
      console.error(error);
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
        "Sửa nguyên vật liệu thất bại!";

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
        throw new Error("Xóa thất bại");
      enqueueSnackbar("Xóa nguyên vật liệu thành công!", {
        variant: "success",
        preventDuplicate: true,
        autoHideDuration: 2000,
      });
      setDeleteId(null);
      reload();
    } catch (error) {
      console.error(error);
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
        "Xóa nguyên vật liệu thất bại!";

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
          Quản lý nguyên vật liệu
        </h1>
        <button
          type="button"
          className="bg-green-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-950 transition cursor-pointer"
          onClick={() => setShowAdd(true)}
        >
          Thêm mới
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-green-800"
              placeholder="Tìm kiếm theo tên..."
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
              <th className="py-3 px-4 w-1/4">Tên</th>
              <th className="px-4 w-3/8">Mô tả</th>
              <th className="px-4 w-1/8">Trạng thái</th>
              <th className="px-4 w-1/8">Dùng trong (Giai đoạn)</th>
              <th className="px-4 w-1/8"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                // eslint-disable-next-line react-x/no-array-index-key
                <tr key={`skeleton-${idx}`} className="border-t animate-pulse">
                  <td colSpan={5} className="py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                  </td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              pagedData.map((m) => (
                <tr key={m.id} className="border-t hover:bg-green-50">
                  <td className="py-3 px-4">{m.name}</td>
                  <td className="px-4">{m.description}</td>
                  <td className="px-4">
                    {m.status == true ? "Active" : "Inactive"}
                  </td>
                  <td className="px-13">{m.currentInStage}</td>
                  <td className="px-4">
                    <button
                      type="button"
                      className="action-btn btn-edit bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition"
                      title="Chỉnh sửa"
                      onClick={() => setEditElement(m)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="action-btn btn-delete bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-2 py-1 rounded transition"
                      title="Xóa"
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
            Tổng số nguyên vật liệu
          </div>
          <div className="text-2xl font-bold text-green-800">{total}</div>
        </div>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
          <span>
            Hiển thị {pagedData.length} nguyên vật liệu trên tổng số {total}{" "}
            nguyên vật liệu{" "}
          </span>
          <div className="flex gap-2">
            {/* Previous button */}
            {page > 1 && (
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                ←
              </button>
            )}

            {/* Page numbers (tối đa 5 số, giống task) */}
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

            {/* Next button */}
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
              Thêm nguyên vật liệu
            </h2>
            <input
              className="border rounded px-2 py-1 w-full mb-3 break-words"
              placeholder="Tên"
              value={newElement.name}
              onChange={(e) =>
                setNewElement({ ...newElement, name: e.target.value })
              }
            />
            <input
              className="border rounded px-2 py-1 w-full mb-3 break-words"
              placeholder="Mô tả"
              value={newElement.description}
              onChange={(e) =>
                setNewElement({ ...newElement, description: e.target.value })
              }
            />
            {/* Hiển thị lỗi chỉ khi bấm Lưu mà thiếu thông tin */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setShowAdd(false)}
              >
                Hủy
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
                    enqueueSnackbar("Vui lòng nhập đầy đủ tên và mô tả!", {
                      variant: "error",
                      preventDuplicate: true,
                      autoHideDuration: 2000,
                    });
                    return;
                  }
                  void handleAddElement();
                }}
              >
                {addLoading ? "Đang lưu..." : "Lưu"}
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
              Sửa nguyên vật liệu
            </h2>
            <input
              className="border rounded px-2 py-1 w-full mb-3 break-words"
              placeholder="Tên"
              value={editElement.name}
              onChange={(e) =>
                setEditElement({ ...editElement, name: e.target.value })
              }
            />
            {!editElement.name.trim() && (
              <div className="text-red-500 text-xs mb-2">
                Vui lòng nhập tên!
              </div>
            )}
            <input
              className="border rounded px-2 py-1 w-full mb-3 break-words"
              placeholder="Mô tả"
              value={editElement.description}
              onChange={(e) =>
                setEditElement({ ...editElement, description: e.target.value })
              }
            />
            {!editElement?.description?.trim() && (
              <div className="text-red-500 text-xs mb-2">
                Vui lòng nhập mô tả!
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setEditElement(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-green-700 text-white"
                disabled={editLoading}
                onClick={() => {
                  void handleEditElement();
                }}
              >
                {editLoading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal xác nhận xóa */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h2 className="font-bold mb-4 text-red-700">Xác nhận xóa</h2>
            <p>Bạn có chắc muốn xóa nguyên vật liệu này?</p>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setDeleteId(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-red-700 text-white"
                disabled={deleteLoading}
                onClick={() => {
                  void handleDeleteElement();
                }}
              >
                {deleteLoading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
