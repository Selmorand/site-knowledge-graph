import { FastifyInstance } from 'fastify';
import { ReportAssembler } from '@/services/report/report-assembler';
import { QuestionEngine } from '@/services/questions/question-engine';
import { QuestionExporter } from '@/services/questions/question-exporter';
import { logger } from '@site-knowledge-graph/shared';

export async function questionsRoutes(fastify: FastifyInstance) {
  // Get questions for a site (JSON)
  fastify.get('/questions/:siteId', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };

    try {
      logger.info({ siteId }, 'Generating questions for site');

      // Get the SiteReport
      const assembler = new ReportAssembler(siteId);
      const report = await assembler.buildReport();

      // Generate questions
      const questionEngine = new QuestionEngine(report);
      const questionSet = await questionEngine.generateQuestions();

      return reply.send(questionSet);
    } catch (error: any) {
      logger.error({ error, siteId }, 'Failed to generate questions');
      return reply.code(500).send({ error: error.message });
    }
  });

  // Export questions as AI-ready JSON
  fastify.get('/questions/:siteId/export/json', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };

    try {
      logger.info({ siteId }, 'Exporting questions as AI-ready JSON');

      const assembler = new ReportAssembler(siteId);
      const report = await assembler.buildReport();

      const questionEngine = new QuestionEngine(report);
      const questionSet = await questionEngine.generateQuestions();

      const json = QuestionExporter.toAIJson(questionSet);

      return reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename="questions-${siteId}.json"`)
        .send(json);
    } catch (error: any) {
      logger.error({ error, siteId }, 'Failed to export questions as JSON');
      return reply.code(500).send({ error: error.message });
    }
  });

  // Export questions as CSV
  fastify.get('/questions/:siteId/export/csv', async (request, reply) => {
    const { siteId } = request.params as { siteId: string };

    try {
      logger.info({ siteId }, 'Exporting questions as CSV');

      const assembler = new ReportAssembler(siteId);
      const report = await assembler.buildReport();

      const questionEngine = new QuestionEngine(report);
      const questionSet = await questionEngine.generateQuestions();

      const csv = QuestionExporter.toCSV(questionSet);

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="questions-${siteId}.csv"`)
        .send(csv);
    } catch (error: any) {
      logger.error({ error, siteId }, 'Failed to export questions as CSV');
      return reply.code(500).send({ error: error.message });
    }
  });
}
