import {
  ActionFieldErrors,
  VendorOrder,
  VendorOrderActionPayload,
  VendorOrderCounts,
  VendorOrdersPage,
  VendorStage,
} from "@/app/types/vendorOrders";

// Thin wrappers over the vendor order endpoints (`/vendor/orders`). Every call needs the backend
// token from the NextAuth session (session.backendToken).

const API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export class VendorOrdersApiError extends Error {
  status: number;
  fieldErrors?: ActionFieldErrors;

  constructor(message: string, status: number, fieldErrors?: ActionFieldErrors) {
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

  let data: { message?: string; errors?: ActionFieldErrors } | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new VendorOrdersApiError(
      data?.message ?? "Something went wrong. Please try again.",
      response.status,
      data?.errors,
    );
  }
  return data as T;
}

export const fetchVendorOrderCounts = (token: string, signal?: AbortSignal) =>
  request<{ counts: VendorOrderCounts }>("/vendor/orders/summary", token, { signal }).then(
    (data) => data.counts,
  );

export function fetchVendorOrders(
  token: string,
  options: { stage: VendorStage; before?: string | null; signal?: AbortSignal },
) {
  const params = new URLSearchParams({ stage: options.stage });
  if (options.before) params.set("before", options.before);
  return request<VendorOrdersPage>(`/vendor/orders?${params.toString()}`, token, {
    signal: options.signal,
  });
}

export const fetchVendorOrder = (token: string, orderId: string, signal?: AbortSignal) =>
  request<{ order: VendorOrder }>(`/vendor/orders/${encodeURIComponent(orderId)}`, token, {
    signal,
  }).then((data) => data.order);

export const updateVendorOrder = (
  token: string,
  orderId: string,
  payload: VendorOrderActionPayload,
) =>
  request<{ order: VendorOrder; counts: VendorOrderCounts }>(
    `/vendor/orders/${encodeURIComponent(orderId)}/status`,
    token,
    { method: "PATCH", body: payload },
  );
