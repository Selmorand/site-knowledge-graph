export function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Site Knowledge Graph</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      padding: 40px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    .header h1 {
      font-size: 2.5em;
      color: #667eea;
      margin-bottom: 10px;
    }

    .header p {
      color: #666;
      font-size: 1.1em;
    }

    .content {
      margin: 20px 0;
    }

    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      border: none;
      font-size: 1em;
      cursor: pointer;
      transition: background 0.3s;
      font-weight: 500;
    }

    .btn:hover {
      background: #5568d3;
    }

    .btn-secondary {
      background: #6c757d;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-success {
      background: #28a745;
    }

    .btn-success:hover {
      background: #218838;
    }

    input[type="text"],
    input[type="url"] {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 1em;
      transition: border-color 0.3s;
    }

    input[type="text"]:focus,
    input[type="url"]:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    .help-text {
      color: #666;
      font-size: 0.9em;
      margin-top: 5px;
    }

    .alert {
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }

    .alert-info {
      background: #d1ecf1;
      color: #0c5460;
      border-left: 4px solid #17a2b8;
    }

    .alert-success {
      background: #d4edda;
      color: #155724;
      border-left: 4px solid #28a745;
    }

    .alert-error {
      background: #f8d7da;
      color: #721c24;
      border-left: 4px solid #dc3545;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Site Knowledge Graph</h1>
      <p>Analyze websites and extract structured knowledge</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Powered by Site Knowledge Graph v0.1.0</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
