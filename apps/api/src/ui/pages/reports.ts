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
        <p style="margin-top: 10px;">You haven't analyzed any websites yet. <a href="/" style="color: #0c5460; font-weight: bold;">Start your first analysis</a></p>
      </div>
    ` : `
      <div style="margin-bottom: 20px;">
        <p style="color: #666;">
          You have analyzed <strong>${reports.length}</strong> website${reports.length === 1 ? '' : 's'}.
          Click on any report to view detailed analysis.
        </p>
      </div>

      <div style="display: grid; gap: 20px;">
        ${reports.map(report => `
          <div style="
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s;
            background: white;
          " onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 4px 12px rgba(102,126,234,0.1)'" onmouseout="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 8px 0; color: #333;">
                  ${escapeHtml(report.title || report.domain)}
                </h3>
                <p style="margin: 0; color: #667eea; font-size: 0.95em;">
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

            <div style="display: flex; gap: 30px; margin-bottom: 15px; padding: 12px 0; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;">
              <div>
                <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">Pages</div>
                <div style="font-size: 1.3em; font-weight: 600; color: #667eea;">${report.pageCount}</div>
              </div>
              <div>
                <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">Entities</div>
                <div style="font-size: 1.3em; font-weight: 600; color: #28a745;">${report.entityCount}</div>
              </div>
              <div>
                <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">Last Crawled</div>
                <div style="font-size: 0.95em; font-weight: 500; color: #333;">
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
            </div>
          </div>
        `).join('')}
      </div>
    `}

    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 6px;">
      <h3 style="margin-bottom: 10px;">💡 Tips</h3>
      <ul style="margin-left: 20px; color: #666;">
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
      return '#28a745';
    case 'ACTIVE':
      return '#17a2b8';
    case 'PENDING':
      return '#ffc107';
    case 'ERROR':
    case 'FAILED':
      return '#dc3545';
    default:
      return '#6c757d';
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
