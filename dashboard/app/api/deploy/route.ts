import { NextRequest, NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${backend}/api/ota/deploy`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const txt = await res.text();
  return new NextResponse(txt, { status: res.status });
}

