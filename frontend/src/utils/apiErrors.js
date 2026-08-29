/**
 * Extract a human-readable message from an Axios error.
 *
 * FastAPI returns two different shapes depending on the failure:
 *  - our own HTTPException: { detail: "some string" }
 *  - a Pydantic validation error (422): { detail: [{ msg, loc, type }, ...] }
 * This normalizes both (plus network errors) into a single string, so
 * every form only needs one line of error-handling code instead of
 * re-parsing the response shape itself.
 */
export function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg).join(" ");
  }

  if (error?.message === "Network Error") {
    return "Could not reach the server. Please check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}
