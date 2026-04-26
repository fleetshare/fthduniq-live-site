const APPLICATION_LIMIT = 50;
const APPLICATION_COUNT_KEY = "career_application_count";
const APPLICATION_OPEN_KEY = "career_applications_open";

const DEFAULT_INTERVIEW_ROOM = "https://meet.google.com/ixd-aoht-oup";

const SAMPLE_CANDIDATES = {
  "FTH-INT-001": {
    code: "FTH-INT-001",
    name: "Interview Candidate",
    email: "candidate@example.com",
    role: "Business Support Officer",
    stage: "shortlisted_interview",
    interviewDate: "Immediate",
    interviewTime: "When invited",
    meetUrl: DEFAULT_INTERVIEW_ROOM,
    message: "You have been shortlisted for the interview stage of FTH D-UNIQ’s recruitment process. Please click the interview room button when you are ready for your interview."
  },

  "FTH-DOC-001": {
    code: "FTH-DOC-001",
    name: "Documentation Candidate",
    email: "candidate2@example.com",
    role: "Business Support Officer",
    stage: "documentation_screening",
    interviewDate: "",
    interviewTime: "",
    meetUrl: "",
    message: "Congratulations. You have moved to the pre-documentation screening stage of FTH D-UNIQ’s recruitment process. Please upload the required documents for review."
  },

  "FTH-DOC-FINAL": {
    code: "FTH-DOC-FINAL",
    name: "Final Selected Candidate",
    email: "finalcandidate@example.com",
    role: "Logistics & Delivery Coordination Officer",
    stage: "final_selected",
    interviewDate: "",
    interviewTime: "",
    meetUrl: "",
    message: "Congratulations. You have been selected for final resumption with FTH D-UNIQ. Please watch your email for official resumption instructions."
  },

  "FTH-DOC-NO": {
    code: "FTH-DOC-NO",
    name: "Reviewed Candidate",
    email: "notselected@example.com",
    role: "Truck Driver",
    stage: "not_selected",
    interviewDate: "",
    interviewTime: "",
    meetUrl: "",
    message: "Thank you for participating in FTH D-UNIQ’s recruitment process. After careful review, you have not been selected for final resumption at this time. We appreciate your interest and wish you success in your future opportunities."
  }
};

const STATUS_LABELS = {
  shortlisted_interview: "Shortlisted for Interview",
  interview_completed: "Interview Completed — Awaiting Decision",
  documentation_screening: "Documentation Screening",
  documents_received: "Documents Received — Under Review",
  final_selected: "Final Selected",
  not_selected: "Not Selected"
};

const NEXT_STEPS = {
  shortlisted_interview: "Attend your interview through the interview room button.",
  interview_completed: "Please wait for the next-stage decision from FTH D-UNIQ Careers.",
  documentation_screening: "Upload your required documents for screening.",
  documents_received: "Please wait while FTH D-UNIQ reviews your submitted documents.",
  final_selected: "Await official resumption instructions from FTH D-UNIQ Careers.",
  not_selected: "No further action is required at this stage."
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/application-status" && request.method === "GET") {
      return handleApplicationStatus(env);
    }

    if (url.pathname === "/api/career-email" && request.method === "POST") {
      return handleCareerEmail(request, env);
    }

    if (url.pathname === "/api/candidate-login" && request.method === "POST") {
      return handleCandidateLogin(request, env);
    }

    if (url.pathname === "/api/pre-doc-login" && request.method === "POST") {
      return handlePreDocLogin(request, env);
    }

    if (url.pathname === "/api/pre-documents" && request.method === "POST") {
      return handlePreDocuments(request, env);
    }

    if (url.pathname === "/api/candidate-documents" && request.method === "POST") {
      return handlePreDocuments(request, env);
    }

    if (url.pathname === "/api/reset-application-count" && request.method === "POST") {
      return handleResetApplicationCount(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function candidateKey(code) {
  return "candidate:" + String(code || "").trim().toUpperCase();
}

async function getCandidateRecord(env, code) {
  const cleanCode = String(code || "").trim().toUpperCase();

  if (!cleanCode) return null;

  if (env.CAREER_KV) {
    const stored = await env.CAREER_KV.get(candidateKey(cleanCode));

    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        return null;
      }
    }
  }

  return SAMPLE_CANDIDATES[cleanCode] || null;
}

