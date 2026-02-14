'use client'

import React, { useCallback, useRef, useState } from 'react';
import SidebarBtn from './dashboardSidebarBtn';

export type FrontendPdfDownloadButtonProps = {
  targetRef: React.RefObject<HTMLElement>;
  label?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  usePrintCss?: boolean;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

type Html2PdfOptions = {
  margin: number;
  filename: string;
  image: { type: 'jpeg' | 'png' | 'webp'; quality: number };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    logging: boolean;
    windowWidth?: number;
  };
  jsPDF: { unit: 'mm'; format: 'a4'; orientation: 'portrait' | 'landscape' };
};

const MM_PER_INCH = 25.4;
const CSS_DPI = 96;
const A4_PORTRAIT_MM = { width: 210, height: 297 };
const PRINT_LAYOUT_WIDTH_PX = 1048; // matches PrintButton printCss

function mmToPx(mm: number): number {
  return Math.round((mm / MM_PER_INCH) * CSS_DPI);
}

function getA4PagePx(orientation: 'portrait' | 'landscape') {
  const portraitWidthPx = mmToPx(A4_PORTRAIT_MM.width);
  const portraitHeightPx = mmToPx(A4_PORTRAIT_MM.height);

  if (orientation === 'portrait') {
    return { widthPx: portraitWidthPx, heightPx: portraitHeightPx };
  }

  return { widthPx: portraitHeightPx, heightPx: portraitWidthPx };
}

function buildPrintCssSandboxCss(): string {
  // Mirrors the PrintButton's printCss intent, but targets the sandbox.
  // Also forces color adjustments to match screen styles.
  return `
    @page{ margin:10mm; }
    .pdf-print-sandbox{ width:${PRINT_LAYOUT_WIDTH_PX}px; margin:0; padding:0; background:#ffffff; }
    .pdf-print-sandbox, .pdf-print-sandbox *{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  `;
}

async function generateAndDownloadPdfFromElement(
  element: HTMLElement,
  options: Html2PdfOptions,
  behavior: { usePrintCss: boolean }
): Promise<void> {
  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = (html2pdfModule as any).default ?? (html2pdfModule as any);

  try {
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready;
    }
  } catch {
    // ignore
  }

  const clonedElement = element.cloneNode(true) as HTMLElement;

  const printHiddenElements = clonedElement.querySelectorAll('.print\\:hidden');
  printHiddenElements.forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  const sandbox = document.createElement('div');
  sandbox.style.position = 'fixed';
  sandbox.style.left = '-100000px';
  sandbox.style.top = '0';
  if (behavior.usePrintCss) {
    sandbox.className = 'pdf-print-sandbox';
    sandbox.style.width = `${PRINT_LAYOUT_WIDTH_PX}px`;
  } else {
    const page = getA4PagePx(options.jsPDF.orientation);
    // Key: render at A4 width so html2pdf doesn't shrink-to-fit.
    sandbox.style.width = `${page.widthPx}px`;
  }
  sandbox.style.pointerEvents = 'none';
  sandbox.style.opacity = '0';

  // Force the cloned content to use the sandbox (A4) width.
  clonedElement.style.width = '100%';
  clonedElement.style.maxWidth = '100%';
  clonedElement.style.margin = '0';

  sandbox.appendChild(clonedElement);
  document.body.appendChild(sandbox);

  let injectedStyleEl: HTMLStyleElement | null = null;
  if (behavior.usePrintCss) {
    injectedStyleEl = document.createElement('style');
    injectedStyleEl.textContent = buildPrintCssSandboxCss();
    sandbox.appendChild(injectedStyleEl);
  }

  try {
    await html2pdf().set(options).from(clonedElement).save();
  } finally {
    try {
      if (injectedStyleEl) sandbox.removeChild(injectedStyleEl);
    } catch {
      // ignore
    }
    document.body.removeChild(sandbox);
  }
}

export default function FrontendPdfDownloadButton({
  targetRef,
  label = 'Download',
  filename = 'document.pdf',
  orientation = 'portrait',
  usePrintCss = true,
  onSuccess,
  onError,
}: FrontendPdfDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const inFlightRef = useRef(false);

  const handleDownload = useCallback(async () => {
    if (inFlightRef.current) return;
    const element = targetRef?.current;
    if (!element) return;

    inFlightRef.current = true;
    setIsDownloading(true);

    try {
      const finalName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

      const options: Html2PdfOptions = {
        margin: usePrintCss ? 10 : 5,
        filename: finalName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation },
      };

      if (usePrintCss) {
        options.html2canvas.windowWidth = PRINT_LAYOUT_WIDTH_PX;
      } else {
        const page = getA4PagePx(orientation);
        options.html2canvas.windowWidth = page.widthPx;
      }

      await generateAndDownloadPdfFromElement(element, options, { usePrintCss });
      onSuccess?.();
    } catch (error) {
      onError?.(error);
    } finally {
      setIsDownloading(false);
      inFlightRef.current = false;
    }
  }, [filename, onError, onSuccess, orientation, targetRef, usePrintCss]);

  return (
    <SidebarBtn
      isActive
      leadingIcon={isDownloading ? 'eos-icons:three-dots-loading' : 'lucide:download'}
      leadingIconSize={20}
      label={label}
      onClick={handleDownload}
    />
  );
}
