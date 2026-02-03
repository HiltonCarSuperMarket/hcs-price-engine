import { defaultConfig } from "@/lib/defaultConfig";

// Store configurations in memory (in production, use a database)
let configs = {
  default: defaultConfig,
};

export async function GET() {
  try {
    return new Response(
      JSON.stringify({
        success: true,
        data: Object.values(configs),
        current: "default",
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
    const { action, config, id } = body;

    if (action === "save") {
      // Save or update a configuration
      configs[config.name] = {
        ...config,
        id: config.name,
      };

      return new Response(
        JSON.stringify({
          success: true,
          message: "Configuration saved successfully",
          data: config,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (action === "delete") {
      if (id === "default") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Cannot delete default configuration",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      delete configs[id];

      return new Response(
        JSON.stringify({
          success: true,
          message: "Configuration deleted successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (action === "get") {
      const config = configs[id];
      if (!config) {
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
          data: config,
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
        error: "Invalid action",
      }),
      {
        status: 400,
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
