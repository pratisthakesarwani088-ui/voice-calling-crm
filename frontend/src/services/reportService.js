import apiClient from "./apiClient.js";

/**
 * All Reports backend calls live here - components never call axios
 * directly (see services/README.md).
 */

export async function getReportSummary() {
  const response = await apiClient.get("/api/v1/reports/summary");
  return response.data; // ReportSummary
}

export async function getCallsByPeriod({ period = "day", buckets = 14 } = {}) {
  const response = await apiClient.get("/api/v1/reports/calls-by-period", {
    params: { period, buckets },
  });
  return response.data; // { period, points: [{ label, count }] }
}

export async function getRecentActivity({ limit = 5 } = {}) {
  const response = await apiClient.get("/api/v1/reports/recent-activity", {
    params: { limit },
  });
  return response.data; // { items: CallOut[] }
}
