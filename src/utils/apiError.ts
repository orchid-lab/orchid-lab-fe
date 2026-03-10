type ProblemDetails = {
  detail?: string;
  title?: string;
  message?: string;
};

type AxiosLikeError = {
  response?: {
    data?: string | ProblemDetails;
  };
  message?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const apiError = error as AxiosLikeError;
  const responseData = apiError.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData && typeof responseData === "object") {
    if (typeof responseData.detail === "string" && responseData.detail.trim()) {
      return responseData.detail;
    }

    if (typeof responseData.title === "string" && responseData.title.trim()) {
      return responseData.title;
    }

    if (typeof responseData.message === "string" && responseData.message.trim()) {
      return responseData.message;
    }
  }

  if (typeof apiError.message === "string" && apiError.message.trim()) {
    return apiError.message;
  }

  return fallback;
};
