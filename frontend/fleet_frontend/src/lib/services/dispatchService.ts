import { api } from "@/lib/api";
import type {
  DispatchSuggestionDTO,
  SmartAssignmentRequest,
} from "@/types/dispatch";

export const smartDispatchService = {
  async smartAssignment(payload: SmartAssignmentRequest) {
    const res = await api.post<DispatchSuggestionDTO>(
      "/api/owner/dispatch/smart-assignment",
      payload
    );

    return res.data;
  },
};

export async function smartAssignment(
  payload: SmartAssignmentRequest
): Promise<DispatchSuggestionDTO> {
  return smartDispatchService.smartAssignment(payload);
}