export interface SeedlingCharacteristic {
  value: number;
  seedlingAttribute: {
    name: string;
    description: string;
  };
}

export interface Seedling {
  id: string;
  localName: string;
  scientificName: string;
  description: string;
  parent1: string;
  parent2: string;
  doB: string;
  characteristics: SeedlingCharacteristic[];
  createdBy: string;
  createdDate: string;
  updatedBy: string | null;
  updatedDate: string | null;
  deletedBy: string | null;
  deletedDate: string | null;
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
