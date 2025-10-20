import { NextRequest, NextResponse } from 'next/server';
import { ProductList } from '@/types/lists';
import { generatePDFHTML } from '@/services/pdf-generator';

const WP_API_URL = 'https://api.floradistro.com/wp-json';
const WP_API_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WP_API_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function POST(request: NextRequest) {
  try {
    const { list, recipients, subject, message } = await request.json();

    if (!list || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const productList = list as ProductList;

    // Generate email HTML
    const emailHtml = generateListEmailHTML(productList, message);
    
    // Generate PDF HTML
    const pdfHtml = generatePDFHTML(productList);

    // Prepare auth header
    const authHeader = 'Basic ' + Buffer.from(`${WP_API_KEY}:${WP_API_SECRET}`).toString('base64');

    // Send email via WordPress Flora Email Plugin
    const emailPayload = {
      to: recipients.join(','),
      subject: subject || `Product List: ${productList.name}`,
      message: emailHtml,
      pdf_html: pdfHtml,
      pdf_filename: `${productList.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      }
    };

    console.log('Sending email with PDF via WordPress API:', {
      endpoint: `${WP_API_URL}/flora/v1/email/send`,
      recipients: recipients,
      subject: emailPayload.subject,
      pdfAttached: true
    });

    // Use WordPress REST API to send email
    const response = await fetch(`${WP_API_URL}/flora/v1/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'X-Flora-Key': WP_API_KEY,
        'X-Flora-Secret': WP_API_SECRET
      },
      body: JSON.stringify(emailPayload)
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse WordPress response:', responseText);
      return NextResponse.json(
        { 
          error: 'WordPress plugin not responding correctly',
          details: 'The WordPress email plugin may not be installed or activated. Please install flora-email-service.zip',
          wpResponse: responseText.substring(0, 200)
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error('WordPress API error:', { status: response.status, result });
      
      // Check if it's the "plugin not installed" error
      if (result.code === 'invalid_username' || response.status === 401) {
        return NextResponse.json(
          { 
            error: '⚠️ WordPress Email Plugin Not Installed',
            details: 'Please upload and activate flora-email-service.zip in WordPress admin',
            instructions: 'Go to: https://api.floradistro.com/wp-admin/plugin-install.php?tab=upload',
            pluginFile: 'flora-email-service.zip is in your /Users/f/Desktop/admin folder'
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: result.message || 'Failed to send email',
          details: result.data || result,
          wpError: result.code
        },
        { status: response.status }
      );
    }

    console.log('Email sent successfully via WordPress');

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully! 📧',
      data: result
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function generateListEmailHTML(list: ProductList, customMessage?: string): string {
  // Build product rows based on visible columns
  const productsTableRows = list.products.map((product, index) => {
    const productData = product.productData;
    const cells: string[] = [];
    const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f8f8';
    
    list.columns.forEach(column => {
      const field = column.field;
      let value: any;
      
      // Get value from snapshot first, then from productData
      value = product.snapshot[field as keyof typeof product.snapshot] ?? productData[field as keyof typeof productData];
      
      if (field === 'image' && productData.image) {
        cells.push(`<td style="padding: 18px 20px; background-color: ${bgColor}; margin: 0;"><img src="${productData.image}" alt="${productData.name}" style="width: 70px; height: 70px; object-fit: cover; border: 3px solid #000000; display: block; margin: 0;" /></td>`);
      } else if (field === 'regular_price' || field === 'sale_price') {
        const price = value ? `$${parseFloat(value).toFixed(2)}` : '-';
        cells.push(`<td style="padding: 18px 20px; background-color: ${bgColor}; color: #000000; font-weight: 700; font-size: 16px; margin: 0;">${price}</td>`);
      } else if (field === 'total_stock' || field === 'stock_quantity') {
        cells.push(`<td style="padding: 18px 20px; background-color: ${bgColor}; color: #000000; font-weight: 700; font-size: 16px; margin: 0;">${value || 0}</td>`);
      } else if (Array.isArray(value)) {
        const displayValue = value.map(v => v.name || v).join(', ');
        cells.push(`<td style="padding: 18px 20px; background-color: ${bgColor}; color: #222222; font-size: 14px; margin: 0;">${displayValue || '-'}</td>`);
      } else {
        cells.push(`<td style="padding: 18px 20px; background-color: ${bgColor}; color: #222222; font-size: 14px; margin: 0;">${value || '-'}</td>`);
      }
    });
    
    return `<tr style="margin: 0; padding: 0;">${cells.join('')}</tr>`;
  }).join('');

  // Build table headers from list columns
  const tableHeaders = list.columns.map(column => 
    `<th style="padding: 18px 20px; text-align: left; color: #ffffff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; background-color: #000000; margin: 0; border: none;">${column.label}</th>`
  ).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${list.name}</title>
  <style>
    @font-face {
      font-family: 'DonGraffiti';
      src: url('https://api.floradistro.com/wp-content/uploads/DonGraffiti.otf') format('opentype');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; margin: 0; padding: 0;">
    <tr>
      <td style="padding: 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: middle; width: 80px;">
              <img src="https://api.floradistro.com/wp-content/uploads/logonew.png" alt="Flora" style="height: 70px; width: auto; display: block; margin: 0; border: none;" />
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <h1 style="margin: 0; color: #ffffff; font-family: 'DonGraffiti', cursive, 'Comic Sans MS', sans-serif; font-size: 56px; font-weight: 400; letter-spacing: 5px; line-height: 1; text-transform: uppercase;">FLORA DISTRO</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- List Title Bar -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; margin: 0; padding: 0;">
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0; color: #000000; font-size: 32px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">${list.name}</h2>
        ${list.description ? `<p style="margin: 12px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">${list.description}</p>` : ''}
        <p style="margin: 12px 0 0; color: #888888; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
          ${list.products.length} ${list.products.length === 1 ? 'Product' : 'Products'} • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </td>
    </tr>
  </table>

  <!-- Custom Message -->
  ${customMessage ? `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; margin: 0; padding: 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
    <tr>
      <td style="padding: 30px 40px;">
        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.7; font-style: italic;">${customMessage}</p>
      </td>
    </tr>
  </table>
  ` : ''}

  <!-- Products Table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-collapse: collapse; margin: 0; padding: 0;">
    <thead>
      <tr>
        ${tableHeaders}
      </tr>
    </thead>
    <tbody>
      ${productsTableRows}
    </tbody>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; margin: 0; padding: 0;">
    <tr>
      <td style="padding: 40px; text-align: center;">
        <h3 style="margin: 0; color: #ffffff; font-family: 'DonGraffiti', cursive, 'Comic Sans MS', sans-serif; font-size: 42px; font-weight: 400; letter-spacing: 5px; line-height: 1; text-transform: uppercase;">FLORA DISTRO</h3>
        <p style="margin: 16px 0 0; color: #aaaaaa; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
          Premium Cannabis Distribution
        </p>
        <p style="margin: 24px 0 0; color: #777777; font-size: 12px;">
          This list was generated from your Flora Admin Dashboard
        </p>
        <p style="margin: 8px 0 0; color: #555555; font-size: 11px;">
          © ${new Date().getFullYear()} Flora Distribution. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

