// src/lib/calendar-utils.ts

// Takes a label like "Final Hearing" and a date string like "2025-11-03"
// Optionally a longer description (like "You must appear in court by this date")
// Returns a fully-formed Google Calendar create-event URL
export function buildGoogleCalendarURL(opts: {
  label: string;
  dateString: string;
  description?: string;
}) {
  const { label, dateString, description } = opts;

  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) return null;

  const startUTC = new Date(Date.UTC(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    0, 0, 0
  ));
  const endUTC = new Date(Date.UTC(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate() + 1,
    0, 0, 0
  ));

  const fmtAllDay = (d: Date) =>
    `${d.getUTCFullYear()}${(d.getUTCMonth()+1).toString().padStart(2,'0')}${d.getUTCDate().toString().padStart(2,'0')}`;

  const startStr = fmtAllDay(startUTC);
  const endStr = fmtAllDay(endUTC);

  const lowerLabel = label.toLowerCase();
  let eventTitle = label;
  let purpose = "";
  let action = "";

  if (lowerLabel.includes("deadline") || lowerLabel.includes("due")) {
    purpose = "Compliance / submission deadline";
    action = "Ensure all required documents or actions are completed by this date to avoid penalties or adverse legal consequences.";
  } else if (lowerLabel.includes("inspection")) {
    purpose = "Official inspection or verification event";
    action = "Attend the inspection personally or through an authorized representative. Carry all supporting documents and evidence required for verification.";
  } else if (lowerLabel.includes("hearing") || lowerLabel.includes("court")) {
    purpose = "Scheduled court or hearing date";
    action = "Ensure presence of concerned parties or legal counsel. Review case documents beforehand.";
  } else if (lowerLabel.includes("meeting")) {
    purpose = "Meeting / negotiation session";
    action = "Attend the meeting on time with all necessary papers. Confirm agenda with the other party.";
  } else if (lowerLabel.includes("payment")) {
    purpose = "Payment or financial obligation";
    action = "Ensure timely payment or transfer. Retain receipts or proof of payment for record.";
  } else if (lowerLabel.includes("notice")) {
    purpose = "Legal notice reference date";
    action = "Acknowledge and respond within stipulated time, if required under applicable law.";
  } else {
    purpose = "Important legal or administrative date";
    action = "Review associated document or event details for any required actions.";
  }

  const fullDetails = `
${label}: ${dateString}

 Purpose: ${purpose}

 Recommended Action:
${action}

${description ? `Context: ${description}\n\n` : ""}Extracted automatically by LegalEase AI — please verify accuracy before saving.
  `.trim();

  const details = encodeURIComponent(fullDetails);
  const title = encodeURIComponent(eventTitle);

  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}` +
    `&dates=${startStr}/${endStr}` +
    `&details=${details}`
  );
}