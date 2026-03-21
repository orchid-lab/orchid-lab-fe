import axiosInstance from "./axiosInstance";
import type { HybridSuccessRate } from "../types/Seedling";

export interface HybridSuccessRateResponse {
  value: HybridSuccessRate[];
}

export interface GetHybridSuccessRatesParams {
  seedlingParentId?: string;
  methodId?: number;
  fromDate?: string;
  toDate?: string;
}

export const getHybridSuccessRates = async (
  params?: GetHybridSuccessRatesParams,
): Promise<HybridSuccessRate[]> => {
  const queryParams = new URLSearchParams();

  if (params?.seedlingParentId) {
    queryParams.append("seedlingParentId", params.seedlingParentId);
  }
  if (params?.methodId !== undefined) {
    queryParams.append("methodId", params.methodId.toString());
  }
  if (params?.fromDate) {
    queryParams.append("fromDate", params.fromDate);
  }
  if (params?.toDate) {
    queryParams.append("toDate", params.toDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/seedlings/hybrid-success-rates${queryString ? `?${queryString}` : ""}`;

  const res = await axiosInstance.get(url);
  const response = (res.data?.value ?? res.data) as HybridSuccessRateResponse;
  return response.value || [];
};
