import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

interface DiseaseItem {
  id: number;
  name: string;
  onnxClassName: string;
}

/**
 * Fetches /api/diseases once on mount and returns a lookup map of
 * onnxClassName → Vietnamese disease name.
 * Keys are stored in both original case and lowercase for flexible matching.
 */
export function useDiseaseMap(): Record<string, string> {
  const [diseaseList, setDiseaseList] = useState<DiseaseItem[]>([]);

  useEffect(() => {
    axiosInstance
      .get<{ value: DiseaseItem[] }>("/api/diseases?pageNo=1&pageSize=1000&isActive=false")
      .then((res) => {
        setDiseaseList(res.data.value ?? []);
      })
      .catch(function () {
        // silently ignore — fallback: keys shown as-is
      });
  }, []);

  const onnxNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    diseaseList.forEach((d) => {
      const normalizedOnnx = d.onnxClassName.replace(/_/g, " ").trim();
      const lowerOnnx = d.onnxClassName.toLowerCase();
      const lowerNormalized = normalizedOnnx.toLowerCase();

      map[d.onnxClassName] = d.name;
      map[lowerOnnx] = d.name;
      map[normalizedOnnx] = d.name;
      map[lowerNormalized] = d.name;
    });
    return map;
  }, [diseaseList]);

  return onnxNameMap;
}
