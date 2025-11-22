import type { NextRequest } from "next/server";

export async function GET() {
  return Response.json({
    message: "Example GET endpoint",
    items: ["alpha", "beta", "gamma"]
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  return Response.json(
    {
      message: "Example POST endpoint",
      received: body ?? null
    },
    { status: 201 }
  );
}


