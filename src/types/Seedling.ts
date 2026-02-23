// Chuẩn hóa định nghĩa màu hoa
export interface SeedlingColor {
  r: number;
  g: number;
  b: number;
  value?: number;
  type: "main" | "sub";
}

export interface SeedlingCharacteristic {
  value: number;
  seedlingAttribute: {
    name: string;
    description: string;
  };
}

export interface SeedlingTrait {
  name: string;
  value: number;
  unit: string;
}

export interface Seedling {
  id: string;
  localName: string;
  scientificName: string;
  description: string;
  parent1?: string;
  parent2?: string;
  parentAId?: string | null;
  parentALocalName?: string | null;
  parentAScientificName?: string | null;
  doB?: string;
  characteristics?: SeedlingCharacteristic[];
  traits?: SeedlingTrait[];
  colors?: SeedlingColor[]; // Danh sách màu hoa chính/phụ
  createdBy: string;
  createdDate: string;
  updatedBy?: string | null;
  updatedDate?: string | null;
  deletedBy?: string | null;
  deletedDate?: string | null;
}

export interface SeedlingFormInput {
  localName: string;
  scientificName: string;
  description: string;
  motherID: string;
  fatherID: string;
  doB: string;
  characteristics: SeedlingCharacteristic[];
}

export interface SeedlingApiResponse {
    totalCount: number;
    pageCount: number;
    pageSize: number;
    pageNumber: number;
    data: Seedling[];
}
