import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "100";
  const eventType = searchParams.get("type") || "";

  try {
    const backendRes = await fetch(`http://localhost:8080/api/events?limit=${limit}&type=${eventType}`, {
      cache: "no-store",
    });

    if (!backendRes.ok) {
      throw new Error(`Backend responded with ${backendRes.status}`);
    }

    const data = await backendRes.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { output: [`Error: ${error instanceof Error ? error.message : "Unknown error"}`], status: "error" },
      { status: 502 }
    );
  }
}
