import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";

export const runtime = "nodejs";

type SignPayload = {
  clientName: string;
  clientTitle: string;
  clientEmail: string;
  producerName?: string;
  producerTitle?: string;
  signatureMode: "draw" | "type";
  signatureDataUrl?: string;
  signatureText?: string;
  tier: "essentials" | "signature" | "premier" | "";
  timestamp: string;
  proposalUrl?: string;
};

const TIER_META: Record<string, { label: string; price: string; rush: string }> = {
  essentials: { label: "Tier 01 — Essentials", price: "$8,600", rush: "+$2,150" },
  signature: { label: "Tier 02 — Signature", price: "$9,800", rush: "+$2,500" },
  premier: { label: "Tier 03 — Premier", price: "$11,600", rush: "+$2,900" },
};

const DOC_ID = "GHXST-RB-LED-001";
const NAVY = rgb(0.039, 0.133, 0.251);
const RED = rgb(0.859, 0.039, 0.251);
const GRAY = rgb(0.42, 0.45, 0.5);
const DARK = rgb(0.1, 0.1, 0.1);

function drawText(page: import("pdf-lib").PDFPage, text: string, x: number, y: number, font: import("pdf-lib").PDFFont, size: number, color = DARK) {
  page.drawText(text, { x, y, size, font, color });
}

async function buildPdf(p: SignPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const tier = TIER_META[p.tier] ?? { label: "Tier Not Specified", price: "TBD", rush: "—" };

  // Header bar
  page.drawRectangle({ x: 0, y: 732, width: 612, height: 60, color: NAVY });
  drawText(page, "GHXSTSHIP × RED BULL NORTH AMERICA", 40, 762, helvBold, 13, rgb(1, 1, 1));
  drawText(page, "LED Illuminated Curved Mobile Bar — Executed Agreement", 40, 744, helv, 10, rgb(0.85, 0.87, 0.9));

  let y = 700;
  drawText(page, "EXECUTED AGREEMENT", 40, y, helvBold, 9, GRAY);
  y -= 18;
  drawText(page, `Document: ${DOC_ID}`, 40, y, helv, 10);
  y -= 14;
  drawText(page, `Executed: ${p.timestamp}`, 40, y, helv, 10);
  y -= 14;
  if (p.proposalUrl) {
    drawText(page, `Proposal: ${p.proposalUrl}`, 40, y, helv, 10);
    y -= 14;
  }

  y -= 14;
  // Selection block
  page.drawRectangle({ x: 40, y: y - 70, width: 532, height: 78, borderColor: NAVY, borderWidth: 1 });
  drawText(page, "TIER SELECTION", 52, y - 8, helvBold, 9, GRAY);
  drawText(page, tier.label, 52, y - 28, helvBold, 14, NAVY);
  drawText(page, `Standard ${tier.price}   ·   Rush (1-week) ${tier.rush}`, 52, y - 46, helv, 10);
  drawText(page, "ACH or Domestic Wire Only   ·   50 / 40 / 10 Payment Milestones", 52, y - 60, helv, 9, GRAY);
  y -= 94;

  // Acknowledgment
  drawText(page, "ACKNOWLEDGMENT", 40, y, helvBold, 9, GRAY);
  y -= 14;
  const ackLines = [
    "By executing this agreement, Client acknowledges review and acceptance of the complete",
    "Scope of Work, Hardware Tier Selection, Investment Summary, Rush Fee, Payment Terms,",
    "Upgrades, and Terms & Conditions outlined in the Proposal and the Master Services",
    "Agreement. Execution triggers the 50% down-payment obligation and authorizes GHXSTSHIP",
    "to proceed with engineering, material procurement, wrap production, and fabrication.",
  ];
  for (const line of ackLines) {
    drawText(page, line, 40, y, helv, 9.5);
    y -= 13;
  }

  y -= 18;
  drawText(page, "SIGNATURES", 40, y, helvBold, 9, GRAY);
  y -= 16;

  // Two signature columns
  const colW = 252;
  const colGap = 28;
  const leftX = 40;
  const rightX = leftX + colW + colGap;
  const sigY = y - 110;

  // Client column
  drawText(page, "CLIENT", leftX, y, helvBold, 8, GRAY);
  drawText(page, "Red Bull North America", leftX, y - 12, helv, 10);
  page.drawRectangle({ x: leftX, y: sigY, width: colW, height: 64, borderColor: rgb(0.85, 0.87, 0.9), borderWidth: 0.75 });

  if (p.signatureMode === "draw" && p.signatureDataUrl?.startsWith("data:image/png")) {
    try {
      const base64 = p.signatureDataUrl.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const png = await pdf.embedPng(bytes);
      const scale = Math.min((colW - 16) / png.width, 52 / png.height);
      page.drawImage(png, {
        x: leftX + 8,
        y: sigY + 6,
        width: png.width * scale,
        height: png.height * scale,
      });
    } catch {
      drawText(page, "[signature image could not be embedded]", leftX + 8, sigY + 28, helv, 9, GRAY);
    }
  } else if (p.signatureText) {
    const cursive = await pdf.embedFont(StandardFonts.HelveticaOblique);
    drawText(page, p.signatureText, leftX + 12, sigY + 26, cursive, 20, RED);
  }

  drawText(page, p.clientName || "—", leftX, sigY - 16, helvBold, 10);
  drawText(page, p.clientTitle || "—", leftX, sigY - 30, helv, 9, GRAY);
  drawText(page, p.clientEmail || "—", leftX, sigY - 44, helv, 9, GRAY);

  // Producer column
  drawText(page, "PRODUCER", rightX, y, helvBold, 8, GRAY);
  drawText(page, "GHXSTSHIP", rightX, y - 12, helv, 10);
  page.drawRectangle({ x: rightX, y: sigY, width: colW, height: 64, borderColor: rgb(0.85, 0.87, 0.9), borderWidth: 0.75 });
  const prodSig = p.producerName || "Countersignature Pending";
  const cursive2 = await pdf.embedFont(StandardFonts.HelveticaOblique);
  drawText(page, prodSig, rightX + 12, sigY + 26, cursive2, 18, NAVY);
  drawText(page, p.producerName || "—", rightX, sigY - 16, helvBold, 10);
  drawText(page, p.producerTitle || "—", rightX, sigY - 30, helv, 9, GRAY);

  // Footer
  const footY = 48;
  page.drawLine({ start: { x: 40, y: footY + 18 }, end: { x: 572, y: footY + 18 }, thickness: 0.5, color: rgb(0.85, 0.87, 0.9) });
  drawText(page, `${DOC_ID}   ·   Confidential & Proprietary   ·   Prepared exclusively for Red Bull North America`, 40, footY, helv, 8, GRAY);
  drawText(page, "GHXSTSHIP — Miami · New York · Chicago · Los Angeles — ghxstship.tours", 40, footY - 12, helv, 8, GRAY);

  return pdf.save();
}

