import Fuse from 'fuse.js';

export interface LawArticle {
  article: number;
  title: string;
  chapter: string;
  part: string;
  text: string;
  tags: string[];
  lawSource?: string;
  articleNumberLabel?: string; // e.g., "Article 13"
}

export interface SearchResult extends LawArticle {
  score?: number;
  matches?: any[];
  matchType?: 'exact' | 'fuzzy';
}

export interface QueryMeta {
  originalQuery: string;
  normalizedQuery: string;
  isQuoted: boolean;
  isArticlePattern: boolean;
  articleNumber?: number;
  tokens: string[];
  regexPatterns: {
    wholeWord?: RegExp;
    articlePattern?: RegExp;
    articleStartPattern?: RegExp;
    quotedPhrase?: RegExp;
    andTerms?: RegExp;
  };
}

class LawSearch {
  private fuse: Fuse<LawArticle> | null = null;
  private articles: LawArticle[] = [];
  private normalizedCache = new Map<string, string>();

  private readonly fuseOptions = {
    keys: [
      { name: 'title', weight: 0.3 },
      { name: 'text', weight: 0.4 },
      { name: 'tags', weight: 0.2 },
      { name: 'chapter', weight: 0.05 },
      { name: 'part', weight: 0.05 },
    ],
    threshold: 0.2, // Lower threshold for fuzzy mode
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2,
    findAllMatches: true,
  };

  async initialize() {
    try {
      const response = await fetch('/law.json');
      this.articles = await response.json();
      
      // Add articleNumberLabel for each article
      this.articles = this.articles.map(article => ({
        ...article,
        articleNumberLabel: `Article ${article.article}`
      }));
      
      this.fuse = new Fuse(this.articles, this.fuseOptions);
      return this.articles;
    } catch (error) {
      console.error('Failed to load law data:', error);
      return [];
    }
  }

  search(query: string, filters?: { chapter?: string; part?: string; tags?: string[]; lawSource?: string }, useFuzzy: boolean = false): SearchResult[] {
    console.log('Search called with query:', query, 'fuzzy:', useFuzzy, 'filters:', filters);
    
    if (!query.trim()) {
      // Show only first 4 articles when no search is performed
      console.log('No query, returning first 4 articles');
      return this.articles.slice(0, 4).map(article => ({ ...article }));
    }

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      console.log('Empty query after trim, returning first 4 articles');
      return this.articles.slice(0, 4).map(article => ({ ...article }));
    }

    console.log('Processing query:', cleanQuery);

    // Use fuzzy search if explicitly requested
    if (useFuzzy && this.fuse) {
      console.log('Using fuzzy search');
      const fuseResults = this.fuse.search(cleanQuery);
      let results: SearchResult[] = fuseResults.map(result => ({
        ...result.item,
        score: result.score || 0,
        matches: result.matches ? [...result.matches] : [],
        matchType: 'fuzzy' as const
      }));

      // Apply filters to fuzzy results
      results = this.applyFilters(results, filters);
      console.log('Fuzzy search results:', results.length, 'articles');
      return results;
    }

    // Use exact search by default
    const queryMeta = this.buildQueryMeta(cleanQuery);
    console.log('Query meta:', queryMeta);

    const exactMatches: SearchResult[] = [];
    
    // Search through all articles for exact matches
    for (const article of this.articles) {
      const matchResult = this.matchItem(article, queryMeta);
      if (matchResult.matches) {
        const score = this.scoreMatch(article, queryMeta);
        exactMatches.push({
          ...article,
          score,
          matchType: 'exact' as const
        });
      }
    }
    
    // Sort exact matches by relevance
    let results = exactMatches.sort((a, b) => {
      // Higher score = better match
      return (b.score || 0) - (a.score || 0);
    });

    // Apply filters
    results = this.applyFilters(results, filters);

