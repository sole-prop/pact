import { NextResponse } from "next/server";

export async function GET() {
  try {
    const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${BACKEND_URL}/api/stats/latest-report`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch backend stats" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Backend offline" }, { status: 503 });
  }
}
