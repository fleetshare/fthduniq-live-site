export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    try {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS workstation_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT,
          status TEXT,
          customer_name TEXT,
          customer_phone TEXT,
          created_by_role TEXT,
          created_by_name TEXT,
          data_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      if (url.pathname === "/api/workstation/records" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT * FROM workstation_records ORDER BY id DESC"
        ).all();

        return Response.json(result.results || [], { headers: cors });
      }

      if (url.pathname === "/api/workstation/records" && request.method === "POST") {
        const body = await request.json();

        const result = await env.DB.prepare(`
          INSERT INTO workstation_records
          (type, status, customer_name, customer_phone, created_by_role, created_by_name, data_json)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        `).bind(
          body.type || "",
          body.status || "Saved",
          body.customer_name || "",
          body.customer_phone || "",
          body.created_by_role || "",
          body.created_by_name || "",
          JSON.stringify(body.data || body || {})
        ).run();

        return Response.json({
          success: true,
          id: result.meta.last_row_id
        }, { headers: cors });
      }

      if (url.pathname.startsWith("/api/workstation/records/") && request.method === "PUT") {
        const id = url.pathname.split("/").pop();
        const body = await request.json();

        await env.DB.prepare(`
          UPDATE workstation_records
          SET type=?1, status=?2, customer_name=?3, customer_phone=?4,
              created_by_role=?5, created_by_name=?6, data_json=?7
          WHERE id=?8
        `).bind(
          body.type || "",
          body.status || "Saved",
          body.customer_name || "",
          body.customer_phone || "",
          body.created_by_role || "",
          body.created_by_name || "",
          JSON.stringify(body.data || body || {}),
          id
        ).run();

        return Response.json({ success: true }, { headers: cors });
      }

      if (url.pathname === "/api/workstation/records/clear" && request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM workstation_records").run();

        return Response.json({
          success: true,
          message: "All workstation records cleared"
        }, { headers: cors });
      }

      if (url.pathname === "/api/workstation/clear-operational-records" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));

        if (body.passcode !== "0000" && body.passcode !== "FTHDUNIQ2024") {
          return Response.json({
            success: false,
            error: "Invalid Director passcode"
          }, { status: 403, headers: cors });
        }

        await env.DB.prepare("DELETE FROM workstation_records").run();

        return Response.json({
          success: true,
          message: "All operational records cleared"
        }, { headers: cors });
      }

      if (url.pathname.startsWith("/api/workstation/records/") && request.method === "DELETE") {
        const id = url.pathname.split("/").pop();

        await env.DB.prepare(
          "DELETE FROM workstation_records WHERE id=?1"
        ).bind(id).run();

        return Response.json({ success: true }, { headers: cors });
      }

      if (url.pathname === "/health" || url.pathname === "/api/workstation/health") {
        return Response.json({
          status: "healthy",
          service: "fthduniq-d1-api"
        }, { headers: cors });
      }

      return Response.json({
        error: "Not found"
      }, { status: 404, headers: cors });

    } catch (error) {
      return Response.json({
        success: false,
        error: String(error.message || error)
      }, { status: 500, headers: cors });
    }
  }
};
