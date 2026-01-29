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
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: #ffffff;
      background: #0a0a0a;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: rgba(26, 26, 26, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      padding: 40px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header h1 {
      font-size: 2.5em;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 10px;
    }

    .header p {
      color: #9ca3af;
      font-size: 1.1em;
      font-weight: 400;
    }

    .content {
      margin: 20px 0;
    }

    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #3b82f6;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      border: none;
      font-size: 1em;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 400;
    }

    .btn:hover {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    .btn-secondary:hover {
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: none;
    }

    .btn-success {
      background: #10b981;
    }

    .btn-success:hover {
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
    }

    input[type="text"],
    input[type="url"],
    input[type="number"] {
      width: 100%;
      padding: 12px;
      background: #1a1a1a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 1em;
      color: #ffffff;
      transition: all 0.2s ease;
    }

    input[type="text"]:focus,
    input[type="url"]:focus,
    input[type="number"]:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #ffffff;
    }

    .help-text {
      color: #9ca3af;
      font-size: 0.9em;
      font-weight: 400;
      margin-top: 5px;
    }

    .alert {
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      background: rgba(26, 26, 26, 0.8);
      backdrop-filter: blur(10px);
    }

    .alert-info {
      border: 1px solid #3b82f6;
      color: #ffffff;
      border-left: 4px solid #3b82f6;
    }

    .alert-success {
      border: 1px solid #10b981;
      color: #ffffff;
      border-left: 4px solid #10b981;
    }

    .alert-error {
      border: 1px solid #ef4444;
      color: #ffffff;
      border-left: 4px solid #ef4444;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      color: #9ca3af;
      font-size: 0.9em;
      font-weight: 400;
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
