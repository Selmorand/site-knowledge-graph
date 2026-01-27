import { chromium } from 'playwright';
import { logger } from '@site-knowledge-graph/shared';

export async function generatePDF(html: string): Promise<Buffer> {
  logger.info('Generating PDF from HTML');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    logger.info('PDF generated successfully');
    return Buffer.from(pdf);
  } catch (error) {
    await browser.close();
    throw error;
  }
}
