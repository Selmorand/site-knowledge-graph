import { SiteReport } from './types';
import { QuestionSet } from '../questions/types';
import { QuestionExporter } from '../questions/question-exporter';

export function renderReportHTML(report: SiteReport, questionSet?: QuestionSet): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Report: ${escapeHtml(report.site.domain)}</title>
  <style>
    ${getCSS()}
  </style>
</head>
<body>
  <div class="report-container">
    ${renderHeader(report)}
    ${renderSiteOverview(report)}
    ${renderCrawlSummary(report)}
    ${questionSet ? renderQuestionBankSection(questionSet, report.site.id) : ''}
    ${renderPagesSection(report)}
    ${renderEntitiesSection(report)}
    ${renderRelationshipsSection(report)}
    ${renderObservations(report)}
    ${renderFooter(report)}
  </div>
  ${questionSet ? renderQuestionBankScript() : ''}
</body>
</html>`;
}

function getCSS(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }

    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h1 {
      font-size: 2.5em;
      margin-bottom: 0.5em;
      color: #1a1a1a;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 0.3em;
    }

    h2 {
      font-size: 1.8em;
      margin-top: 1.5em;
      margin-bottom: 0.8em;
      color: #0066cc;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.3em;
    }

    h3 {
      font-size: 1.3em;
      margin-top: 1em;
      margin-bottom: 0.5em;
      color: #333;
    }

    .meta {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 2em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #333;
    }

    tr:hover {
      background-color: #f8f9fa;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 1.5em 0;
    }

    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #0066cc;
    }

    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #0066cc;
    }

    .stat-label {
      color: #666;
      font-size: 0.9em;
      margin-top: 0.3em;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 500;
    }

    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-error { background: #f8d7da; color: #721c24; }
    .badge-info { background: #d1ecf1; color: #0c5460; }

    .observation {
      background: #fffbea;
      border-left: 4px solid #f9c74f;
      padding: 15px;
      margin: 1em 0;
    }

    details {
      margin: 1em 0;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 10px;
    }

    summary {
      cursor: pointer;
      font-weight: 600;
      padding: 5px;
      user-select: none;
    }

    summary:hover {
      background: #f8f9fa;
    }

    .footer {
      margin-top: 3em;
      padding-top: 1em;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 0.9em;
      text-align: center;
    }

    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    /* Question Bank Styles */
    .question-bank {
      margin: 2em 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .section-intro {
      margin-bottom: 20px;
      font-style: italic;
      color: #666;
    }

    .download-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .download-btn {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .question-group {
      margin: 20px 0;
      background: white;
      padding: 20px;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .question-group h3 {
      margin: 0;
      padding: 10px 0;
      color: #0066cc;
      border-bottom: 2px solid #e0e0e0;
    }

    .question-group h4 {
      margin: 15px 0 10px 0;
      color: #333;
      font-size: 1.1em;
    }

    .collapsible-section {
      margin-top: 15px;
    }

    .toggle-indicator {
      float: right;
      font-size: 0.8em;
      color: #999;
    }

    .question-list {
      list-style: none;
      padding: 0;
      margin: 10px 0;
    }

    .question-item {
      padding: 12px 15px;
      margin: 8px 0;
      background: #f8f9fa;
      border-left: 3px solid #0066cc;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .question-text {
      flex: 1;
      min-width: 250px;
      font-size: 1.05em;
    }

    .question-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .confidence-badge,
    .level-badge,
    .type-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 500;
      color: white;
    }

    .confidence-badge {
      background: #28a745;
    }

    .level-badge {
      background: #6c757d;
    }

    .type-badge {
      background: #17a2b8;
    }

    .ai-guidance {
      margin-top: 30px;
      padding: 20px;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
    }

    .ai-guidance h4 {
      margin-top: 0;
      color: #856404;
    }

    .ai-guidance p {
      margin: 8px 0;
      color: #856404;
    }

    /* Print styles */
    @media print {
      body {
        background: white;
        padding: 0;
      }

      .report-container {
        box-shadow: none;
        padding: 20px;
      }

      h2 {
        page-break-after: avoid;
      }

      table {
        page-break-inside: avoid;
      }

      .stat-card {
        page-break-inside: avoid;
      }

      details {
        border: none;
      }

      summary {
        display: none;
      }

      details[open] > *:not(summary) {
        display: block !important;
      }

      tr:hover {
        background-color: transparent;
      }
    }

    @page {
      margin: 2cm;
    }
  `;
}

