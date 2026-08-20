import { requireAuth } from "@/lib/require-auth";

export async function POST(request) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const csv = await request.json();

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": 'attachment; filename="pricing_results.csv"',
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to generate download" },
      { status: 500 },
    );
  }
}
