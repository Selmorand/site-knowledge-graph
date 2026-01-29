import { baseLayout } from '../layouts/base';

export function renderHomePage(error?: string): string {
  const content = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">Analyze a Website</h2>
      <a href="/ui/reports" class="btn btn-secondary" style="text-decoration: none;">
        📊 View Past Reports
      </a>
    </div>

    ${error ? `
      <div class="alert alert-error">
        <strong>Error:</strong> ${escapeHtml(error)}
      </div>
    ` : ''}

    <div class="alert alert-info">
      <strong>What this tool does:</strong>
      <ul style="margin: 10px 0 0 20px;">
        <li>Crawls the website (respecting robots.txt)</li>
        <li>Extracts content and structure</li>
        <li>Identifies entities (organizations, products, services, etc.)</li>
        <li>Maps relationships between entities</li>
        <li>Generates downloadable reports</li>
      </ul>
    </div>

    <form action="/ui/analyze" method="POST" style="margin-top: 30px;">
      <div class="form-group">
        <label for="url">Website URL</label>
        <input
          type="url"
          id="url"
          name="url"
          placeholder="https://example.com"
          required
          pattern="https?://.+"
        >
        <p class="help-text">Enter the full URL including http:// or https://</p>
      </div>

      <div class="form-group">
        <label for="maxDepth">Maximum Crawl Depth (optional)</label>
        <input
          type="number"
          id="maxDepth"
          name="maxDepth"
          value="3"
          min="1"
          max="5"
          style="width: 100px;"
        >
        <p class="help-text">How many levels deep to crawl (1-5)</p>
      </div>

      <div class="form-group">
        <label for="maxPages">Maximum Pages (optional)</label>
        <input
          type="number"
          id="maxPages"
          name="maxPages"
          value="50"
          min="1"
          max="500"
          style="width: 100px;"
        >
        <p class="help-text">Maximum number of pages to analyze (1-500)</p>
      </div>

      <button type="submit" class="btn btn-success" style="font-size: 1.2em; padding: 15px 30px;">
        🚀 Run Analysis
      </button>
    </form>

    <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 6px;">
      <h3 style="margin-bottom: 10px;">What happens next?</h3>
      <ol style="margin-left: 20px;">
        <li>The system will crawl your website</li>
        <li>Extract entities and relationships</li>
        <li>Build a knowledge graph</li>
        <li>Generate a comprehensive report</li>
        <li>Provide downloadable exports (PDF, CSV, JSON)</li>
      </ol>
      <p style="margin-top: 10px; color: #666;"><strong>Note:</strong> Analysis time depends on site size. Small sites: 1-2 minutes. Larger sites: 5-10 minutes.</p>
    </div>
  `;

  return baseLayout('Home', content);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