function renderHeader(report: SiteReport): string {
  return `
    <h1>Site Analysis Report</h1>
    <div class="meta">
      <strong>Site:</strong> ${escapeHtml(report.site.url)}<br>
      <strong>Domain:</strong> ${escapeHtml(report.site.domain)}<br>
      <strong>Generated:</strong> ${formatDate(report.metadata.generatedAt)}<br>
      <strong>Tool:</strong> ${escapeHtml(report.metadata.toolName)} v${escapeHtml(report.metadata.toolVersion)}
    </div>

    ${renderDownloadButtons(report.site.id)}
  `;
}

function renderDownloadButtons(siteId: string): string {
  return `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
      <h3 style="color: white; margin-bottom: 20px; font-size: 1.3em;">📥 Download Report</h3>
      <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
        <a href="/api/report/${siteId}/export/pdf"
           class="download-btn"
           style="background: white; color: #667eea; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
          📄 PDF Report
        </a>
        <a href="/api/report/${siteId}/export/json"
           class="download-btn"
           style="background: white; color: #667eea; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
          🤖 JSON (AI-Ready)
        </a>
        <a href="/api/report/${siteId}/export/pages.csv"
           class="download-btn"
           style="background: white; color: #667eea; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
          📊 Pages CSV
        </a>
        <a href="/api/report/${siteId}/export/entities.csv"
           class="download-btn"
           style="background: white; color: #667eea; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
          🏢 Entities CSV
        </a>
        <a href="/api/report/${siteId}/export/relationships.csv"
           class="download-btn"
           style="background: white; color: #667eea; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
          🔗 Relationships CSV
        </a>
      </div>
      <p style="color: white; margin-top: 15px; font-size: 0.9em; opacity: 0.9;">
        All exports are generated from the same analysis data
      </p>
      <div style="margin-top: 20px;">
        <a href="/" style="color: white; text-decoration: underline; font-size: 0.95em;">
          ← Analyze Another Website
        </a>
      </div>
    </div>
  `;
}

function renderSiteOverview(report: SiteReport): string {
  return `
    <h2>Site Overview</h2>
    <table>
      <tr><th>Property</th><th>Value</th></tr>
      <tr><td>URL</td><td><code>${escapeHtml(report.site.url)}</code></td></tr>
      <tr><td>Domain</td><td>${escapeHtml(report.site.domain)}</td></tr>
      <tr><td>Title</td><td>${escapeHtml(report.site.title || 'N/A')}</td></tr>
      <tr><td>Description</td><td>${escapeHtml(report.site.description || 'N/A')}</td></tr>
      <tr><td>Status</td><td><span class="badge badge-${getBadgeClass(report.site.status)}">${escapeHtml(report.site.status)}</span></td></tr>
      <tr><td>Last Crawled</td><td>${report.site.lastCrawledAt ? formatDate(report.site.lastCrawledAt) : 'Never'}</td></tr>
    </table>
  `;
}

