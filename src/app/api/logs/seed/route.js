import connectDB from "@/lib/mongodb";
import { DailySummaryLog } from "@/lib/models";
import { SEED_LOGS } from "@/lib/seedLogs";

export async function POST() {
  try {
    await connectDB();

    const existingCount = await DailySummaryLog.countDocuments();
    if (existingCount > 0) {
      return Response.json({
        success: true,
        seeded: 0,
        message: "Database already contains logs",
        total: existingCount,
      });
    }

    const documents = SEED_LOGS.map((row) => ({
      ...row,
      savedAt: new Date(row.dateIso + "T12:00:00"),
    }));

    await DailySummaryLog.insertMany(documents);

    return Response.json({
      success: true,
      seeded: documents.length,
      message: `Seeded ${documents.length} historical log entries`,
    });
  } catch (error) {
    console.error("Failed to seed logs:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to seed logs" },
      { status: 500 },
    );
  }
}
