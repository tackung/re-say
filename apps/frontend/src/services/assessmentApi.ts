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

export const synthesizeExampleSpeech = async (text: string): Promise<Blob> => {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    let message = `Server error: ${response.status}`;
    try {
      const payload: unknown = await response.json();
      if (
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
      ) {
        message = payload.error;
      }
    } catch {
      const errorText = await response.text();
      if (errorText.trim()) {
        message = errorText;
      }
    }
    throw new Error(message);
  }

  return response.blob();
};
