import { Vendor } from "../../VendorPage/vendor";

export type FilterOption = {
  value: string;
  label: string;
  icon?: string;
};

type CheckboxGroupFilter = {
  id: string;
  type: "checkbox-group";
  label: string;
  getOptions: (vendors: Vendor[]) => FilterOption[];
};

type RadioFilter = {
  id: string;
  type: "radio";
  label: string;
  options: FilterOption[];
};

type ToggleFilter = {
  id: string;
  type: "toggle";
  label: string;
};

export type FilterDefinition = CheckboxGroupFilter | RadioFilter | ToggleFilter;

export type ActiveFilters = Record<string, string[] | string | boolean>;

// Multi-value checkbox-group params (category, location) join their selected
// values with this delimiter, not a comma — vendor `location` values are
// "City, State" strings that already contain commas, so a comma-joined list
// can't be split back apart unambiguously. The backend splits on the same
// character (see parseCsv in vendorDetailRoutes.ts).
export const MULTI_VALUE_DELIMITER = "|";

function getCategoryOptions(vendors: Vendor[]): FilterOption[] {
  const options = new Map<string, FilterOption>();
  vendors.forEach((vendor) => {
    vendor.categories.forEach((category) => {
      if (!options.has(category.id)) {
        options.set(category.id, {
          value: category.id,
          label: category.label,
          icon: category.icon,
        });
      }
    });
  });
  return Array.from(options.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

function getLocationOptions(vendors: Vendor[]): FilterOption[] {
  const locations = new Set<string>();
  vendors.forEach((vendor) => {
    if (vendor.location) locations.add(vendor.location);
  });
  return Array.from(locations)
    .sort((a, b) => a.localeCompare(b))
    .map((location) => ({ value: location, label: location }));
}

// Add a new filter here to make it available everywhere Filters render —
// desktop sidebar, mobile overlay, and the backend query all read this list.
// The `id` doubles as the query-param name GET /vendors expects.
export const FILTER_DEFINITIONS: FilterDefinition[] = [
  {
    id: "category",
    type: "checkbox-group",
    label: "Category",
    getOptions: getCategoryOptions,
  },
  {
    id: "rating",
    type: "radio",
    label: "Rating",
    options: [
      { value: "4", label: "4 stars & up" },
      { value: "3", label: "3 stars & up" },
    ],
  },
  {
    id: "verified",
    type: "toggle",
    label: "Verified vendors only",
  },
  {
    id: "location",
    type: "checkbox-group",
    label: "Location",
    getOptions: getLocationOptions,
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

// Builds the exact query string GET /vendors expects, reading only the
// known filter params out of whatever is currently in the URL (so unrelated
// query params, if any are ever added, never leak into the API request).
export function buildFilterQueryString(
  searchParams: URLSearchParams | { get(key: string): string | null },
): string {
  const params = new URLSearchParams();
  FILTER_DEFINITIONS.forEach((definition) => {
    const raw = searchParams.get(definition.id);
    if (raw) params.set(definition.id, raw);
  });
  return params.toString();
}

export function buildCategoryScopedFilterQuery(
  searchParams: URLSearchParams | { get(key: string): string | null },
  categoryId: string,
): { fullQuery: string; extraQuery: string } {
  const extraQuery = buildFilterQueryString(searchParams);
  const params = new URLSearchParams(extraQuery);
  params.set("category", categoryId);
  return { fullQuery: params.toString(), extraQuery };
}

export function countActiveFilters(activeFilters: ActiveFilters): number {
  return FILTER_DEFINITIONS.reduce((count, definition) => {
    const value = activeFilters[definition.id];
    if (definition.type === "checkbox-group") {
      return count + ((value as string[])?.length ?? 0);
    }
    return count + (value ? 1 : 0);
  }, 0);
}
