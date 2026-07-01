export const generateInvoiceHTML = (orderData) => {
  const address = orderData.shippingAddress || {};
  const customerName = address.name || orderData.customerName || 'Customer';
  const street = address.street || '';
  const city = address.city || '';
  const state = address.state || '';
  const zip = address.zip || '';
  const phone = address.number || '';

  // 1. Clean the Order ID to remove the raw "order_" prefix from Razorpay
  const rawOrderId = orderData.razorpayOrderId || orderData._id || '';
  const cleanOrderId = rawOrderId.replace(/^order_/, '').toUpperCase();

  // 2. GST Breakdown Calculation (Assuming 18% inclusive GST for water bottles)
  const totalAmount = Number(orderData.totalAmount || 0);
  const basePrice = totalAmount / 1.18;
  const totalGst = totalAmount - basePrice;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: A4; margin: 0; }
        body { 
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
          color: #1e293b; 
          margin: 0; 
          padding: 50px 40px;
          background: #ffffff;
          line-height: 1.5;
        }
        
        .wrapper-table { width: 100%; border-collapse: collapse; }
        
        /* Modern Minimal Header */
        .header-section { margin-bottom: 35px; border-bottom: 1px solid #e2e8f0; padding-bottom: 25px; }
        .brand-name { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 1px; text-transform: uppercase; }
        .brand-subtext { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .invoice-title { font-size: 26px; font-weight: 300; text-align: right; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
        
        /* Business Meta Grid */
        .info-table { width: 100%; margin-bottom: 35px; border-collapse: collapse; }
        .info-col { width: 33.33%; vertical-align: top; font-size: 12px; color: #334155; line-height: 1.7; }
        .info-heading { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 6px; }
        
        /* Premium Table Design */
        .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .items-table th { 
          background: #f8fafc; 
          color: #475569; 
          text-align: left; 
          padding: 12px 10px; 
          font-size: 11px; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }
        .items-table td { padding: 14px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; vertical-align: middle; }
        
        /* Summary Calculation Blocks */
        .totals-table { width: 100%; border-collapse: collapse; margin-top: 25px; }
        .total-row td { padding: 6px 10px; font-size: 13px; color: #475569; }
        .grand-total td { font-size: 16px; font-weight: bold; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        
        .footer { margin-top: 60px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      </style>
    </head>
    <body>
      
      <table class="wrapper-table header-section">
        <tr>
          <td>
            <div class="brand-name">Bouncy Bucket</div>
            <div class="brand-subtext">Premium E-Commerce Operations</div>
          </td>
          <td class="invoice-title">Tax Invoice</td>
        </tr>
      </table>

      <table class="info-table">
        <tr>
          <td class="info-col">
            <div class="info-heading">Supplier</div>
            <strong>Bouncy Bucket</strong><br>
            UGF, Plot E4, Hanuman Vihar, Barola<br>
            Noida, Uttar Pradesh - 201301<br>
            <strong>GSTIN:</strong> 09CVJPC3384D1ZM<br>
            <strong>Email:</strong> sales@bouncybucket.com
          </td>
          
          <td class="info-col" style="padding-left: 20px;">
            <div class="info-heading">Billed To</div>
            <strong>${customerName}</strong><br>
            ${street}<br>
            ${city}, ${state} - ${zip}<br>
            ${phone ? `Phone: +91 ${phone}` : ''}
          </td>
          
          <td class="info-col text-right">
            <div class="info-heading">Invoice Details</div>
            <strong>Invoice No:</strong> #BB-${cleanOrderId}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}<br>
            <strong>Place of Supply:</strong> ${state.toUpperCase()}<br>
            <strong>Payment Mode:</strong> Prepaid (Digital)
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 45%;">Item Description</th>
            <th style="width: 15%; text-align: center;">Size</th>
            <th style="width: 10%; text-align: center;">Qty</th>
            <th style="width: 15%; text-align: right;">Taxable Value</th>
            <th style="width: 15%; text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${orderData.items.map(item => {
            const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
            const itemTaxable = itemTotal / 1.18;
            return `
              <tr>
                <td><strong>${item.title}</strong></td>
                <td class="text-center">${item.capacity || 'Standard'}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">₹${itemTaxable.toFixed(2)}</td>
                <td class="text-right">₹${itemTotal.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
          
          ${orderData.isCustomizable ? `
            <tr>
              <td><strong>Custom Laser Engraving Services</strong></td>
              <td class="text-center">-</td>
              <td class="text-center">1</td>
              <td class="text-right">₹${((orderData.customizationOptions?.price || 299) / 1.18).toFixed(2)}</td>
              <td class="text-right">₹${orderData.customizationOptions?.price || 299}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <table class="totals-table">
        <tr>
          <td style="width: 50%; vertical-align: top; font-size: 11px; color: #94a3b8; line-height: 1.6; padding-top: 10px;">
            <strong>Terms & Conditions:</strong><br>
            1. Goods once sold will not be taken back or exchanged.<br>
            2. All disputes are subject to Gurugram jurisdiction only.
          </td>
          <td style="width: 50%;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr class="total-row">
                <td class="text-right">Taxable Value (Subtotal):</td>
                <td class="text-right" style="width: 40%;">₹${basePrice.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td class="text-right">CGST (9%):</td>
                <td class="text-right">₹${cgst.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td class="text-right">SGST (9%):</td>
                <td class="text-right">₹${sgst.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td class="text-right">Integrated Tax (IGST):</td>
                <td class="text-right">₹0.00</td>
              </tr>
              <tr class="grand-total">
                <td class="text-right">Grand Total (Inclusive of GST):</td>
                <td class="text-right">₹${totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table class="wrapper-table" style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <tr>
          <td style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.8;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
              This is a digitally generated invoice
            </p>
            <p style="margin: 0; color: #94a3b8;">
              No physical signature is required. Tax computed electronically on behalf of <strong>Bouncy Bucket</strong>.
            </p>
            <p style="margin: 8px 0 0 0; color: #cbd5e1; font-size: 10px;">
              Thank you for your business! For queries or support, reach out to sales@bouncybucket.com
            </p>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};