export interface SeedlingCharacteristic {
  attribute: string;
  value: string;
  unit: string;
}

export interface Seedling {
  id?: number;
  name: string;
  parent: string;
  parent1: string;
  description: string;
  dateOfBirth: string;
  createdAt?: string;
  createdBy?: string;
  characteristics: SeedlingCharacteristic[];
}
