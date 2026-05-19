import { createContext, useContext, useState, type ReactNode } from "react";

type SetOpenArg = boolean | ((prev: boolean) => boolean);

interface FilterMenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: SetOpenArg) => void;
  activeDept: string | null;
  setActiveDept: (id: string | null) => void;
  activeCat: string | null;
  setActiveCat: (id: string | null) => void;
}

const FilterMenuContext = createContext<FilterMenuContextValue>({
  isOpen: false,
  setIsOpen: () => {},
  activeDept: null,
  setActiveDept: () => {},
  activeCat: null,
  setActiveCat: () => {},
});

export function FilterMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  return (
    <FilterMenuContext.Provider
      value={{ isOpen, setIsOpen, activeDept, setActiveDept, activeCat, setActiveCat }}
    >
      {children}
    </FilterMenuContext.Provider>
  );
}

export function useFilterMenu() {
  return useContext(FilterMenuContext);
}
