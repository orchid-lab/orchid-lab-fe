/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
  
  // Sửa lại phần bóc tách dữ liệu:
  // Nếu dữ liệu có dạng { value: [...] }
  if (res.data && Array.isArray(res.data.value)) {
    return res.data.value;
  }
  
  // Phòng trường hợp axios interceptor đã bóc sẵn lớp ngoài cùng
  if (Array.isArray(res.data)) {
    return res.data;
  }
  
  return [];
};
