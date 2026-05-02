import { createApiClient } from "@restaurant/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export const api = createApiClient({ baseUrl: API_URL, getToken });
