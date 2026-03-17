import axiosInstance from "./axiosInstance";
import type {
  DiseaseIncidentListResponse,
  ReviewIncidentRequest,
} from "../types/DiseaseIncident";
import type { DiseaseIncidentStatus } from "../types/DiseaseIncident";

export const getDiseaseIncidents = async (params: {
  experimentLogId: string;
  pageNo?: number;
  pageSize?: number;
  status?: DiseaseIncidentStatus;
}): Promise<DiseaseIncidentListResponse> => {
  const { experimentLogId, pageNo = 1, pageSize = 50, status } = params;
  let url = `/api/disease-incidents?pageNo=${pageNo}&pageSize=${pageSize}&experimentLogId=${experimentLogId}`;
  if (status !== undefined) {
    url += `&status=${status}`;
  }
  const res = await axiosInstance.get(url);
  return (res.data?.value ?? res.data) as DiseaseIncidentListResponse;
};

export const reviewDiseaseIncident = async (
  id: string,
  body: ReviewIncidentRequest,
): Promise<string> => {
  const res = await axiosInstance.put(
    `/api/disease-incidents/${id}/review`,
    body,
  );
  return (res.data?.value ?? res.data) as string;
};