function renderCrawlSummary(report: SiteReport): string {
  const stats = report.crawlStats;
  return `
    <h2>Crawl Summary</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalPages}</div>
        <div class="stat-label">Total Pages</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.pagesCompleted}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.maxDepth}</div>
        <div class="stat-label">Max Depth</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.fetchMethods.http + stats.fetchMethods.playwright}</div>
        <div class="stat-label">Pages Fetched</div>
      </div>
    </div>

    <h3>Fetch Methods</h3>
    <table>
      <tr><th>Method</th><th>Count</th><th>Percentage</th></tr>
      <tr>
        <td>HTTP (Static)</td>
        <td>${stats.fetchMethods.http}</td>
        <td>${calculatePercentage(stats.fetchMethods.http, stats.totalPages)}%</td>
      </tr>
      <tr>
        <td>Playwright (JavaScript)</td>
        <td>${stats.fetchMethods.playwright}</td>
        <td>${calculatePercentage(stats.fetchMethods.playwright, stats.totalPages)}%</td>
      </tr>
    </table>

    ${stats.crawlDuration ? `<p><strong>Crawl Duration:</strong> ${formatDuration(stats.crawlDuration)}</p>` : ''}
  `;
}

function renderPagesSection(report: SiteReport): string {
  const topPages = report.pages.slice(0, 50);

  return `
    <h2>Pages & Structure</h2>
    <p><strong>Total:</strong> ${report.pages.length} pages</p>

    <details ${report.pages.length <= 20 ? 'open' : ''}>
      <summary>View All Pages (${report.pages.length})</summary>
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Title</th>
            <th>Depth</th>
            <th>Status</th>
            <th>Entities</th>
          </tr>
        </thead>
        <tbody>
          ${topPages.map(page => `
            <tr>
              <td><code>${escapeHtml(truncate(page.url, 60))}</code></td>
              <td>${escapeHtml(page.title || 'Untitled')}</td>
              <td>${page.depth}</td>
              <td><span class="badge badge-${getBadgeClass(page.status)}">${page.status}</span></td>
              <td>${page.entityCount}</td>
            </tr>
          `).join('')}
          ${report.pages.length > 50 ? `<tr><td colspan="5"><em>...and ${report.pages.length - 50} more pages</em></td></tr>` : ''}
        </tbody>
      </table>
    </details>

    <h3>Structure Analysis</h3>
    <p><strong>Average Depth:</strong> ${report.summaries.structure.avgDepth}</p>
    <p><strong>Depth Distribution:</strong></p>
    <table>
      <tr><th>Depth Level</th><th>Page Count</th></tr>
      ${Object.entries(report.summaries.structure.pagesPerDepthLevel)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([depth, count]) => `<tr><td>Level ${depth}</td><td>${count}</td></tr>`)
        .join('')}
    </table>
  `;
}

function renderEntitiesSection(report: SiteReport): string {
  return `
    <h2>Entities Summary</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${report.entities.length}</div>
        <div class="stat-label">Total Entities</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summaries.coverage.orphanEntities}</div>
        <div class="stat-label">Orphan Entities</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summaries.coverage.mostConnectedEntity || 'N/A'}</div>
        <div class="stat-label">Most Connected</div>
      </div>
    </div>

    <details ${report.entities.length <= 20 ? 'open' : ''}>
      <summary>View All Entities (${report.entities.length})</summary>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Source</th>
            <th>Confidence</th>
            <th>Mentions</th>
            <th>Relations</th>
          </tr>
        </thead>
        <tbody>
          ${report.entities.slice(0, 100).map(entity => `
            <tr>
              <td><strong>${escapeHtml(entity.name)}</strong></td>
              <td><span class="badge badge-info">${entity.type}</span></td>
              <td>${entity.source}</td>
              <td>${(entity.confidence * 100).toFixed(0)}%</td>
              <td>${entity.mentionCount}</td>
              <td>${entity.relationsCount}</td>
            </tr>
          `).join('')}
          ${report.entities.length > 100 ? `<tr><td colspan="6"><em>...and ${report.entities.length - 100} more entities</em></td></tr>` : ''}
        </tbody>
      </table>
    </details>
  `;
}

