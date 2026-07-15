/**
 * Sanitizes and validates the redirect path to prevent open redirect vulnerabilities.
 * Only allows internal paths that:
 * - Start with one '/'
 * - Do not start with '//'
 * - Do not contain a protocol (e.g. http://, https://)
 * - Do not contain backslashes
 */
export function getSafeRedirect(nextParam: string | null): string {
  if (!nextParam) return "/dashboard";
  
  const trimmed = nextParam.trim();
  
  // Must start with a single '/' and not be double '//'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }
  
  // Prevent protocol or external hostname indicators
  if (
    trimmed.includes("://") || 
    trimmed.includes("\\") || 
    /^[a-zA-Z\d+-.]+:\/\//.test(trimmed)
  ) {
    return "/dashboard";
  }
  
  return trimmed;
}
