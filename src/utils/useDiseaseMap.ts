import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

interface DiseaseItem {
  id: number;
  name: string;
  code: string;
  onnxClassName: string;
  isActive: boolean;
}

/**
 * Fetches /api/diseases once on mount and returns a lookup map of
 * onnxClassName → Vietnamese disease name.
 * Keys are stored in both original case and lowercase for flexible matching.
 */
export function useDiseaseMap(): {
  onnxNameMap: Record<string, string>;
  codeNameMap: Record<string, string>;
  isMapLoaded: boolean;
} {
  const [diseaseList, setDiseaseList] = useState<DiseaseItem[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    axiosInstance
      .get<{ value: DiseaseItem[] }>("/api/diseases?pageNo=1&pageSize=1000")
      .then((res) => {
        setDiseaseList(res.data.value ?? []);
        setIsMapLoaded(true);
      })
      .catch(function () {
        setIsMapLoaded(true); // treat failure as loaded so UI doesn't stay blank
      });
  }, []);

  const onnxNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    diseaseList.forEach((d) => {
      map[d.onnxClassName] = d.name;
      map[d.onnxClassName.toLowerCase()] = d.name;
    });
    return map;
  }, [diseaseList]);

  const codeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    diseaseList.forEach((d) => {
      map[d.code] = d.name;
    });
    return map;
  }, [diseaseList]);

  return { onnxNameMap, codeNameMap, isMapLoaded };
}
