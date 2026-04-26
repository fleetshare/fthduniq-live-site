export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/career-email" && request.method === "POST") {
      return handleCareerEmail(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleCareerEmail(request, env) {
  try {
    if (!env.RESEND_API_KEY) {
      return Response.json(
        { ok: false, message: "RESEND_API_KEY is not set in Cloudflare." },
        { status: 500 }
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

    const subject = `Career Application - ${position} - ${fullName}`;

    const textBody =
      `New Career Application - FTH D-UNIQ\n\n` +
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
        subject: subject,
        text: textBody,
        html: htmlBody,
        attachments: attachments
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

    return Response.json({
      ok: true,
      message: "Application submitted successfully."
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
