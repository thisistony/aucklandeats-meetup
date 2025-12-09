import { NextRequest, NextResponse } from "next/server";

// Lightweight existence check using Reddit's public about.json endpoint.
// No OAuth token required; we proxy via the server to avoid CORS and to
// allow simple rate limiting/timeouts.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") || "").trim();

  if (!username) {
    return NextResponse.json(
      { error: "username is required" },
      { status: 400 }
    );
  }

  // Basic validation to avoid obviously invalid calls
  if (username.length > 30) {
    return NextResponse.json(
      { exists: false, reason: "too_long" },
      { status: 200 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://www.reddit.com/user/${encodeURIComponent(
        username
      )}/about.json`,
      {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "reddit-shared-calendar/1.0 (username check; contact: dev@example.com)",
          Accept: "application/json",
        },
        redirect: "follow",
      }
    );

    clearTimeout(timeout);

    if (res.status === 200) {
      try {
        const json = await res.json();
        const apiName =
          json && typeof json === "object" && json.data && typeof json.data.name === "string"
            ? json.data.name
            : null;

        if (apiName) {
          const inputLower = username.toLowerCase();
          const apiLower = apiName.toLowerCase();
          if (apiLower === inputLower) {
            const caseMismatch = apiName !== username;
            return NextResponse.json(
              { exists: true, canonical: apiName, caseMismatch },
              { status: 200 }
            );
          }
        }
      } catch {
        // If parsing fails, fall back to exists=true since status was 200.
      }

      return NextResponse.json({ exists: true }, { status: 200 });
    }

    if (res.status === 404) {
      return NextResponse.json({ exists: false, reason: "not_found" }, { status: 200 });
    }

    if (res.status === 429) {
      return NextResponse.json(
        { exists: false, error: "rate_limited", status: res.status },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { exists: false, error: "unexpected_status", status: res.status },
      { status: 200 }
    );
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { exists: false, error: isAbort ? "timeout" : "fetch_failed" },
      { status: 200 }
    );
  }
}

