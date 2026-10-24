import {
  AdminProduct,
  ManagedProduct,
  ProductFieldErrors,
  ProductInput,
  ProductPage,
  ProductStatus,
  PhotoTicket,
  ProductTypesResponse,
} from "@/app/types/vendorProducts";

// Thin wrappers over the vendor product endpoints (`/vendor/products`) and the owner's review endpoints
// (`/admin/products`). Every call needs the backend token from the NextAuth session (session.backendToken).

const API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export class ProductsApiError extends Error {
  status: number;
  fieldErrors?: ProductFieldErrors;

  constructor(message: string, status: number, fieldErrors?: ProductFieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(
  path: string,
  token: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: init.method ?? "GET",
    signal: init.signal,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  let data: { message?: string; errors?: ProductFieldErrors } | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    throw new ProductsApiError(
      data?.message ?? "Something went wrong. Please try again.",
      response.status,
      data?.errors,
    );
  }
  return data as T;
}

function listQuery(options: { status: string; before?: string | null; limit?: number }): string {
  const params = new URLSearchParams({ status: options.status });
  if (options.before) params.set("before", options.before);
  if (options.limit) params.set("limit", String(options.limit));
  return params.toString();
}

// --- the vendor's own products
export const fetchProductTypes = (token: string, signal?: AbortSignal) =>
  request<ProductTypesResponse>("/vendor/products/options", token, { signal });

export const fetchMyProducts = (
  token: string,
  options: { status: ProductStatus | "all"; before?: string | null; limit?: number; signal?: AbortSignal },
) =>
  request<ProductPage<ManagedProduct>>(`/vendor/products?${listQuery(options)}`, token, {
    signal: options.signal,
  });

export const fetchMyProduct = (token: string, id: string, signal?: AbortSignal) =>
  request<{ product: ManagedProduct }>(`/vendor/products/${encodeURIComponent(id)}`, token, { signal }).then(
    (data) => data.product,
  );

export const createProduct = (token: string, input: ProductInput) =>
  request<{ product: ManagedProduct; warnings: string[] }>("/vendor/products", token, {
    method: "POST",
    body: input,
  });

export const updateProduct = (token: string, id: string, changes: Partial<ProductInput>) =>
  request<{ product: ManagedProduct; warnings: string[] }>(
    `/vendor/products/${encodeURIComponent(id)}`,
    token,
    { method: "PATCH", body: changes },
  );

// --- photos: ask for permission to upload one, then (after the browser has sent it to Cloudinary) attach it
export const requestPhotoTicket = (token: string, signal?: AbortSignal) =>
  request<PhotoTicket>("/vendor/products/photo-ticket", token, { method: "POST", signal });

export const attachPhoto = (token: string, productId: string, publicId: string) =>
  request<{ product: ManagedProduct }>(`/vendor/products/${encodeURIComponent(productId)}/photos`, token, {
    method: "POST",
    body: { publicId },
  }).then((data) => data.product);

export const removePhoto = (token: string, productId: string, url: string) =>
  request<{ product: ManagedProduct }>(`/vendor/products/${encodeURIComponent(productId)}/photos/remove`, token, {
    method: "POST",
    body: { url },
  }).then((data) => data.product);

const action = (verb: "pause" | "resume" | "duplicate") => (token: string, id: string) =>
  request<{ product: ManagedProduct }>(`/vendor/products/${encodeURIComponent(id)}/${verb}`, token, {
    method: "POST",
  }).then((data) => data.product);

export const pauseProduct = action("pause");
export const resumeProduct = action("resume");
export const duplicateProduct = action("duplicate");

// --- the owner's review
export const fetchReviewQueue = (
  token: string,
  options: { status: ProductStatus; before?: string | null; signal?: AbortSignal },
) =>
  request<ProductPage<AdminProduct>>(`/admin/products?${listQuery(options)}`, token, {
    signal: options.signal,
  });

const adminAction = (token: string, id: string, verb: string, body?: unknown) =>
  request<{ product: AdminProduct }>(`/admin/products/${encodeURIComponent(id)}/${verb}`, token, {
    method: "POST",
    body: body ?? {},
  }).then((data) => data.product);

export const approveProduct = (token: string, id: string, showInRooms: boolean) =>
  adminAction(token, id, "approve", { showInRooms });
export const rejectProduct = (token: string, id: string, reason: string) =>
  adminAction(token, id, "reject", { reason });
export const adminPauseProduct = (token: string, id: string) => adminAction(token, id, "pause");
export const adminResumeProduct = (token: string, id: string) => adminAction(token, id, "resume");
export const setProductRooms = (token: string, id: string, enabled: boolean) =>
  adminAction(token, id, "rooms", { enabled });
