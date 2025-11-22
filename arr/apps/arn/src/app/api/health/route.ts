export async function GET() {
  return Response.json({
    status: "ok",
    service: "arn",
    timestamp: new Date().toISOString()
  });
}


