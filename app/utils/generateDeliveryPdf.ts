'use client'

import html2pdf from 'html2pdf.js';

// Type definitions for the PDF data structure
export interface ProductItem {
  productName?: string;
  uom?: string;
  quantity?: number;
  price?: number;
  net?: number;
  vat?: number;
  total?: number;
}

export interface PdfData {
  // Header
  documentType?: string; // e.g., "ORDER", "DELIVERY", "INVOICE"
  referenceNumber?: string; // e.g., "1473260106ORD05"

  // Seller Information
  seller?: {
    name?: string;
    phone?: string;
    address?: string;
    code?: string;
    email?: string;
  };

  // Buyer Information
  buyer?: {
    name?: string;
    address?: string;
    phone?: string;
    code?: string;
    email?: string;
  };

  // Products
  products?: ProductItem[];

  // Totals
  netTotal?: number;
  vatTotal?: number;
  grandTotal?: number;
  currency?: string; // e.g., "UGX", "USD"

  // Payment Method & Notes
  paymentMethod?: string;
  customerNote?: string;

  // Dates
  orderDate?: string;
  deliveryDate?: string;

  // Optional logo URL
  logoUrl?: string;

  // Additional flexible fields
  [key: string]: any;
}

export interface GeneratePdfOptions {
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  scale?: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Global reusable PDF generator - Matches exact styling from design
 * Works 100% client-side with no backend dependency
 * 
 * @param data - PDF content data (all fields optional for flexibility)
 * @param options - Generation options
 * 
 * @example
 * // Simple usage
 * await generateDeliveryPdf({
 *   documentType: "ORDER",
 *   referenceNumber: "1473260106ORD05",
 *   seller: { name: "Gomansik Distributors", code: "WHO015" },
 *   buyer: { name: "Gomansik Makindye", code: "AC00398372" },
 *   products: [{ productName: "Riham Cola 600ml X 12", quantity: 12, price: 1167 }],
 *   grandTotal: 14004
 * });
 */
export async function generateDeliveryPdf(
  data?: PdfData,
  options: GeneratePdfOptions & { html?: string } = {}
): Promise<void> {
  const {
    fileName = 'delivery-note.pdf',
    orientation = 'portrait',
    margin = 10,
    scale = 2,
    onSuccess,
    onError,
    html
  } = options;

  try {
    // Validate input
    if (!html && !data) {
      throw new Error('Either data or html must be provided to generate the PDF.');
    }

    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm'; // A4 width
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    // Generate the HTML content
    container.innerHTML = html || (data ? generatePdfHtml(data) : '');

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Ensure all images are loaded
    const images = container.getElementsByTagName('img');
    if (images.length > 0) {
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            // Timeout after 3 seconds
            setTimeout(resolve, 3000);
          });
        })
      );
    }

    // PDF generation options
    const pdfOptions = {
      margin: margin,
      filename: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: scale,
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: orientation
      }
    };

    // Generate and download PDF
    await html2pdf().set(pdfOptions).from(container).save();

    // Clean up
    document.body.removeChild(container);

    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
    if (onError) {
      onError(error);
    }
    // Don't rethrow to avoid breaking UI in reusable scenarios
  }
}

/**
 * Generates the HTML content for the PDF - Matches exact design styling
 */
