import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./api";

// Get Business Dashboard
export const fetchBusinessDashboard = async () => {
  try {
    const response = await api.get("/business/dashboard");
    return response.data;
  } catch (error) {
    console.error("Error fetching business dashboard:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch business dashboard");
  }
};

export const useBusinessDashboard = () => {
  return useQuery({
    queryKey: ["businessDashboard"],
    queryFn: fetchBusinessDashboard,
  });
};

// Get Business Location
export const fetchBusinessLocation = async () => {
  try {
    const response = await api.get("/business/location");
    return response.data;
  } catch (error) {
    console.error("Error fetching business location:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch business location");
  }
};

export const useBusinessLocation = () => {
  return useQuery({
    queryKey: ["businessLocation"],
    queryFn: fetchBusinessLocation,
  });
};

// Get Business Profile
export const fetchBusinessProfile = async () => {
  try {
    const response = await api.get("/business/profile");
    return response.data;
  } catch (error) {
    console.error("Error fetching business profile:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch business profile");
  }
};

export const useBusinessProfile = () => {
  return useQuery({
    queryKey: ["businessProfile"],
    queryFn: fetchBusinessProfile,
  });
};

// Update Business Profile
export const updateBusinessProfile = async (profileData) => {
  try {
    const response = await api.put("/business/profile", profileData);
    return response.data;
  } catch (error) {
    console.error("Error updating business profile:", error);
    throw new Error(error.response?.data?.error || "Failed to update business profile");
  }
};

export const useUpdateBusinessProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusinessProfile,
    onSuccess: () => {
      // Invalidate and refetch business profile
      queryClient.invalidateQueries({ queryKey: ["businessProfile"] });
    },
  });
};

// Toggle Business Visibility
export const toggleBusinessVisibility = async (visibility) => {
  try {
    const response = await api.put("/business/visibility", { visibility });
    return response.data;
  } catch (error) {
    console.error("Error toggling business visibility:", error);
    throw new Error(error.response?.data?.error || "Failed to update business visibility");
  }
};

export const useToggleBusinessVisibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleBusinessVisibility,
    onSuccess: () => {
      // Invalidate and refetch dashboard and profile
      queryClient.invalidateQueries({ queryKey: ["businessDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["businessProfile"] });
    },
  });
};

// Upload Menu
export const uploadMenu = async (menuFile) => {
  try {
    const formData = new FormData();
    formData.append("menu", menuFile);
    const response = await api.post("/business/menu", formData);
    return response.data;
  } catch (error) {
    console.error("Error uploading menu:", error);
    throw new Error(error.response?.data?.error || "Failed to upload menu");
  }
};

export const useUploadMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadMenu,
    onSuccess: () => {
      // Invalidate and refetch dashboard and profile
      queryClient.invalidateQueries({ queryKey: ["businessDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["businessProfile"] });
    },
  });
};

// Get Engagement Stats
export const fetchEngagementStats = async () => {
  try {
    const response = await api.get("/business/engagement");
    return response.data;
  } catch (error) {
    console.error("Error fetching engagement stats:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch engagement stats");
  }
};

export const useEngagementStats = () => {
  return useQuery({
    queryKey: ["engagementStats"],
    queryFn: fetchEngagementStats,
  });
};

export const updateBusinessPlan = async (planTier) => {
  const response = await api.put("/business/plan", { plan_tier: planTier });
  return response.data;
};

export const useUpdateBusinessPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusinessPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["businessDashboard"] }),
  });
};

export const toggleSpotlight = async (spotlight) => {
  const response = await api.put("/business/spotlight", { spotlight });
  return response.data;
};

export const useToggleSpotlight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleSpotlight,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["businessDashboard"] }),
  });
};
