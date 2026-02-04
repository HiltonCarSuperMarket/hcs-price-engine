import connectDB from "@/lib/mongodb";
import { Strategy } from "@/lib/models";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get("strategyId");

    // Fetch strategy with target_matrix configuration
    const strategy = await Strategy.findOne({
      name: "Default Strategy",
    }).lean();

    if (!strategy) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Strategy not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Extract age_bands, rating_bands, and target_matrix
    const ageBands = strategy.age_bands || [];
    const ratingBands = strategy.rating_bands || [];
    const targetMatrix = strategy.target_matrix || {};

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ageBands,
          ratingBands,
          targetMatrix,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("GET /api/target-matrix error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { strategyId, targetMatrix } = body;

    if (!strategyId || !targetMatrix) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "strategyId and targetMatrix are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate that all values are filled
    for (const [ageBand, ratingData] of Object.entries(targetMatrix)) {
      for (const [ratingBand, value] of Object.entries(ratingData)) {
        if (value === null || value === undefined || value === "") {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Missing value for age band "${ageBand}" and rating band "${ratingBand}"`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Invalid value for age band "${ageBand}" and rating band "${ratingBand}". Must be a number.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }
    }

    // Update strategy with new target_matrix
    const updatedStrategy = await Strategy.findOneAndUpdate(
      { name: "Default Strategy" }, // filter
      { target_matrix: targetMatrix }, // update
      { new: true }, // return updated doc
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Target matrix updated successfully",
        data: updatedStrategy,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("POST /api/target-matrix error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
