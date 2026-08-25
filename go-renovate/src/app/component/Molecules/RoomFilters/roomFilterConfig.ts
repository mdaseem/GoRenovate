import { FilterDefinition, FilterOption } from "../Filters/filterConfig";
import { Room, humanizeStyleTag } from "../../CategoryPage/category";

export type ActiveFilters = Record<string, string[] | string | boolean>;

export const MULTI_VALUE_DELIMITER = "|";

function getStyleOptions(rooms: Room[]): FilterOption[] {
  const options = new Map<string, FilterOption>();
  rooms.forEach((room) => {
    room.styleTags.forEach((tag) => {
      if (!options.has(tag)) {
        options.set(tag, { value: tag, label: humanizeStyleTag(tag) });
      }
    });
  });
  return Array.from(options.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

// Add a new filter here to make it available in RoomGrid — the `id` doubles
// as the URL query-param name, translated to GET /essentials/categories/:slug's
// actual params (style/minPrice/maxPrice) by buildRoomsQueryString below.
export const FILTER_DEFINITIONS: FilterDefinition<Room>[] = [
  {
    id: "style",
    type: "checkbox-group",
    label: "Style",
    getOptions: getStyleOptions,
  },
  {
    id: "price",
    type: "radio",
    label: "Price",
    options: [
      { value: "0-40000", label: "Under ₹40,000" },
      { value: "40000-80000", label: "₹40,000 – ₹80,000" },
      { value: "80000-150000", label: "₹80,000 – ₹1,50,000" },
      { value: "150000-", label: "₹1,50,000+" },
    ],
  },
];

export function readActiveFilters(
  searchParams: URLSearchParams | { get(key: string): string | null },
): ActiveFilters {
  const active: ActiveFilters = {};
  FILTER_DEFINITIONS.forEach((definition) => {
    const raw = searchParams.get(definition.id);
    if (definition.type === "checkbox-group") {
      active[definition.id] = raw
        ? raw.split(MULTI_VALUE_DELIMITER).filter(Boolean)
        : [];
    } else if (definition.type === "radio") {
      active[definition.id] = raw ?? "";
    } else {
      active[definition.id] = raw === "1";
    }
  });
  return active;
}

export function countActiveFilters(activeFilters: ActiveFilters): number {
  return FILTER_DEFINITIONS.reduce((count, definition) => {
    const value = activeFilters[definition.id];
    if (definition.type === "checkbox-group") {
      return count + ((value as string[])?.length ? 1 : 0);
    }
    return count + (value ? 1 : 0);
  }, 0);
}

// Translates this component's URL-facing filter shape (style/price bucket)
// into the query params GET /essentials/categories/:slug actually expects
// (style/minPrice/maxPrice).
export function buildRoomsQueryString(
  searchParams: URLSearchParams | { get(key: string): string | null },
): string {
  const params = new URLSearchParams();

  const style = searchParams.get("style");
  if (style) params.set("style", style);

  const price = searchParams.get("price");
  if (price) {
    const [min, max] = price.split("-");
    if (min) params.set("minPrice", min);
    if (max) params.set("maxPrice", max);
  }

  return params.toString();
}
