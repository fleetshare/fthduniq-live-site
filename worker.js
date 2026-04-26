const APPLICATION_LIMIT = 50;
const APPLICATION_COUNT_KEY = "career_application_count";
const APPLICATION_OPEN_KEY = "career_applications_open";

const CANDIDATES = {
  "FTH-CAND-001": {
    name: "Candidate One",
    email: "candidate@example.com",
    role: "Business Support Officer",
    status: "shortlisted",
    interviewDate: "To be communicated",
    interviewTime: "To be communicated",
    meetUrl: "https://meet.google.com/your-meet-code",
    message: "You have been shortlisted for the next stage of FTH D-UNIQ’s recruitment process. Please review your interview preparation details and attend your interview at the scheduled time."
  },

  "FTH-CAND-002": {
    name: "Candidate Two",
    email: "candidate2@example.com",
    role: "Logistics & Delivery Coordination Officer",
    status: "successful",
    interviewDate: "Completed",
    interviewTime: "Completed",
    meetUrl: "https://meet.google.com/your-meet-code",
    message: "Congratulations. You have been selected to proceed to FTH D-UNIQ’s pre-resumption documentation stage. Please upload the required documents through this portal."
  }
};

const STATUS_LABELS = {
  shortlisted: "Shortlisted for Interview",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed — Awaiting Decision",
  successful: "Successful — Proceed to Pre-Resumption Documentation",
  documents_received: "Documents Received — Awaiting Review",
  physical_verification: "Proceed to Physical Verification",
  not_successful: "Not Successful"
};

