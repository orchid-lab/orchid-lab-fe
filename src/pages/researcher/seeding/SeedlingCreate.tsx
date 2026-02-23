/**
 * Component tạo mới Seedling (Cây giống) cho Researcher
 * Cho phép nhập thông tin cơ bản, chọn tính trạng, và chọn màu hoa
 * 
 * @module SeedlingCreate
 * @category Pages/Researcher
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { findClosestColorName, colorPalette } from "../../../utils/colorHelper";
import type { Seedling } from "../../../types/Seedling";

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

export default function SeedlingCreate() {
  const navigate = useNavigate();

  // ============= FORM STATES =============
  const [formData, setFormData] = useState({
    localName: "",
    scientificName: "",
    description: "",
    parentAId: "",
  });

  // ============= DATA STATES =============
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  const [allSeedlings, setAllSeedlings] = useState<Seedling[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ============= TRAITS STATES =============
  const [selectedTraits, setSelectedTraits] = useState<{
    [characteristicId: string]: number | null;
  }>({});

  // ============= COLOR STATES =============
  const [mainColorRGB, setMainColorRGB] = useState({ r: 255, g: 0, b: 0 });
  const [subColorRGB, setSubColorRGB] = useState({ r: 0, g: 0, b: 255 });
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
      setLoading(true);
      try {
        // Fetch characteristics
        const charRes = await axiosInstance.get(
          "/api/characteristic?PageNo=1&PageSize=1000"
        );
        
        // Xử lý dữ liệu characteristics từ API
        let charData = [];
        if (charRes.data?.data && Array.isArray(charRes.data.data)) {
          charData = charRes.data.data;
        } else if (Array.isArray(charRes.data)) {
          charData = charRes.data;
        }
        
        // Map dữ liệu sang format chuẩn
        const mappedChars = charData.map((char: any) => ({
          id: char.id || '',
          code: char.code || '',
          name: codeToDisplayName(char.code),
          description: char.description || null,
          unit: char.unit || '',
        }));
        setCharacteristics(mappedChars);

        // Fetch all seedlings for parent selection
        const seedRes = await axiosInstance.get(
          "/api/seedlings?PageNumber=1&PageSize=1000"
        );
        const seedData = seedRes.data?.data || [];
        setAllSeedlings(seedData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

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
        // Xóa giá trị màu khỏi traits
        const mainColorId = getColorCharacteristicId("primary");
        if (mainColorId) {
          setSelectedTraits(prev => {
            const next = { ...prev };
            delete next[mainColorId];
            return next;
          });
        }
      } else {
        // Tự động thêm giá trị màu vào traits
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
        // Xóa giá trị màu khỏi traits
        const subColorId = getColorCharacteristicId("secondary");
        if (subColorId) {
          setSelectedTraits(prev => {
            const next = { ...prev };
            delete next[subColorId];
            return next;
          });
        }
      } else {
        // Tự động thêm giá trị màu vào traits
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
   * Xử lý thay đổi giá trị RGB component (R, G, hoặc B) của màu
   * Tự động cập nhật selectedTraits khi có thay đổi
   * 
   * @param {"main" | "sub"} type - Loại màu (chính/phụ)
   * @param {"r" | "g" | "b"} component - Component RGB cần thay đổi
   * @param {string} value - Giá trị mới (0-255)
   */
  const handleColorChange = (
    type: "main" | "sub",
    component: "r" | "g" | "b",
    value: string
  ) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value, 10) || 0));
    if (type === "main") {
      const newRGB = { ...mainColorRGB, [component]: numValue };
      setMainColorRGB(newRGB);
      // Tự động update selectedTraits khi có color
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
      // Tự động update selectedTraits khi có color
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
        // Tự động update selectedTraits
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
        // Tự động update selectedTraits
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
    
    // Tìm màu trong palette
    const selectedColor = colorPalette.find(c => c.name === colorName);
    if (!selectedColor) return;

    const { r, g, b } = selectedColor;
    
    if (type === "main") {
      setMainColorRGB({ r, g, b });
      setSelectedMainColorName(colorName);
      // Tự động update selectedTraits
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
      // Tự động update selectedTraits
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

  /**
   * Chuyển đổi mã màu Hex sang RGB
   * 
   * @param {string} hex - Mã màu hex (VD: "#FF0000" hoặc "FF0000")
   * @returns {{r: number, g: number, b: number} | null} Object RGB hoặc null nếu invalid
   * 
   * @example
   * hexToRgb("#FF0000") // returns {r: 255, g: 0, b: 0}
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
   * Chuyển đổi RGB sang mã màu Hex
   * 
   * @param {number} r - Giá trị Red (0-255)
   * @param {number} g - Giá trị Green (0-255)
   * @param {number} b - Giá trị Blue (0-255)
   * @returns {string} Mã màu hex (VD: "#FF0000")
   * 
   * @example
   * rgbToHex(255, 0, 0) // returns "#FF0000"
   */
  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("").toUpperCase();
  };

  /**
   * Chuyển đổi RGB sang định dạng RRRGGGBBB để lưu vào database
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
   * Xử lý submit form tạo seedling mới
   * - Build seedlingsTraits array từ selectedTraits
   * - Gửi POST request đến API
   * - Hiển thị success modal nếu thành công
   * - Hiển thị error message nếu thất bại
   * 
   * @param {React.FormEvent} e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build seedlingTraits array - mỗi characteristic sẽ tự động tracked trong selectedTraits
      const seedlingTraits = Object.entries(selectedTraits)
        .filter(([_, value]) => value !== null && value !== undefined)
        .map(([characteristicId, value]) => ({
          characteristicId,
          value,
        }));

      const payload = {
        localName: formData.localName.trim(),
        scientificName: formData.scientificName.trim(),
        description: formData.description.trim(),
        parentAId: formData.parentAId || null,
        seedlingsTraits: seedlingTraits,
      };

      const response = await axiosInstance.post("/api/seedlings", payload);
      // Kiểm tra success dựa vào status code
      if (response.status === 200 || response.status === 201) {
        // Success - hiển thị modal thông báo
        const message = typeof response.data === 'string' 
          ? response.data 
          : response.data?.message || "Tạo cây giống thành công!";
        setSuccessMessage(message);
        setShowSuccessModal(true);
      } else if (response.data?.id || response.data?.value?.id || response.data?.data?.id) {
        // Có ID trong response - cũng coi là thành công
        setSuccessMessage("Tạo cây giống thành công!");
        setShowSuccessModal(true);
      } else {
        setError("Tạo giống cây không thành công");
      }
    } catch (err: unknown) {
      const errorMsg = (err as any)?.response?.data?.message || "Lỗi khi tạo giống cây";
      setError(errorMsg);
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Đóng success modal và navigate về trang danh sách seedlings
   */
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/seedlings?page=1");
  };

  if (loading) {
    return (
      <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-4 md:px-8">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ml-0 sm:ml-64 mt-16 min-h-[calc(100vh-64px)] bg-gray-100 px-4 md:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* ============= HEADER ============= */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/seedlings")}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tạo Giống Cây Mới
          </h1>
          <p className="text-gray-600">
            Nhập thông tin chi tiết để tạo một giống cây mới
          </p>
        </div>

        {/* ============= ERROR MESSAGE ============= */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ============= BASIC INFORMATION ============= */}
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
            // Lọc ra các characteristics không phải màu hoa (vì màu được xử lý ở phần chọn màu)
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

                {hasMainColor && (
                  <div className="space-y-4">
                    {/* Color Name Selector */}
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
                      {/* Color Picker */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hoặc Chọn Màu Tự Do
                        </label>
                        <input
                          type="color"
                          value={rgbToHex(mainColorRGB.r, mainColorRGB.g, mainColorRGB.b)}
                          onChange={(e) => {
                            handleColorPickerChange("main", e.target.value);
                            setSelectedMainColorName(""); // Reset dropdown khi dùng color picker
                          }}
                          className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* RGB Inputs */}
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
                              setSelectedMainColorName(""); // Reset dropdown khi nhập RGB
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Color Preview */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                        style={{
                          backgroundColor: `rgb(${mainColorRGB.r}, ${mainColorRGB.g}, ${mainColorRGB.b})`,
                        }}
                      />
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

                {hasSubColor && (
                  <div className="space-y-4">
                    {/* Color Name Selector */}
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
                      {/* Color Picker */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hoặc Chọn Màu Tự Do
                        </label>
                        <input
                          type="color"
                          value={rgbToHex(subColorRGB.r, subColorRGB.g, subColorRGB.b)}
                          onChange={(e) => {
                            handleColorPickerChange("sub", e.target.value);
                            setSelectedSubColorName(""); // Reset dropdown khi dùng color picker
                          }}
                          className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* RGB Inputs */}
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
                              setSelectedSubColorName(""); // Reset dropdown khi nhập RGB
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Color Preview */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                        style={{
                          backgroundColor: `rgb(${subColorRGB.r}, ${subColorRGB.g}, ${subColorRGB.b})`,
                        }}
                      />
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
              onClick={() => navigate("/seedlings")}
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
                "Tạo Giống Cây"
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
              {/* Success Icon */}
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

              {/* Success Message */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Thành Công!
              </h3>
              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>

              {/* Action Button */}
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
