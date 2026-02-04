import { defaultConfig } from "@/lib/defaultConfig";

// Store single configuration in memory (in production, use a database)
let currentConfig = { ...defaultConfig };

export async function GET() {
  try {
    return new Response(
      JSON.stringify({
        success: true,
        data: currentConfig,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
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
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configuration is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate age bands (no overlaps, no gaps)
    const ageBands = config.age_bands || [];
    if (ageBands.length > 0) {
      // Check for overlaps and gaps
      for (let i = 0; i < ageBands.length - 1; i++) {
        const current = ageBands[i];
        const next = ageBands[i + 1];

        // Current band's max should be one less than next band's min
        if (
          current.max !== undefined &&
          next.min !== undefined &&
          current.max + 1 !== next.min
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Gap or overlap between bands "${current.name}" and "${next.name}"`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      // First band should have min 0 or -Infinity
      if (ageBands[0].min !== 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "First age band must start at 0",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Last band should have no max (open-ended)
      if (ageBands[ageBands.length - 1].max !== undefined) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Last age band must be open-ended (no maximum)",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Update configuration
    currentConfig = {
      ...currentConfig,
      ...config,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Configuration updated successfully",
        data: currentConfig,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
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
