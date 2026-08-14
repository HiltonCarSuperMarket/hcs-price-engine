import connectDB from "@/lib/mongodb";
import { ProcessLogRecord } from "@/lib/models";

/**
 * Legacy seed endpoint — no longer seeds summary-only history.
 * New dashboard uses ProcessLogRecord data from Save Log only.
 */
export async function POST() {
  try {
    await connectDB();
    const total = await ProcessLogRecord.countDocuments();
    return Response.json({
      success: true,
      seeded: 0,
      message:
        "Legacy summary seed disabled. Dashboard uses detailed process logs from Save Log.",
      total,
    });
  } catch (error) {
    console.error("Failed to check process logs:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to check process logs" },
      { status: 500 },
    );
  }
}
