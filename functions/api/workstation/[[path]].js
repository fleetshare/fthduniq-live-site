export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-fth-key",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  function safeJson(value) {
    try {
      return JSON.parse(value || "{}");
    } catch {
      return {};
    }
  }

  function cleanPhone(value = "") {
    return String(value).replace(/\D/g, "");
  }

  function idPrefix(type) {
    const map = {
      quote: "QUOTE",
      invoice: "INVOICE",
      payment: "PAYMENT",
      receipt: "RECEIPT",
      waybill: "WAYBILL",
      stock: "STOCK",
      procurementRequest: "PROC-REQ",
      procurement: "PROC",
      logistics: "LOG",
      followup: "FOLLOWUP",
      customer: "CUSTOMER",
      officer: "OFFICER",
      archive: "ARCHIVE",
      report: "REPORT",
    };

    return map[type] || String(type || "RECORD").toUpperCase();
  }

  async function nextBusinessId(type) {
    const prefix = idPrefix(type);
    const year = new Date().getFullYear();

    const existing = await env.DB.prepare(
      "SELECT last_number FROM workstation_counters WHERE type = ?"
    ).bind(type).first();

    const next = Number(existing?.last_number || 0) + 1;

    await env.DB.prepare(
      `INSERT INTO workstation_counters (type, last_number)
       VALUES (?, ?)
       ON CONFLICT(type) DO UPDATE SET last_number = excluded.last_number`
    ).bind(type, next).run();

    return `FTH-${prefix}-${year}-${String(next).padStart(4, "0")}`;
  }

  async function writeAudit({ recordId, action, officerRole, officerName, data }) {
    await env.DB.prepare(
      `INSERT INTO workstation_audit_log
       (id, record_id, action, officer_role, officer_name, data_json)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      recordId || "",
      action || "",
      officerRole || "",
      officerName || "",
      JSON.stringify(data || {})
    ).run();
  }

  if (!env.DB) {
    return json({
      ok: false,
      message: "DB binding is missing. Add D1 binding name as DB.",
    }, 500);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/workstation\/?/, "");

  try {
    if (path === "health") {
      return json({
        ok: true,
        message: "FTH D-UNIQ workstation API is connected.",
        database: "DB",
        time: new Date().toISOString(),
      });
    }

    if (path === "records" && request.method === "GET") {
      const type = url.searchParams.get("type") || "";
      const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);

      let result;

      if (type) {
        result = await env.DB.prepare(
          `SELECT * FROM workstation_records
           WHERE type = ?
           ORDER BY created_at DESC
           LIMIT ?`
        ).bind(type, limit).all();
      } else {
        result = await env.DB.prepare(
          `SELECT * FROM workstation_records
           ORDER BY created_at DESC
           LIMIT ?`
        ).bind(limit).all();
      }

      const records = (result.results || []).map((row) => ({
        id: row.id,
        type: row.type,
        business_ref: row.business_ref,
        status: row.status,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        created_by_role: row.created_by_role,
        created_by_name: row.created_by_name,
        created_at: row.created_at,
        updated_at: row.updated_at,
        data: safeJson(row.data_json),
      }));

      return json({ ok: true, records });
    }

    if (path === "records" && request.method === "POST") {
      const body = await request.json();

      const type = body.type || "record";
      const data = body.data || body;
      const businessRef = body.business_ref || data.id || await nextBusinessId(type);
      const recordId = body.id || businessRef;

      const customerName =
        body.customer_name ||
        data.customer ||
        data.customerName ||
        data.name ||
        "";

      const customerPhone =
        body.customer_phone ||
        data.phone ||
        data.customerPhone ||
        "";

      const status =
        body.status ||
        data.status ||
        "New";

      const officerRole =
        body.created_by_role ||
        data.createdByRole ||
        data.role ||
        "";

      const officerName =
        body.created_by_name ||
        data.createdByName ||
        data.enteredBy ||
        data.officerName ||
        "";

      await env.DB.prepare(
        `INSERT INTO workstation_records
         (id, type, business_ref, status, customer_name, customer_phone, created_by_role, created_by_name, data_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        recordId,
        type,
        businessRef,
        status,
        customerName,
        cleanPhone(customerPhone),
        officerRole,
        officerName,
        JSON.stringify({ ...data, id: businessRef })
      ).run();

      await writeAudit({
        recordId,
        action: "CREATE",
        officerRole,
        officerName,
        data,
      });

      return json({
        ok: true,
        message: "Record saved.",
        id: recordId,
        business_ref: businessRef,
      });
    }

    if (path.startsWith("records/") && request.method === "PUT") {
      const recordId = decodeURIComponent(path.replace("records/", ""));
      const body = await request.json();
      const data = body.data || body;

      const existing = await env.DB.prepare(
        "SELECT * FROM workstation_records WHERE id = ?"
      ).bind(recordId).first();

      if (!existing) {
        return json({ ok: false, message: "Record not found." }, 404);
      }

      const oldData = safeJson(existing.data_json);
      const mergedData = { ...oldData, ...data };

      const status = body.status || data.status || existing.status;
      const customerName =
        body.customer_name ||
        data.customer ||
        data.customerName ||
        existing.customer_name ||
        "";

      const customerPhone =
        body.customer_phone ||
        data.phone ||
        data.customerPhone ||
        existing.customer_phone ||
        "";

      await env.DB.prepare(
        `UPDATE workstation_records
         SET status = ?,
             customer_name = ?,
             customer_phone = ?,
             updated_at = CURRENT_TIMESTAMP,
             data_json = ?
         WHERE id = ?`
      ).bind(
        status,
        customerName,
        cleanPhone(customerPhone),
        JSON.stringify(mergedData),
        recordId
      ).run();

      await writeAudit({
        recordId,
        action: "UPDATE",
        officerRole: body.officer_role || data.role || "",
        officerName: body.officer_name || data.officerName || "",
        data: mergedData,
      });

      return json({
        ok: true,
        message: "Record updated.",
        id: recordId,
      });
    }

    if (path.startsWith("records/") && request.method === "DELETE") {
      const recordId = decodeURIComponent(path.replace("records/", ""));

      await env.DB.prepare(
        "DELETE FROM workstation_records WHERE id = ?"
      ).bind(recordId).run();

      await writeAudit({
        recordId,
        action: "DELETE",
        officerRole: "",
        officerName: "",
        data: {},
      });

      return json({
        ok: true,
        message: "Record deleted.",
        id: recordId,
      });
    }

    if (path === "next-id" && request.method === "POST") {
      const body = await request.json();
      const type = body.type || "record";
      const businessRef = await nextBusinessId(type);

      return json({
        ok: true,
        id: businessRef,
      });
    }

    return json({
      ok: false,
      message: "Route not found.",
      path,
    }, 404);

  } catch (error) {
    return json({
      ok: false,
      message: error.message || "Server error",
    }, 500);
  }
}
