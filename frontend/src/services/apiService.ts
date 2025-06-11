import type {
  Status,
  Team,
  Todo,
  TodoAuditLog,
  TodoCountByPriority,
  TodoCountByStatus,
  TodosByPriority,
  TodosByStatus,
} from "../types";

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

interface UserManagement {
  id: number;
  uuid: string;
  email: string;
  name: string;
  userRoles: string[];
  isActive: boolean;
  createdAt: string;
  isVerified: boolean;
}

interface Role {
  id: number;
  name: string;
}

export type DataResponse<T> = {
  status: "success" | "error";
  data: T;
};

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
  count?: number;
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
    const text = await response.text();
    data = { message: text || "No response data" };
  }

  if (!response.ok) {
    const errorMessage =
      data.message || response.statusText || "Something went wrong";
    const error = new Error(errorMessage) as any;
    error.response = {
      status: response.status,
      data: data
    };
    if (response.status === 401 && response.url.includes("/login")) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
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
    sessionStorage.setItem("token", token);
  }

  clearAuthToken(): void {
    sessionStorage.removeItem("token");
  }

  private async fetchWrapper<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = sessionStorage.getItem("token");

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

  async healthCheck() {
    return this.fetchWrapper("/health", { method: "GET" });
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

  // User Management Methods
  async getUsers(): Promise<ApiResponse<UserManagement[]>> {
    return this.fetchWrapper("/users", {
      method: "GET",
    });
  }

  async getUser(uuid: string): Promise<ApiResponse<UserManagement>> {
    return this.fetchWrapper(`/users/${uuid}`, {
      method: "GET",
    });
  }

  async getUserRoles(): Promise<ApiResponse<Role[]>> {
    return this.fetchWrapper("/users/roles", {
      method: "GET",
    });
  }

  async updateUserRoles(
    uuid: string,
    roles: string[],
    operation: "add" | "remove" | "replace" = "replace"
  ): Promise<ApiResponse> {
    return this.fetchWrapper(`/users/${uuid}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles, operation }),
    });
  }

  async toggleUserLock(uuid: string, isActive: boolean): Promise<ApiResponse> {
    return this.fetchWrapper(`/users/${uuid}/lock`, {
      method: "PUT",
      body: JSON.stringify({ isActive }),
    });
  }

  async deleteUser(uuid: string): Promise<ApiResponse> {
    return this.fetchWrapper(`/users/${uuid}`, {
      method: "DELETE",
    });
  }

  async getUserTeams(
    uuid: string
  ): Promise<ApiResponse<{ id: number; name: string; is_lead: boolean }[]>> {
    return this.fetchWrapper(`/users/${uuid}/teams`, {
      method: "GET",
    });
  }

  async getUIserSearchResults(
    searchText: string
  ): Promise<DataResponse<{ uuid: string; name: string }[]>> {
    return this.fetchWrapper(
      "/search/users?searchText=" + encodeURIComponent(searchText),
      {
        method: "GET",
      }
    );
  }

  async createTeam(
    teamData: { name: string; members: { uuid: string; name: string }[] }
  ): Promise<DataResponse<Team>> {
    return this.fetchWrapper("/teams", {
      method: "POST",
      body: JSON.stringify({
        name: teamData.name,
        members: teamData.members || [],
      }),
    });
  }

  async createTask(
    title: string,
    assignedToUuid: string,
    teamId: number,
    statusId: number,
    priorityId: number,
    description?: string
  ): Promise<DataResponse<{ createdTodo: Todo }>> {
    return this.fetchWrapper("/todos", {
      method: "POST",
      body: JSON.stringify({
        title,
        assignedToUuid,
        teamId,
        statusId,
        priorityId,
        description,
      }),
    });
  }

  async getTodoCountsByPriority(teamId: number): Promise<TodoCountByPriority[] | Error> {
    return this.fetchWrapper(`/todos/counts-by-priority?teamId=${teamId}`, {
      method: "GET",
    });
  }

  async getTodoCountsByStatus(teamId: number): Promise<TodoCountByStatus[] | Error> {
    return this.fetchWrapper(`/todos/counts-by-status?teamId=${teamId}`, {
      method: "GET",
    })
  }

  async getTodosByPriority(teamId: number): Promise<TodosByPriority[] | Error> {
    return this.fetchWrapper(`/todos/by-priority?teamId=${teamId}`, {
      method: "GET",
    })
  }

  async getTodosByStatus(teamId: number): Promise<TodosByStatus[] | Error> {
    return this.fetchWrapper(`/todos/by-status?teamId=${teamId}`, {
      method: "GET",
    })
  }

  async getTodoChanges(todoId: number, startDate?: string, endDate?: string): Promise<TodoAuditLog[] | Error> {
    let url = `/todos/${todoId}/changes`
    const params = new URLSearchParams()

    if (startDate) {
      params.append("startDate", startDate)
    }

    if (endDate) {
      params.append("endDate", endDate)
    }

    const queryString = params.toString()
    if (queryString) {
      url += `?${queryString}`
    }

    return this.fetchWrapper(url, {
      method: "GET",
    })
  }
}


export const apiService = new ApiService();
