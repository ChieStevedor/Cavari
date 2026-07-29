import "server-only";

// CORS allow-list for API route handlers. The wizard/dashboard call these
// routes same-origin, so this exists purely to make cross-origin calls fail
// closed by default rather than open — see SECURITY.md, "API Hardening".
// Route handlers that need to be callable cross-origin should call
// corsHeaders(request) and spread the result onto their response, plus
// implement an OPTIONS handler using the same function.

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().includes(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}
