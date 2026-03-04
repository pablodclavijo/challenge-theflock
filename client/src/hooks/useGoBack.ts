import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

/**
 * Custom hook to safely navigate back in history.
 * Goes back to the previous page if it's within the same app,
 * otherwise navigates to a fallback URL (default: homepage).
 */
export function useGoBack(fallbackUrl: string = "/") {
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    // Check if there's navigation history in the current session
    // window.history.length > 1 means there's at least one entry before the current page
    // document.referrer checks if we came from the same origin
    const hasHistory = window.history.length > 1;
    const referrer = document.referrer;
    const sameOrigin = referrer === "" || referrer.startsWith(window.location.origin);

    if (hasHistory && sameOrigin) {
      // Safe to go back - we have history and it's from the same domain
      navigate(-1);
    } else {
      // No safe history or came from external domain - go to fallback
      navigate(fallbackUrl);
    }
  }, [navigate, fallbackUrl]);

  return goBack;
}
