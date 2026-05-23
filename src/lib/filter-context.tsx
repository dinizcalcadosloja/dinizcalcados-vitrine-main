// @refresh reset
import { createContext, useContext, useState, type ReactNode } from "react";

type SetOpenArg = boolean | ((prev: boolean) => boolean);

interface FilterMenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: SetOpenArg) => void;
  activeDept: string | null;
  setActiveDept: (id: string | null) => void;
  activeCat: string | null;
  setActiveCat: (id: string | null) => void;
  activeBrand: string | null;
  setActiveBrand: (id: string | null) => void;
}

/** Retorna todos os IDs descendentes (inclusive o próprio id). */
export function getDescendantIds(
  id: string,
  cats: Array<{ id: string; parent_id: string | null }>,
): string[] {
  const result: string[] = [id];
  cats
    .filter((c) => c.parent_id === id)
    .forEach((c) => getDescendantIds(c.id, cats).forEach((d) => result.push(d)));
  return result;
}

const FilterMenuContext = createContext<FilterMenuContextValue>({
  isOpen: false,
  setIsOpen: () => {},
  activeDept: null,
  setActiveDept: () => {},
  activeCat: null,
  setActiveCat: () => {},
  activeBrand: null,
  setActiveBrand: () => {},
});

export function FilterMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  return (
    <FilterMenuContext.Provider
      value={{
        isOpen,
        setIsOpen,
        activeDept,
        setActiveDept,
        activeCat,
        setActiveCat,
        activeBrand,
        setActiveBrand,
      }}
    >
      {children}
    </FilterMenuContext.Provider>
  );
}

export function useFilterMenu() {
  return useContext(FilterMenuContext);
}
