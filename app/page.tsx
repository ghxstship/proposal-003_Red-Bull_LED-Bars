"use client";

import { useEffect } from "react";
import Script from "next/script";
import { htmlContent } from "./_content";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "GHXSTSHIP",
  "description":
    "Full-service scenic fabrication and experiential production studio specializing in custom brand assets, illuminated environments, retail activations, and large-format graphics — serving Miami, New York, Chicago, Los Angeles, and markets nationwide.",
  "url": "https://ghxstship.tours",
  "telephone": "+1-407-885-6011",
  "email": "sos@ghxstship.pro",
  "areaServed": [
    { "@type": "City", "name": "Miami" },
    { "@type": "City", "name": "New York" },
    { "@type": "City", "name": "Chicago" },
    { "@type": "City", "name": "Los Angeles" },
  ],
  "knowsAbout": [
    "Scenic Fabrication",
    "Experiential Production",
    "Illuminated Environments",
    "Custom Brand Assets",
    "Large-Format Printing",
    "Retail Activations",
    "LED Hardware Integration",
    "DMX Lighting Systems",
  ],
  "sameAs": [
    "https://www.instagram.com/ghxstship/",
    "https://www.linkedin.com/company/ghxstship",
    "https://www.tiktok.com/@ghxstship",
    "https://x.com/ghxstship",
  ],
};

type SigCanvas = HTMLCanvasElement & {
  _clear?: () => void;
  _hasSig?: () => boolean;
};

declare global {
  interface Window {
    openLegal?: (type: string) => void;
    closeLegal?: () => void;
    clearCanvas?: (role: string) => void;
    switchSigTab?: (tab: string, btn: HTMLElement) => void;
    updateTypedSig?: (role: string) => void;
    submitSignature?: () => void;
    checkReady?: () => void;
    selectTier?: (tier: "essentials" | "signature" | "premier") => void;
  }
}

const TIER_META: Record<string, { label: string; price: string; rush: string }> = {
  essentials: { label: "Tier 01 · Essentials", price: "$8,600", rush: "+$2,150" },
  signature: { label: "Tier 02 · Signature", price: "$9,800", rush: "+$2,500" },
  premier: { label: "Tier 03 · Premier", price: "$11,600", rush: "+$2,900" },
};

