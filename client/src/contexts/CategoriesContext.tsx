"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CategoriesService } from "@/services/categories";
import type { Category } from "@/lib/types";

type CategoriesContextType = {
  categories: Category[];
  refreshCategories: () => void;
};

const CategoriesContext = createContext<CategoriesContextType>({
  categories: [],
  refreshCategories: () => {},
});

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = async () => {
    try {
      const cat = await CategoriesService.getAll();
      setCategories(cat);
    } catch (e) {
      console.error("Failed to fetch categories", e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const refreshCategories = () => fetchCategories();

  return (
    <CategoriesContext.Provider value={{ categories, refreshCategories }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => useContext(CategoriesContext);