function renderRelationshipsSection(report: SiteReport): string {
  return `
    <h2>Relationships Overview</h2>
    <p><strong>Total Relationships:</strong> ${report.relationships.length}</p>

    ${report.relationships.length > 0 ? `
      <details>
        <summary>View Relationships (${report.relationships.length})</summary>
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>Relation</th>
              <th>To</th>
              <th>Weight</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            ${report.relationships.slice(0, 50).map(rel => `
              <tr>
                <td><strong>${escapeHtml(rel.fromEntityName)}</strong><br><small>${rel.fromEntityType}</small></td>
                <td><span class="badge badge-info">${escapeHtml(rel.relationType)}</span></td>
                <td><strong>${escapeHtml(rel.toEntityName)}</strong><br><small>${rel.toEntityType}</small></td>
                <td>${rel.weight.toFixed(1)}</td>
                <td>${rel.source}</td>
              </tr>
            `).join('')}
            ${report.relationships.length > 50 ? `<tr><td colspan="5"><em>...and ${report.relationships.length - 50} more relationships</em></td></tr>` : ''}
          </tbody>
        </table>
      </details>
    ` : '<p><em>No relationships found.</em></p>'}
  `;
}

function renderObservations(report: SiteReport): string {
  const observations: string[] = [];

  if (report.summaries.coverage.pagesWithoutEntities > 0) {
    observations.push(`${report.summaries.coverage.pagesWithoutEntities} pages have no extracted entities. This may indicate thin content or pages with only navigation elements.`);
  }

  if (report.summaries.coverage.orphanEntities > 0) {
    observations.push(`${report.summaries.coverage.orphanEntities} entities have no relationships. They may be isolated concepts or require better context.`);
  }

  if (report.crawlStats.pagesError > 0) {
    observations.push(`${report.crawlStats.pagesError} pages failed to crawl. Check for broken links or access restrictions.`);
  }

  if (report.crawlStats.fetchMethods.playwright > report.crawlStats.fetchMethods.http) {
    observations.push(`Majority of pages required JavaScript rendering, indicating a heavily dynamic site.`);
  }

  return observations.length > 0 ? `
    <h2>Observations</h2>
    ${observations.map(obs => `<div class="observation">${escapeHtml(obs)}</div>`).join('')}
  ` : '';
}

