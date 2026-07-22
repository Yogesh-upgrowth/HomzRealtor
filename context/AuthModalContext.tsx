"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AuthModalMode = "login" | "signup" | null;

type AuthModalContextType = {
  mode: AuthModalMode;
  openLogin: () => void;
  openSignup: () => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextType>({
  mode: null,
  openLogin: () => {},
  openSignup: () => {},
  close: () => {},
});

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AuthModalMode>(null);

  return (
    <AuthModalContext.Provider
      value={{
        mode,
        openLogin: () => setMode("login"),
        openSignup: () => setMode("signup"),
        close: () => setMode(null),
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => useContext(AuthModalContext);
