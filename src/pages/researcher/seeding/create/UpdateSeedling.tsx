/**
 * Component cập nhật Seedling (Cây giống) cho Researcher
 * Cho phép chỉnh sửa thông tin cơ bản, tính trạng, và màu hoa
 * 
 * @module SeedlingUpdate
 * @category Pages/Researcher
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import { findClosestColorName, colorPalette } from "../../../../utils/colorHelper";
import type { Seedling } from "../../../../types/Seedling";

/**
 * Interface định nghĩa cấu trúc Characteristic (Tính trạng)
 */
interface Characteristic {
  id: string;              // UUID của characteristic
  code: string;            // Mã code (VD: PLANT_HEIGHT, LEAF_WIDTH)
  name: string;            // Tên hiển thị tiếng Việt
  description?: string | null;  // Mô tả chi tiết (optional)
  unit: string;            // Đơn vị đo (cm, mm, %, ngày, ...)
}

/**
 * Chuyển đổi characteristic code (tiếng Anh) sang tên hiển thị tiếng Việt
 * 
 * @param {string} code - Mã code của characteristic (VD: "PLANT_HEIGHT")
 * @returns {string} Tên tiếng Việt tương ứng hoặc code gốc nếu không tìm thấy
 * 
 * @example
 * codeToDisplayName("PLANT_HEIGHT") // returns "Chiều Cao Cây"
 * codeToDisplayName("UNKNOWN_CODE") // returns "UNKNOWN_CODE"
 */
const codeToDisplayName = (code: string): string => {
  const codeMap: { [key: string]: string } = {
    "PLANT_HEIGHT": "Chiều Cao Cây",
    "FLOWER_COLOR_PRIMARY": "Màu Hoa Chính",
    "FLOWER_LIFESPAN": "Tuổi Thọ Hoa",
    "SURVIVAL_RATE": "Tỷ Lệ Sống",
    "LEAF_WIDTH": "Chiều Rộng Lá",
    "LEAF_LENGTH": "Chiều Dài Lá",
    "DAYS_TO_FLOWERING": "Ngày Cho Hoa",
    "LEAF_COUNT": "Số Lá",
    "FLOWER_COUNT_PER_SPIKE": "Số Hoa Trên Cụm",
    "FLOWER_COLOR_SECONDARY": "Màu Hoa Phụ",
    "FLOWER_DIAMETER": "Đường Kính Hoa",
    "LEAF_THICKNESS": "Độ Dày Lá",
  };
  return codeMap[code] || code;
};

/**
 * Chuyển đổi giá trị hex thành RGB
 * 
 * @param {string} hex - Mã màu hex (VD: "#FF0000")
 * @returns {object | null} Object {r, g, b} hoặc null nếu invalid
 * 
 * @example
 * hexToRgb("#FF0000") // returns { r: 255, g: 0, b: 0 }
 * hexToRgb("#FFF") // returns { r: 255, g: 255, b: 255 }
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Chuyển đổi RGB thành giá trị hex
 * 
 * @param {number} r - Giá trị Red (0-255)
 * @param {number} g - Giá trị Green (0-255)
 * @param {number} b - Giá trị Blue (0-255)
 * @returns {string} Mã màu hex (VD: "#FF0000")
 * 
 * @example
 * rgbToHex(255, 0, 0) // returns "#FF0000"
 * rgbToHex(173, 216, 230) // returns "#ADD8E6"
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map((x) => Math.min(255, Math.max(0, x)).toString(16).padStart(2, "0").toUpperCase()).join("")}`;
};

/**
 * Chuyển đổi RGB thành format lưu trữ trait (RRRGGGBBB)
 * 
 * @param {number} r - Giá trị Red (0-255)
 * @param {number} g - Giá trị Green (0-255)
 * @param {number} b - Giá trị Blue (0-255)
 * @returns {number} Giá trị số theo format RRRGGGBBB
 * 
 * @example
 * rgbToTraitFormat(255, 0, 0) // returns 255000000
 * rgbToTraitFormat(173, 216, 230) // returns 173216230
 */
const rgbToTraitFormat = (r: number, g: number, b: number): number => {
  return r * 1_000_000 + g * 1_000 + b;
};

