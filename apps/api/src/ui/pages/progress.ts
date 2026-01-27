import { baseLayout } from '../layouts/base';

interface ProgressData {
  jobId: string;
  siteId: string;
  url: string;
  status: string;
  pagesProcessed: number;
  maxPages: number;
  phase: 'crawling' | 'building-graph' | 'completed' | 'error';
  error?: string;
}

export function renderProgressPage(data: ProgressData): string {
  const { siteId, url, status, pagesProcessed, maxPages, phase, error } = data;

  const progressPercentage = maxPages > 0 ? Math.min((pagesProcessed / maxPages) * 100, 100) : 0;

  const content = `
    <h2>Analyzing Website</h2>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 1.2em; margin-bottom: 10px;"><strong>URL:</strong> ${escapeHtml(url)}</p>
      <p><strong>Status:</strong> <span style="color: ${getStatusColor(status)}">${getStatusText(status, phase)}</span></p>
    </div>

    ${phase === 'error' && error ? `
      <div class="alert alert-error">
        <strong>Analysis Failed</strong><br><br>
        <pre style="background: #fff; padding: 15px; border-radius: 5px; overflow-x: auto; text-align: left; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(error)}</pre>
        <br>
        <a href="/" class="btn btn-secondary">Try Another Website</a>
      </div>
    ` : phase === 'completed' ? `
      <div class="alert alert-success">
        <strong>✅ Analysis Complete!</strong><br>
        Redirecting to report...
      </div>
      <script>
        setTimeout(function() {
          window.location.href = '/report/${siteId}';
        }, 2000);
      </script>
    ` : `
      <!-- Progress indicator -->
      <div style="margin: 30px 0;">
        <div style="background: #e0e0e0; border-radius: 10px; height: 30px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${progressPercentage}%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            ${progressPercentage > 10 ? Math.round(progressPercentage) + '%' : ''}
          </div>
        </div>
        <p style="text-align: center; margin-top: 10px; color: #666;">
          ${pagesProcessed} of ${maxPages} pages processed
        </p>
      </div>

      <!-- Current phase -->
      <div style="margin: 30px 0; text-align: center;">
        ${getPhaseIndicator(phase)}
      </div>

      <!-- Auto-refresh -->
      <script>
        setTimeout(function() {
          window.location.reload();
        }, 3000);
      </script>

      <div style="text-align: center; margin-top: 30px; color: #666;">
        <p>This page will refresh automatically...</p>
        <p style="font-size: 0.9em; margin-top: 10px;">
          <a href="/" style="color: #667eea;">Cancel and start over</a>
        </p>
      </div>
    `}
  `;

  return baseLayout('Analysis in Progress', content);
}

function getStatusText(status: string, phase: string): string {
  if (phase === 'completed') return 'Completed';
  if (phase === 'error') return 'Failed';
  if (phase === 'building-graph') return 'Building knowledge graph';
  if (status === 'RUNNING') return 'Crawling website';
  return status;
}

function getStatusColor(status: string): string {
  if (status === 'COMPLETED') return '#28a745';
  if (status === 'FAILED' || status === 'ERROR') return '#dc3545';
  if (status === 'RUNNING') return '#667eea';
  return '#6c757d';
}

function getPhaseIndicator(phase: string): string {
  const phases = [
    { id: 'crawling', label: '📄 Crawling Pages', active: phase === 'crawling' },
    { id: 'building-graph', label: '🔗 Building Knowledge Graph', active: phase === 'building-graph' },
    { id: 'completed', label: '✅ Generating Report', active: phase === 'completed' },
  ];

  return `
    <div style="display: flex; justify-content: space-around; align-items: center; max-width: 600px; margin: 0 auto;">
      ${phases.map((p, i) => `
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 2em; margin-bottom: 10px; ${p.active ? 'animation: pulse 1.5s infinite;' : 'opacity: 0.3;'}">
            ${p.label.split(' ')[0]}
          </div>
          <div style="font-size: 0.9em; ${p.active ? 'font-weight: bold; color: #667eea;' : 'color: #999;'}">
            ${p.label.substring(p.label.indexOf(' ') + 1)}
          </div>
        </div>
        ${i < phases.length - 1 ? `
          <div style="flex: 0 0 30px; font-size: 1.5em; color: #ccc;">→</div>
        ` : ''}
      `).join('')}
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    </style>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
