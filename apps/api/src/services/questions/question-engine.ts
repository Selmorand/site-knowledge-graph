import { SiteReport } from '../report/types';
import { Question, QuestionSet } from './types';
import { logger } from '@site-knowledge-graph/shared';

export class QuestionEngine {
  private questions: Map<string, Question> = new Map();
  private questionCounter = 0;

  constructor(private report: SiteReport) {}

  /**
   * Generate all questions from the SiteReport
   */
  async generateQuestions(): Promise<QuestionSet> {
    logger.info('Starting question generation from SiteReport');

    // Generate questions at all levels
    this.generateChunkQuestions();
    this.generatePageQuestions();
    this.generateEntityQuestions();
    this.generateGraphQuestions();

    // Deduplicate and score
    this.deduplicateQuestions();
    this.scoreConfidence();

    const questionArray = Array.from(this.questions.values());

    logger.info({ totalQuestions: questionArray.length }, 'Question generation complete');

    return {
      site: {
        url: this.report.site.url,
        domain: this.report.site.domain,
      },
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        totalPages: this.report.pages.length,
        totalEntities: this.report.entities.length,
        totalQuestions: questionArray.length,
      },
      questions: questionArray,
      guidance: {
        howToAnswer: 'Answer only from provided data in the site report. Do not use external knowledge or make assumptions.',
        allowedSources: ['pages', 'chunks', 'entities', 'relationships'],
        forbidden: ['external knowledge', 'assumptions', 'speculation'],
      },
    };
  }

  /**
   * Generate questions from content chunks
   */
  private generateChunkQuestions(): void {
    for (const chunk of this.report.chunks) {
      // Skip very short chunks
      if (chunk.text.length < 50) continue;

      const page = this.report.pages.find((p) => p.url === chunk.pageUrl);
      if (!page) continue;

      // Definition questions from chunks with clear topics
      if (chunk.headingPath && chunk.headingPath.length > 0) {
        const headings = chunk.headingPath;
        const mainTopic = headings[headings.length - 1];

        if (mainTopic && mainTopic.length > 3) {
          this.addQuestion({
            questionText: `What does this section explain about "${mainTopic}"?`,
            questionType: 'DEFINITION',
            level: 'CHUNK',
            entityIds: [],
            sourceChunkIds: [chunk.id],
            sourcePageIds: [page.id],
            answerConfidence: 0.8,
          });
        }
      }

      // How-to questions from chunks with process indicators
      if (this.hasProcessIndicators(chunk.text)) {
        this.addQuestion({
          questionText: `How does this process work according to the content?`,
          questionType: 'HOW_TO',
          level: 'CHUNK',
          entityIds: [],
          sourceChunkIds: [chunk.id],
          sourcePageIds: [page.id],
          answerConfidence: 0.7,
        });
      }
    }
  }

  /**
   * Generate questions from pages
   */
  private generatePageQuestions(): void {
    for (const page of this.report.pages) {
      // Skip pages without meaningful content
      if (!page.title || page.title.length < 3) continue;

      // Page purpose questions
      this.addQuestion({
        questionText: `What is the purpose of the page titled "${page.title}"?`,
        questionType: 'DEFINITION',
        level: 'PAGE',
        entityIds: [],
        sourceChunkIds: [],
        sourcePageIds: [page.id],
        answerConfidence: 0.9,
      });

      // Coverage questions
      if (page.entityCount > 0) {
        this.addQuestion({
          questionText: `What topics are covered on "${page.title}"?`,
          questionType: 'COVERAGE',
          level: 'PAGE',
          entityIds: [],
          sourceChunkIds: [],
          sourcePageIds: [page.id],
          answerConfidence: 0.85,
        });
      }
    }
  }

  /**
   * Generate questions from entities
   */
  private generateEntityQuestions(): void {
    for (const entity of this.report.entities) {
      const entityName = entity.name;
      const pageIds = this.getPageIdsByUrls(entity.pagesMentioned);

      // Definition questions
      if (entity.type === 'ORGANIZATION' || entity.type === 'SERVICE' || entity.type === 'PRODUCT') {
        this.addQuestion({
          questionText: `What is ${entityName}?`,
          questionType: 'DEFINITION',
          level: 'ENTITY',
          entityIds: [entity.id],
          sourceChunkIds: [],
          sourcePageIds: pageIds,
          answerConfidence: 0.9,
        });
      }

      // Capability questions for organizations and services
      if (entity.type === 'ORGANIZATION' || entity.type === 'SERVICE') {
        this.addQuestion({
          questionText: `What does ${entityName} offer or provide?`,
          questionType: 'CAPABILITY',
          level: 'ENTITY',
          entityIds: [entity.id],
          sourceChunkIds: [],
          sourcePageIds: pageIds,
          answerConfidence: 0.85,
        });
      }

      // Relationship questions for entities with connections
      if (entity.relationsCount > 0) {
        this.addQuestion({
          questionText: `How is ${entityName} related to other entities on the site?`,
          questionType: 'RELATIONSHIP',
          level: 'ENTITY',
          entityIds: [entity.id],
          sourceChunkIds: [],
          sourcePageIds: pageIds,
          answerConfidence: 0.8,
        });
      }
    }
  }

  /**
   * Generate questions from the knowledge graph
   */
  private generateGraphQuestions(): void {
    // Entity type clustering questions
    const entityTypes = new Set(this.report.entities.map((e) => e.type));

    for (const type of entityTypes) {
      const entitiesOfType = this.report.entities.filter((e) => e.type === type);

      if (entitiesOfType.length > 1) {
        this.addQuestion({
          questionText: `What ${type.toLowerCase()}s are mentioned on this website?`,
          questionType: 'COVERAGE',
          level: 'GRAPH',
          entityIds: entitiesOfType.map((e) => e.id),
          sourceChunkIds: [],
          sourcePageIds: [],
          answerConfidence: 0.95,
        });
      }
    }

    // Relationship clustering questions
    if (this.report.relationships.length > 0) {
      this.addQuestion({
        questionText: 'What are the key relationships between entities on this site?',
        questionType: 'RELATIONSHIP',
        level: 'GRAPH',
        entityIds: [],
        sourceChunkIds: [],
        sourcePageIds: [],
        answerConfidence: 0.85,
      });
    }

    // Coverage gaps
    const pagesWithoutEntities = this.report.pages.filter((p) => p.entityCount === 0);
    if (pagesWithoutEntities.length > 0) {
      this.addQuestion({
        questionText: 'What pages have limited structured information?',
        questionType: 'GAP',
        level: 'GRAPH',
        entityIds: [],
        sourceChunkIds: [],
        sourcePageIds: pagesWithoutEntities.map((p) => p.id),
        answerConfidence: 0.9,
      });
    }

    // Entity comparison (if we have multiple entities of the same type)
    const organizationEntities = this.report.entities.filter((e) => e.type === 'ORGANIZATION');
    if (organizationEntities.length > 1) {
      this.addQuestion({
        questionText: 'What organizations are mentioned and how do they differ?',
        questionType: 'COMPARISON',
        level: 'GRAPH',
        entityIds: organizationEntities.map((e) => e.id),
        sourceChunkIds: [],
        sourcePageIds: [],
        answerConfidence: 0.75,
      });
    }
  }

  /**
   * Add a question to the set
   */
  private addQuestion(question: Omit<Question, 'id'>): void {
    const id = `q-${++this.questionCounter}`;
    const fullQuestion: Question = { id, ...question };

    // Initial traceability check
    if (!this.isTraceable(fullQuestion)) {
      logger.warn({ questionText: question.questionText }, 'Question failed traceability check, skipping');
      return;
    }

    this.questions.set(id, fullQuestion);
  }

  /**
   * Check if a question is traceable to sources
   */
  private isTraceable(question: Question): boolean {
    return (
      question.sourceChunkIds.length > 0 ||
      question.sourcePageIds.length > 0 ||
      question.entityIds.length > 0 ||
      question.level === 'GRAPH' // Graph-level questions are inherently traceable
    );
  }

  /**
   * Deduplicate similar questions
   */
  private deduplicateQuestions(): void {
    const questionsArray = Array.from(this.questions.values());
    const toRemove: Set<string> = new Set();

    for (let i = 0; i < questionsArray.length; i++) {
      for (let j = i + 1; j < questionsArray.length; j++) {
        const q1 = questionsArray[i];
        const q2 = questionsArray[j];

        if (toRemove.has(q1.id) || toRemove.has(q2.id)) continue;

        // Check similarity
        if (this.areSimilar(q1.questionText, q2.questionText)) {
          // Keep the one with higher confidence
          const toDelete = q1.answerConfidence >= q2.answerConfidence ? q2.id : q1.id;
          toRemove.add(toDelete);
        }
      }
    }

    // Remove duplicates
    for (const id of toRemove) {
      this.questions.delete(id);
    }

    logger.info({ removed: toRemove.size }, 'Deduplicated questions');
  }

  /**
   * Simple similarity check using word overlap
   */
  private areSimilar(text1: string, text2: string): boolean {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    const similarity = intersection.size / union.size;

    return similarity > 0.7; // 70% word overlap = similar
  }

  /**
   * Score confidence for all questions
   */
  private scoreConfidence(): void {
    for (const question of this.questions.values()) {
      let confidence = question.answerConfidence;

      // Boost confidence if multiple sources
      if (question.sourceChunkIds.length > 1) confidence += 0.05;
      if (question.sourcePageIds.length > 1) confidence += 0.05;
      if (question.entityIds.length > 0) confidence += 0.05;

      // Cap at 1.0
      question.answerConfidence = Math.min(confidence, 1.0);
    }
  }

  /**
   * Check if text contains process indicators
   */
  private hasProcessIndicators(text: string): boolean {
    const indicators = [
      'how to',
      'step',
      'first',
      'then',
      'next',
      'finally',
      'process',
      'procedure',
      'follow these',
      'in order to',
    ];

    const lowerText = text.toLowerCase();
    return indicators.some((indicator) => lowerText.includes(indicator));
  }

  /**
   * Convert page URLs to page IDs
   */
  private getPageIdsByUrls(urls: string[]): string[] {
    const pageIds: string[] = [];

    for (const url of urls) {
      const page = this.report.pages.find((p) => p.url === url);
      if (page) {
        pageIds.push(page.id);
      }
    }

    return pageIds;
  }
}