/**
 * Chuyển đổi format lưu trữ trait (RRRGGGBBB) thành RGB
 * 
 * @param {number} value - Giá trị theo format RRRGGGBBB
 * @returns {object} Object {r, g, b}
 * 
 * @example
 * traitFormatToRgb(255000000) // returns { r: 255, g: 0, b: 0 }
 * traitFormatToRgb(173216230) // returns { r: 173, g: 216, b: 230 }
 */
const traitFormatToRgb = (value: number): { r: number; g: number; b: number } => {
  const r = Math.floor(value / 1_000_000);
  const g = Math.floor((value % 1_000_000) / 1_000);
  const b = value % 1_000;
  return { r, g, b };
};

export default function UpdateSeedling() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "1";

  // ============= FORM STATES =============
  const [formData, setFormData] = useState({
    localName: "",
    scientificName: "",
    description: "",
    parentAId: "",
  });

  // ============= DATA STATES =============
  const [seedling, setSeedling] = useState<Seedling | null>(null);
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  const [allSeedlings, setAllSeedlings] = useState<Seedling[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ============= TRAITS STATES =============
  // selectedTraits: dùng để track giá trị hiện tại của traits (cả existing và new)
  const [selectedTraits, setSelectedTraits] = useState<{
    [characteristicId: string]: number | null;
  }>({});
  
  // originalTraits: lưu giá trị gốc của traits để hiển thị (indexed by NAME)
  const [originalTraits, setOriginalTraits] = useState<{
    [name: string]: number | null;
  }>({});
  
  // traitIds: lưu mapping giữa characteristicId và traitId (dùng cho update)
  const [traitIds, setTraitIds] = useState<{
    [characteristicId: string]: string | null;
  }>({});

  // ============= COLOR STATES =============
  const [mainColorRGB, setMainColorRGB] = useState({ r: 255, g: 0, b: 0 });
  const [subColorRGB, setSubColorRGB] = useState({ r: 0, g: 0, b: 255 });
  const [originalMainColorRGB, setOriginalMainColorRGB] = useState<{ r: number; g: number; b: number } | null>(null);
  const [originalSubColorRGB, setOriginalSubColorRGB] = useState<{ r: number; g: number; b: number } | null>(null);
  const [hasMainColor, setHasMainColor] = useState(false);
  const [hasSubColor, setHasSubColor] = useState(false);
  const [selectedMainColorName, setSelectedMainColorName] = useState("");
  const [selectedSubColorName, setSelectedSubColorName] = useState("");

  /**
   * Tìm ID của characteristic màu hoa dựa vào type
   * 
   * @param {"primary" | "secondary"} type - Loại màu (chính hoặc phụ)
   * @returns {string | null} ID của characteristic hoặc null nếu không tìm thấy
   */
  const getColorCharacteristicId = (type: "primary" | "secondary"): string | null => {
    if (type === "primary") {
      return characteristics.find(c => c.code === "FLOWER_COLOR_PRIMARY")?.id || null;
    } else {
      return characteristics.find(c => c.code === "FLOWER_COLOR_SECONDARY")?.id || null;
    }
  };

  // ============= FETCH DATA =============
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("ID giống cây không hợp lệ");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch characteristics first (cần để map với traits)
        const charRes = await axiosInstance.get(
          "/api/characteristic?PageNo=1&PageSize=1000"
        );
        
        let charData = [];
        if (charRes.data?.data && Array.isArray(charRes.data.data)) {
          charData = charRes.data.data;
        } else if (Array.isArray(charRes.data)) {
          charData = charRes.data;
        }
        
        const mappedChars = charData.map((char: any) => ({
          id: char.id || '',
          code: char.code || '',
          name: char.name || codeToDisplayName(char.code), // Dùng name từ API, fallback về codeToDisplayName
          description: char.description || null,
          unit: char.unit || '',
        }));
        setCharacteristics(mappedChars);

        // Fetch seedling detail
        const seedRes = await axiosInstance.get(`/api/seedlings/${id}`);
        let seedlingData: Seedling | null = null;
        
        if (seedRes.data?.value) {
          seedlingData = seedRes.data.value;
        } else if (seedRes.data?.data) {
          seedlingData = seedRes.data.data;
        } else if (seedRes.data) {
          seedlingData = seedRes.data;
        }
        
        if (seedlingData) {
          setSeedling(seedlingData);
          setFormData({
            localName: seedlingData.localName || "",
            scientificName: seedlingData.scientificName || "",
            description: seedlingData.description || "",
            parentAId: seedlingData.parentAId || "",
          });

          // Process existing traits - Map theo NAME để hiển thị giá trị cũ
          if (seedlingData.traits && Array.isArray(seedlingData.traits)) {
            const originalByName: { [name: string]: number | null } = {};
            const traitsMapById: { [characteristicId: string]: number | null } = {};
            const idsMap: { [characteristicId: string]: string | null } = {};
            
            // Lưu originalTraits theo NAME để hiển thị
            seedlingData.traits.forEach((trait: any) => {
              const traitName = trait.name;
              const traitValue = trait.value;
              
              // Lưu giá trị gốc theo NAME (để hiển thị)
              originalByName[traitName] = traitValue !== null && traitValue !== undefined ? traitValue : null;
              
              // Tìm characteristic ID tương ứng với trait name
              const matchingChar = mappedChars.find((c: Characteristic) => c.name === traitName);
              if (matchingChar) {
                traitsMapById[matchingChar.id] = traitValue !== null && traitValue !== undefined ? traitValue : null;
                // Lưu trait ID nếu có (từ API, dùng cho update)
                // NOTE: API hiện tại không trả trait.id, nên sẽ dùng originalByName để phân biệt
                idsMap[matchingChar.id] = trait.id || null;
              }
            });
            
            setOriginalTraits(originalByName); // Lưu theo NAME để hiển thị
            setSelectedTraits(traitsMapById);   // Lưu theo ID để submit
            setTraitIds(idsMap);
            
            // Populate colors từ traits ngay tại đây
            const mainColorChar = mappedChars.find((c: Characteristic) => c.code === "FLOWER_COLOR_PRIMARY");
            const subColorChar = mappedChars.find((c: Characteristic) => c.code === "FLOWER_COLOR_SECONDARY");
            
            if (mainColorChar && traitsMapById[mainColorChar.id] !== null && traitsMapById[mainColorChar.id] !== undefined) {
              const mainValue = traitsMapById[mainColorChar.id]!;
              const rgb = traitFormatToRgb(mainValue);
              setMainColorRGB(rgb);
              setOriginalMainColorRGB(rgb);
              setHasMainColor(true);
            }
            
            if (subColorChar && traitsMapById[subColorChar.id] !== null && traitsMapById[subColorChar.id] !== undefined) {
              const subValue = traitsMapById[subColorChar.id]!;
              const rgb = traitFormatToRgb(subValue);
              setSubColorRGB(rgb);
              setOriginalSubColorRGB(rgb);
              setHasSubColor(true);
            }
          }
        } else {
          setError("Không tìm thấy giống cây");
        }

        // Fetch all seedlings for parent selection
        const seedListRes = await axiosInstance.get(
          "/api/seedlings?PageNumber=1&PageSize=1000"
        );
        const seedListData = seedListRes.data?.data || [];
        setAllSeedlings(seedListData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id]);

  // ============= POPULATE COLOR FROM TRAITS =============
  // NOTE: Đã được xử lý trong fetchData useEffect, không cần useEffect riêng nữa
  // useEffect(() => {
  //   if (characteristics.length === 0 || Object.keys(selectedTraits).length === 0) return;
  //   
  //   const mainColorId = getColorCharacteristicId("primary");
  //   const subColorId = getColorCharacteristicId("secondary");
  //   
  //   // Set main color
  //   if (mainColorId && selectedTraits[mainColorId]) {
  //     const mainValue = selectedTraits[mainColorId];
  //     if (mainValue !== null) {
  //       const rgb = traitFormatToRgb(mainValue);
  //       setMainColorRGB(rgb);
  //       setOriginalMainColorRGB(rgb);
  //       setHasMainColor(true);
  //     }
  //   }
  //   
  //   // Set sub color
  //   if (subColorId && selectedTraits[subColorId]) {
  //     const subValue = selectedTraits[subColorId];
  //     if (subValue !== null) {
  //       const rgb = traitFormatToRgb(subValue);
  //       setSubColorRGB(rgb);
  //       setOriginalSubColorRGB(rgb);
  //       setHasSubColor(true);
  //     }
  //   }
  // }, [characteristics, selectedTraits]);

  // ============= FORM HANDLERS =============
  /**
   * Xử lý thay đổi giá trị trong form (localName, scientificName, description, parentAId)
   * 
   * @param {React.ChangeEvent} e - Event từ input/select/textarea
   */
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Xử lý thay đổi giá trị tính trạng (traits)
   * 
   * @param {string} characteristicId - ID của characteristic
   * @param {string} value - Giá trị mới (string số)
   */
  const handleTraitChange = (characteristicId: string, value: string) => {
    setSelectedTraits((prev) => ({
      ...prev,
      [characteristicId]: value ? parseInt(value, 10) : null,
    }));
  };

  /**
   * Xử lý bật/tắt checkbox màu hoa (chính/phụ)
   * Khi bật: thêm giá trị màu vào selectedTraits
   * Khi tắt: xóa giá trị màu khỏi selectedTraits và reset về màu mặc định
   * 
   * @param {"main" | "sub"} type - Loại màu (chính/phụ)
   * @param {boolean} enabled - Trạng thái bật/tắt
   */
  const handleColorToggle = (type: "main" | "sub", enabled: boolean) => {
    if (type === "main") {
      setHasMainColor(enabled);
      if (!enabled) {
        setMainColorRGB({ r: 255, g: 0, b: 0 });
        const mainColorId = getColorCharacteristicId("primary");
        if (mainColorId) {
          setSelectedTraits(prev => {
            const next = { ...prev };
            delete next[mainColorId];
            return next;
          });
        }
      } else {
        const mainColorId = getColorCharacteristicId("primary");
        if (mainColorId) {
          setSelectedTraits(prev => ({
            ...prev,
            [mainColorId]: rgbToTraitFormat(mainColorRGB.r, mainColorRGB.g, mainColorRGB.b),
          }));
        }
      }
    } else {
      setHasSubColor(enabled);
      if (!enabled) {
        setSubColorRGB({ r: 0, g: 0, b: 255 });
        const subColorId = getColorCharacteristicId("secondary");
        if (subColorId) {
          setSelectedTraits(prev => {
            const next = { ...prev };
            delete next[subColorId];
            return next;
          });
        }
      } else {
        const subColorId = getColorCharacteristicId("secondary");
        if (subColorId) {
          setSelectedTraits(prev => ({
            ...prev,
            [subColorId]: rgbToTraitFormat(subColorRGB.r, subColorRGB.g, subColorRGB.b),
          }));
        }
      }
    }
  };

  /**
   * Xử lý thay đổi thành phần RGB của màu (R, G, B)
   * Tự động update selectedTraits nếu color được bật
   * 
   * @param {"main" | "sub"} type - Loại màu (chính/phụ)
   * @param {"r" | "g" | "b"} component - Thành phần RGB
   * @param {string} value - Giá trị mới (0-255)
   */
  const handleColorChange = (
    type: "main" | "sub",
    component: "r" | "g" | "b",
    value: string
  ) => {
    const numValue = Math.min(255, Math.max(0, parseInt(value, 10) || 0));

    if (type === "main") {
      const newRGB = { ...mainColorRGB, [component]: numValue };
      setMainColorRGB(newRGB);
      if (hasMainColor) {
        const mainColorId = getColorCharacteristicId("primary");
        if (mainColorId) {
          setSelectedTraits(prev => ({
            ...prev,
            [mainColorId]: rgbToTraitFormat(newRGB.r, newRGB.g, newRGB.b),
          }));
        }
      }
    } else {
      const newRGB = { ...subColorRGB, [component]: numValue };
      setSubColorRGB(newRGB);
      if (hasSubColor) {
        const subColorId = getColorCharacteristicId("secondary");
        if (subColorId) {
          setSelectedTraits(prev => ({
            ...prev,
            [subColorId]: rgbToTraitFormat(newRGB.r, newRGB.g, newRGB.b),
          }));
        }
      }
    }
  };

  /**
   * Xử lý thay đổi màu từ color picker (input type="color")
   * Convert hex sang RGB và cập nhật state
   * 
   * @param {"main" | "sub"} type - Loại màu (chính/phụ)
   * @param {string} hexColor - Mã màu hex (VD: "#FF0000")
   */
  const handleColorPickerChange = (
    type: "main" | "sub",
    hexColor: string
  ) => {
    const rgb = hexToRgb(hexColor);
    if (rgb) {
      if (type === "main") {
        setMainColorRGB(rgb);
        if (hasMainColor) {
          const mainColorId = getColorCharacteristicId("primary");
          if (mainColorId) {
            setSelectedTraits(prev => ({
              ...prev,
              [mainColorId]: rgbToTraitFormat(rgb.r, rgb.g, rgb.b),
            }));
          }
        }
      } else {
        setSubColorRGB(rgb);
        if (hasSubColor) {
          const subColorId = getColorCharacteristicId("secondary");
          if (subColorId) {
            setSelectedTraits(prev => ({
              ...prev,
              [subColorId]: rgbToTraitFormat(rgb.r, rgb.g, rgb.b),
            }));
          }
        }
      }
    }
  };

  /**
   * Xử lý thay đổi màu từ dropdown chọn tên màu
   * Tìm màu trong palette và cập nhật RGB values
   * 
   * @param {"main" | "sub"} type - Loại màu (chính/phụ)
   * @param {string} colorName - Tên màu được chọn (VD: "Đỏ tươi")
   */
  const handleColorNameChange = (type: "main" | "sub", colorName: string) => {
    if (!colorName) return;
    
    const selectedColor = colorPalette.find(c => c.name === colorName);
    if (!selectedColor) return;

    const { r, g, b } = selectedColor;
    
    if (type === "main") {
      setMainColorRGB({ r, g, b });
      setSelectedMainColorName(colorName);
      if (hasMainColor) {
        const mainColorId = getColorCharacteristicId("primary");
        if (mainColorId) {
          setSelectedTraits(prev => ({
            ...prev,
            [mainColorId]: rgbToTraitFormat(r, g, b),
          }));
        }
      }
    } else {
      setSubColorRGB({ r, g, b });
      setSelectedSubColorName(colorName);
      if (hasSubColor) {
        const subColorId = getColorCharacteristicId("secondary");
        if (subColorId) {
          setSelectedTraits(prev => ({
            ...prev,
            [subColorId]: rgbToTraitFormat(r, g, b),
          }));
        }
      }
    }
  };

  // ============= VALIDATION & SUBMIT =============
  /**
   * Kiểm tra tính hợp lệ của form trước khi submit
   * 
   * @returns {boolean} true nếu form hợp lệ, false nếu có lỗi
   */
  const validateForm = (): boolean => {
    if (!formData.localName.trim()) {
      setError("Vui lòng nhập tên địa phương");
      return false;
    }
    if (!formData.scientificName.trim()) {
      setError("Vui lòng nhập tên khoa học");
      return false;
    }
    return true;
  };

  /**
   * Xử lý submit form cập nhật seedling
   * - Phân tách traits thành createSeedlingsTraits và updateSeedlingsTraits
   * - Gửi PUT request đến API
   * - Hiển thị success modal nếu thành công
   * - Hiển thị error message nếu thất bại
   * 
   * @param {React.FormEvent} e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Phân tách traits thành create và update
      const createTraits: Array<{ characteristicId: string; value: number }> = [];
      const updateTraits: Array<{ id: string; value: number }> = [];

      Object.entries(selectedTraits).forEach(([characteristicId, value]) => {
        // Skip nếu characteristicId rỗng hoặc value null/undefined
        if (!characteristicId || value === null || value === undefined) {
          return;
        }
        
        // Tìm characteristic name từ ID
        const char = characteristics.find(c => c.id === characteristicId);
        const charName = char?.name;
        
        // Kiểm tra xem trait này đã tồn tại trong originalTraits chưa
        const isExistingTrait = charName && originalTraits[charName] !== null && originalTraits[charName] !== undefined;
        const traitId = traitIds[characteristicId];
        
        if (isExistingTrait && traitId) {
          // Trait đã tồn tại VÀ có trait ID → UPDATE
          updateTraits.push({
            id: traitId,
            value,
          });
        } else if (!isExistingTrait) {
          // Trait hoàn toàn mới (không có trong originalTraits) → CREATE
          createTraits.push({
            characteristicId,
            value,
          });
        }
        // Nếu trait đã tồn tại nhưng không có traitId → skip (API issue)
      });

      const payload = {
        id,
        localName: formData.localName.trim(),
        scientificName: formData.scientificName.trim(),
        description: formData.description.trim(),
        parentAId: formData.parentAId || null,
        createSeedlingsTraits: createTraits,
        updateSeedlingsTraits: updateTraits,
      };

      const response = await axiosInstance.put("/api/seedlings", payload);
      
      if (response.status === 200 || response.status === 201) {
        const message = typeof response.data === 'string' 
          ? response.data 
          : response.data?.message || "Cập nhật giống cây thành công!";
        setSuccessMessage(message);
        setShowSuccessModal(true);
      } else if (response.data?.id || response.data?.value?.id || response.data?.data?.id) {
        setSuccessMessage("Cập nhật giống cây thành công!");
        setShowSuccessModal(true);
      } else {
        setError("Cập nhật giống cây không thành công");
      }
    } catch (err: unknown) {
      const errorMsg = (err as any)?.response?.data?.message || "Lỗi khi cập nhật giống cây";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Đóng success modal và navigate về trang danh sách seedlings
   */
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate(`/seedlings?page=${page}`);
  };

  if (loading) {
    return (
      <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-10 bg-gray-300 rounded w-32 animate-pulse" />
          <div className="bg-white rounded-lg shadow p-8 space-y-4">
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !seedling) {
    return (
      <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error}
          </div>
          <button
            onClick={() => navigate(`/seedlings?page=${page}`)}
            className="mt-6 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Quay Lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-2 sm:px-4 md:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cập Nhật Giống Cây</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ============= BASIC INFO ============= */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full mr-3 font-semibold">
                ℹ
              </span>
              Thông Tin Cơ Bản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Local Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Địa Phương *
                </label>
                {seedling && (
                  <div className="mb-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <span className="font-medium">Giá trị cũ:</span> {seedling.localName || "(Chưa có)"}
                  </div>
                )}
                <input
                  type="text"
                  name="localName"
                  value={formData.localName}
                  onChange={handleFormChange}
                  placeholder="VD: Hoa Lan Hồ Điệp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              {/* Scientific Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Khoa Học *
                </label>
                {seedling && (
                  <div className="mb-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <span className="font-medium">Giá trị cũ:</span> {seedling.scientificName || "(Chưa có)"}
                  </div>
                )}
                <input
                  type="text"
                  name="scientificName"
                  value={formData.scientificName}
                  onChange={handleFormChange}
                  placeholder="VD: Phalaenopsis amabilis"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô Tả
                </label>
                {seedling && (
                  <div className="mb-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <span className="font-medium">Giá trị cũ:</span> {seedling.description || "(Chưa có)"}
                  </div>
                )}
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Nhập mô tả về giống cây này..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* ============= PARENT SELECTION ============= */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded-full mr-3 font-semibold">
                👨
              </span>
              Chọn Cây Cha
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cây Cha A (Tùy Chọn)
              </label>
              {seedling && seedling.parentALocalName && (
                <div className="mb-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  <span className="font-medium">Giá trị cũ:</span> {seedling.parentALocalName} ({seedling.parentAScientificName || "N/A"})
                </div>
              )}
              <select
                name="parentAId"
                value={formData.parentAId}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              >
                <option value="">-- Không chọn --</option>
                {allSeedlings.map((seedling) => (
                  <option key={seedling.id} value={seedling.id}>
                    {seedling.localName} ({seedling.scientificName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ============= CHARACTERISTICS ============= */}
          {characteristics.length > 0 && (() => {
            const nonColorCharacteristics = characteristics.filter(
              (char) => char.code !== "FLOWER_COLOR_PRIMARY" && char.code !== "FLOWER_COLOR_SECONDARY"
            );

            return nonColorCharacteristics.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-500">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full mr-3 font-semibold">
                    📋
                  </span>
                  Các Tính Trạng ({nonColorCharacteristics.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {nonColorCharacteristics.map((char) => {
                    const charId = char.id || '';
                    const charName = char.name || 'Tính trạng không xác định';
                    const charUnit = char.unit || '';
                    const oldValue = originalTraits[charName];
                    const hasOldValue = oldValue !== null && oldValue !== undefined;

                    return (
                      <div key={charId} className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {charName}
                          {charUnit && (
                            <span className="text-gray-500 text-xs block font-normal mt-1">
                              Đơn vị: <strong>{charUnit}</strong>
                            </span>
                          )}
                        </label>
                        {hasOldValue ? (
                          <div className="mb-2 text-xs text-gray-500 bg-yellow-50 px-3 py-2 rounded border border-yellow-200">
                            <span className="font-medium">Giá trị cũ:</span> <strong>{oldValue}</strong> {charUnit}
                          </div>
                        ) : (
                          <div className="mb-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                            <span className="font-medium italic">Chưa có giá trị cũ</span>
                          </div>
                        )}
                        <input
                          type="number"
                          value={selectedTraits[charId] ?? ""}
                          onChange={(e) => handleTraitChange(charId, e.target.value)}
                          placeholder={`Nhập giá trị (${charUnit})...`}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null;
          })()}

          {/* ============= COLOR SELECTION ============= */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-indigo-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full mr-3 font-semibold">
                🎨
              </span>
              Chọn Màu Hoa
            </h2>

            <div className="space-y-8">
              {/* Main Color */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Màu Hoa Chính
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasMainColor}
                      onChange={(e) => handleColorToggle("main", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Có màu chính</span>
                  </label>
                </div>

                {/* Hiển thị giá trị màu cũ nếu có */}
                {originalMainColorRGB && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm flex-shrink-0"
                        style={{
                          backgroundColor: `rgb(${originalMainColorRGB.r}, ${originalMainColorRGB.g}, ${originalMainColorRGB.b})`,
                        }}
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-700">Màu cũ:</div>
                        <div className="text-gray-600 font-mono">
                          {findClosestColorName(originalMainColorRGB.r, originalMainColorRGB.g, originalMainColorRGB.b)}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          RGB({originalMainColorRGB.r}, {originalMainColorRGB.g}, {originalMainColorRGB.b})
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {hasMainColor && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn Tên Màu
                      </label>
                      <select
                        value={selectedMainColorName}
                        onChange={(e) => handleColorNameChange("main", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      >
                        <option value="">-- Chọn màu hoặc nhập RGB --</option>
                        {colorPalette.map((color) => (
                          <option key={color.name} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hoặc Chọn Màu Tự Do
                        </label>
                        <input
                          type="color"
                          value={rgbToHex(mainColorRGB.r, mainColorRGB.g, mainColorRGB.b)}
                          onChange={(e) => {
                            handleColorPickerChange("main", e.target.value);
                            setSelectedMainColorName("");
                          }}
                          className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {(["r", "g", "b"] as const).map((component) => (
                        <div key={component}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {component.toUpperCase()}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={mainColorRGB[component]}
                            onChange={(e) => {
                              handleColorChange("main", component, e.target.value);
                              setSelectedMainColorName("");
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Current Color Preview */}
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Màu mới</div>
                        <div
                          className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                          style={{
                            backgroundColor: `rgb(${mainColorRGB.r}, ${mainColorRGB.g}, ${mainColorRGB.b})`,
                          }}
                        />
                      </div>
                      {/* Original Color Preview */}
                      {originalMainColorRGB && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Màu cũ</div>
                          <div
                            className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                            style={{
                              backgroundColor: `rgb(${originalMainColorRGB.r}, ${originalMainColorRGB.g}, ${originalMainColorRGB.b})`,
                            }}
                          />
                        </div>
                      )}
                      {/* Color Info */}
                      <div className="text-sm text-gray-600">
                        <div className="font-semibold text-base mb-1">
                          {selectedMainColorName || findClosestColorName(mainColorRGB.r, mainColorRGB.g, mainColorRGB.b)}
                        </div>
                        <div className="font-mono">
                          RGB({mainColorRGB.r}, {mainColorRGB.g}, {mainColorRGB.b})
                        </div>
                        <div className="font-mono text-xs mt-1">
                          Định dạng lưu: {rgbToTraitFormat(mainColorRGB.r, mainColorRGB.g, mainColorRGB.b)}
                        </div>
                        {originalMainColorRGB && (
                          <div className="font-mono text-xs mt-2 text-gray-500">
                            Cũ: RGB({originalMainColorRGB.r}, {originalMainColorRGB.g}, {originalMainColorRGB.b})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub Color */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Màu Hoa Phụ
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSubColor}
                      onChange={(e) => handleColorToggle("sub", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Có màu phụ</span>
                  </label>
                </div>

                {/* Hiển thị giá trị màu cũ nếu có */}
                {originalSubColorRGB && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm flex-shrink-0"
                        style={{
                          backgroundColor: `rgb(${originalSubColorRGB.r}, ${originalSubColorRGB.g}, ${originalSubColorRGB.b})`,
                        }}
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-700">Màu cũ:</div>
                        <div className="text-gray-600 font-mono">
                          {findClosestColorName(originalSubColorRGB.r, originalSubColorRGB.g, originalSubColorRGB.b)}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          RGB({originalSubColorRGB.r}, {originalSubColorRGB.g}, {originalSubColorRGB.b})
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {hasSubColor && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn Tên Màu
                      </label>
                      <select
                        value={selectedSubColorName}
                        onChange={(e) => handleColorNameChange("sub", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      >
                        <option value="">-- Chọn màu hoặc nhập RGB --</option>
                        {colorPalette.map((color) => (
                          <option key={color.name} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hoặc Chọn Màu Tự Do
                        </label>
                        <input
                          type="color"
                          value={rgbToHex(subColorRGB.r, subColorRGB.g, subColorRGB.b)}
                          onChange={(e) => {
                            handleColorPickerChange("sub", e.target.value);
                            setSelectedSubColorName("");
                          }}
                          className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {(["r", "g", "b"] as const).map((component) => (
                        <div key={component}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {component.toUpperCase()}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={subColorRGB[component]}
                            onChange={(e) => {
                              handleColorChange("sub", component, e.target.value);
                              setSelectedSubColorName("");
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Current Color Preview */}
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Màu mới</div>
                        <div
                          className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                          style={{
                            backgroundColor: `rgb(${subColorRGB.r}, ${subColorRGB.g}, ${subColorRGB.b})`,
                          }}
                        />
                      </div>
                      {/* Original Color Preview */}
                      {originalSubColorRGB && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Màu cũ</div>
                          <div
                            className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                            style={{
                              backgroundColor: `rgb(${originalSubColorRGB.r}, ${originalSubColorRGB.g}, ${originalSubColorRGB.b})`,
                            }}
                          />
                        </div>
                      )}
                      {/* Color Info */}
                      <div className="text-sm text-gray-600">
                        <div className="font-semibold text-base mb-1">
                          {selectedSubColorName || findClosestColorName(subColorRGB.r, subColorRGB.g, subColorRGB.b)}
                        </div>
                        <div className="font-mono">
                          RGB({subColorRGB.r}, {subColorRGB.g}, {subColorRGB.b})
                        </div>
                        <div className="font-mono text-xs mt-1">
                          Định dạng lưu: {rgbToTraitFormat(subColorRGB.r, subColorRGB.g, subColorRGB.b)}
                        </div>
                        {originalSubColorRGB && (
                          <div className="font-mono text-xs mt-2 text-gray-500">
                            Cũ: RGB({originalSubColorRGB.r}, {originalSubColorRGB.g}, {originalSubColorRGB.b})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============= FORM ACTIONS ============= */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate(`/seedlings?page=${page}`)}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang lưu...
                </>
              ) : (
                "Cập Nhật Giống Cây"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ============= SUCCESS MODAL ============= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Thành Công!
              </h3>
              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>

              <button
                onClick={handleCloseSuccessModal}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-lg"
              >
                Quay Lại Danh Sách
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
