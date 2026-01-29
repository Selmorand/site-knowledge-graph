import { baseLayout } from '../layouts/base';

interface ReportSummary {
  siteId: string;
  url: string;
  domain: string;
  title: string | null;
  status: string;
  lastCrawledAt: Date | null;
  pageCount: number;
  entityCount: number;
}

export function renderReportsPage(reports: ReportSummary[]): string {
  const content = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">Past Analysis Reports</h2>
      <a href="/" class="btn btn-secondary" style="text-decoration: none;">
        🏠 Back to Home
      </a>
    </div>

    ${reports.length === 0 ? `
      <div class="alert alert-info">
        <strong>No reports yet!</strong>
        <p style="margin-top: 10px;">You haven't analyzed any websites yet. <a href="/" style="color: #3b82f6; font-weight: 600; text-decoration: none; transition: all 0.2s ease;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">Start your first analysis</a></p>
      </div>
    ` : `
      <div style="margin-bottom: 20px;">
        <p style="color: #9ca3af;">
          You have analyzed <strong style="color: #ffffff;">${reports.length}</strong> website${reports.length === 1 ? '' : 's'}.
          Click on any report to view detailed analysis.
        </p>
      </div>

      <div style="display: grid; gap: 20px;">
        ${reports.map(report => `
          <div style="
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 20px;
            transition: all 0.2s ease;
            background: rgba(26, 26, 26, 0.8);
            backdrop-filter: blur(10px);
          " onmouseover="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 20px rgba(59, 130, 246, 0.3)'" onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.boxShadow='none'">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 8px 0; color: #ffffff; font-weight: 600;">
                  ${escapeHtml(report.title || report.domain)}
                </h3>
                <p style="margin: 0; color: #3b82f6; font-size: 0.95em;">
                  ${escapeHtml(report.url)}
                </p>
              </div>
              <span style="
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 0.85em;
                font-weight: 500;
                background: ${getStatusColor(report.status)};
                color: white;
                white-space: nowrap;
              ">
                ${escapeHtml(report.status)}
              </span>
            </div>

            <div style="display: flex; gap: 30px; margin-bottom: 15px; padding: 12px 0; border-top: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <div>
                <div style="font-size: 0.85em; color: #9ca3af; margin-bottom: 4px;">Pages</div>
                <div style="font-size: 1.3em; font-weight: 600; color: #3b82f6;">${report.pageCount}</div>
              </div>
              <div>
                <div style="font-size: 0.85em; color: #9ca3af; margin-bottom: 4px;">Entities</div>
                <div style="font-size: 1.3em; font-weight: 600; color: #10b981;">${report.entityCount}</div>
              </div>
              <div>
                <div style="font-size: 0.85em; color: #9ca3af; margin-bottom: 4px;">Last Crawled</div>
                <div style="font-size: 0.95em; font-weight: 500; color: #ffffff;">
                  ${report.lastCrawledAt ? formatDate(report.lastCrawledAt) : 'Never'}
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="/api/report/${report.siteId}" class="btn" style="text-decoration: none;">
                📄 View Report
              </a>
              <a href="/api/report/${report.siteId}/export/json" class="btn btn-secondary" style="text-decoration: none;">
                💾 Download JSON
              </a>
              <a href="/api/report/${report.siteId}/export/pdf" class="btn btn-secondary" style="text-decoration: none;">
                📑 Download PDF
              </a>
              <form method="POST" action="/reports/delete/${report.siteId}" style="display: inline;" onsubmit="return confirm('⚠️ Are you sure you want to delete this report?\\n\\nThis will permanently delete:\\n• Site: ${escapeHtml(report.title || report.domain)}\\n• ${report.pageCount} pages\\n• ${report.entityCount} entities\\n• All associated data\\n\\nThis action cannot be undone!');">
                <button type="submit" class="btn" style="background: #ef4444; border: none; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.boxShadow='0 0 20px rgba(239, 68, 68, 0.3)'; this.style.background='#dc2626'" onmouseout="this.style.boxShadow='none'; this.style.background='#ef4444'">
                  🗑️ Delete
                </button>
              </form>
            </div>
          </div>
        `).join('')}
      </div>
    `}

    <div style="margin-top: 40px; padding: 20px; background: rgba(26, 26, 26, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px;">
      <h3 style="margin-bottom: 10px; color: #ffffff; font-weight: 600;">💡 Tips</h3>
      <ul style="margin-left: 20px; color: #9ca3af;">
        <li>Reports are generated from data stored in the database</li>
        <li>You can re-download reports at any time</li>
        <li>JSON exports contain complete data for AI processing</li>
        <li>To analyze a new website, return to the home page</li>
      </ul>
    </div>
  `;

  return baseLayout('Past Reports', content);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return '#10b981';
    case 'ACTIVE':
      return '#3b82f6';
    case 'PENDING':
      return '#f59e0b';
    case 'ERROR':
    case 'FAILED':
      return '#ef4444';
    default:
      return '#9ca3af';
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
