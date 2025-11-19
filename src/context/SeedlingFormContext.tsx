import React, { createContext, useContext, useState } from "react";
import type { Seedling } from "../types/Seedling";

interface SeedlingFormContextType {
  form: Seedling;
  setForm: React.Dispatch<React.SetStateAction<Seedling>>;
}

const defaultForm: Seedling = {
  name: "",
  parent: "",
  parent1: "",
  description: "",
  dateOfBirth: "",
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
  const [form, setForm] = useState<Seedling>(defaultForm);

  return (
    <SeedlingFormContext.Provider value={{ form, setForm }}>
      {children}
    </SeedlingFormContext.Provider>
  );
}
