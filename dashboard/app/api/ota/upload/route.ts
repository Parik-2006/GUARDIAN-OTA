import { NextRequest } from "next/server";

export const config = {
  api: {
    bodyParser: false, // Disable built-in parser to handle multipart
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // We must forward as a new FormData request to the Go backend
    const backendFormData = new FormData();
    const file = formData.get("file") as File;
    if (file) backendFormData.append("file", file);
    
    const version = formData.get("version") as string;
    if (version) backendFormData.append("version", version);
    
    const targetDevice = formData.get("targetDevice") as string;
    if (targetDevice) backendFormData.append("targetDevice", targetDevice);

    const backendRes = await fetch("http://localhost:8080/api/ota/upload", {
      method: "POST",
      body: backendFormData,
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      return Response.json({ error: errText }, { status: backendRes.status });
    }

    const data = await backendRes.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
