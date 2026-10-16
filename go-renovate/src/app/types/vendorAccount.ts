import { Vendor } from "./vendor";

// What the signed-in account may do. Always read from the server (GET /auth/me), never stored in
// the NextAuth session, so a role change shows up without logging in again.
export type AccountRole = "customer" | "vendor" | "admin";

export interface AccountInfo {
  id: number;
  email: string;
  name: string;
  role: AccountRole;
  vendorId: string | null;
}

export type SellsOption = "services" | "products" | "both";

export const SELLS_LABELS: Record<SellsOption, string> = {
  services: "Services",
  products: "Products",
  both: "Both",
};

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface VendorApplication {
  id: string;
  businessName: string;
  city: string;
  sells: SellsOption;
  phone: string;
  pickupAddress: string;
  gstin: string;
  status: ApplicationStatus;
  rejectionReason: string;
  vendorId: string | null;
  createdAt: string;
  decidedAt: string | null;
  // Only included for the admin list.
  userEmail?: string;
}

export interface ApplicationFormValues {
  businessName: string;
  city: string;
  sells: SellsOption | "";
  phone: string;
  pickupAddress: string;
  gstin: string;
}

export type ApplicationField = keyof ApplicationFormValues;

export type ApplicationFieldErrors = Partial<Record<ApplicationField, string>>;

// The vendor's own profile (GET /vendor/me): the public vendor shape plus its visibility.
export interface OwnVendorProfile extends Vendor {
  status?: "pending" | "active" | "paused";
}
