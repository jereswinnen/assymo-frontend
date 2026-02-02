/**
 * Opens a new window with the provided HTML content and triggers the print dialog.
 */
export function printHTML(title: string, bodyContent: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.error("Failed to open print window - popup may be blocked");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          padding: 20mm;
          color: #1a1a1a;
        }
        h1 {
          font-size: 16pt;
          margin-bottom: 1em;
          padding-bottom: 0.5em;
          border-bottom: 2px solid #1a1a1a;
        }
        h2 {
          font-size: 12pt;
          font-weight: 600;
          color: #666;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .field {
          margin-bottom: 0.5em;
        }
        .field-label {
          font-weight: 600;
          display: inline;
        }
        .field-value {
          display: inline;
        }
        .section {
          margin-bottom: 1.5em;
        }
        .highlight {
          background: #f5f5f5;
          padding: 0.75em;
          border-radius: 4px;
          margin-bottom: 1em;
        }
        .meta {
          font-size: 10pt;
          color: #666;
          margin-top: 2em;
          padding-top: 1em;
          border-top: 1px solid #ddd;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