    console.log('Exact search results:', results.length, 'articles');
    return results;
  }

  buildQueryMeta(query: string): QueryMeta {
    const originalQuery = query;
    const normalizedQuery = this.normalize(query);
    
    // Check if query is quoted
    const isQuoted = query.startsWith('"') && query.endsWith('"');
    const unquotedQuery = isQuoted ? query.slice(1, -1) : query;
    const normalizedUnquoted = this.normalize(unquotedQuery);
    
    // Check if query matches article pattern
    const articleMatch = normalizedUnquoted.match(/^article\s*(\d+)$/i);
    const isArticlePattern = !!articleMatch;
    const articleNumber = articleMatch ? parseInt(articleMatch[1]) : undefined;
    
    // Extract tokens for multi-word queries
    const tokens = normalizedUnquoted.split(/\s+/).filter(token => token.length > 0);
    
    // Build regex patterns
    const regexPatterns: QueryMeta['regexPatterns'] = {};
    
    if (tokens.length === 1 && !isArticlePattern) {
      // Single token: whole word match
      const token = tokens[0];
      regexPatterns.wholeWord = new RegExp(`\\b${this.escapeRegex(token)}\\b`, 'i');
    } else if (isArticlePattern && articleNumber !== undefined) {
      // Article pattern: exact article number with lookahead
      regexPatterns.articlePattern = new RegExp(`\\barticle\\s*${articleNumber}(?=[^\\d]|$)`, 'i');
      regexPatterns.articleStartPattern = new RegExp(`^article\\s*${articleNumber}(?=[^\\d]|$)`, 'i');
    } else if (isQuoted) {
      // Quoted phrase: exact phrase match
      regexPatterns.quotedPhrase = new RegExp(this.escapeRegex(normalizedUnquoted), 'i');
    } else if (tokens.length > 1) {
      // Multi-word unquoted: AND of exact whole-word terms
      const andPatterns = tokens.map(token => `(?=.*\\b${this.escapeRegex(token)}\\b)`);
      regexPatterns.andTerms = new RegExp(andPatterns.join(''), 'i');
    }
    
    return {
      originalQuery,
      normalizedQuery: normalizedUnquoted,
      isQuoted,
      isArticlePattern,
      articleNumber,
      tokens,
      regexPatterns
    };
  }

  matchItem(article: LawArticle, queryMeta: QueryMeta): { matches: boolean; matchDetails?: any } {
    const { regexPatterns, isArticlePattern, articleNumber } = queryMeta;
    
    // Get normalized searchable text
    const searchableText = this.getNormalizedSearchableText(article);
    const normalizedTitle = this.normalize(article.title);
    const normalizedArticleLabel = this.normalize(article.articleNumberLabel || '');
    
    // Article pattern matching (highest priority)
    if (isArticlePattern && articleNumber !== undefined) {
      // Exact article number match
      if (article.article === articleNumber) {
        return { matches: true, matchDetails: { type: 'exactArticleNumber' } };
      }
      
      // Article pattern in title or text
      if (regexPatterns.articlePattern) {
        if (regexPatterns.articlePattern.test(normalizedTitle) || 
            regexPatterns.articlePattern.test(searchableText)) {
          return { matches: true, matchDetails: { type: 'articlePattern' } };
        }
      }
      
      return { matches: false };
    }
    
    // Quoted phrase matching
    if (regexPatterns.quotedPhrase) {
      if (regexPatterns.quotedPhrase.test(searchableText)) {
        return { matches: true, matchDetails: { type: 'quotedPhrase' } };
      }
      return { matches: false };
    }
    
    // Single token whole word matching
    if (regexPatterns.wholeWord) {
      if (regexPatterns.wholeWord.test(searchableText)) {
        return { matches: true, matchDetails: { type: 'wholeWord' } };
      }
      return { matches: false };
    }
    
    // Multi-word AND matching
    if (regexPatterns.andTerms) {
      if (regexPatterns.andTerms.test(searchableText)) {
        return { matches: true, matchDetails: { type: 'andTerms' } };
      }
      return { matches: false };
    }
    
    return { matches: false };
  }

  scoreMatch(article: LawArticle, queryMeta: QueryMeta): number {
    const { regexPatterns, isArticlePattern, articleNumber } = queryMeta;
    let score = 0;
    
    const searchableText = this.getNormalizedSearchableText(article);
    const normalizedTitle = this.normalize(article.title);
    const normalizedArticleLabel = this.normalize(article.articleNumberLabel || '');
    
    // Article pattern scoring (highest priority)
    if (isArticlePattern && articleNumber !== undefined) {
      // Exact article number match gets highest score
      if (article.article === articleNumber) {
        score += 1000;
      }
      
      // Title starts with article pattern
      if (regexPatterns.articleStartPattern && regexPatterns.articleStartPattern.test(normalizedTitle)) {
        score += 800;
      }
      
      // Article pattern in title
      if (regexPatterns.articlePattern && regexPatterns.articlePattern.test(normalizedTitle)) {
        score += 600;
      }
      
      // Article pattern in text
      if (regexPatterns.articlePattern && regexPatterns.articlePattern.test(searchableText)) {
        score += 400;
      }
      
      return score;
    }
    
    // Quoted phrase scoring
    if (regexPatterns.quotedPhrase) {
      // Title contains exact phrase
      if (regexPatterns.quotedPhrase.test(normalizedTitle)) {
        score += 500;
      }
      // Text contains exact phrase
      else if (regexPatterns.quotedPhrase.test(searchableText)) {
        score += 300;
      }
      return score;
    }
    
    // Single token scoring
    if (regexPatterns.wholeWord) {
      // Title contains whole word
      if (regexPatterns.wholeWord.test(normalizedTitle)) {
        score += 400;
      }
      // Text contains whole word
      else if (regexPatterns.wholeWord.test(searchableText)) {
        score += 200;
      }
      return score;
    }
    
    // Multi-word AND scoring
    if (regexPatterns.andTerms) {
      // All terms in title
      if (regexPatterns.andTerms.test(normalizedTitle)) {
        score += 300;
      }
      // All terms in text
      else if (regexPatterns.andTerms.test(searchableText)) {
        score += 150;
      }
      return score;
    }
    
    return score;
  }

  private normalize(text: string): string {
    if (this.normalizedCache.has(text)) {
      return this.normalizedCache.get(text)!;
    }
    
    const normalized = text
      .normalize('NFD') // Unicode normalization
      .replace(/\p{Diacritic}/gu, '') // Remove diacritics
      .toLowerCase()
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
    
    this.normalizedCache.set(text, normalized);
    return normalized;
  }

  private getNormalizedSearchableText(article: LawArticle): string {
    const searchableFields = [
      article.title,
      article.text,
      article.chapter,
      article.part,
      ...article.tags
    ].filter(Boolean);
    
    return this.normalize(searchableFields.join(' '));
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private applyFilters(results: SearchResult[], filters?: { chapter?: string; part?: string; tags?: string[]; lawSource?: string }): SearchResult[] {
    if (!filters) return results;

    let filteredResults = results;

    if (filters.chapter) {
      filteredResults = filteredResults.filter(result => 
        result.chapter.toLowerCase().includes(filters.chapter!.toLowerCase())
      );
    }

    if (filters.part) {
      filteredResults = filteredResults.filter(result => 
        result.part.toLowerCase().includes(filters.part!.toLowerCase())
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.tags!.some(tag => 
          result.tags.some(articleTag => 
            articleTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (filters.lawSource) {
      filteredResults = filteredResults.filter(result => 
        result.lawSource === filters.lawSource
      );
    }

    return filteredResults;
  }


  getArticleByNumber(articleNumber: number): LawArticle | undefined {
    return this.articles.find(article => article.article === articleNumber);
  }

  getAllArticles(): LawArticle[] {
    return this.articles;
  }

  clearSearchCache(): void {
    this.normalizedCache.clear();
  }

  getQuickFilters() {
    const tags = new Set<string>();
    const chapters = new Set<string>();
    const parts = new Set<string>();
    
    this.articles.forEach(article => {
      article.tags.forEach(tag => tags.add(tag));
      if (article.chapter) chapters.add(article.chapter);
      if (article.part) parts.add(article.part);
    });

    return {
      popularTags: ['rights', 'freedom', 'citizenship', 'justice', 'education', 'assembly', 'government', 'constitution'],
      allTags: Array.from(tags).sort(),
      chapters: Array.from(chapters).sort(),
      parts: Array.from(parts).sort(),
    };
  }
}

export const lawSearch = new LawSearch();

// Utility function to highlight search terms in text
export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim()) return text;
  
  let highlightedText = text;
  const exactQuery = query.trim();
  const queryMeta = lawSearch.buildQueryMeta(exactQuery);
  
  if (queryMeta.isArticlePattern && queryMeta.articleNumber !== undefined) {
    // Highlight article patterns
    const articleRegex = new RegExp(`\\b(article\\s*${queryMeta.articleNumber})(?=[^\\d]|$)`, 'gi');
    highlightedText = highlightedText.replace(articleRegex, '<mark class="exact-search">$1</mark>');
  } else if (queryMeta.isQuoted) {
    // Highlight quoted phrases
    const phraseRegex = new RegExp(`(${queryMeta.normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlightedText = highlightedText.replace(phraseRegex, '<mark class="exact-search">$1</mark>');
  } else if (queryMeta.tokens.length === 1) {
    // Highlight single tokens as whole words
    const token = queryMeta.tokens[0];
    const wholeWordRegex = new RegExp(`\\b(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    highlightedText = highlightedText.replace(wholeWordRegex, '<mark class="exact-search">$1</mark>');
  } else {
    // Highlight multi-word terms
    queryMeta.tokens.forEach(token => {
      const wholeWordRegex = new RegExp(`(?<!<mark[^>]*>)\\b(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?![^<]*</mark>)`, 'gi');
      highlightedText = highlightedText.replace(wholeWordRegex, '<mark class="exact-match">$1</mark>');
    });
  }
  
  return highlightedText;
}

// Chat and conversation interfaces
export interface ChatResponse {
  message: string;
  searchResults: SearchResult[];
  suggestions?: string[];
  context?: string;
}

export interface ConversationContext {
  previousQueries: string[];
  mentionedArticles: number[];
  currentTopic?: string;
  userIntent?: 'search' | 'explain' | 'compare' | 'general' | 'fulltext';
}

// Enhanced search with conversational capabilities
class ConversationalLawSearch extends LawSearch {
  private conversationContext: ConversationContext = {
    previousQueries: [],
    mentionedArticles: [],
  };

  // Interpret user intent and generate contextual responses
  async processChatQuery(query: string, context?: ConversationContext): Promise<ChatResponse> {
    if (context) {
      this.conversationContext = context;
    }

    // Add to conversation context
    this.conversationContext.previousQueries.push(query);

    // Analyze query intent
    const intent = this.analyzeIntent(query);
    this.conversationContext.userIntent = intent;

    // Extract search terms from conversational query
    const searchTerms = this.extractSearchTerms(query);
    
    // Perform search
    const searchResults = this.search(searchTerms, undefined, false);
    
    // Generate contextual response
    const response = this.generateContextualResponse(query, searchResults, intent);
    
    // Update context with mentioned articles
    this.conversationContext.mentionedArticles = searchResults.map(r => r.article);
    
    return response;
  }

  private analyzeIntent(query: string): 'search' | 'explain' | 'compare' | 'general' | 'fulltext' {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('show me the full') || lowerQuery.includes('full article') || lowerQuery.includes('full text') || lowerQuery.includes('complete article')) {
      return 'fulltext';
    }
    
    if (lowerQuery.includes('what is') || lowerQuery.includes('explain') || lowerQuery.includes('tell me about')) {
      return 'explain';
    }
    
    if (lowerQuery.includes('compare') || lowerQuery.includes('difference') || lowerQuery.includes('versus')) {
      return 'compare';
    }
    
    if (lowerQuery.includes('article') || lowerQuery.includes('section') || /^\d+$/.test(query.trim())) {
      return 'search';
    }
    
    return 'general';
  }

  private extractSearchTerms(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Remove conversational words
    const conversationalWords = [
      'what', 'is', 'are', 'the', 'tell', 'me', 'about', 'can', 'you', 'explain',
      'how', 'does', 'do', 'show', 'find', 'search', 'for', 'give', 'me'
    ];
    
    // Extract article numbers
    const articleMatch = query.match(/(?:article|art\.?)\s*(\d+)|^(\d+)$/i);
    if (articleMatch) {
      return articleMatch[1] || articleMatch[2] || query;
    }
    
    // Clean up query
    let cleanQuery = query;
    conversationalWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleanQuery = cleanQuery.replace(regex, '');
    });
    
    return cleanQuery.trim() || query;
  }

  private generateContextualResponse(query: string, results: SearchResult[], intent: string): ChatResponse {
    let message = '';
    let suggestions: string[] = [];
    
    if (results.length === 0) {
      message = "I couldn't find any articles matching your query. Could you try rephrasing your question or be more specific?";
      suggestions = [
        "Try searching for specific legal terms",
        "Search by article number (e.g., 'Article 25')",
        "Ask about fundamental rights or citizenship"
      ];
    } else if (intent === 'fulltext') {
      message = this.generateFullTextResponse(query, results);
      suggestions = this.generateFullTextSuggestions(results);
    } else if (intent === 'explain') {
      message = this.generateExplanationResponse(query, results);
      suggestions = this.generateFollowUpSuggestions(results);
    } else if (intent === 'compare') {
      message = this.generateComparisonResponse(query, results);
      suggestions = this.generateComparisonSuggestions(results);
    } else if (intent === 'search') {
      message = this.generateSearchResponse(query, results);
      suggestions = this.generateSearchSuggestions(results);
    } else {
      message = this.generateGeneralResponse(query, results);
      suggestions = this.generateGeneralSuggestions(results);
    }

    return {
      message,
      searchResults: results.slice(0, 5), // Limit to 5 most relevant results
      suggestions,
      context: this.conversationContext.currentTopic
    };
  }

  private generateExplanationResponse(query: string, results: SearchResult[]): string {
    const topResult = results[0];
    const articleNum = topResult.article;
    
    // Generate a concise summary instead of showing full article
    const summary = this.generateArticleSummary(topResult, query);
    
    return `Based on Article ${articleNum} (${topResult.title}), here's what I found:\n\n${summary}\n\nWould you like me to show you the full article text?`;
  }

  private generateComparisonResponse(query: string, results: SearchResult[]): string {
    if (results.length < 2) {
      return `I found one relevant article for your comparison question. Here's what Article ${results[0].article} says about this topic.`;
    }
    
    const articles = results.slice(0, 2).map(r => `Article ${r.article}`);
    return `I found relevant information in ${articles.join(' and ')}. Let me show you both articles so you can compare their provisions.`;
  }

  private generateSearchResponse(query: string, results: SearchResult[]): string {
    const count = results.length;
    const articleNumbers = results.slice(0, 3).map(r => r.article);
    
    if (count === 1) {
      const topResult = results[0];
      const summary = this.generateArticleSummary(topResult, query);
      return `I found Article ${topResult.article} (${topResult.title}):\n\n${summary}\n\nWould you like me to show you the full article text?`;
    } else if (count <= 3) {
      return `I found ${count} relevant articles: ${articleNumbers.join(', ')}. Here are the details:`;
    } else {
      return `I found ${count} articles related to your search. Here are the most relevant ones:`;
    }
  }

  private generateGeneralResponse(query: string, results: SearchResult[]): string {
    const count = results.length;
    const topResult = results[0];
    
    if (count === 1) {
      const summary = this.generateArticleSummary(topResult, query);
      return `I found Article ${topResult.article} (${topResult.title}) that addresses your question about "${query}":\n\n${summary}\n\nWould you like me to show you the full article text?`;
    }
    
    return `I found ${count} articles related to your question. Here's what the law says about "${query}":`;
  }

  private generateArticleSummary(article: SearchResult, query: string): string {
    // Extract key sentences from the article text
    const sentences = article.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Find sentences that are most relevant to the query
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const relevantSentences = sentences
      .map(sentence => ({
        sentence: sentence.trim(),
        relevance: queryWords.reduce((score, word) => 
          sentence.toLowerCase().includes(word) ? score + 1 : score, 0
        )
      }))
      .filter(item => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 2)
      .map(item => item.sentence);

    if (relevantSentences.length > 0) {
      return relevantSentences.join('. ') + '.';
    }

    // Fallback: return first 2-3 sentences
    return sentences.slice(0, 2).join('. ') + '.';
  }

  private generateFollowUpSuggestions(results: SearchResult[]): string[] {
    const suggestions: string[] = [];
    
    if (results.length > 0) {
      const topResult = results[0];
      suggestions.push(`Show me the full Article ${topResult.article} text`);
      suggestions.push(`Tell me more about ${topResult.title.toLowerCase()}`);
      
      if (topResult.tags.length > 0) {
        suggestions.push(`What are the ${topResult.tags[0]} provisions?`);
      }
    }
    
    suggestions.push("What are the penalties for violations?");
    suggestions.push("How does this relate to other rights?");
    
    return suggestions;
  }

  private generateComparisonSuggestions(results: SearchResult[]): string[] {
    return [
      "What are the key differences between these articles?",
      "How do these provisions work together?",
      "Are there any conflicts between these laws?"
    ];
  }

  private generateSearchSuggestions(results: SearchResult[]): string[] {
    const suggestions: string[] = [];
    
    if (results.length > 1) {
      suggestions.push("Show me more articles on this topic");
    }
    
    suggestions.push("Explain this article in simple terms");
    suggestions.push("What are the key points of this law?");
    
    return suggestions;
  }

  private generateGeneralSuggestions(results: SearchResult[]): string[] {
    return [
      "Can you explain this in simpler terms?",
      "What are the practical implications?",
      "Are there any related laws I should know about?"
    ];
  }

  private generateFullTextResponse(query: string, results: SearchResult[]): string {
    const topResult = results[0];
    return `Here's the complete text of Article ${topResult.article} (${topResult.title}):`;
  }

  private generateFullTextSuggestions(results: SearchResult[]): string[] {
    const suggestions: string[] = [];
    
    if (results.length > 0) {
      const topResult = results[0];
      suggestions.push(`Explain Article ${topResult.article} in simple terms`);
      suggestions.push(`What are the key points of this article?`);
      
      if (topResult.tags.length > 0) {
        suggestions.push(`How does this relate to ${topResult.tags[0]}?`);
      }
    }
    
    suggestions.push("Are there any related articles?");
    suggestions.push("What are the practical implications?");
    
    return suggestions;
  }

  // Get conversation context
  getConversationContext(): ConversationContext {
    return { ...this.conversationContext };
  }

  // Clear conversation context
  clearConversationContext(): void {
    this.conversationContext = {
      previousQueries: [],
      mentionedArticles: [],
    };
  }

  // Generate welcome message
  getWelcomeMessage(): string {
    return "Hello! I am your law assistant, ask me anything about South Sudan laws and I'll help you find the information you need. I can help you find and understand legal provisions from the Transitional Constitution and other laws. What would you like to know?";
  }

  // Generate help message
  getHelpMessage(): string {
    return "I can help you with:\n\n• Finding specific articles by number or keyword\n• Explaining legal concepts and provisions\n• Comparing different articles\n• Answering questions about South Sudan law\n\nTry asking me something like 'What are the fundamental rights?' or 'Tell me about Article 25'.";
  }
}

// Local storage utilities for recent searches
export const searchHistory = {
  add(query: string) {
    if (!query.trim()) return;
    
    const history = this.get();
    const newHistory = [query, ...history.filter(q => q !== query)].slice(0, 5);
    localStorage.setItem('law-search-history', JSON.stringify(newHistory));
  },

  get(): string[] {
    try {
      return JSON.parse(localStorage.getItem('law-search-history') || '[]');
    } catch {
      return [];
    }
  },

  clear() {
    localStorage.removeItem('law-search-history');
  }
};

export const conversationalLawSearch = new ConversationalLawSearch();