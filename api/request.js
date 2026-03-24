import { API_BASE } from "./config_api.js";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });

  if ((!response.ok) && (response.status !== 401)) {
    let errorPayload;



    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = await response.text();
    }

    throw new Error(
      `HTTP ${response.status}: ${
        typeof errorPayload === "string"
          ? errorPayload
          : JSON.stringify(errorPayload)
      }`
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
}

export function buildJsonOptions({
  method = "GET",
  data = null,
  headers = {},
  ...rest
} = {}) {
  const options = {
    method,
    headers: { ...headers },
    ...rest,
  };

  if (data !== null) {
    options.body = JSON.stringify(data);
    options.headers["Content-Type"] = "application/json";
  }

  return options;
}

/*
Примеры использования:
    GET
        const result = await apiRequest("/markers/all");

    POST
        const result = await apiRequest("/markers/single", buildJsonOptions({
        method: "POST",
        data: {
            id: "m1",
            name: "Test",
        }
        }));

    PATCH
        const result = await apiRequest("/users/user/role", buildJsonOptions({
        method: "PATCH",
        data: {
            id: "123",
            name: "admin",
        }
        }));
*/