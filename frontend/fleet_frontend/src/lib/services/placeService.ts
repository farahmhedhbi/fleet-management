import { api } from "@/lib/api";

export interface PlaceSuggestion {
  placeId: string;
  label: string;
  value: string;
  displayName: string;
  lat: number;
  lon: number;
}

export const placeService = {
  async search(query: string): Promise<PlaceSuggestion[]> {
    const res = await api.get<PlaceSuggestion[]>("/api/places/search", {
      params: { q: query },
    });
    return res.data;
  },
};