function generatePdfHtml(data: PdfData): string {
  const currency = data.currency || 'UGX';
  const products = data.products || [];
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px 30px; color: #000; background: #fff; box-sizing: border-box; font-size: 14px; line-height: 1.5;">
      
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 35px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
        <div style="flex: 1;">
          ${data.logoUrl ? `
            <img src="${data.logoUrl}" alt="Logo" style="height: 45px; width: auto; display: block;" />
          ` : `
            <div style="display: flex; align-items: center;">
              <div style="width: 45px; height: 45px; border: 2px solid #e30613; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <span style="color: #e30613; font-weight: 700; font-size: 20px;">H</span>
              </div>
              <div>
                <div style="color: #e30613; font-weight: 700; font-size: 16px; letter-spacing: 1.5px; line-height: 1.2;">HARISS</div>
                <div style="color: #6b7280; font-size: 10px; letter-spacing: 0.5px;">INTERNATIONAL (U) LTD</div>
              </div>
            </div>
          `}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 36px; color: #A4A7AE; font-weight: 300; margin-bottom: 5px; text-transform: uppercase;">${data.documentType || 'ORDER'}</div>
          <div style="font-size: 14px; color: #181D27; letter-spacing: 8px; font-weight: 500;">#${data.referenceNumber || ''}</div>
        </div>
      </div>

      <!-- Seller, Buyer, Dates Section -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px;">
        <!-- Seller -->
        <div style="flex: 1;">
          <div style="font-weight: 500; margin-bottom: 8px; color: #000; position:left;">Seller</div>
          <div style="font-weight: 600; margin-bottom: 5px; color: #000;">
            ${data.seller?.code || ''}${data.seller?.code && data.seller?.name ? ' - ' : ''}${data.seller?.name || ''}
          </div>
          ${data.seller?.address ? `<div style="margin-bottom: 3px; color: #374151;">${data.seller.address}</div>` : ''}
          ${data.seller?.phone ? `<div style="color: #374151;">Phone: ${data.seller.phone}</div>` : ''}
          ${data.seller?.email ? `<div style="color: #374151;">Email: ${data.seller.email}</div>` : ''}
        </div>

        <!-- Buyer -->
        <div style="flex: 1;">
          <div style="font-weight: 500; margin-bottom: 8px; color: #000;">Buyer</div>
          <div style="font-weight: 600; margin-bottom: 5px; color: #000;">
            ${data.buyer?.code && data.buyer?.name ? `${data.buyer.code} - ${data.buyer.name}` : (data.buyer?.name || '-')}
          </div>
          ${data.buyer?.address ? `<div style="margin-bottom: 3px; color: #374151;">${data.buyer.address}</div>` : ''}
          ${data.buyer?.phone ? `<div style="color: #374151;">Phone: ${data.buyer.phone}</div>` : ''}
          ${data.buyer?.email ? `<div style="color: #374151;">Email: ${data.buyer.email}</div>` : ''}
        </div>

        <!-- Dates -->
        <div style="flex: 1; text-align: right;">
          ${data.orderDate ? `
            <div style="margin-bottom: 8px;">
              <span style="color: #000;">Order Date: </span>
              <span style="font-weight: 700; color: #000;">${data.orderDate}</span>
            </div>
          ` : ''}
          ${data.deliveryDate ? `
            <div style="margin-bottom: 8px;">
              <span style="color: #000;">Delivery Date: </span>
              <span style="font-weight: 700; color: #000;">${data.deliveryDate}</span>
            </div>
          ` : ''}
          ${data.orderSource ? `
            <div>
              <span style="color: #000;">Order Source: </span>
              <span style="font-weight: 700; color: #000;">${data.orderSource}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Products Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
          <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 10px 8px; text-align: left; font-weight: 600; font-size: 13px; color: #374151;">#</th>
            <th style="padding: 10px 8px; text-align: left; font-weight: 600; font-size: 13px; color: #374151;">Item Name</th>
            <th style="padding: 10px 8px; text-align: center; font-weight: 600; font-size: 13px; color: #374151;">UOM</th>
            <th style="padding: 10px 8px; text-align: center; font-weight: 600; font-size: 13px; color: #374151;">Quantity</th>
            <th style="padding: 10px 8px; text-align: right; font-weight: 600; font-size: 13px; color: #374151;">Price</th>
            <th style="padding: 10px 8px; text-align: right; font-weight: 600; font-size: 13px; color: #374151;">Net</th>
            <th style="padding: 10px 8px; text-align: right; font-weight: 600; font-size: 13px; color: #374151;">VAT</th>
            <th style="padding: 10px 8px; text-align: right; font-weight: 600; font-size: 13px; color: #374151;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${products.length > 0 ? products.map((product, index) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 12px 8px; font-size: 13px; color: #000;">${index + 1}</td>
              <td style="padding: 12px 8px; font-size: 13px; color: #000;">${product.productName || 'N/A'}</td>
              <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #000;">${product.uom || ''}</td>
              <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #000;">${product.quantity || 0}</td>
              <td style="padding: 12px 8px; text-align: right; font-size: 13px; color: #000;">${formatNumber(product.price)}</td>
              <td style="padding: 12px 8px; text-align: right; font-size: 13px; color: #000;">${formatNumber(product.net)}</td>
              <td style="padding: 12px 8px; text-align: right; font-size: 13px; color: #000;">${formatNumber(product.vat)}</td>
              <td style="padding: 12px 8px; text-align: right; font-size: 13px; color: #000;">${formatNumber(product.total)}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="8" style="padding: 30px; text-align: center; color: #9ca3af;">No products available</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- Bottom Section: Notes and Totals -->
      <div style="display: flex; justify-content: space-between; gap: 40px;">
        <!-- Left: Customer Note & Payment Method -->
        <div style="flex: 1;">
          ${data.customerNote ? `
            <div style="margin-bottom: 15px;">
              <div style="font-weight: 600; margin-bottom: 5px; color: #000;">Customer Note</div>
              <div style="color: #374151; font-size: 13px;">${data.customerNote}</div>
            </div>
          ` : ''}
          
          ${data.paymentMethod ? `
            <div>
              <div style="font-weight: 600; margin-bottom: 5px; color: #000;">Payment Method</div>
              <div style="color: #374151; font-size: 13px;">${data.paymentMethod}</div>
            </div>
          ` : ''}
        </div>

        <!-- Right: Totals -->
        <div style="min-width: 350px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; gap: 60px;">
            <span style="color: #000;">Net Total</span>
            <span style="font-weight: 500; color: #000;">${currency} ${formatNumber(data.netTotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; gap: 60px;">
            <span style="color: #000;">VAT</span>
            <span style="font-weight: 500; color: #000;">${currency} ${formatNumber(data.vatTotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 8px; gap: 60px;">
            <span style="font-weight: 700; font-size: 16px; color: #181D27;">Total</span>
            <span style="font-weight: 700; font-size: 16px; color: #181D27;">${currency} ${formatNumber(data.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Formats numbers with thousands separators
 */
function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0.00';
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Alternative method: Generate PDF from an existing React component/HTML element
 * This is the recommended method as it captures the actual rendered content
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions = {}
): Promise<void> {
  const {
    fileName = 'document.pdf',
    orientation = 'portrait',
    margin = 10,
    scale = 2,
    onSuccess,
    onError
  } = options;

  try {
    if (!element) {
      throw new Error('No element provided');
    }

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Hide elements with print:hidden class
    const printHiddenElements = clonedElement.querySelectorAll('.print\\:hidden');
    printHiddenElements.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
    
    // PDF generation options
    const pdfOptions = {
      margin: margin,
      filename: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: scale,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: orientation
      }
    };

    // Generate and download PDF
    await html2pdf().set(pdfOptions).from(clonedElement).save();
    
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

/**
 * Global function to capture and download the current page content as PDF
 * Automatically finds the content container and generates PDF
 * @param selector - CSS selector for the element to capture (default: looks for common containers)
 * @param fileName - Name of the PDF file
 */
export async function downloadPageAsPdf(
  selector?: string,
  fileName: string = 'document.pdf'
): Promise<void> {
  try {
    // Try to find the element using provided selector or common patterns
    let element: HTMLElement | null = null;
    
    if (selector) {
      element = document.querySelector(selector) as HTMLElement;
    } else {
      // Try common container selectors
      const selectors = [
        '[ref="targetRef"]',
        '[data-pdf-content]',
        '.pdf-content',
        'main',
        '#content',
        '.container',
      ];
      
      for (const sel of selectors) {
        element = document.querySelector(sel) as HTMLElement;
        if (element) break;
      }
      
      // If still not found, use the body
      if (!element) {
        element = document.body;
      }
    }
    
    if (!element) {
      throw new Error('Could not find element to capture');
    }
    
    await generatePdfFromElement(element, {
      fileName,
      orientation: 'portrait',
      margin: 10,
      scale: 2,
    });
  } catch (error) {
    console.error('Failed to download page as PDF:', error);
    throw error;
  }
}

/**
 * Simplified wrapper for invoice generation - Use this for quick invoice PDFs
 * @param invoiceData - Simplified invoice data
 */
export async function generateInvoicePdf(invoiceData: Partial<PdfData>): Promise<void> {
  await generateDeliveryPdf({
    documentType: 'INVOICE',
    ...invoiceData
  });
}

/**
 * Transform API response data to PdfData format
 * @param apiData - Raw data from API
 */
export function transformToPdfData(apiData: any): PdfData {
  return {
    documentType: apiData.document_type || apiData.type || 'ORDER',
    referenceNumber: apiData.invoice_code || apiData.order_code || apiData.reference_number,
    seller: {
      name: apiData.seller_name || apiData.warehouse_name,
      code: apiData.seller_code || apiData.warehouse_code,
      address: apiData.seller_address || apiData.warehouse_address,
      phone: apiData.seller_phone || apiData.warehouse_phone,
      email: apiData.seller_email || apiData.warehouse_email,
    },
    buyer: {
      name: apiData.buyer_name || apiData.customer_name,
      code: apiData.buyer_code || apiData.customer_code,
      address: apiData.buyer_address || apiData.customer_address,
      phone: apiData.buyer_phone || apiData.customer_phone,
      email: apiData.buyer_email || apiData.customer_email,
    },
    products: apiData.products || apiData.items || [],
    netTotal: apiData.net_total || apiData.subtotal,
    vatTotal: apiData.vat_total || apiData.vat || apiData.tax,
    grandTotal: apiData.grand_total || apiData.total,
    currency: apiData.currency || 'UGX',
    paymentMethod: apiData.payment_method || apiData.paymentMethod,
    customerNote: apiData.customer_note || apiData.note,
    orderDate: apiData.order_date || apiData.date,
    deliveryDate: apiData.delivery_date || apiData.deliveryDate,
    orderSource: apiData.order_source || apiData.source,
    logoUrl: apiData.logo_url || apiData.logoUrl,
  };
}

