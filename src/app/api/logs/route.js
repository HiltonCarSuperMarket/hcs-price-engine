import connectDB from "@/lib/mongodb";
import { ProcessLogRecord } from "@/lib/models";
import {
  buildLogRecordsFromResults,
  deriveDailySummariesFromRecords,
  formatDateStr,
  toDateIso,
} from "@/lib/logUtils";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const dateIso = searchParams.get("dateIso");
    const detail = searchParams.get("detail") === "true";
    const view = searchParams.get("view") || "all";

    const filter = {};
    if (dateIso) {
      filter.dateIso = dateIso;
    } else if (startDate || endDate) {
      filter.dateIso = {};
      if (startDate) filter.dateIso.$gte = startDate;
      if (endDate) filter.dateIso.$lte = endDate;
    }

    const VIEW_CATEGORIES = {
      all: null,
      units: null,
      pc_up: ["pc_up"],
      pc_down: ["pc_down"],
      pr_down: ["pr_down"],
      issues: ["issue"],
      blocked: ["blocked"],
      increase: ["pc_up"],
      drop: ["pc_down", "pr_down"],
      net: ["pc_up", "pc_down", "pr_down"],
    };

    if (detail) {
      const categories = VIEW_CATEGORIES[view];
      if (categories) {
        filter.category = { $in: categories };
      }

      const records = await ProcessLogRecord.find(filter)
        .sort({ category: 1, stock_id: 1 })
        .lean();

      return Response.json({
        success: true,
        data: records,
        meta: {
          dateIso: dateIso || null,
          view,
          count: records.length,
        },
      });
    }

    const records = await ProcessLogRecord.find(filter)
      .sort({ dateIso: 1, savedAt: 1 })
      .lean();

    const summaries = deriveDailySummariesFromRecords(records);
    return Response.json({ success: true, data: summaries });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to fetch logs" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const dateIso = searchParams.get("dateIso");
    const id = searchParams.get("id");

    if (!dateIso && !id) {
      return Response.json(
        { success: false, error: "dateIso or id is required" },
        { status: 400 },
      );
    }

    const targetDate = dateIso || id;
    const result = await ProcessLogRecord.deleteMany({ dateIso: targetDate });

    if (result.deletedCount === 0) {
      return Response.json(
        { success: false, error: "Log not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Failed to delete log:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to delete log" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const now = new Date();
    const dateIso = toDateIso(now);
    const dateStr = formatDateStr(now);

    if (!Array.isArray(body.results)) {
      return Response.json(
        {
          success: false,
          error: "Invalid log payload — results array is required",
        },
        { status: 400 },
      );
    }

    const logRows = buildLogRecordsFromResults(body.results);
    const existingCount = await ProcessLogRecord.countDocuments({ dateIso });

    await ProcessLogRecord.deleteMany({ dateIso });

    if (logRows.length > 0) {
      await ProcessLogRecord.insertMany(
        logRows.map((row) => ({
          ...row,
          dateIso,
          dateStr,
          savedAt: now,
        })),
      );
    }

    const summaries = deriveDailySummariesFromRecords(
      await ProcessLogRecord.find({ dateIso }).lean(),
    );

    return Response.json({
      success: true,
      data: summaries[0] || {
        dateIso,
        dateStr,
        savedAt: now,
        units: 0,
        pcUp: 0,
        pcDown: 0,
        prUp: 0,
        prDown: 0,
        issues: 0,
        blocked: 0,
        drop: 0,
        increase: 0,
        net: 0,
      },
      savedRecords: logRows.length,
      updated: existingCount > 0,
    });
  } catch (error) {
    console.error("Failed to save log:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to save log" },
      { status: 500 },
    );
  }
}