function validate(body: unknown): body is SignPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const isStr = (v: unknown): v is string => typeof v === "string";
  return (
    isStr(b.clientName) && b.clientName.length > 0 &&
    isStr(b.clientEmail) && /.+@.+\..+/.test(b.clientEmail) &&
    (b.signatureMode === "draw" || b.signatureMode === "type") &&
    isStr(b.timestamp)
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!validate(body)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const payload = body as SignPayload;
  const pdfBytes = await buildPdf(payload);
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  const filename = `GHXST-RB-LED-001_Executed_${payload.timestamp.replace(/[^0-9]/g, "").slice(0, 12) || "signed"}.pdf`;

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_ADDRESS ?? "GHXSTSHIP <onboarding@resend.dev>";
  const teamTo = "julian.clarkson@ghxstship.pro";
  const teamCc = "sos@ghxstship.pro";
  const tierLabel = TIER_META[payload.tier]?.label ?? "Tier not specified";

  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      emailSent: false,
      reason: "email_service_unconfigured",
      pdfBase64,
      filename,
    });
  }

  const resend = new Resend(apiKey);
  const attachments = [{ filename, content: pdfBase64 }];

  try {
    const clientHtml = `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; max-width: 560px;">
        <h2 style="margin: 0 0 8px; color: #0a2240;">Agreement Executed</h2>
        <p style="margin: 0 0 12px; color: #555;">Document ${DOC_ID} — LED Illuminated Curved Mobile Bar</p>
        <p style="margin: 0 0 12px;">Hi ${payload.clientName.split(" ")[0]},</p>
        <p style="margin: 0 0 12px;">Thanks for executing the GHXSTSHIP × Red Bull North America purchase agreement for the LED Illuminated Curved Mobile Bar. Your signed copy is attached.</p>
        <p style="margin: 0 0 12px;"><strong>Selection:</strong> ${tierLabel}</p>
        <p style="margin: 0 0 12px;">Our team will follow up shortly with the 50% deposit invoice and production kickoff confirmation.</p>
        <p style="margin: 24px 0 0; color: #555; font-size: 12px;">GHXSTSHIP · Miami · New York · Chicago · Los Angeles</p>
      </div>
    `;
    await resend.emails.send({
      from: fromAddress,
      to: payload.clientEmail,
      subject: `Executed: ${DOC_ID} — LED Illuminated Curved Mobile Bar`,
      html: clientHtml,
      attachments,
    });

    const teamHtml = `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; max-width: 560px;">
        <h2 style="margin: 0 0 8px; color: #0a2240;">Signature Received</h2>
        <p style="margin: 0 0 12px; color: #555;">${DOC_ID} — Red Bull North America</p>
        <table style="border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 4px 12px 4px 0; color: #555;">Signer</td><td>${payload.clientName} — ${payload.clientTitle || "—"}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #555;">Email</td><td>${payload.clientEmail}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #555;">Tier</td><td>${tierLabel}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #555;">Mode</td><td>${payload.signatureMode}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #555;">Timestamp</td><td>${payload.timestamp}</td></tr>
        </table>
        <p style="margin: 16px 0 0;">Executed PDF attached. Countersign and issue deposit invoice.</p>
      </div>
    `;
    await resend.emails.send({
      from: fromAddress,
      to: teamTo,
      cc: teamCc,
      subject: `Signed: ${DOC_ID} — ${payload.clientName} (Red Bull North America)`,
      html: teamHtml,
      attachments,
    });

    return NextResponse.json({ ok: true, emailSent: true, filename });
  } catch (err) {
    return NextResponse.json({
      ok: true,
      emailSent: false,
      reason: "email_send_failed",
      error: err instanceof Error ? err.message : "unknown",
      pdfBase64,
      filename,
    });
  }
}