export default function Home() {
  useEffect(() => {
    // ====== SCROLL FADE-UP ANIMATIONS ======
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

    // ====== ACTIVE NAV LINK ON SCROLL ======
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll<HTMLAnchorElement>("nav .nav-links a");

    const updateActiveNav = () => {
      const scrollPos = window.scrollY + 100;
      sections.forEach((section) => {
        const el = section as HTMLElement;
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        const id = section.getAttribute("id");
        if (scrollPos >= top && scrollPos < bottom) {
          navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + id) link.classList.add("active");
          });
        }
      });
    };

    window.addEventListener("scroll", updateActiveNav, { passive: true });
    updateActiveNav();

    // ====== SMOOTH SCROLL FOR NAV LINKS ======
    const navClickHandlers: Array<[HTMLAnchorElement, (e: MouseEvent) => void]> = [];
    navLinks.forEach((link) => {
      const handler = (e: MouseEvent) => {
        e.preventDefault();
        const href = link.getAttribute("href");
        if (!href) return;
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      link.addEventListener("click", handler);
      navClickHandlers.push([link, handler]);
    });

    // ====== LEGAL PANELS ======
    const openLegal = (type: string) => {
      document.querySelector(".legal-overlay")?.classList.add("open");
      document.getElementById("panel-" + type)?.classList.add("open");
      document.body.style.overflow = "hidden";
    };

    const closeLegal = () => {
      document.querySelector(".legal-overlay")?.classList.remove("open");
      document.querySelectorAll(".legal-panel").forEach((p) => p.classList.remove("open"));
      document.body.style.overflow = "";
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLegal();
    };
    document.addEventListener("keydown", keyHandler);

    // ====== SIGNATURE CANVAS ======
    const isValidEmail = (v: string) => /.+@.+\..+/.test(v);

    const checkReady = () => {
      const tab = document.querySelector(".sig-tab.active");
      const btn = document.getElementById("sig-submit-btn") as HTMLButtonElement | null;
      if (!tab || !btn) return;
      let ready = false;
      if (tab.id === "sig-tab-draw") {
        const cc = document.getElementById("sig-canvas-client") as SigCanvas | null;
        const nc = document.getElementById("sig-name-client") as HTMLInputElement | null;
        const ec = document.getElementById("sig-email-client") as HTMLInputElement | null;
        ready = !!(
          cc && cc._hasSig && cc._hasSig() &&
          nc && nc.value.trim().length > 0 &&
          ec && isValidEmail(ec.value.trim())
        );
      } else {
        const tc = document.getElementById("sig-typed-client") as HTMLInputElement | null;
        const te = document.getElementById("sig-typed-email-client") as HTMLInputElement | null;
        ready = !!(
          tc && tc.value.trim().length > 2 &&
          te && isValidEmail(te.value.trim())
        );
      }
      btn.disabled = !ready;
      if (ready) btn.classList.add("ready");
      else btn.classList.remove("ready");
    };

    const initCanvas = (id: string) => {
      const c = document.getElementById(id) as SigCanvas | null;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      c.width = c.offsetWidth * 2;
      c.height = c.offsetHeight * 2;
      ctx.scale(2, 2);
      ctx.strokeStyle = "#DB0A40";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      let drawing = false;
      let hasSig = false;
      const getPos = (e: PointerEvent) => {
        const r = c.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      c.addEventListener("pointerdown", (e) => {
        drawing = true;
        const p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        e.preventDefault();
      });
      c.addEventListener("pointermove", (e) => {
        if (!drawing) return;
        const p = getPos(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        hasSig = true;
        c.classList.add("signed");
        checkReady();
        e.preventDefault();
      });
      c.addEventListener("pointerup", () => {
        drawing = false;
      });
      c.addEventListener("pointerleave", () => {
        drawing = false;
      });
      c._clear = () => {
        ctx.clearRect(0, 0, c.width, c.height);
        hasSig = false;
        c.classList.remove("signed");
        checkReady();
      };
      c._hasSig = () => hasSig;
    };

    const clearCanvas = (role: string) => {
      const c = document.getElementById("sig-canvas-" + role) as SigCanvas | null;
      if (c && c._clear) c._clear();
    };

    const switchSigTab = (tab: string, btn: HTMLElement) => {
      document.querySelectorAll(".sig-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".sig-opt-btn").forEach((b) => b.classList.remove("active"));
      document.getElementById("sig-tab-" + tab)?.classList.add("active");
      btn.classList.add("active");
      checkReady();
    };

    const updateTypedSig = (role: string) => {
      const input = document.getElementById("sig-typed-" + role) as HTMLInputElement | null;
      const preview = document.getElementById("sig-typed-preview-" + role);
      if (input && preview) preview.textContent = input.value;
      checkReady();
    };

    const gatherSigPayload = () => {
      const activeTab = document.querySelector(".sig-tab.active")?.id === "sig-tab-draw" ? "draw" : "type";
      const clientName = (
        activeTab === "draw"
          ? (document.getElementById("sig-name-client") as HTMLInputElement | null)?.value
          : (document.getElementById("sig-typed-client") as HTMLInputElement | null)?.value
      )?.trim() ?? "";
      const clientTitle = (
        activeTab === "draw"
          ? (document.getElementById("sig-title-client") as HTMLInputElement | null)?.value
          : (document.getElementById("sig-typed-title-client") as HTMLInputElement | null)?.value
      )?.trim() ?? "";
      const clientEmail = (
        activeTab === "draw"
          ? (document.getElementById("sig-email-client") as HTMLInputElement | null)?.value
          : (document.getElementById("sig-typed-email-client") as HTMLInputElement | null)?.value
      )?.trim() ?? "";
      const producerName = (document.getElementById("sig-name-producer") as HTMLInputElement | null)?.value?.trim() ?? "";
      const producerTitle = (document.getElementById("sig-title-producer") as HTMLInputElement | null)?.value?.trim() ?? "";
      const tier = (document.getElementById("sig-tier") as HTMLInputElement | null)?.value?.trim() ?? "";

      let signatureDataUrl: string | undefined;
      let signatureText: string | undefined;
      if (activeTab === "draw") {
        const c = document.getElementById("sig-canvas-client") as HTMLCanvasElement | null;
        signatureDataUrl = c?.toDataURL("image/png");
      } else {
        signatureText = clientName;
      }

      return {
        clientName,
        clientTitle,
        clientEmail,
        producerName,
        producerTitle,
        signatureMode: activeTab,
        signatureDataUrl,
        signatureText,
        tier,
        timestamp: new Date().toISOString(),
        proposalUrl: typeof window !== "undefined" ? window.location.origin + window.location.pathname : undefined,
      };
    };

    const submitSignature = async () => {
      const btn = document.getElementById("sig-submit-btn") as HTMLButtonElement | null;
      if (!btn || btn.disabled) return;

      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Executing…";

      const payload = gatherSigPayload();
      let response: { ok: boolean; emailSent?: boolean; reason?: string; pdfBase64?: string; filename?: string } = { ok: false };

      try {
        const res = await fetch("/api/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        response = await res.json();
      } catch {
        response = { ok: false, reason: "network_error" };
      }

      const ts = new Date(payload.timestamp).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
      const block = document.getElementById("sig-block-main");
      if (block) block.style.display = "none";
      const conf = document.getElementById("sig-confirmation");
      if (conf) {
        conf.classList.add("active");
        conf.style.display = "block";
      }
      const stamp = document.getElementById("sig-confirm-timestamp");
      if (stamp) stamp.textContent = "Executed · " + ts;

      const status = document.getElementById("sig-confirm-status");
      if (status) {
        if (response.emailSent) {
          status.textContent = `Signed PDF emailed to ${payload.clientEmail} and the GHXSTSHIP team.`;
        } else if (response.ok && response.pdfBase64) {
          status.textContent = "Signed PDF ready for download. Email notification will follow.";
          const link = document.getElementById("sig-download-link") as HTMLAnchorElement | null;
          if (link && response.pdfBase64) {
            link.href = `data:application/pdf;base64,${response.pdfBase64}`;
            link.download = response.filename ?? "signed-proposal.pdf";
            link.style.display = "inline-flex";
          }
        } else {
          status.textContent = "Signature recorded. Our team will follow up shortly.";
        }
      }

      btn.textContent = originalLabel ?? "Execute Agreement";
    };

    const selectTier = (tier: "essentials" | "signature" | "premier") => {
      const meta = TIER_META[tier];
      if (!meta) return;
      const summary = document.querySelector(".sig-summary");
      if (summary) summary.textContent = `Project Investment · ${meta.label} · ${meta.price} (Rush ${meta.rush})`;
      const tierField = document.getElementById("sig-tier") as HTMLInputElement | null;
      if (tierField) tierField.value = tier;
      document.getElementById("authorize")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Expose to inline `onclick` handlers in the injected HTML
    window.openLegal = openLegal;
    window.closeLegal = closeLegal;
    window.clearCanvas = clearCanvas;
    window.switchSigTab = switchSigTab;
    window.updateTypedSig = updateTypedSig;
    window.submitSignature = submitSignature;
    window.checkReady = checkReady;
    window.selectTier = selectTier;

    // Initialize canvases on mount
    initCanvas("sig-canvas-client");
    initCanvas("sig-canvas-producer");

    // Also attach oninput="checkReady()" handlers programmatically
    const clientNameInput = document.getElementById("sig-name-client");
    clientNameInput?.addEventListener("input", checkReady);

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActiveNav);
      document.removeEventListener("keydown", keyHandler);
      navClickHandlers.forEach(([link, h]) => link.removeEventListener("click", h));
      clientNameInput?.removeEventListener("input", checkReady);
      delete window.openLegal;
      delete window.closeLegal;
      delete window.clearCanvas;
      delete window.switchSigTab;
      delete window.updateTypedSig;
      delete window.submitSignature;
      delete window.checkReady;
      delete window.selectTier;
    };
  }, []);

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </>
  );
}