const NEXT_STEPS = {
  shortlisted: "Prepare for interview and join the interview room at the scheduled time.",
  interview_scheduled: "Attend the interview at the scheduled time.",
  interview_completed: "Wait for the final decision update.",
  successful: "Upload your required pre-resumption documents.",
  documents_received: "Wait for document review and further instruction.",
  physical_verification: "Come physically for document verification and final employment documentation.",
  not_successful: "Thank you for your interest in FTH D-UNIQ. We wish you success in future opportunities."
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

    if (url.pathname === "/api/candidate-documents" && request.method === "POST") {
      return handleCandidateDocuments(request, env);
    }

    if (url.pathname === "/api/reset-application-count" && request.method === "POST") {
      return handleResetApplicationCount(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200){
  return new Response(JSON.stringify(data), {
    status,
    headers:{
      "content-type":"application/json"
    }
  });
}

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

  await env.CAREER_KV.put(APPLICATION_COUNT_KEY, "0");
  await env.CAREER_KV.put(APPLICATION_OPEN_KEY, "true");

  return json({
    ok: true,
    message: "Application count reset to 0 and applications reopened."
  });
}

function publicCandidate(code, candidate){
  return {
    code,
    name: candidate.name,
    email: candidate.email,
    role: candidate.role,
    status: candidate.status,
    statusLabel: STATUS_LABELS[candidate.status] || candidate.status,
    nextStep: NEXT_STEPS[candidate.status] || "Please wait for further instructions.",
    interviewDate: candidate.interviewDate,
    interviewTime: candidate.interviewTime,
    meetUrl: candidate.meetUrl,
    message: candidate.message,
    canUploadDocuments: candidate.status === "successful" || candidate.status === "documents_received" || candidate.status === "physical_verification"
  };
}

async function handleCandidateLogin(request, env){
  try{
    const body = await request.json();

    const candidateCode = String(body.candidateCode || "").trim().toUpperCase();
    const candidateEmail = String(body.candidateEmail || "").trim().toLowerCase();

    if(!candidateCode || !candidateEmail){
      return json({
        ok:false,
        message:"Please enter your access code and email address."
      }, 400);
    }

    if(env.ADMIN_KEY && candidateCode === env.ADMIN_KEY){
      const candidates = Object.entries(CANDIDATES).map(function(entry){
        return publicCandidate(entry[0], entry[1]);
      });

      return json({
        ok:true,
        master:true,
        candidates
      });
    }

    const candidate = CANDIDATES[candidateCode];

    if(!candidate){
      return json({
        ok:false,
        message:"Invalid candidate access code."
      }, 403);
    }

    if(String(candidate.email).toLowerCase() !== candidateEmail){
      return json({
        ok:false,
        message:"The email address does not match this access code."
      }, 403);
    }

    return json({
      ok:true,
      master:false,
      candidate:publicCandidate(candidateCode, candidate)
    });

  }catch(error){
    return json({
      ok:false,
      message:"Candidate access could not be verified."
    }, 500);
  }
}

async function handleCandidateDocuments(request, env){
  try{
    if(!env.RESEND_API_KEY){
      return json({
        ok:false,
        message:"RESEND_API_KEY is not set in Cloudflare."
      }, 500);
    }

    const formData = await request.formData();

    const candidateCode = String(formData.get("candidateCode") || "").trim().toUpperCase();
    const candidateEmail = String(formData.get("candidateEmail") || "").trim().toLowerCase();
    const candidateNotes = String(formData.get("candidateNotes") || "").trim();

    const candidate = CANDIDATES[candidateCode];

    if(!candidate){
      return json({
        ok:false,
        message:"Invalid candidate access code."
      }, 403);
    }

    if(String(candidate.email).toLowerCase() !== candidateEmail){
      return json({
        ok:false,
        message:"The email address does not match this access code."
      }, 403);
    }

    if(!(candidate.status === "successful" || candidate.status === "documents_received" || candidate.status === "physical_verification")){
      return json({
        ok:false,
        message:"Document upload is not currently available for this candidate stage."
      }, 403);
    }

    const attachments = [];

    await addAttachment(formData.get("validId"), "Valid ID", attachments);
    await addAttachment(formData.get("passportPhoto"), "Passport Photograph", attachments);
    await addAttachment(formData.get("qualificationDoc"), "Qualification Document", attachments);
    await addAttachment(formData.get("nyscDoc"), "NYSC Document", attachments);
    await addAttachment(formData.get("guarantorDoc"), "Guarantor / Referee Document", attachments);
    await addAttachment(formData.get("otherDoc"), "Other Document", attachments);

    if(!attachments.length){
      return json({
        ok:false,
        message:"Please upload at least one document."
      }, 400);
    }

    const subject = `Candidate Documents - ${candidate.name} - ${candidate.role}`;

    const textBody =
      `Candidate Pre-Resumption Documents - FTH D-UNIQ\n\n` +
      `Candidate Name: ${candidate.name}\n` +
      `Candidate Email: ${candidate.email}\n` +
      `Access Code: ${candidateCode}\n` +
      `Role: ${candidate.role}\n` +
      `Current Status: ${STATUS_LABELS[candidate.status] || candidate.status}\n\n` +
      `Candidate Notes:\n${candidateNotes || "No notes provided."}\n\n` +
      `Documents were uploaded from the FTH D-UNIQ Candidate Portal.`;

    const htmlBody =
      `<h2>Candidate Pre-Resumption Documents - FTH D-UNIQ</h2>` +
      `<p><strong>Candidate Name:</strong> ${escapeHtml(candidate.name)}</p>` +
      `<p><strong>Candidate Email:</strong> ${escapeHtml(candidate.email)}</p>` +
      `<p><strong>Access Code:</strong> ${escapeHtml(candidateCode)}</p>` +
      `<p><strong>Role:</strong> ${escapeHtml(candidate.role)}</p>` +
      `<p><strong>Current Status:</strong> ${escapeHtml(STATUS_LABELS[candidate.status] || candidate.status)}</p>` +
      `<h3>Candidate Notes</h3>` +
      `<p>${escapeHtml(candidateNotes || "No notes provided.").replace(/\n/g, "<br>")}</p>` +
      `<p>Documents were uploaded from the FTH D-UNIQ Candidate Portal.</p>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method:"POST",
      headers:{
        Authorization:`Bearer ${env.RESEND_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        from:"FTH D-UNIQ Careers <careers@fthduniq.com>",
        to:["careers@fthduniq.com"],
        reply_to:candidate.email,
        subject,
        text:textBody,
        html:htmlBody,
        attachments
      })
    });

    const resendResult = await resendResponse.json();

    if(!resendResponse.ok){
      return json({
        ok:false,
        message:"Documents could not be emailed.",
        details:resendResult
      }, 500);
    }

    return json({
      ok:true,
      message:"Documents submitted successfully."
    });

  }catch(error){
    return json({
      ok:false,
      message:error.message || "Documents could not be submitted."
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
          message: "Applications are currently closed. The application limit has been reached."
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

async function addAttachment(file, label, attachments){
  if(!file || typeof file === "string" || !file.name) return;

  const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
  const fileName = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));

  if(!hasAllowedExtension){
    throw new Error(label + " must be PDF, DOC, DOCX, JPG, or PNG.");
  }

  if(file.size > 5 * 1024 * 1024){
    throw new Error(label + " is too large. Please upload a file below 5MB.");
  }

  const arrayBuffer = await file.arrayBuffer();

  attachments.push({
    filename: file.name,
    content: arrayBufferToBase64(arrayBuffer)
  });
}

function arrayBufferToBase64(buffer){
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for(let i = 0; i < bytes.length; i += chunkSize){
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }

  return btoa(binary);
}

function escapeHtml(value){
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
