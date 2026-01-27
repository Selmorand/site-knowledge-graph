export type QuestionType =
  | 'DEFINITION'
  | 'HOW_TO'
  | 'CAPABILITY'
  | 'RELATIONSHIP'
  | 'COVERAGE'
  | 'COMPARISON'
  | 'GAP';

export type QuestionLevel = 'CHUNK' | 'PAGE' | 'ENTITY' | 'GRAPH';

export interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  level: QuestionLevel;
  entityIds: string[];
  sourceChunkIds: string[];
  sourcePageIds: string[];
  answerConfidence: number; // 0.0 to 1.0
  metadata?: {
    suggestedAnswer?: string;
    relatedQuestions?: string[];
  };
}

export interface QuestionSet {
  site: {
    url: string;
    domain: string;
  };
  reportMetadata: {
    generatedAt: string;
    totalPages: number;
    totalEntities: number;
    totalQuestions: number;
  };
  questions: Question[];
  guidance: {
    howToAnswer: string;
    allowedSources: string[];
    forbidden: string[];
  };
}

export interface QuestionsByType {
  [key: string]: Question[];
}

export interface QuestionsByEntity {
  entityName: string;
  entityType: string;
  questions: Question[];
}

export interface QuestionsByLevel {
  [key: string]: Question[];
}
