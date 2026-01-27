import { FastifyInstance } from 'fastify';
import { prisma } from '@/db/client';
import { ReportAssembler } from '@/services/report/report-assembler';
import { renderReportHTML } from '@/services/report/html-renderer';
import { generatePDF } from '@/services/report/pdf-generator';
import {
  generatePagesCSV,
  generateEntitiesCSV,
  generateRelationshipsCSV,
} from '@/services/report/csv-generator';
import { QuestionEngine } from '@/services/questions/question-engine';

export async function reportRoutes(fastify: FastifyInstance) {
  // Get HTML report view
  fastify.get('/:siteId', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    // Build report
    const assembler = new ReportAssembler(siteId);
    const report = await assembler.buildReport();

    // Generate questions
    const questionEngine = new QuestionEngine(report);
    const questionSet = await questionEngine.generateQuestions();

    // Render HTML with questions
    const html = renderReportHTML(report, questionSet);

    return reply.type('text/html').send(html);
  });

  // Export report as PDF
  fastify.get('/:siteId/export/pdf', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    // Build report
    const assembler = new ReportAssembler(siteId);
    const report = await assembler.buildReport();

    // Generate questions
    const questionEngine = new QuestionEngine(report);
    const questionSet = await questionEngine.generateQuestions();

    // Render HTML with questions
    const html = renderReportHTML(report, questionSet);

    // Generate PDF
    const pdf = await generatePDF(html);

    const filename = `report-${site.domain}-${Date.now()}.pdf`;

    return reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(pdf);
  });

  // Export report as AI-ready JSON
  fastify.get('/:siteId/export/json', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    // Build report
    const assembler = new ReportAssembler(siteId);
    const report = await assembler.buildReport();

    // Return strict JSON (same SiteReport object)
    const filename = `report-${site.domain}-${Date.now()}.json`;

    return reply
      .type('application/json')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(report);
  });

  // Export pages as CSV
  fastify.get('/:siteId/export/pages.csv', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    // Build report
    const assembler = new ReportAssembler(siteId);
    const report = await assembler.buildReport();

    // Generate CSV
    const csv = generatePagesCSV(report);

    const filename = `pages-${site.domain}-${Date.now()}.csv`;

    return reply
      .type('text/csv')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  });

  // Export entities as CSV
  fastify.get('/:siteId/export/entities.csv', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    // Build report
    const assembler = new ReportAssembler(siteId);
    const report = await assembler.buildReport();

    // Generate CSV
    const csv = generateEntitiesCSV(report);

    const filename = `entities-${site.domain}-${Date.now()}.csv`;

    return reply
      .type('text/csv')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  });

  // Export relationships as CSV
  fastify.get('/:siteId/export/relationships.csv', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Site not found',
      });
    }

    // Build report
    const assembler = new ReportAssembler(siteId);
    const report = await assembler.buildReport();

    // Generate CSV
    const csv = generateRelationshipsCSV(report);

    const filename = `relationships-${site.domain}-${Date.now()}.csv`;

    return reply
      .type('text/csv')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  });

  // List all available reports
  fastify.get('/', async (_request, reply) => {
    const sites = await prisma.site.findMany({
      select: {
        id: true,
        url: true,
        domain: true,
        title: true,
        status: true,
        lastCrawledAt: true,
        _count: {
          select: {
            pages: true,
            entities: true,
          },
        },
      },
      orderBy: { lastCrawledAt: 'desc' },
    });

    const reports = sites.map(site => ({
      siteId: site.id,
      url: site.url,
      domain: site.domain,
      title: site.title,
      status: site.status,
      lastCrawledAt: site.lastCrawledAt,
      pageCount: site._count.pages,
      entityCount: site._count.entities,
      links: {
        view: `/api/report/${site.id}`,
        pdf: `/api/report/${site.id}/export/pdf`,
        json: `/api/report/${site.id}/export/json`,
        csvPages: `/api/report/${site.id}/export/pages.csv`,
        csvEntities: `/api/report/${site.id}/export/entities.csv`,
        csvRelationships: `/api/report/${site.id}/export/relationships.csv`,
      },
    }));

    return reply.send({
      total: reports.length,
      reports,
    });
  });
}
