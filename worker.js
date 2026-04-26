const APPLICATION_LIMIT = 50;
const APPLICATION_COUNT_KEY = "career_application_count";
const APPLICATION_OPEN_KEY = "career_applications_open";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/application-status" && request.method === "GET") {
      return handleApplicationStatus(env);
    }

    if (url.pathname === "/api/career-email" && request.method === "POST") {
      return handleCareerEmail(request, env);
    }

    if (url.pathname === "/api/reset-application-count" && request.method === "POST") {
      return handleResetApplicationCount(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function getApplicationCount(env) {
  const current = await env.CAREER_KV.get(APPLICATION_COUNT_KEY);
  const count = Number(current || "0");
  return Number.isFinite(count) ? count : 0;
}

async function isApplicationOpen(env) {
  const openValue = await env.CAREER_KV.get(APPLICATION_OPEN_KEY);

  if (openValue === "false") {
    return false;
  }

  return true;
}

async function handleApplicationStatus(env) {
  const count = await getApplicationCount(env);
  const manuallyOpen = await isApplicationOpen(env);
  const remaining = Math.max(APPLICATION_LIMIT - count, 0);
  const open = manuallyOpen && count < APPLICATION_LIMIT;

  return Response.json({
    ok: true,
    open,
    count,
    limit: APPLICATION_LIMIT,
    remaining
  });
}

async function handleResetApplicationCount(request, env) {
  const adminKey = request.headers.get("x-admin-key");

  if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
    return Response.json(
      { ok: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  await env.CAREER_KV.put(APPLICATION_COUNT_KEY, "0");
  await env.CAREER_KV.put(APPLICATION_OPEN_KEY, "true");

  return Response.json({
    ok: true,
    message: "Application count reset to 0 and applications reopened."
  });
}

async function handleCareerEmail(request, env) {
  try {
    if (!env.RESEND_API_KEY) {
      return Response.json(
        { ok: false, message: "RESEND_API_KEY is not set in Cloudflare." },
        { status: 500 }
      );
    }

    if (!env.CAREER_KV) {
      return Response.json(
        { ok: false, message: "CAREER_KV binding is not set in Cloudflare." },
        { status: 500 }
      );
    }

    const countBefore = await getApplicationCount(env);
    const manuallyOpen = await isApplicationOpen(env);

    if (!manuallyOpen || countBefore >= APPLICATION_LIMIT) {
      return Response.json(
        {
          ok: false,
          closed: true,
          message: "Applications are currently closed. The application limit has been reached."
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const fullName = String(formData.get("fullName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const position = String(formData.get("position") || "").trim();
    const qualification = String(formData.get("qualification") || "").trim();
    const experience = String(formData.get("experience") || "").trim();
    const onsite = String(formData.get("onsite") || "").trim();
    const relevantExperience = String(formData.get("relevantExperience") || "").trim();

    const cv = formData.get("cv");
    const coverLetter = formData.get("coverLetter");

    if (!fullName || !phone || !email || !location || !position || !qualification || !experience || !onsite || !relevantExperience) {
      return Response.json(
        { ok: false, message: "Please complete all required fields." },
        { status: 400 }
      );
    }

    const attachments = [];

    async function addAttachment(file, label) {
      if (!file || typeof file === "string" || !file.name) return;

      const allowedExtensions = [".pdf", ".doc", ".docx"];
      const fileName = file.name.toLowerCase();
      const hasAllowedExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));

      if (!hasAllowedExtension) {
        throw new Error(label + " must be PDF, DOC, or DOCX.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error(label + " is too large. Please upload a file below 5MB.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";

      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      attachments.push({
        filename: file.name,
        content: btoa(binary)
      });
    }

    await addAttachment(cv, "CV");
    await addAttachment(coverLetter, "Cover letter");

    const safe = (value) =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const subject = `Career Application ${countBefore + 1} of ${APPLICATION_LIMIT} - ${position} - ${fullName}`;

    const textBody =
      `New Career Application - FTH D-UNIQ\n\n` +
      `Application Number: ${countBefore + 1} of ${APPLICATION_LIMIT}\n\n` +
      `Full Name: ${fullName}\n` +
      `Phone / WhatsApp Number: ${phone}\n` +
      `Email Address: ${email}\n` +
      `Location: ${location}\n` +
      `Position Applying For: ${position}\n` +
      `Highest Qualification: ${qualification}\n` +
      `Years of Relevant Experience: ${experience}\n` +
      `Able to work within Amuwo-Odofin / Festac axis: ${onsite}\n\n` +
      `Relevant Experience:\n${relevantExperience}\n\n` +
      `Submitted from the FTH D-UNIQ website career form.`;

    const htmlBody =
      `<h2>New Career Application - FTH D-UNIQ</h2>` +
      `<p><strong>Application Number:</strong> ${countBefore + 1} of ${APPLICATION_LIMIT}</p>` +
      `<p><strong>Full Name:</strong> ${safe(fullName)}</p>` +
      `<p><strong>Phone / WhatsApp Number:</strong> ${safe(phone)}</p>` +
      `<p><strong>Email Address:</strong> ${safe(email)}</p>` +
      `<p><strong>Location:</strong> ${safe(location)}</p>` +
      `<p><strong>Position Applying For:</strong> ${safe(position)}</p>` +
      `<p><strong>Highest Qualification:</strong> ${safe(qualification)}</p>` +
      `<p><strong>Years of Relevant Experience:</strong> ${safe(experience)}</p>` +
      `<p><strong>Able to work within Amuwo-Odofin / Festac axis:</strong> ${safe(onsite)}</p>` +
      `<h3>Relevant Experience</h3>` +
      `<p>${safe(relevantExperience).replace(/\n/g, "<br>")}</p>` +
      `<p>Submitted from the FTH D-UNIQ website career form.</p>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "FTH D-UNIQ Careers <onboarding@resend.dev>",
        to: ["careers@fthduniq.com"],
        reply_to: email,
        subject,
        text: textBody,
        html: htmlBody,
        attachments
      })
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      return Response.json(
        {
          ok: false,
          message: "Resend could not send the application email.",
          details: resendResult
        },
        { status: 500 }
      );
    }

    const newCount = countBefore + 1;
    await env.CAREER_KV.put(APPLICATION_COUNT_KEY, String(newCount));

    if (newCount >= APPLICATION_LIMIT) {
      await env.CAREER_KV.put(APPLICATION_OPEN_KEY, "false");
    }

    return Response.json({
      ok: true,
      message: "Application submitted successfully.",
      count: newCount,
      limit: APPLICATION_LIMIT,
      remaining: Math.max(APPLICATION_LIMIT - newCount, 0),
      closed: newCount >= APPLICATION_LIMIT
    });

  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error.message || "Application could not be submitted. Please email careers@fthduniq.com directly."
      },
      { status: 500 }
    );
  }
}
