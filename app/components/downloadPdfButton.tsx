'use client'
import React from 'react';
import SidebarBtn from './dashboardSidebarBtn';
import html2pdf from 'html2pdf.js';

type Props = { 
  targetRef: React.RefObject<HTMLElement>;
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  onSuccess?: () => void;
  onError?: (error: any) => void;
};

export default function DownloadPdfButton({ 
  targetRef, 
  title = 'Download PDF', 
  filename = 'document.pdf',
  orientation = 'portrait',
  onSuccess,
  onError
}: Props) {
  // simple lock to avoid duplicate downloads
  let isDownloading = false;

  const handleDownload = async () => {
    if (isDownloading) return;
    if (!targetRef?.current) return;
    isDownloading = true;

    try {
      const element = targetRef.current;
      
      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Hide elements with print:hidden class by adding inline style
      const printHiddenElements = clonedElement.querySelectorAll('.print\\:hidden');
      printHiddenElements.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
      
      // PDF generation options
      const options = {
        margin: 10,
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: orientation
        }
      };

      // Generate and download PDF
      await html2pdf().set(options).from(clonedElement).save();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('PDF download failed', e);
      
      // Call error callback if provided
      if (onError) {
        onError(e);
      }
    } finally {
      isDownloading = false;
    }
  };

  return (
    <SidebarBtn
      isActive
      leadingIcon={"lucide:download"}
      leadingIconSize={20}
      label={title}
      onClick={handleDownload}
    />
  );
}