function renderQuestionBankSection(questionSet: QuestionSet, siteId: string): string {
  const byType = QuestionExporter.groupByType(questionSet.questions);
  const byLevel = QuestionExporter.groupByLevel(questionSet.questions);

  return `
    <h2>Question Bank</h2>
    <div class="question-bank">
      <p class="section-intro">
        This section contains ${questionSet.questions.length} questions that can be answered using the data from this website.
        All questions are derived from crawled content, entities, and relationships.
      </p>

      <!-- Download Buttons -->
      <div class="download-buttons" style="margin: 20px 0;">
        <a href="/api/questions/${siteId}/export/json" class="download-btn" download>
          📄 Download Questions (AI-Ready JSON)
        </a>
        <a href="/api/questions/${siteId}/export/csv" class="download-btn" download>
          📊 Download Questions (CSV)
        </a>
      </div>

      <!-- Group by Type -->
      <div class="question-group">
        <h3 onclick="toggleSection('questions-by-type')" style="cursor: pointer;">
          📋 Questions by Type (${Object.keys(byType).length} types)
          <span class="toggle-indicator">▼</span>
        </h3>
        <div id="questions-by-type" class="collapsible-section">
          ${Object.entries(byType).map(([type, questions]) => `
            <div class="question-type-group">
              <h4 onclick="toggleSection('type-${type}')" style="cursor: pointer;">
                ${formatQuestionType(type)} (${questions.length})
                <span class="toggle-indicator">▼</span>
              </h4>
              <div id="type-${type}" class="collapsible-section">
                <ul class="question-list">
                  ${questions.map(q => `
                    <li class="question-item">
                      <span class="question-text">${escapeHtml(q.questionText)}</span>
                      <span class="question-meta">
                        <span class="confidence-badge" style="background-color: ${getConfidenceColor(q.answerConfidence)}">
                          ${Math.round(q.answerConfidence * 100)}% confidence
                        </span>
                        <span class="level-badge">${q.level}</span>
                      </span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Group by Level -->
      <div class="question-group">
        <h3 onclick="toggleSection('questions-by-level')" style="cursor: pointer;">
          🎯 Questions by Level (${Object.keys(byLevel).length} levels)
          <span class="toggle-indicator">▼</span>
        </h3>
        <div id="questions-by-level" class="collapsible-section" style="display: none;">
          ${Object.entries(byLevel).map(([level, questions]) => `
            <div class="question-level-group">
              <h4 onclick="toggleSection('level-${level}')" style="cursor: pointer;">
                ${formatQuestionLevel(level)} (${questions.length})
                <span class="toggle-indicator">▼</span>
              </h4>
              <div id="level-${level}" class="collapsible-section">
                <ul class="question-list">
                  ${questions.map(q => `
                    <li class="question-item">
                      <span class="question-text">${escapeHtml(q.questionText)}</span>
                      <span class="question-meta">
                        <span class="confidence-badge" style="background-color: ${getConfidenceColor(q.answerConfidence)}">
                          ${Math.round(q.answerConfidence * 100)}% confidence
                        </span>
                        <span class="type-badge">${formatQuestionType(q.questionType)}</span>
                      </span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- AI Guidance -->
      <div class="ai-guidance">
        <h4>AI Interrogation Guidance</h4>
        <p><strong>How to answer:</strong> ${escapeHtml(questionSet.guidance.howToAnswer)}</p>
        <p><strong>Allowed sources:</strong> ${questionSet.guidance.allowedSources.join(', ')}</p>
        <p><strong>Forbidden:</strong> ${questionSet.guidance.forbidden.join(', ')}</p>
      </div>
    </div>
  `;
}

function renderQuestionBankScript(): string {
  return `
    <script>
      function toggleSection(id) {
        const section = document.getElementById(id);
        const indicator = event.target.querySelector('.toggle-indicator');
        if (section.style.display === 'none') {
          section.style.display = 'block';
          if (indicator) indicator.textContent = '▼';
        } else {
          section.style.display = 'none';
          if (indicator) indicator.textContent = '▶';
        }
      }
    </script>
  `;
}

function formatQuestionType(type: string): string {
  const typeLabels: Record<string, string> = {
    DEFINITION: 'Definition Questions',
    HOW_TO: 'How-To / Process Questions',
    CAPABILITY: 'Capability Questions',
    RELATIONSHIP: 'Relationship Questions',
    COVERAGE: 'Coverage / Scope Questions',
    COMPARISON: 'Comparison Questions',
    GAP: 'Gap / Missing Information Questions',
  };
  return typeLabels[type] || type;
}

function formatQuestionLevel(level: string): string {
  const levelLabels: Record<string, string> = {
    CHUNK: 'Content Chunk Level',
    PAGE: 'Page Level',
    ENTITY: 'Entity Level',
    GRAPH: 'Knowledge Graph Level',
  };
  return levelLabels[level] || level;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return '#28a745'; // Green
  if (confidence >= 0.75) return '#ffc107'; // Yellow
  return '#dc3545'; // Red
}

function renderFooter(report: SiteReport): string {
  return `
    <div class="footer">
      <p>Generated by ${escapeHtml(report.metadata.toolName)} v${escapeHtml(report.metadata.toolVersion)}</p>
      <p>${formatDate(report.metadata.generatedAt)}</p>
      <p>Report ID: <code>${escapeHtml(report.metadata.reportId)}</code></p>
    </div>
  `;
}

// Utility functions
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function calculatePercentage(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
}

function getBadgeClass(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('complete') || statusLower.includes('success')) return 'success';
  if (statusLower.includes('error') || statusLower.includes('fail')) return 'error';
  if (statusLower.includes('pending') || statusLower.includes('running')) return 'warning';
  return 'info';
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}
