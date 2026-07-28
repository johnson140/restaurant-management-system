// Minimal JWT payload decoder. We only need to read claims (username, role,
// expiry) on the client — verification already happened server-side when
// the token was issued, and every request is re-validated by the backend's
// JwtAuthFilter. This never trusts the token for security decisions beyond
// deciding what UI to show; the backend remains the source of truth.
export function decodeToken(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    // JWT uses base64url; convert to standard base64 before decoding.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    return JSON.parse(json);
  } catch (err) {
    console.error("Failed to decode token", err);
    return null;
  }
}

export function isTokenExpired(decoded) {
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}
