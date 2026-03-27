import { AssessmentApiResponse } from "../../../../packages/shared/types/assessment";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

const buildApiUrl = (path: string): string => {
  if (!configuredApiBaseUrl) {
    return path;
  }

  return `${configuredApiBaseUrl.replace(/\/+$/, "")}${path}`;
};

const readErrorResponse = async (response: Response): Promise<string> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload: unknown = await response.json();
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      return payload.error;
    }
  } else {
    const errorText = await response.text();
    if (errorText.trim().toLowerCase().startsWith("<!doctype")) {
      return "API endpoint returned HTML. In Firebase Hosting, /api is likely being rewritten to index.html. Set VITE_API_BASE_URL to your backend origin or add a Hosting rewrite for /api.";
    }
    if (errorText.trim()) {
      return errorText;
    }
  }

  return `Server error: ${response.status}`;
};

export const assessPronunciation = async (
  audioBlob: Blob,
  referenceText: string,
): Promise<AssessmentApiResponse> => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");
  formData.append("referenceText", referenceText);

  const response = await fetch(buildApiUrl("/api/assess"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const responseText = await response.text();
    if (responseText.trim().toLowerCase().startsWith("<!doctype")) {
      throw new Error(
        "Assessment API returned HTML instead of JSON. In Firebase Hosting, /api is likely being rewritten to index.html. Set VITE_API_BASE_URL to your backend origin or add a Hosting rewrite for /api.",
      );
    }
    throw new Error("Assessment API returned an unexpected response.");
  }

  const payload: unknown = await response.json();
  return payload as AssessmentApiResponse;
};

export const synthesizeExampleSpeech = async (text: string): Promise<Blob> => {
  const response = await fetch(buildApiUrl("/api/tts"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("audio/")) {
    const responseText = await response.text();
    if (responseText.trim().toLowerCase().startsWith("<!doctype")) {
      throw new Error(
        "Speech synthesis API returned HTML instead of audio. In Firebase Hosting, /api is likely being rewritten to index.html. Set VITE_API_BASE_URL to your backend origin or add a Hosting rewrite for /api.",
      );
    }
    throw new Error("Speech synthesis API returned an unexpected response.");
  }

  return response.blob();
};
