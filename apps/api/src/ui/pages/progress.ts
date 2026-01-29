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

    <div style="background: rgba(26, 26, 26, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="font-size: 1.2em; margin-bottom: 10px; color: #ffffff;"><strong>URL:</strong> ${escapeHtml(url)}</p>
      <p style="color: #ffffff;"><strong>Status:</strong> <span style="color: ${getStatusColor(status)}">${getStatusText(status, phase)}</span></p>
    </div>

    ${phase === 'error' && error ? `
      <div class="alert alert-error">
        <strong>Analysis Failed</strong><br><br>
        <pre style="background: #1a1a1a; padding: 15px; border-radius: 8px; overflow-x: auto; text-align: left; white-space: pre-wrap; word-wrap: break-word; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.1);">${escapeHtml(error)}</pre>
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
        <div style="background: rgba(26, 26, 26, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; height: 30px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #3b82f6, #f57f20); height: 100%; width: ${progressPercentage}%; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 600; box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);">
            ${progressPercentage > 10 ? Math.round(progressPercentage) + '%' : ''}
          </div>
        </div>
        <p style="text-align: center; margin-top: 10px; color: #9ca3af;">
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

      <div style="text-align: center; margin-top: 30px; color: #9ca3af;">
        <p>This page will refresh automatically...</p>
        <p style="font-size: 0.9em; margin-top: 10px;">
          <a href="/" style="color: #3b82f6; text-decoration: none; transition: all 0.2s ease;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">Cancel and start over</a>
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
  if (status === 'COMPLETED') return '#10b981';
  if (status === 'FAILED' || status === 'ERROR') return '#ef4444';
  if (status === 'RUNNING') return '#3b82f6';
  return '#9ca3af';
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
          <div style="font-size: 0.9em; ${p.active ? 'font-weight: 600; color: #3b82f6;' : 'color: #9ca3af;'}">
            ${p.label.substring(p.label.indexOf(' ') + 1)}
          </div>
        </div>
        ${i < phases.length - 1 ? `
          <div style="flex: 0 0 30px; font-size: 1.5em; color: rgba(255, 255, 255, 0.2);">→</div>
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
