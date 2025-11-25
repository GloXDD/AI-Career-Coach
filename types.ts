
export type AppLanguage = 'en' | 'fr' | 'zh';

export interface Improvement {
  category: string;
  suggestion: string;
}

export interface ScoreItem {
  category: string;
  score: number;
  reason: string;
}

export interface AnalysisResult {
  detectedLanguage: string;
  score: number;
  scoreBreakdown: ScoreItem[];
  candidateAnalysis: string;
  suggestedProfileSummary: string;
  improvements: Improvement[];
  beautifulVersion: {
    title: string;
    content: string;
    designTips: string[];
  };
  atsVersion: {
    title: string;
    content: string;
    keywordsIncluded: string[];
  };
  interviewPrepPoints: string[];
}

export interface CareerPath {
  title: string;
  description: string;
  matchReason: string;
}

export interface JobOpportunity {
  title: string;
  company: string;
  location: string;
  snippet: string; // Brief description from search
  url: string;
}

export interface DiscoveryResult {
  suggestedPaths: CareerPath[];
  foundJobs: JobOpportunity[];
  marketInsights: string;
}

export interface InterviewFeedback {
  overallScore: number;
  toneAnalysis: string;
  strengths: string[];
  improvements: string[];
  qaFeedback: {
    question: string;
    userAnswer: string;
    critique: string;
    improvedVersion: string;
  }[];
}

export enum AppState {
  ONBOARDING = 'ONBOARDING',
  DISCOVERY = 'DISCOVERY', 
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  INTERVIEW = 'INTERVIEW',
  INTERVIEW_FEEDBACK = 'INTERVIEW_FEEDBACK'
}

export interface FileData {
  base64: string;
  mimeType: string;
}