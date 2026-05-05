const APPLICATION_LIMIT = 50;
const APPLICATION_COUNT_KEY = "career_application_count";
const APPLICATION_OPEN_KEY = "career_applications_open";

const APPLICANT_EMAIL_PREFIX = "career_applicant_email:";
const APPLICANT_PHONE_PREFIX = "career_applicant_phone:";
const APPLICANT_RECORD_PREFIX = "career_applicant_record:";

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
    message: "Congratulations. You have been shortlisted for the interview stage of FTH D-UNIQ’s recruitment process. Please click the interview room button when you are ready for your interview."
  },

  "FTH-PHY-001": {
    code: "FTH-PHY-001",
    name: "Physical Interview Candidate",
    email: "physicalcandidate@example.com",
    role: "Logistics & Delivery Coordination Officer",
    stage: "physical_interview",
    interviewDate: "",
    interviewTime: "",
    meetUrl: "",
    message: "You have moved to the physical interview stage. Please follow the instruction sent by FTH D-UNIQ Careers."
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

  "FTH-REVIEW-001": {
    code: "FTH-REVIEW-001",
    name: "Documents Review Candidate",
    email: "reviewcandidate@example.com",
    role: "Social Media & Digital Communications Officer",
    stage: "documents_received",
    interviewDate: "",
    interviewTime: "",
    meetUrl: "",
    message: "Your documents have been received and are currently under review. FTH D-UNIQ will communicate the next step through official contact channels."
  },

  "FTH-FINAL-001": {
    code: "FTH-FINAL-001",
    name: "Final Selected Candidate",
    email: "finalcandidate@example.com",
    role: "Logistics & Delivery Coordination Officer",
    stage: "final_selected",
    interviewDate: "",
    interviewTime: "",
    meetUrl: "",
    message: "Congratulations. Following the recruitment and documentation screening process, you have been selected to join FTH D-UNIQ. Please watch your email for your official resumption instructions. You will be required to come physically for final document verification, employment documentation, and onboarding before commencing work."
  },

  "FTH-NOT-001": {
    code: "FTH-NOT-001",
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
  physical_interview: "Physical Interview Stage",
  documentation_screening: "Pre-Documentation Screening",
  documents_received: "Documents Received — Under Review",
  final_selected: "Selected for Final Resumption",
  not_selected: "Not Selected"
};

const NEXT_STEPS = {
  shortlisted_interview: "Attend your interview through the interview room button.",
  interview_completed: "Please wait for the next-stage decision from FTH D-UNIQ Careers.",
  physical_interview: "Follow the physical interview instruction from FTH D-UNIQ Careers.",
  documentation_screening: "Upload your required documents for screening.",
  documents_received: "Please wait while FTH D-UNIQ reviews your submitted documents.",
  final_selected: "Watch your email for official resumption and onboarding instructions from FTH D-UNIQ Careers.",
  not_selected: "No further action is required at this stage."
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/about.html" && request.method === "GET") {
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);

      headers.set("content-type", "text/html; charset=UTF-8");
      headers.set("content-disposition", "inline");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    if (url.pathname === "/api/application-status" && request.method === "GET") {
      return handleApplicationStatus(env);
    }

    if (url.pathname === "/api/career-email" && request.method === "POST") {
      return handleCareerEmail(request, env);
    }

    if (url.pathname === "/api/quote-email" && request.method === "POST") {
      return handleQuoteEmail(request, env);
    }

    if (url.pathname === "/api/candidate-login" && request.method === "POST") {
      return handleCandidateLogin(request, env);
    }

    if (url.pathname === "/api/pre-doc-login" && request.method === "POST") {
      return handleCandidateLogin(request, env);
    }

    if (url.pathname === "/api/pre-documents" && request.method === "POST") {
      return handlePreDocuments(request, env);
    }

    if (url.pathname === "/api/candidate-documents" && request.method === "POST") {
      return handlePreDocuments(request, env);
    }

    if (url.pathname === "/api/director-login" && request.method === "POST") {
      return handleDirectorLogin(request, env);
    }

    if (url.pathname === "/api/director-list-applicants" && request.method === "POST") {
      return handleDirectorListApplicants(request, env);
    }

    if (url.pathname === "/api/director-update-applicant" && request.method === "POST") {
      return handleDirectorUpdateApplicant(request, env);
    }

    if (url.pathname === "/api/director-create-candidate" && request.method === "POST") {
      return handleDirectorCreateCandidate(request, env);
    }

    if (url.pathname === "/api/director-list-candidates" && request.method === "POST") {
      return handleDirectorListCandidates(request, env);
    }

    if (url.pathname === "/api/director-update-candidate" && request.method === "POST") {
      return handleDirectorUpdateCandidate(request, env);
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

function cleanCode(value) {
  return String(value || "").trim().toUpperCase();
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("234") && digits.length >= 13) {
    digits = "0" + digits.slice(3);
  }

  return digits;
}

function applicantEmailKey(email) {
  return APPLICANT_EMAIL_PREFIX + cleanEmail(email);
}

function applicantPhoneKey(phone) {
  return APPLICANT_PHONE_PREFIX + cleanPhone(phone);
}

function applicantRecordKey(applicationNumber) {
  return APPLICANT_RECORD_PREFIX + String(applicationNumber).padStart(5, "0");
}

function candidateKey(code) {
  return "candidate:" + cleanCode(code);
}

async function getCandidateRecord(env, code) {
  const codeValue = cleanCode(code);

  if (!codeValue) return null;

  if (env.CAREER_KV) {
    const stored = await env.CAREER_KV.get(candidateKey(codeValue));

    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        return null;
      }
    }
  }

  return SAMPLE_CANDIDATES[codeValue] || null;
}

