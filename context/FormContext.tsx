"use client";

import { createContext, useState, ReactNode } from "react";

type FormContextType = {
  isOpen: boolean;
  openForm: () => void;
  closeForm: () => void;
};

// create context with dummy defaults (so TS is happy)
export const FormContext = createContext<FormContextType>({
  isOpen: false,
  openForm: () => {},
  closeForm: () => {},
});

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openForm = () => setIsOpen(true);
  const closeForm = () => setIsOpen(false);

  return (
    <FormContext.Provider value={{ isOpen, openForm, closeForm }}>
      {children}
    </FormContext.Provider>
  );
};
