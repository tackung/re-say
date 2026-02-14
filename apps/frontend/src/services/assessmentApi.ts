import { AssessmentApiResponse } from "../../../../packages/shared/types/assessment";

export const assessPronunciation = async (
  audioBlob: Blob,
  referenceText: string,
): Promise<AssessmentApiResponse> => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");
  formData.append("referenceText", referenceText);

  const response = await fetch("/api/assess", {
    method: "POST",
    body: formData,
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      throw new Error(payload.error);
    }
    throw new Error(`Server error: ${response.status}`);
  }

  return payload as AssessmentApiResponse;
};
