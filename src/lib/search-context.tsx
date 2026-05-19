import { createContext, useContext, useState, type ReactNode } from "react";

interface SearchMenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SearchMenuContext = createContext<SearchMenuContextValue>({
  isOpen: false,
  setIsOpen: () => {},
});

export function SearchMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SearchMenuContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SearchMenuContext.Provider>
  );
}

export function useSearchMenu() {
  return useContext(SearchMenuContext);
}
