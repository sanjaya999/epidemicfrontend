import { api } from "@/lib/api";
import type {
  ConfigurationItemResponse,
  ConfigurationListResponse,
  DiseaseProfile,
  DiseaseProfilePayload,
  Location,
  LocationPayload,
  Organization,
  OrganizationPayload,
} from "@/types/configuration";

export const configurationService = {
  getOrganizations: (includeInactive = false) =>
    api.get<ConfigurationListResponse<Organization>>("/organizations", {
      params: { include_inactive: includeInactive },
    }),

  createOrganization: (payload: OrganizationPayload) =>
    api.post<ConfigurationItemResponse<Organization>>("/organizations", payload),

  updateOrganization: (id: number, payload: Partial<OrganizationPayload> & { is_active?: boolean }) =>
    api.patch<ConfigurationItemResponse<Organization>>(`/organizations/${id}`, payload),

  getLocations: (organizationId?: number, includeInactive = false) =>
    api.get<ConfigurationListResponse<Location>>("/locations", {
      params: {
        organization_id: organizationId,
        include_inactive: includeInactive,
      },
    }),

  createLocation: (payload: LocationPayload) =>
    api.post<ConfigurationItemResponse<Location>>("/locations", payload),

  updateLocation: (
    id: number,
    payload: Partial<LocationPayload> & { is_active?: boolean }
  ) => api.patch<ConfigurationItemResponse<Location>>(`/locations/${id}`, payload),

  getDiseaseProfiles: (organizationId?: number, includeInactive = false) =>
    api.get<ConfigurationListResponse<DiseaseProfile>>("/disease-profiles", {
      params: {
        organization_id: organizationId,
        include_inactive: includeInactive,
      },
    }),

  createDiseaseProfile: (payload: DiseaseProfilePayload) =>
    api.post<ConfigurationItemResponse<DiseaseProfile>>("/disease-profiles", payload),

  updateDiseaseProfile: (
    id: number,
    payload: Partial<DiseaseProfilePayload> & { is_active?: boolean }
  ) => api.patch<ConfigurationItemResponse<DiseaseProfile>>(`/disease-profiles/${id}`, payload),
};
