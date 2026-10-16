import {
  AccountInfo,
  ApplicationFieldErrors,
  ApplicationFormValues,
  ApplicationStatus,
  OwnVendorProfile,
  VendorApplication,
} from "@/app/types/vendorAccount";

// Thin wrappers over the vendor sign-up endpoints. Every call needs the backend token from the
// NextAuth session (session.backendToken).

const API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

export class ApiError extends Error {
  status: number;
  fieldErrors?: ApplicationFieldErrors;

  constructor(message: string, status: number, fieldErrors?: ApplicationFieldErrors) {
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
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  let data: { message?: string; errors?: ApplicationFieldErrors } | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? "Something went wrong. Please try again.",
      response.status,
      data?.errors,
    );
  }
  return data as T;
}

export const fetchAccount = (token: string, signal?: AbortSignal) =>
  request<AccountInfo>("/auth/me", token, { signal });

export const fetchOwnVendor = (token: string, signal?: AbortSignal) =>
  request<OwnVendorProfile>("/vendor/me", token, { signal });

export const fetchMyApplication = async (token: string, signal?: AbortSignal) =>
  (await request<{ application: VendorApplication | null }>("/vendor-applications/mine", token, { signal }))
    .application;

export const submitApplication = async (token: string, values: ApplicationFormValues) =>
  (await request<{ application: VendorApplication }>("/vendor-applications", token, { method: "POST", body: values }))
    .application;

export const fetchApplications = async (token: string, status: ApplicationStatus, signal?: AbortSignal) =>
  (await request<{ applications: VendorApplication[] }>(`/vendor-applications?status=${status}`, token, { signal }))
    .applications;

export const approveApplication = (token: string, id: string) =>
  request<{ application: VendorApplication }>(`/vendor-applications/${id}/approve`, token, { method: "POST" });

export const rejectApplication = (token: string, id: string, reason: string) =>
  request<{ application: VendorApplication }>(`/vendor-applications/${id}/reject`, token, {
    method: "POST",
    body: { reason },
  });

export const linkTestVendor = (token: string, userId: number, vendorId: string) =>
  request<{ ok: boolean }>("/vendor-applications/admin/link", token, { method: "POST", body: { userId, vendorId } });

export const unlinkTestVendor = (token: string, userId: number) =>
  request<{ ok: boolean }>("/vendor-applications/admin/unlink", token, { method: "POST", body: { userId } });
