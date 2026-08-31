import { useQuery } from "@tanstack/react-query";
import api, { getActiveBusinessId } from "./api";

const fetchBusinessAnalytics = async (period) => {
  const response = await api.get("/business/analytics", { params: { period } });
  return response.data;
};

export const useBusinessAnalytics = (period) => useQuery({
  queryKey: ["businessAnalytics", getActiveBusinessId(), period],
  queryFn: () => fetchBusinessAnalytics(period),
});
