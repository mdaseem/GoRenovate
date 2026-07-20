import { useCallback, useEffect, useRef, useState } from "react";
import { ServiceCategory } from "../vendor";

interface UseCategoryScrollSpyReturn {
  activeCategoryId: string;
  setActiveCategoryId: (categoryId: string) => void;
  registerSectionRef: (categoryId: string) => (el: HTMLElement | null) => void;
}

/**
 * Keeps activeCategoryId in sync with whichever category heading is
 * currently pinned below the header, so the jump-to-category menu highlight
 * tracks scroll position, not just explicit menu clicks.
 */
export function useCategoryScrollSpy(
  categories: ServiceCategory[],
  headerHeight: number,
): UseCategoryScrollSpyReturn {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? "",
  );
  const sectionElsRef = useRef<Map<string, HTMLElement>>(new Map());

  const registerSectionRef = useCallback(
    (categoryId: string) => (el: HTMLElement | null) => {
      if (el) {
        sectionElsRef.current.set(categoryId, el);
      } else {
        sectionElsRef.current.delete(categoryId);
      }
    },
    [],
  );

  useEffect(() => {
    const categoryIds = categories.map((category) => category.id);

    let observer: IntersectionObserver | null = null;

    const setup = () => {
      observer?.disconnect();

      const sections = categoryIds
        .map((id) => sectionElsRef.current.get(id))
        .filter((el): el is HTMLElement => Boolean(el));

      if (!sections.length) return;

      const topInset = headerHeight + 1;
      const bottomInset = Math.max(window.innerHeight - headerHeight - 80, 0);

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((entry) => entry.isIntersecting);
          if (!visible.length) return;
          const topMost = visible.reduce((a, b) =>
            a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
          );
          const id = topMost.target.id.replace("category-section-", "");
          setActiveCategoryId(id);
        },
        {
          rootMargin: `-${topInset}px 0px -${bottomInset}px 0px`,
          threshold: 0,
        },
      );

      sections.forEach((section) => observer?.observe(section));
    };

    setup();
    window.addEventListener("resize", setup);
    return () => {
      window.removeEventListener("resize", setup);
      observer?.disconnect();
    };
  }, [headerHeight, categories]);

  return { activeCategoryId, setActiveCategoryId, registerSectionRef };
}
