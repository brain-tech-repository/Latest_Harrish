"use client";

import React, { createContext, useContext, useState } from "react";
import Loading from "../components/Loading";
import { useAllDropdownListData } from "../components/contexts/allDropdownListData";

type LoadingContextProps = {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const LoadingContext = createContext<LoadingContextProps | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const { loading: dropdownLoading } = useAllDropdownListData();

  return (
    <LoadingContext.Provider value={{ loading, setLoading }} >
      {(loading || dropdownLoading) && <Loading isFullPage={false} />}
      <div className={`${(loading  || dropdownLoading) ? "hidden" : ""} h-full`}>
        {children}
      </div>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
};
