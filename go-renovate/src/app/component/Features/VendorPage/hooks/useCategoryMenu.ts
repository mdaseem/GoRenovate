import { useCallback, useEffect, useRef, useState } from "react";

interface UseCategoryMenuParams {
  onSelectCategory: (categoryId: string) => void;
}

interface UseCategoryMenuReturn {
  isOpen: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  toggle: () => void;
  close: (focusTrigger?: boolean) => void;
  selectCategory: (categoryId: string) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  handleBlur: (event: React.FocusEvent<HTMLDivElement>) => void;
}

/**
 * Encapsulates the jump-to-category menu's open state plus the WAI-ARIA menu
 * button pattern behaviors: outside click / Escape to close, focus-into-menu
 * on open, and arrow/home/end key navigation between menu items.
 */
export function useCategoryMenu({
  onSelectCategory,
}: UseCategoryMenuParams): UseCategoryMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const close = useCallback((focusTrigger?: boolean) => {
    setIsOpen(false);
    if (focusTrigger) buttonRef.current?.focus();
  }, []);

  const selectCategory = useCallback(
    (categoryId: string) => {
      onSelectCategory(categoryId);
      close(true);
    },
    [onSelectCategory, close],
  );

  // Close the jump-menu on outside click / Escape, matching the WAI-ARIA menu button pattern.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  // Move focus into the menu when it opens, for keyboard users.
  useEffect(() => {
    if (isOpen) {
      panelRef.current
        ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
        ?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const items = Array.from(
        panelRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"]',
        ) ?? [],
      );
      if (!items.length) return;
      const currentIndex = items.indexOf(
        document.activeElement as HTMLButtonElement,
      );

      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1]?.focus();
      }
    },
    [],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setIsOpen(false);
      }
    },
    [],
  );

  return {
    isOpen,
    buttonRef,
    panelRef,
    toggle,
    close,
    selectCategory,
    handleKeyDown,
    handleBlur,
  };
}
