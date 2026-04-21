import PocketBase from "pocketbase";

export function createPocketBaseClient() {
  const baseUrl = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
  return new PocketBase(baseUrl);
}

export const AUTH_COOKIE_NAME = "pb_auth";
