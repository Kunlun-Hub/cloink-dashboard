"use client";

import "react-loading-skeleton/dist/skeleton.css";
import React, { useContext, useEffect, useState } from "react";
import { SkeletonTheme } from "react-loading-skeleton";

type Props = {
  children: React.ReactNode;
};

const ThemeContext = React.createContext(
  {} as {
    theme: "dark";
    setTheme: () => void;
  },
);

export function ThemeProvider({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    setMounted(true);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark", setTheme: () => {} }}>
      <SkeletonTheme
        baseColor="#25282d"
        highlightColor="#33373e"
      >
        {mounted ? children : null}
      </SkeletonTheme>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