async function saveCandidateRecord(env, candidate) {
  if (!env.CAREER_KV || !candidate || !candidate.code) return;

  candidate.updatedAt = new Date().toISOString();

  await env.CAREER_KV.put(
    candidateKey(candidate.code),
    JSON.stringify(candidate)
  );
}

async function getApplicantRecord(env, applicantId) {
  if (!env.CAREER_KV || !applicantId) return null;

  const key = String(applicantId || "").startsWith(APPLICANT_RECORD_PREFIX)
    ? String(applicantId)
    : APPLICANT_RECORD_PREFIX + String(applicantId).replace(APPLICANT_RECORD_PREFIX, "");

  const stored = await env.CAREER_KV.get(key);

  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
}

async function saveApplicantRecord(env, applicant) {
  if (!env.CAREER_KV || !applicant || !applicant.applicationId) return;

  applicant.updatedAt = new Date().toISOString();

  await env.CAREER_KV.put(applicant.applicationId, JSON.stringify(applicant));
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
    canUploadDocuments: candidate.stage === "documentation_screening",
    portal: "candidate-portal.html"
  };
}

function publicApplicant(applicant) {
  return {
    applicationId: applicant.applicationId,
    applicationNumber: applicant.applicationNumber,
    fullName: applicant.fullName,
    phone: applicant.originalPhone || applicant.phone,
    cleanedPhone: applicant.phone,
    email: applicant.email,
    location: applicant.location,
    position: applicant.position,
    availability: applicant.availability || "",
    expectedSalary: applicant.expectedSalary || "",
    qualification: applicant.qualification || "",
    experience: applicant.experience || "",
    onsite: applicant.onsite || "",
    relevantExperience: applicant.relevantExperience || "",
    status: applicant.status || "New application",
    directorNote: applicant.directorNote || "",
    candidateCode: applicant.candidateCode || "",
    candidateStage: applicant.candidateStage || "",
    submittedAt: applicant.submittedAt || "",
    updatedAt: applicant.updatedAt || ""
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
  const adminKey = String(request.headers.get("x-admin-key") || "").trim();
  const savedKey = String(env.ADMIN_KEY || "").trim();

  if (!savedKey || adminKey !== savedKey) {
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

    const candidateCode = cleanCode(body.candidateCode);
    const candidateEmail = cleanEmail(body.candidateEmail);

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

    if (cleanEmail(candidate.email) !== candidateEmail) {
      return json({
        ok: false,
        message: "The email address does not match this access code."
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

async function handlePreDocuments(request, env) {
  try {
    if (!env.RESEND_API_KEY) {
      return json({
        ok: false,
        message: "RESEND_API_KEY is not set in Cloudflare."
      }, 500);
    }

    const formData = await request.formData();

    const candidateCode = cleanCode(formData.get("candidateCode"));
    const candidateEmail = cleanEmail(formData.get("candidateEmail"));
    const candidateNotes = String(formData.get("candidateNotes") || "").trim();

    const candidate = await getCandidateRecord(env, candidateCode);

    if (!candidate) {
      return json({
        ok: false,
        message: "Invalid candidate access code."
      }, 403);
    }

    if (cleanEmail(candidate.email) !== candidateEmail) {
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
      `Documents were uploaded from the FTH D-UNIQ Candidate Portal.`;

    const htmlBody =
      `<h2>Pre-Documentation Screening Documents - FTH D-UNIQ</h2>` +
      `<p><strong>Candidate Name:</strong> ${escapeHtml(candidate.name)}</p>` +
      `<p><strong>Candidate Email:</strong> ${escapeHtml(candidate.email)}</p>` +
      `<p><strong>Access Code:</strong> ${escapeHtml(candidateCode)}</p>` +
      `<p><strong>Role:</strong> ${escapeHtml(candidate.role)}</p>` +
      `<p><strong>Current Stage:</strong> ${escapeHtml(STATUS_LABELS[candidate.stage] || candidate.stage)}</p>` +
      `<h3>Candidate Notes</h3>` +
      `<p>${escapeHtml(candidateNotes || "No notes provided.").replace(/\n/g, "<br>")}</p>` +
      `<p>Documents were uploaded from the FTH D-UNIQ Candidate Portal.</p>`;

    const resendResult = await sendResendEmail(env, {
      from: "FTH D-UNIQ Careers <careers@fthduniq.com>",
      to: ["careers@fthduniq.com"],
      reply_to: candidate.email,
      subject,
      text: textBody,
      html: htmlBody,
      attachments
    });

    if (!resendResult.ok) {
      return json({
        ok: false,
        message: "Documents could not be emailed.",
        details: resendResult.details
      }, 500);
    }

    candidate.stage = "documents_received";
    candidate.message = defaultMessageForStage("documents_received");

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

async function handleDirectorLogin(request, env) {
  try {
    const body = await request.json();

    const typedKey = String(body.directorKey || "").trim();
    const savedKey = String(env.ADMIN_KEY || "").trim();

    if (!savedKey) {
      return json({
        ok: false,
        message: "ADMIN_KEY is not found in Cloudflare runtime variables."
      }, 500);
    }

    if (typedKey !== savedKey) {
      return json({
        ok: false,
        message: "Invalid director access code. The code entered does not match the ADMIN_KEY saved in Cloudflare."
      }, 403);
    }

    return json({
      ok: true,
      message: "Director access verified."
    });

  } catch (error) {
    return json({
      ok: false,
      message: "Director access could not be verified."
    }, 500);
  }
}

async function verifyDirector(body, env) {
  const typedKey = String(body.directorKey || "").trim();
  const savedKey = String(env.ADMIN_KEY || "").trim();

  if (!savedKey) {
    return false;
  }

  return typedKey === savedKey;
}

async function handleDirectorListApplicants(request, env) {
  try {
    const body = await request.json();

    const isDirector = await verifyDirector(body, env);

    if (!isDirector) {
      return json({
        ok: false,
        message: "Unauthorized director access."
      }, 403);
    }

    if (!env.CAREER_KV) {
      return json({
        ok: false,
        message: "CAREER_KV is not connected."
      }, 500);
    }

    const applicants = [];
    let cursor = undefined;

    do {
      const result = await env.CAREER_KV.list({
        prefix: APPLICANT_RECORD_PREFIX,
        cursor
      });

      for (const key of result.keys) {
        const stored = await env.CAREER_KV.get(key.name);

        if (stored) {
          try {
            const applicant = JSON.parse(stored);
            applicants.push(publicApplicant(applicant));
          } catch (error) {}
        }
      }

      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    applicants.sort((a, b) => {
      return Number(b.applicationNumber || 0) - Number(a.applicationNumber || 0);
    });

    return json({
      ok: true,
      applicants
    });

  } catch (error) {
    return json({
      ok: false,
      message: "Submitted applications could not be loaded."
    }, 500);
  }
}

async function handleDirectorUpdateApplicant(request, env) {
  try {
    const body = await request.json();

    const isDirector = await verifyDirector(body, env);

    if (!isDirector) {
      return json({
        ok: false,
        message: "Unauthorized director access."
      }, 403);
    }

    if (!env.CAREER_KV) {
      return json({
        ok: false,
        message: "CAREER_KV is not connected."
      }, 500);
    }

    const applicantId = String(body.applicantId || "").trim();
    const status = String(body.status || "").trim();
    const directorNote = String(body.directorNote || "").trim();

    if (!applicantId || !status) {
      return json({
        ok: false,
        message: "Applicant ID and status are required."
      }, 400);
    }

    const applicant = await getApplicantRecord(env, applicantId);

    if (!applicant) {
      return json({
        ok: false,
        message: "Applicant record not found."
      }, 404);
    }

    applicant.status = status;
    applicant.directorNote = directorNote || applicant.directorNote || "";
    applicant.updatedAt = new Date().toISOString();

    await saveApplicantRecord(env, applicant);

    return json({
      ok: true,
      applicant: publicApplicant(applicant),
      message: "Applicant profile updated successfully."
    });

  } catch (error) {
    return json({
      ok: false,
      message: "Applicant profile could not be updated."
    }, 500);
  }
}

function generateCandidateCode(accessType) {
  const prefix = accessType === "documentation" ? "FTH-DOC" : "FTH-INT";
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const time = Date.now().toString().slice(-4);

  return `${prefix}-${random}${time}`;
}

function defaultMessageForStage(stage) {
  if (stage === "shortlisted_interview") {
    return "Congratulations. You have been shortlisted for the interview stage of FTH D-UNIQ’s recruitment process. Please click the interview room button when you are ready for your interview.";
  }

  if (stage === "interview_completed") {
    return "Your interview has been completed. Please wait for the next-stage decision from FTH D-UNIQ Careers.";
  }

  if (stage === "physical_interview") {
    return "You have moved to the physical interview stage. Please follow the instruction sent by FTH D-UNIQ Careers.";
  }

  if (stage === "documentation_screening") {
    return "Congratulations. You have moved to the pre-documentation screening stage of FTH D-UNIQ’s recruitment process. Please upload the required documents for review.";
  }

  if (stage === "documents_received") {
    return "Your documents have been received and are currently under review. FTH D-UNIQ will communicate the next step through official contact channels.";
  }

  if (stage === "final_selected") {
    return "Congratulations. Following the recruitment and documentation screening process, you have been selected to join FTH D-UNIQ. Please watch your email for your official resumption instructions. You will be required to come physically for final document verification, employment documentation, and onboarding before commencing work.";
  }

  if (stage === "not_selected") {
    return "Thank you for participating in FTH D-UNIQ’s recruitment process. After careful review, you have not been selected for final resumption at this time. We appreciate your interest and wish you success in your future opportunities.";
  }

  return "Please follow the instruction provided by FTH D-UNIQ Careers.";
}

async function handleDirectorCreateCandidate(request, env) {
  try {
    const body = await request.json();

    const isDirector = await verifyDirector(body, env);

    if (!isDirector) {
      return json({
        ok: false,
        message: "Unauthorized director access."
      }, 403);
    }

    if (!env.CAREER_KV) {
      return json({
        ok: false,
        message: "CAREER_KV is not connected."
      }, 500);
    }

    const applicantId = String(body.applicantId || "").trim();
    let applicant = null;

    if (applicantId) {
      applicant = await getApplicantRecord(env, applicantId);
    }

    const name = String(body.name || (applicant ? applicant.fullName : "") || "").trim();
    const email = cleanEmail(body.email || (applicant ? applicant.email : ""));
    const role = String(body.role || (applicant ? applicant.position : "") || "").trim();
    const accessType = String(body.accessType || "interview").trim();

    if (!name || !email || !role) {
      return json({
        ok: false,
        message: "Candidate name, email, and role are required."
      }, 400);
    }

    const stage = accessType === "documentation" ? "documentation_screening" : "shortlisted_interview";
    const code = generateCandidateCode(accessType);

    const candidate = {
      code,
      name,
      email,
      role,
      stage,
      interviewDate: String(body.interviewDate || "").trim(),
      interviewTime: String(body.interviewTime || "").trim(),
      meetUrl: String(body.meetUrl || DEFAULT_INTERVIEW_ROOM).trim(),
      message: String(body.message || "").trim() || defaultMessageForStage(stage),
      applicantId: applicantId || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveCandidateRecord(env, candidate);

    if (applicant) {
      applicant.status = stage === "documentation_screening"
        ? "Moved to pre-documentation screening"
        : "Shortlisted - access generated";

      applicant.candidateCode = code;
      applicant.candidateStage = stage;
      applicant.directorNote = String(body.directorNote || applicant.directorNote || "").trim();
      applicant.updatedAt = new Date().toISOString();

      await saveApplicantRecord(env, applicant);
    }

    let emailSent = false;

    if (env.RESEND_API_KEY) {
      const emailResult = await sendCandidateAccessEmail(env, candidate);
      emailSent = emailResult.ok;
    }

    return json({
      ok: true,
      candidate: publicCandidate(candidate),
      applicant: applicant ? publicApplicant(applicant) : null,
      emailSent,
      portalLabel: "Candidate Portal"
    });

  } catch (error) {
    return json({
      ok: false,
      message: error.message || "Candidate access could not be created."
    }, 500);
  }
}

async function handleDirectorListCandidates(request, env) {
  try {
    const body = await request.json();

    const isDirector = await verifyDirector(body, env);

    if (!isDirector) {
      return json({
        ok: false,
        message: "Unauthorized director access."
      }, 403);
    }

    const recordsByCode = new Map();

    if (env.CAREER_KV) {
      let cursor = undefined;

      do {
        const result = await env.CAREER_KV.list({
          prefix: "candidate:",
          cursor
        });

        for (const key of result.keys) {
          const stored = await env.CAREER_KV.get(key.name);

          if (stored) {
            try {
              const candidate = JSON.parse(stored);
              recordsByCode.set(cleanCode(candidate.code), publicCandidate(candidate));
            } catch (error) {}
          }
        }

        cursor = result.list_complete ? undefined : result.cursor;
      } while (cursor);
    }

    for (const sample of Object.values(SAMPLE_CANDIDATES)) {
      const code = cleanCode(sample.code);

      if (!recordsByCode.has(code)) {
        recordsByCode.set(code, publicCandidate(sample));
      }
    }

    return json({
      ok: true,
      candidates: Array.from(recordsByCode.values())
    });

  } catch (error) {
    return json({
      ok: false,
      message: "Candidate records could not be loaded."
    }, 500);
  }
}

async function handleDirectorUpdateCandidate(request, env) {
  try {
    const body = await request.json();

    const isDirector = await verifyDirector(body, env);

    if (!isDirector) {
      return json({
        ok: false,
        message: "Unauthorized director access."
      }, 403);
    }

    if (!env.CAREER_KV) {
      return json({
        ok: false,
        message: "CAREER_KV is not connected."
      }, 500);
    }

    const candidateCode = cleanCode(body.candidateCode);
    const candidateEmail = cleanEmail(body.candidateEmail);
    const newStage = String(body.stage || "").trim();
    const sendEmailNotice = String(body.sendEmailNotice || "yes").trim();
    const updatedMessage = String(body.message || "").trim();

    if (!candidateCode || !candidateEmail || !newStage) {
      return json({
        ok: false,
        message: "Candidate code, email, and new stage are required."
      }, 400);
    }

    const candidate = await getCandidateRecord(env, candidateCode);

    if (!candidate) {
      return json({
        ok: false,
        message: "Candidate record not found."
      }, 404);
    }

    if (cleanEmail(candidate.email) !== candidateEmail) {
      return json({
        ok: false,
        message: "The email address does not match this candidate code."
      }, 403);
    }

    candidate.stage = newStage;
    candidate.message = updatedMessage || defaultMessageForStage(newStage);

    await saveCandidateRecord(env, candidate);

    if (candidate.applicantId) {
      const applicant = await getApplicantRecord(env, candidate.applicantId);

      if (applicant) {
        applicant.status = STATUS_LABELS[newStage] || newStage;
        applicant.candidateCode = candidate.code;
        applicant.candidateStage = newStage;
        applicant.updatedAt = new Date().toISOString();

        await saveApplicantRecord(env, applicant);
      }
    }

    let emailSent = false;

    if (sendEmailNotice === "yes" && env.RESEND_API_KEY) {
      const emailResult = await sendCandidateStageUpdateEmail(env, candidate);
      emailSent = emailResult.ok;
    }

    return json({
      ok: true,
      emailSent,
      candidate: publicCandidate(candidate),
      message: "Candidate stage updated successfully."
    });

  } catch (error) {
    return json({
      ok: false,
      message: error.message || "Candidate stage could not be updated."
    }, 500);
  }
}

async function sendCandidateAccessEmail(env, candidate) {
  const portalUrl = "https://www.fthduniq.com/candidate-portal.html";

  const subject =
    candidate.stage === "documentation_screening"
      ? "Pre-Documentation Screening Access — FTH D-UNIQ"
      : "Candidate Portal Access — FTH D-UNIQ";

  const text =
    `Dear ${candidate.name},\n\n` +
    `${candidate.message}\n\n` +
    `Candidate Portal: ${portalUrl}\n` +
    `Access Code: ${candidate.code}\n` +
    `Email Address: ${candidate.email}\n\n` +
    `Regards,\nFTH D-UNIQ Careers`;

  const html =
    `<p>Dear ${escapeHtml(candidate.name)},</p>` +
    `<p>${escapeHtml(candidate.message)}</p>` +
    `<p><strong>Candidate Portal:</strong> ${escapeHtml(portalUrl)}</p>` +
    `<p><strong>Access Code:</strong> ${escapeHtml(candidate.code)}</p>` +
    `<p><strong>Email Address:</strong> ${escapeHtml(candidate.email)}</p>` +
    `<p>Regards,<br>FTH D-UNIQ Careers</p>`;

  return sendResendEmail(env, {
    from: "FTH D-UNIQ Careers <careers@fthduniq.com>",
    to: [candidate.email],
    reply_to: "careers@fthduniq.com",
    subject,
    text,
    html,
    attachments: []
  });
}

async function sendCandidateStageUpdateEmail(env, candidate) {
  const portalUrl = "https://www.fthduniq.com/candidate-portal.html";

  const subject = `Recruitment Status Update — FTH D-UNIQ`;

  const text =
    `Dear ${candidate.name},\n\n` +
    `${candidate.message}\n\n` +
    `You may log in to your candidate dashboard using the details below:\n\n` +
    `Candidate Portal: ${portalUrl}\n` +
    `Access Code: ${candidate.code}\n` +
    `Email Address: ${candidate.email}\n\n` +
    `Regards,\nFTH D-UNIQ Careers`;

  const html =
    `<p>Dear ${escapeHtml(candidate.name)},</p>` +
    `<p>${escapeHtml(candidate.message)}</p>` +
    `<p>You may log in to your candidate dashboard using the details below:</p>` +
    `<p><strong>Candidate Portal:</strong> ${escapeHtml(portalUrl)}</p>` +
    `<p><strong>Access Code:</strong> ${escapeHtml(candidate.code)}</p>` +
    `<p><strong>Email Address:</strong> ${escapeHtml(candidate.email)}</p>` +
    `<p>Regards,<br>FTH D-UNIQ Careers</p>`;

  return sendResendEmail(env, {
    from: "FTH D-UNIQ Careers <careers@fthduniq.com>",
    to: [candidate.email],
    reply_to: "careers@fthduniq.com",
    subject,
    text,
    html,
    attachments: []
  });
}

async function handleQuoteEmail(request, env) {
  try {
    if (!env.RESEND_API_KEY) {
      return json(
        { ok: false, message: "RESEND_API_KEY is not set in Cloudflare." },
        500
      );
    }

    const formData = await request.formData();

    const fullName = String(formData.get("full_name") || "").trim();
    const phoneNumber = String(formData.get("phone_number") || "").trim();
    const emailAddress = String(formData.get("email_address") || "").trim();
    const deliveryLocation = String(formData.get("delivery_location") || "").trim();
    const materialOrService = String(formData.get("material_or_service_needed") || "").trim();
    const quantity = String(formData.get("quantity_or_volume") || "").trim();
    const timeline = String(formData.get("preferred_timeline") || "").trim();
    const siteContact = String(formData.get("site_contact_person") || "").trim();
    const requestDetails = String(formData.get("request_details") || "").trim();
    const formSource = String(formData.get("form_source") || "Homepage Quote Request").trim();

    if (!fullName || !phoneNumber || !deliveryLocation || !materialOrService || !requestDetails) {
      return json(
        {
          ok: false,
          message: "Please complete all required quote request fields."
        },
        400
      );
    }

    const cleanedEmail = cleanEmail(emailAddress);

    const subject = `New Quote Request - ${materialOrService} - ${fullName}`;

    const textBody =
      `New Quote Request - FTH D-UNIQ\n\n` +
      `Form Source: ${formSource}\n` +
      `Full Name: ${fullName}\n` +
      `Phone / WhatsApp Number: ${phoneNumber}\n` +
      `Email Address: ${emailAddress || "Not provided"}\n` +
      `Delivery / Project Location: ${deliveryLocation}\n` +
      `Material / Service Needed: ${materialOrService}\n` +
      `Quantity / Volume: ${quantity || "Not provided"}\n` +
      `Preferred Timeline: ${timeline || "Not provided"}\n` +
      `Site Contact Person: ${siteContact || "Not provided"}\n\n` +
      `Request Details:\n${requestDetails}\n\n` +
      `Submitted from the FTH D-UNIQ website quote form.`;

    const htmlBody =
      `<h2>New Quote Request - FTH D-UNIQ</h2>` +
      `<p><strong>Form Source:</strong> ${escapeHtml(formSource)}</p>` +
      `<p><strong>Full Name:</strong> ${escapeHtml(fullName)}</p>` +
      `<p><strong>Phone / WhatsApp Number:</strong> ${escapeHtml(phoneNumber)}</p>` +
      `<p><strong>Email Address:</strong> ${escapeHtml(emailAddress || "Not provided")}</p>` +
      `<p><strong>Delivery / Project Location:</strong> ${escapeHtml(deliveryLocation)}</p>` +
      `<p><strong>Material / Service Needed:</strong> ${escapeHtml(materialOrService)}</p>` +
      `<p><strong>Quantity / Volume:</strong> ${escapeHtml(quantity || "Not provided")}</p>` +
      `<p><strong>Preferred Timeline:</strong> ${escapeHtml(timeline || "Not provided")}</p>` +
      `<p><strong>Site Contact Person:</strong> ${escapeHtml(siteContact || "Not provided")}</p>` +
      `<h3>Request Details</h3>` +
      `<p>${escapeHtml(requestDetails).replace(/\n/g, "<br>")}</p>` +
      `<p>Submitted from the FTH D-UNIQ website quote form.</p>`;

    const emailResult = await sendResendEmail(env, {
      from: "FTH D-UNIQ Website <careers@fthduniq.com>",
      to: ["info@fthduniq.com"],
      reply_to: cleanedEmail || "info@fthduniq.com",
      subject,
      text: textBody,
      html: htmlBody,
      attachments: []
    });

    if (!emailResult.ok) {
      return json(
        {
          ok: false,
          message: "Resend could not send the quote request email.",
          details: emailResult.details
        },
        500
      );
    }

    return json({
      ok: true,
      message: "Quote request submitted successfully."
    });

  } catch (error) {
    return json(
      {
        ok: false,
        message: error.message || "Quote request could not be submitted. Please email info@fthduniq.com directly."
      },
      500
    );
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
          message: "Applications are currently closed. Please check back when another opportunity is announced."
        },
        403
      );
    }

    const formData = await request.formData();

    const fullName = String(formData.get("full_name") || "").trim();
    const phone = String(formData.get("phone_number") || "").trim();
    const email = String(formData.get("email_address") || "").trim();
    const location = String(formData.get("current_location") || "").trim();
    const position = String(formData.get("role_applied_for") || "").trim();
    const availability = String(formData.get("availability") || "").trim();
    const expectedSalary = String(formData.get("expected_salary") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const cv = formData.get("cv_upload");
    const coverLetter = formData.get("cover_letter_upload");

    if (!fullName || !phone || !email || !location || !position || !availability || !expectedSalary || !message) {
      return json(
        { ok: false, message: "Please complete all required application fields." },
        400
      );
    }

    const cleanedEmail = cleanEmail(email);
    const cleanedPhone = cleanPhone(phone);

    if (!cleanedEmail || !cleanedPhone) {
      return json(
        { ok: false, message: "Please enter a valid email address and phone number." },
        400
      );
    }

    const existingEmailApplication = await env.CAREER_KV.get(applicantEmailKey(cleanedEmail));
    const existingPhoneApplication = await env.CAREER_KV.get(applicantPhoneKey(cleanedPhone));

    if (existingEmailApplication || existingPhoneApplication) {
      return json(
        {
          ok: false,
          duplicate: true,
          message: "Our record shows that you have already submitted an application. Duplicate applications are not allowed. Please wait for FTH D-UNIQ Careers to review your submission."
        },
        409
      );
    }

    const attachments = [];

    await addAttachment(cv, "CV", attachments);
    await addAttachment(coverLetter, "Cover Letter", attachments);

    if (attachments.length < 2) {
      return json(
        { ok: false, message: "Please upload both your CV and cover letter." },
        400
      );
    }

    const newCount = countBefore + 1;

    const subject = `Career Application ${newCount} - ${position} - ${fullName}`;

    const textBody =
      `New Career Application - FTH D-UNIQ\n\n` +
      `Application Number: ${newCount}\n` +
      `Full Name: ${fullName}\n` +
      `Phone / WhatsApp Number: ${phone}\n` +
      `Email Address: ${email}\n` +
      `Current Location: ${location}\n` +
      `Role Applied For: ${position}\n` +
      `Availability: ${availability}\n` +
      `Expected Salary: ${expectedSalary}\n\n` +
      `Brief Message:\n${message}\n\n` +
      `CV and cover letter are attached.\n\n` +
      `Submitted from the FTH D-UNIQ website career form.`;

    const htmlBody =
      `<h2>New Career Application - FTH D-UNIQ</h2>` +
      `<p><strong>Application Number:</strong> ${newCount}</p>` +
      `<p><strong>Full Name:</strong> ${escapeHtml(fullName)}</p>` +
      `<p><strong>Phone / WhatsApp Number:</strong> ${escapeHtml(phone)}</p>` +
      `<p><strong>Email Address:</strong> ${escapeHtml(email)}</p>` +
      `<p><strong>Current Location:</strong> ${escapeHtml(location)}</p>` +
      `<p><strong>Role Applied For:</strong> ${escapeHtml(position)}</p>` +
      `<p><strong>Availability:</strong> ${escapeHtml(availability)}</p>` +
      `<p><strong>Expected Salary:</strong> ${escapeHtml(expectedSalary)}</p>` +
      `<h3>Brief Message</h3>` +
      `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` +
      `<p><strong>CV and cover letter are attached.</strong></p>` +
      `<p>Submitted from the FTH D-UNIQ website career form.</p>`;

    const emailResult = await sendResendEmail(env, {
      from: "FTH D-UNIQ Careers <careers@fthduniq.com>",
      to: ["careers@fthduniq.com"],
      reply_to: cleanedEmail,
      subject,
      text: textBody,
      html: htmlBody,
      attachments
    });

    if (!emailResult.ok) {
      return json(
        {
          ok: false,
          message: "Resend could not send the application email.",
          details: emailResult.details
        },
        500
      );
    }

    const applicantRecord = {
      applicationId: applicantRecordKey(newCount),
      applicationNumber: newCount,
      fullName,
      phone: cleanedPhone,
      originalPhone: phone,
      email: cleanedEmail,
      location,
      position,
      availability,
      expectedSalary,
      relevantExperience: message,
      status: "New application",
      directorNote: "",
      candidateCode: "",
      candidateStage: "",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await env.CAREER_KV.put(applicantRecord.applicationId, JSON.stringify(applicantRecord));

    await env.CAREER_KV.put(applicantEmailKey(cleanedEmail), JSON.stringify({
      applicantId: applicantRecord.applicationId,
      applicationNumber: newCount,
      email: cleanedEmail,
      submittedAt: applicantRecord.submittedAt
    }));

    await env.CAREER_KV.put(applicantPhoneKey(cleanedPhone), JSON.stringify({
      applicantId: applicantRecord.applicationId,
      applicationNumber: newCount,
      phone: cleanedPhone,
      submittedAt: applicantRecord.submittedAt
    }));

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

async function sendResendEmail(env, payload) {
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: payload.from || "FTH D-UNIQ Careers <careers@fthduniq.com>",
      to: payload.to,
      reply_to: payload.reply_to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      attachments: payload.attachments || []
    })
  });

  let details = null;

  try {
    details = await resendResponse.json();
  } catch (error) {
    details = {};
  }

  return {
    ok: resendResponse.ok,
    details
  };
}

async function addAttachment(file, label, attachments) {
  if (!file || typeof file === "string" || !file.name) return;

  const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
  const fileName = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasAllowedExtension) {
    throw new Error(label + " must be PDF, DOC, DOCX, JPG, JPEG, or PNG.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error(label + " is too large. Please upload a file below 10MB.");
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
