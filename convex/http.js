import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS preflight for /get-portfolio
http.route({
  path: "/get-portfolio",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }),
});

// Handle GET /get-portfolio
http.route({
  path: "/get-portfolio",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const data = await ctx.runQuery(api.portfolio.get);
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }),
});

// Handle OPTIONS preflight for /save-portfolio
http.route({
  path: "/save-portfolio",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }),
});

// Handle POST /save-portfolio
http.route({
  path: "/save-portfolio",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const dataToSave = body.data !== undefined ? body.data : body;
      await ctx.runMutation(api.portfolio.save, { data: dataToSave });
      return new Response(
        JSON.stringify({ success: true, message: "Saved to Convex cloud" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  }),
});

export default http;
