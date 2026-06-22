import { defaultConfig } from "@/lib/defaultConfig";
import connectDB from "@/lib/mongodb";
import { Strategy, Configuration } from "@/lib/models";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'strategy', 'config', or 'all'
    const id = searchParams.get("id"); // Strategy ID or config ID

    if (type === "config") {
      if (id) {
        const configItem = await Configuration.findById(id);
        if (!configItem) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Configuration not found",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: configItem,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const configs = await Configuration.find();
      return new Response(
        JSON.stringify({
          success: true,
          data: configs,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (type === "strategy") {
      if (id) {
        const strategy = await Strategy.findById(id);
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

        return new Response(
          JSON.stringify({
            success: true,
            data: strategy,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const strategies = await Strategy.find();
      return new Response(
        JSON.stringify({
          success: true,
          data: strategies,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (type === "all") {
      const [configs, strategies] = await Promise.all([
        Configuration.find(),
        Strategy.find(),
      ]);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            configurations: configs,
            strategies,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (id) {
      const strategy = await Strategy.findById(id);
      if (strategy) {
        return new Response(
          JSON.stringify({
            success: true,
            data: strategy,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const configItem = await Configuration.findById(id);
      if (configItem) {
        return new Response(
          JSON.stringify({
            success: true,
            data: configItem,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Resource not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Default: return all strategies using the Strategy schema.
    const strategies = await Strategy.find();

    return new Response(
      JSON.stringify({
        success: true,
        data: strategies,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("GET /api/config error:", error);
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
    const { action, config, id, configData } = body;

    if (action === "save" && config) {
      // Save strategy
      let strategy;

      // Validate age bands

      const ageBands = config.age_bands || [];

      // ---- Validation (uses object format) ----
      if (ageBands.length > 0) {
        // Check for overlaps and gaps
        for (let i = 0; i < ageBands.length - 1; i++) {
          const current = ageBands[i];
          const next = ageBands[i + 1];

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

      // ---- Convert ageBands IN-PLACE to expected string format ----
      for (let i = 0; i < ageBands.length; i++) {
        const band = ageBands[i];

        if (band.max === undefined || band.max === null) {
          ageBands[i] = `${band.min}+`; // "180+"
        } else {
          ageBands[i] = `${band.min}-${band.max}`;
        }
      }

      if (config._id) {
        // Update existing strategy
        strategy = await Strategy.findByIdAndUpdate(config._id, config, {
          new: true,
        });
      } else {
        // Check if strategy name already exists
        const existingStrategy = await Strategy.findOne({ name: config.name });
        if (existingStrategy) {
          // Update existing strategy with same name
          strategy = await Strategy.findOneAndUpdate(
            { name: config.name },
            config,
            { new: true },
          );
        } else {
          // Create new strategy
          strategy = await Strategy.create(config);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Strategy saved successfully",
          data: strategy,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (action === "delete" && id) {
      // Delete strategy
      if (id === "Default Strategy") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Cannot delete default strategy",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      await Strategy.findByIdAndDelete(id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Strategy deleted successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (action === "saveConfig" && configData) {
      // Save global configuration
      const { key, value, description, category } = configData;

      const existingConfig = await Configuration.findOne({ key });
      let savedConfig;

      if (existingConfig) {
        savedConfig = await Configuration.findOneAndUpdate(
          { key },
          { value, description, category },
          { new: true },
        );

        console.log(savedConfig);
      } else {
        savedConfig = await Configuration.create({
          key,
          value,
          description,
          category,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Configuration saved successfully",
          data: savedConfig,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid request",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("POST /api/config error:", error);
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
