import connectDB from "@/lib/mongodb";
import { DailySummaryLog } from "@/lib/models";
import {
  buildLogFromResults,
  formatDateStr,
  toDateIso,
} from "@/lib/logUtils";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter = {};
    if (startDate || endDate) {
      filter.dateIso = {};
      if (startDate) filter.dateIso.$gte = startDate;
      if (endDate) filter.dateIso.$lte = endDate;
    }

    const logs = await DailySummaryLog.find(filter)
      .sort({ dateIso: 1 })
      .lean();

    return Response.json({ success: true, data: logs });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to fetch logs" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const now = new Date();
    const dateIso = toDateIso(now);
    const dateStr = formatDateStr(now);

    let logData;

    if (body.stats && body.summary) {
      logData = buildLogFromResults(body);
    } else if (body.units !== undefined) {
      logData = body;
    } else {
      return Response.json(
        { success: false, error: "Invalid log payload" },
        { status: 400 },
      );
    }

    const existing = await DailySummaryLog.findOne({ dateIso });

    const payload = {
      ...logData,
      dateStr,
      dateIso,
      savedAt: now,
    };

    let log;
    if (existing) {
      log = await DailySummaryLog.findOneAndUpdate(
        { dateIso },
        payload,
        { new: true },
      );
    } else {
      log = await DailySummaryLog.create(payload);
    }

    return Response.json({
      success: true,
      data: log,
      updated: !!existing,
    });
  } catch (error) {
    console.error("Failed to save log:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to save log" },
      { status: 500 },
    );
  }
}