async function saveCandidateRecord(env, candidate) {
  if (!env.CAREER_KV || !candidate || !candidate.code) return;

  await env.CAREER_KV.put(
    candidateKey(candidate.code),
    JSON.stringify(candidate)
  );
}

function publicCandidate(candidate) {
  return {
    code: candidate.code,
    name: candidate.name,
    email: candidate.email,
    role: candidate.role,
    stage: candidate.stage,
    statusLabel: STATUS_LABELS[candidate.stage] || candidate.stage,
    nextStep: NEXT_STEPS[candidate.stage] || "Please wait for further instructions.",
    interviewDate: candidate.interviewDate || "",
    interviewTime: candidate.interviewTime || "",
    meetUrl: candidate.meetUrl || "",
    message: candidate.message || "",
    canUploadDocuments: candidate.stage === "documentation_screening"
  };
}

async function getApplicationCount(env) {
  if (!env.CAREER_KV) return 0;

  const current = await env.CAREER_KV.get(APPLICATION_COUNT_KEY);
  const count = Number(current || "0");

  return Number.isFinite(count) ? count : 0;
}

async function isApplicationOpen(env) {
  if (!env.CAREER_KV) return true;

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

  return json({
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
    return json(
      { ok: false, message: "Unauthorized." },
      401
    );
  }

  if (!env.CAREER_KV) {
    return json(
      { ok: false, message: "CAREER_KV is not connected." },
      500
    );
  }

  await env.CAREER_KV.put(APPLICATION_COUNT_KEY, "0");
  await env.CAREER_KV.put(APPLICATION_OPEN_KEY, "true");

  return json({
    ok: true,
    message: "Application count reset to 0 and applications reopened."
  });
}

async function handleCandidateLogin(request, env) {
  try {
    const body = await request.json();

    const candidateCode = String(body.candidateCode || "").trim().toUpperCase();
    const candidateEmail = String(body.candidateEmail || "").trim().toLowerCase();

    if (!candidateCode || !candidateEmail) {
      return json({
        ok: false,
        message: "Please enter your access code and email address."
      }, 400);
    }

    const candidate = await getCandidateRecord(env, candidateCode);

    if (!candidate) {
      return json({
        ok: false,
        message: "Invalid candidate access code."
      }, 403);
    }

    if (String(candidate.email || "").toLowerCase() !== candidateEmail) {
      return json({
        ok: false,
        message: "The email address does not match this access code."
      }, 403);
    }

    if (
      candidate.stage !== "shortlisted_interview" &&
      candidate.stage !== "interview_completed"
    ) {
      return json({
        ok: false,
        message: "This access code is not for the interview portal. Please use the correct portal link provided by FTH D-UNIQ Careers."
      }, 403);
    }

    return json({
      ok: true,
      candidate: publicCandidate(candidate)
    });

  } catch (error) {
    return json({
      ok: false,
      message: "Candidate access could not be verified."
    }, 500);
  }
}

async function handlePreDocLogin(request, env) {
  try {
    const body = await request.json();

    const candidateCode = String(body.candidateCode || "").trim().toUpperCase();
    const candidateEmail = String(body.candidateEmail || "").trim().toLowerCase();

    if (!candidateCode || !candidateEmail) {
      return json({
        ok: false,
        message: "Please enter your pre-documentation access code and email address."
      }, 400);
    }

    const candidate = await getCandidateRecord(env, candidateCode);

    if (!candidate) {
      return json({
        ok: false,
        message: "Invalid pre-documentation access code."
      }, 403);
    }

    if (String(candidate.email || "").toLowerCase() !== candidateEmail) {
      return json({
        ok: false,
        message: "The email address does not match this access code."
      }, 403);
    }

    const allowedStages = [
      "documentation_screening",
      "documents_received",
      "final_selected",
      "not_selected"
    ];

    if (!allowedStages.includes(candidate.stage)) {
      return json({
        ok: false,
        message: "This access code is not for the pre-documentation screening portal."
      }, 403);
    }

    return json({
      ok: true,
      candidate: publicCandidate(candidate)
    });

  } catch (error) {
    return json({
      ok: false,
      message: "Pre-documentation access could not be verified."
    }, 500);
  }
}

async function handlePreDocuments(request, env) {
  try {
    if (!env.RESEND_API_KEY) {
      return json({
        ok: false,
        message: "RESEND_API_KEY is not set in Cloudflare."
      }, 500);
    }

    const formData = await request.formData();

    const candidateCode = String(formData.get("candidateCode") || "").trim().toUpperCase();
    const candidateEmail = String(formData.get("candidateEmail") || "").trim().toLowerCase();
    const candidateNotes = String(formData.get("candidateNotes") || "").trim();

    const candidate = await getCandidateRecord(env, candidateCode);

    if (!candidate) {
      return json({
        ok: false,
        message: "Invalid candidate access code."
      }, 403);
    }

    if (String(candidate.email || "").toLowerCase() !== candidateEmail) {
      return json({
        ok: false,
        message: "The email address does not match this access code."
      }, 403);
    }

    if (candidate.stage !== "documentation_screening") {
      return json({
        ok: false,
        message: "Document upload is not currently available for this candidate stage."
      }, 403);
    }

    const attachments = [];

    await addAttachment(formData.get("validId"), "Valid ID", attachments);
    await addAttachment(formData.get("passportPhoto"), "Passport Photograph", attachments);
    await addAttachment(formData.get("qualificationDoc"), "Certificate / Qualification Document", attachments);
    await addAttachment(formData.get("nyscDoc"), "NYSC / Exemption / Applicable Document", attachments);
    await addAttachment(formData.get("itLetter"), "Industrial Training / SIWES Letter", attachments);
    await addAttachment(formData.get("guarantorDoc"), "Reference / Guarantor Document", attachments);
    await addAttachment(formData.get("driverLicense"), "Driver’s Licence", attachments);
    await addAttachment(formData.get("otherDoc"), "Other Requested Document", attachments);

    if (!attachments.length) {
      return json({
        ok: false,
        message: "Please upload at least one document."
      }, 400);
    }

    const subject = `Pre-Documentation Documents - ${candidate.name} - ${candidate.role}`;

    const textBody =
      `Pre-Documentation Screening Documents - FTH D-UNIQ\n\n` +
      `Candidate Name: ${candidate.name}\n` +
      `Candidate Email: ${candidate.email}\n` +
      `Access Code: ${candidateCode}\n` +
      `Role: ${candidate.role}\n` +
      `Current Stage: ${STATUS_LABELS[candidate.stage] || candidate.stage}\n\n` +
      `Candidate Notes:\n${candidateNotes || "No notes provided."}\n\n` +
      `Documents were uploaded from the FTH D-UNIQ Pre-Documentation Screening Portal.`;

    const htmlBody =
      `<h2>Pre-Documentation Screening Documents - FTH D-UNIQ</h2>` +
      `<p><strong>Candidate Name:</strong> ${escapeHtml(candidate.name)}</p>` +
      `<p><strong>Candidate Email:</strong> ${escapeHtml(candidate.email)}</p>` +
      `<p><strong>Access Code:</strong> ${escapeHtml(candidateCode)}</p>` +
      `<p><strong>Role:</strong> ${escapeHtml(candidate.role)}</p>` +
      `<p><strong>Current Stage:</strong> ${escapeHtml(STATUS_LABELS[candidate.stage] || candidate.stage)}</p>` +
      `<h3>Candidate Notes</h3>` +
      `<p>${escapeHtml(candidateNotes || "No notes provided.").replace(/\n/g, "<br>")}</p>` +
      `<p>Documents were uploaded from the FTH D-UNIQ Pre-Documentation Screening Portal.</p>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "FTH D-UNIQ Careers <careers@fthduniq.com>",
        to: ["careers@fthduniq.com"],
        reply_to: candidate.email,
        subject,
        text: textBody,
        html: htmlBody,
        attachments
      })
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      return json({
        ok: false,
        message: "Documents could not be emailed.",
        details: resendResult
      }, 500);
    }

    candidate.stage = "documents_received";
    candidate.message = "Your documents have been received. FTH D-UNIQ will review your submission and communicate the next step through official contact channels.";

    await saveCandidateRecord(env, candidate);

    return json({
      ok: true,
      message: "Documents submitted successfully."
    });

  } catch (error) {
    return json({
      ok: false,
      message: error.message || "Documents could not be submitted."
    }, 500);
  }
}

async function handleCareerEmail(request, env) {
  try {
    if (!env.RESEND_API_KEY) {
      return json(
        { ok: false, message: "RESEND_API_KEY is not set in Cloudflare." },
        500
      );
    }

    if (!env.CAREER_KV) {
      return json(
        { ok: false, message: "CAREER_KV binding is not set in Cloudflare." },
        500
      );
    }

    const countBefore = await getApplicationCount(env);
    const manuallyOpen = await isApplicationOpen(env);

    if (!manuallyOpen || countBefore >= APPLICATION_LIMIT) {
      return json(
        {
          ok: false,
          closed: true,
          message: "Applications are currently closed for this role. Please check back when another opportunity is announced."
        },
        403
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
      return json(
        { ok: false, message: "Please complete all required fields." },
        400
      );
    }

    const attachments = [];

    await addAttachment(cv, "CV", attachments);
    await addAttachment(coverLetter, "Cover Letter", attachments);

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
      `<p><strong>Full Name:</strong> ${escapeHtml(fullName)}</p>` +
      `<p><strong>Phone / WhatsApp Number:</strong> ${escapeHtml(phone)}</p>` +
      `<p><strong>Email Address:</strong> ${escapeHtml(email)}</p>` +
      `<p><strong>Location:</strong> ${escapeHtml(location)}</p>` +
      `<p><strong>Position Applying For:</strong> ${escapeHtml(position)}</p>` +
      `<p><strong>Highest Qualification:</strong> ${escapeHtml(qualification)}</p>` +
      `<p><strong>Years of Relevant Experience:</strong> ${escapeHtml(experience)}</p>` +
      `<p><strong>Able to work within Amuwo-Odofin / Festac axis:</strong> ${escapeHtml(onsite)}</p>` +
      `<h3>Relevant Experience</h3>` +
      `<p>${escapeHtml(relevantExperience).replace(/\n/g, "<br>")}</p>` +
      `<p>Submitted from the FTH D-UNIQ website career form.</p>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "FTH D-UNIQ Careers <careers@fthduniq.com>",
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
      return json(
        {
          ok: false,
          message: "Resend could not send the application email.",
          details: resendResult
        },
        500
      );
    }

    const newCount = countBefore + 1;
    await env.CAREER_KV.put(APPLICATION_COUNT_KEY, String(newCount));

    if (newCount >= APPLICATION_LIMIT) {
      await env.CAREER_KV.put(APPLICATION_OPEN_KEY, "false");
    }

    return json({
      ok: true,
      message: "Application submitted successfully.",
      count: newCount,
      limit: APPLICATION_LIMIT,
      remaining: Math.max(APPLICATION_LIMIT - newCount, 0),
      closed: newCount >= APPLICATION_LIMIT
    });

  } catch (error) {
    return json(
      {
        ok: false,
        message: error.message || "Application could not be submitted. Please email careers@fthduniq.com directly."
      },
      500
    );
  }
}

async function addAttachment(file, label, attachments) {
  if (!file || typeof file === "string" || !file.name) return;

  const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
  const fileName = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasAllowedExtension) {
    throw new Error(label + " must be PDF, DOC, DOCX, JPG, JPEG, or PNG.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error(label + " is too large. Please upload a file below 5MB.");
  }

  const arrayBuffer = await file.arrayBuffer();

  attachments.push({
    filename: file.name,
    content: arrayBufferToBase64(arrayBuffer)
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }

  return btoa(binary);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
