const BASE_URL = "http://localhost:1001/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Service {
  _id: string;
  name: string;
  category: string;
  avgProcessingTime: number;
  fee: number;
  priority: "High" | "Medium" | "Low";
  status: "Active" | "Inactive";
  requiredDocuments: string[];
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceInput {
  name: string;
  category: string;
  avgProcessingTime: number;
  fee: number;
  priority: "High" | "Medium" | "Low";
  status: "Active" | "Inactive";
  requiredDocuments: string[];
  description: string;
}

export interface ServiceBranchLink {
  serviceId: string;
  branchId: string;
  customProcessingTime?: number;
  capacityPerDay?: number;
}

export interface Branch {
  _id: string;
  name?: string;
  location?: string;
  capacity?: number;
  capacityPerDay?: number;
}

export interface ServiceBranchAssignment {
  _id?: string;
  serviceId?: string;
  branchId: string | Branch;
  customProcessingTime?: number;
  capacityPerDay?: number;
}

export interface QueueToken {
  _id: string;
  tokenNumber: string;
  serviceId: string | Service;
  branchId: string | Branch;
  citizenName?: string;
  status: "Waiting" | "Serving" | "Completed" | "Skipped" | "Cancelled";
  priority: "Normal" | "Priority";
  waitingPosition?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Request failed");
  }

  return res.json() as Promise<T>;
}

// ─── Service API ─────────────────────────────────────────────────────────────

export const serviceAPI = {
  getAll: () => request<Service[]>("/services"),
  getBranches: () => request<Branch[]>("/services/branches"),
  getServiceBranches: (serviceId: string) =>
    request<ServiceBranchAssignment[]>(`/services/${serviceId}/branches`),
  syncServiceBranches: (
    serviceId: string,
    assignments: Array<{
      branchId: string;
      customProcessingTime?: number;
      capacityPerDay?: number;
    }>
  ) =>
    request<ServiceBranchAssignment[]>(`/services/${serviceId}/branches`, {
      method: "PUT",
      body: JSON.stringify({ assignments }),
    }),

  create: (data: ServiceInput) =>
    request<Service>("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<ServiceInput>) =>
    request<Service>(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/services/${id}`, { method: "DELETE" }),

  linkToBranch: (data: ServiceBranchLink) =>
    request<ServiceBranchLink>("/services/link", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Analytics API ────────────────────────────────────────────────────────────

export const analyticsAPI = {
  compareBranches: () => request<unknown[]>("/analytics/compare"),
  leastCrowded: () => request<unknown>("/analytics/least-crowded"),
};

export const queueAPI = {
  getTokens: (params?: { branchId?: string; serviceId?: string; status?: string }) => {
    const search = new URLSearchParams();
    if (params?.branchId) search.set("branchId", params.branchId);
    if (params?.serviceId) search.set("serviceId", params.serviceId);
    if (params?.status) search.set("status", params.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<QueueToken[]>(`/queue/tokens${suffix}`);
  },

  createToken: (data: {
    serviceId: string;
    branchId: string;
    citizenName?: string;
    priority?: "Normal" | "Priority";
  }) =>
    request<QueueToken>("/queue/tokens", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTokenStatus: (id: string, status: QueueToken["status"]) =>
    request<QueueToken>(`/queue/tokens/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getTokenPosition: (id: string) =>
    request<{ token: QueueToken; waitingPosition: number | null; summary: unknown }>(
      `/queue/tokens/${id}/position`
    ),
};
