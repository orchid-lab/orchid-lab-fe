import React, { createContext, useContext, useState } from "react";
import type { SeedlingFormInput } from "../types/Seedling";

interface SeedlingFormContextType {
  form: SeedlingFormInput;
  setForm: React.Dispatch<React.SetStateAction<SeedlingFormInput>>;
}

const defaultForm: SeedlingFormInput = {
  localName: "",
  scientificName: "",
  motherID: "",
  fatherID: "",
  description: "",
  doB: "",
  characteristics: [],
};

const SeedlingFormContext = createContext<SeedlingFormContextType | undefined>(
  undefined
);

export function useSeedlingForm() {
  const context = useContext(SeedlingFormContext);
  if (!context) {
    throw new Error(
      "useSeedlingForm must be used within a SeedlingFormProvider"
    );
  }
  return context;
}

export function SeedlingFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [form, setForm] = useState<SeedlingFormInput>(defaultForm);

  return (
    <SeedlingFormContext.Provider value={{ form, setForm }}>
      {children}
    </SeedlingFormContext.Provider>
  );
}
