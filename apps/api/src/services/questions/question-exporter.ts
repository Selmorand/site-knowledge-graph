import { QuestionSet, Question, QuestionsByType, QuestionsByLevel } from './types';

export class QuestionExporter {
  /**
   * Export questions as AI-ready JSON
   */
  static toAIJson(questionSet: QuestionSet): string {
    return JSON.stringify(questionSet, null, 2);
  }

  /**
   * Export questions as CSV
   */
  static toCSV(questionSet: QuestionSet): string {
    const headers = [
      'ID',
      'Question',
      'Type',
      'Level',
      'Confidence',
      'Entity IDs',
      'Source Chunk IDs',
      'Source Page IDs',
    ];

    const rows = questionSet.questions.map((q) => [
      q.id,
      this.escapeCsv(q.questionText),
      q.questionType,
      q.level,
      q.answerConfidence.toFixed(2),
      q.entityIds.join('; '),
      q.sourceChunkIds.join('; '),
      q.sourcePageIds.join('; '),
    ]);

    const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];

    return csvLines.join('\n');
  }

  /**
   * Group questions by type
   */
  static groupByType(questions: Question[]): QuestionsByType {
    const grouped: QuestionsByType = {};

    for (const question of questions) {
      if (!grouped[question.questionType]) {
        grouped[question.questionType] = [];
      }
      grouped[question.questionType].push(question);
    }

    return grouped;
  }

  /**
   * Group questions by level
   */
  static groupByLevel(questions: Question[]): QuestionsByLevel {
    const grouped: QuestionsByLevel = {};

    for (const question of questions) {
      if (!grouped[question.level]) {
        grouped[question.level] = [];
      }
      grouped[question.level].push(question);
    }

    return grouped;
  }

  /**
   * Escape CSV field
   */
  private static escapeCsv(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
