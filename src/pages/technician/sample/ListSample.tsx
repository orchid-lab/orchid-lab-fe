import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import type { Sample, SampleApiResponse, ExperimentLogApiResponse } from "../../../types/Sample";
import { SampleStatus } from "../../../types/Sample";

// Helper function to format date in Vietnamese format (dd/MM/yyyy)
const formatVietnameseDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Status color mapping
const STATUS_COLOR_MAP: Record<SampleStatus, string> = {
  [SampleStatus.Created]: "bg-blue-100 text-blue-800",
  [SampleStatus.InProgressed]: "bg-yellow-100 text-yellow-800",
  [SampleStatus.Completed]: "bg-green-100 text-green-800",
  [SampleStatus.ExecutedBecauseOfDisease]: "bg-red-100 text-red-800",
  [SampleStatus.ConvertedToSeedling]: "bg-purple-100 text-purple-800",
};

export default function ListSample() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const [samples, setSamples] = useState<Sample[]>([]);
  const [experimentLogMap, setExperimentLogMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // Fetch experiment logs to map IDs to names
  useEffect(() => {
    const fetchExperimentLogs = async () => {
      try {
        const params = new URLSearchParams({
          PageNo: "1",
          PageSize: "1000"
        });
        
        const response = await axiosInstance.get<ExperimentLogApiResponse>(
          `/api/experiment-logs?${params.toString()}`
        );
        
        // Create a map from ID to name
        const logMap: Record<string, string> = {};
        response.data.data.forEach(log => {
          logMap[log.id] = log.name;
        });
        
        setExperimentLogMap(logMap);
      } catch (err) {
        console.error("Error fetching experiment logs:", err);
        // Don't show error to user, just use IDs as fallback
      }
    };

    fetchExperimentLogs();
  }, []);

  useEffect(() => {
    const fetchSamples = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          pageNo: "1",
          pageSize: "1000"
        });
        
        const response = await axiosInstance.get<SampleApiResponse>(`/api/samples?${params.toString()}`);
        
        let filteredSamples = response.data.data || [];
        
        // Apply filters
        if (searchTerm.trim()) {
          filteredSamples = filteredSamples.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (statusFilter) {
          filteredSamples = filteredSamples.filter(s => s.status === statusFilter);
        }
        
        // Sort by created date (newest first)
        filteredSamples.sort((a, b) => 
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );
        
        setTotalCount(filteredSamples.length);
        
        // Paginate
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        setSamples(filteredSamples.slice(start, end));
        
      } catch (err) {
        setError(t('sample.fetchError') || "Không thể tải danh sách mẫu thí nghiệm");
        enqueueSnackbar(t('common.error'), { variant: "error" });
        console.error("Error fetching samples:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchSamples, searchTerm ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [searchTerm, statusFilter, currentPage, enqueueSnackbar, t]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const paginate = (p: number) => setCurrentPage(p);

  // Get translation for status
  const getStatusLabel = (status: SampleStatus): string => {
    const statusMap: Record<SampleStatus, string> = {
      [SampleStatus.Created]: t('sample.statusCreated'),
      [SampleStatus.InProgressed]: t('sample.statusInProgressed'),
      [SampleStatus.Completed]: t('sample.statusCompleted'),
      [SampleStatus.ExecutedBecauseOfDisease]: t('sample.statusExecutedBecauseOfDisease'),
      [SampleStatus.ConvertedToSeedling]: t('sample.statusConvertedToSeedling'),
    };
    return statusMap[status] || status;
  };

  return (
    <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('sample.sampleList')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('sample.sampleManagement')}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder={t('sample.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="min-w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">{t('sample.allStatus')}</option>
                <option value={SampleStatus.Created}>{t('sample.statusCreated')}</option>
                <option value={SampleStatus.InProgressed}>{t('sample.statusInProgressed')}</option>
                <option value={SampleStatus.Completed}>{t('sample.statusCompleted')}</option>
                <option value={SampleStatus.ExecutedBecauseOfDisease}>{t('sample.statusExecutedBecauseOfDisease')}</option>
                <option value={SampleStatus.ConvertedToSeedling}>{t('sample.statusConvertedToSeedling')}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              {t('common.clearFilters')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">{t('common.loadingData')}</div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900 w-20">
                        {t('sample.number')}
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        {t('common.name')}
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        {t('sample.experimentLog')}
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        {t('sample.currentStage')}
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        {t('sample.notes')}
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        {t('common.status')}
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">
                        {t('sample.executionDate')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          {t('common.noData')}
                        </td>
                      </tr>
                    ) : (
                      samples.map((sample, index) => {
                        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                        return (
                          <tr
                            key={sample.id}
                            className="border-b hover:bg-green-50 cursor-pointer transition"
                            onClick={() => {
                              navigate(`/technician/samples/${sample.id}`);
                            }}
                          >
                            <td className="p-4 text-gray-900 font-medium">
                              {rowNumber}
                            </td>
                            <td className="p-4 text-gray-900">
                              {sample.name}
                            </td>
                            <td className="p-4 text-gray-600 text-sm">
                              {experimentLogMap[sample.experimentLogId] || sample.experimentLogId.substring(0, 8) + '...'}
                            </td>
                            <td className="p-4 text-gray-600">
                              {sample.currentSampleStage || "-"}
                            </td>
                            <td className="p-4 text-gray-600 max-w-xs truncate">
                              {sample.notes || "-"}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR_MAP[sample.status] || "bg-gray-100 text-gray-800"}`}>
                                {getStatusLabel(sample.status)}
                              </span>
                            </td>
                            <td className="p-4 text-gray-600">
                              {formatVietnameseDate(sample.executionDate)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
                <span>
                  {t('sample.showing')} {samples.length} {t('sample.outOf')} {totalCount} {t('sample.samples')}
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      onClick={() => paginate(currentPage - 1)}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      ←
                    </button>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPage === pageNum
                            ? "bg-green-700 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {currentPage < totalPages && (
                    <button
                      type="button"
                      onClick={() => paginate(currentPage + 1)}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
