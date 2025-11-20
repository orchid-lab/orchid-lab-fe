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
  create_by: string;
  create_date: string;
  update_by: string | null;
  update_date: string | null;
  delete_by: string | null;
  delete_date: string | null;
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
  value: {
    totalCount: number;
    pageCount: number;
    pageSize: number;
    pageNumber: number;
    data: Seedling[];
  };
}
