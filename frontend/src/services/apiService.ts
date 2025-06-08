import { Status, Team } from "../types";

interface User {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  token?: string;
  user?: User;
  requiresTwoFactor?: boolean;
  message: string;
}

interface RegisterResponse {
  uuid: string;
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

interface VerifyResponse {
  data: {
    verified: boolean;
  };
  message: string;
}

interface ValidateResponse {
  data: {
    validated: boolean;
  };
  message?: string;
}

export type DataResponse<T> = {
  status: "success" | "error";
  data: T;
};

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (e) {
      data = {};
      console.error("Failed to parse JSON response:", e, response);
    }
  } else {
    data = await response.text(); 
    data = { message: data || "No response data" };
  }

  if (!response.ok) {
    const errorMessage =
      data.message || response.statusText || "Something went wrong";
    const error = new Error(errorMessage) as any;
    error.response = {
      status: response.status,
      data: data,
    };
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw error;
  }
  return data as T;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = "/api";
  }

  setAuthToken(token: string): void {
    localStorage.setItem("token", token);
  }

  clearAuthToken(): void {
    localStorage.removeItem("token");
  }

  private async fetchWrapper<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return handleResponse<T>(response);
  }

  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    env: string;
  }> {
    return this.fetchWrapper("/health", {
      method: "GET",
    });
  }

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<ApiResponse<RegisterResponse>> {
    return this.fetchWrapper("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(
    email: string,
    password: string,
    totpToken?: string
  ): Promise<LoginResponse> {
    return this.fetchWrapper("/login", {
      method: "POST",
      body: JSON.stringify({ email, password, totpToken }),
    });
  }

  async verify(uuid: string, token: string): Promise<VerifyResponse> {
    return this.fetchWrapper("/verify", {
      method: "POST",
      body: JSON.stringify({ uuid, token }),
    });
  }

  async validate(token: string): Promise<ValidateResponse> {
    return this.fetchWrapper("/validate", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async retrieveUserTeams(): Promise<DataResponse<Team[]>> {
    return this.fetchWrapper("/teams/mine", {
      method: "GET",
    });
  }

  async retrievePriorities(): Promise<
    DataResponse<
      {
        id: number;
        name: string;
      }[]
    >
  > {
    return this.fetchWrapper("/priorities", {
      method: "GET",
    });
  }

  async retrieveStatuses(): Promise<DataResponse<Status[]>> {
    return this.fetchWrapper("/statuses", {
      method: "GET",
    });
  }
}

export const apiService = new ApiService();
