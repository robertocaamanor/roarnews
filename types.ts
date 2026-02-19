
export interface SEOParams {
  titleTag: string;
  metaDescription: string;
  keywords: string[];
  slug: string;
}

export interface ArticleData {
  id?: string;
  timestamp?: number;
  title: string;
  subtitle: string;
  body: string;
  seo: SEOParams;
  instagramSummary: string[];
  microblogSummary: string;
  groundingSources?: any[];
  imageSearchQueries: string[]; // Replaces imagePrompts
  featuredImage?: string;
}

export interface HistoryItem extends ArticleData {
  id: string;
  timestamp: number;
}

export type GenerationState = 'idle' | 'loading' | 'success' | 'error';
