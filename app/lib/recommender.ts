/**
 * 推荐引擎：基于搜索历史的推荐、相关关键词、趋势分析、热度预测
 * 实现冷启动、协同过滤简化版、时间衰减加权推荐
 */

import { SearchHistoryItem } from '@/store/useStore';

export interface Recommendation {
  query: string;
  score: number;
  reason: string;
  category?: string;
  trend?: 'up' | 'down' | 'stable';
  searchCount?: number;
}

export interface TrendingQuery {
  query: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  category?: string;
  firstSeen: number;
  lastSeen: number;
}

export interface RelatedQuery {
  query: string;
  similarity: number;
  coOccurrence: number;
}

export class Recommender {
  private history: SearchHistoryItem[];
  private weights: Record<string, number>;
  private decayFactor: number;
  private minHistorySize: number;

  constructor(history: SearchHistoryItem[] = [], config?: {
    weights?: Record<string, number>;
    decayFactor?: number;
    minHistorySize?: number;
  }) {
    this.history = history;
    this.weights = {
      recency: 0.35,
      frequency: 0.25,
      resultCount: 0.20,
      length: 0.10,
      uniqueness: 0.10,
      ...config?.weights,
    };
    this.decayFactor = config?.decayFactor || 0.95;
    this.minHistorySize = config?.minHistorySize || 5;
  }

  getRecommendations(count: number = 8): Recommendation[] {
    if (this.history.length < this.minHistorySize) {
      return this.getDefaultRecommendations(count);
    }

    const scored = this.history.map(item => ({
      query: item.query,
      score: this.calculateScore(item),
      reason: this.getReason(item),
      category: this.inferCategory(item.query),
      trend: this.getTrend(item.query),
      searchCount: this.getSearchCount(item.query),
    }));

    // 去重并按分数排序
    const unique = Array.from(
      new Map(scored.map(item => [item.query.toLowerCase(), item])).values()
    );

    return unique
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  getTrendingQueries(windowMs: number = 7 * 24 * 60 * 60 * 1000, minCount: number = 2): TrendingQuery[] {
    const now = Date.now();
    const windowStart = now - windowMs;
    const previousWindowStart = windowStart - windowMs;

    const currentWindow = this.history.filter(h => h.timestamp >= windowStart);
    const previousWindow = this.history.filter(h => 
      h.timestamp >= previousWindowStart && h.timestamp < windowStart
    );

    const currentCounts = this.countQueries(currentWindow);
    const previousCounts = this.countQueries(previousWindow);
    const firstSeenMap = this.getFirstSeenMap();
    const lastSeenMap = this.getLastSeenMap();

    return Object.entries(currentCounts)
      .filter(([, count]) => count >= minCount)
      .map(([query, count]) => {
        const previousCount = previousCounts[query] || 0;
        const changePercent = previousCount === 0 ? 100 : ((count - previousCount) / previousCount) * 100;
        const trend = changePercent > 20 ? 'up' : changePercent < -20 ? 'down' : 'stable';
        
        return {
          query,
          count,
          trend,
          changePercent: Math.round(changePercent * 100) / 100,
          category: this.inferCategory(query),
          firstSeen: firstSeenMap[query] || now,
          lastSeen: lastSeenMap[query] || now,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }

  getRelatedQueries(query: string, count: number = 6): RelatedQuery[] {
    const words = query.toLowerCase().split(/\s+/);
    const related: Record<string, { similarity: number; coOccurrence: number }> = {};

    this.history.forEach(item => {
      const itemWords = item.query.toLowerCase().split(/\s+/);
      const commonWords = words.filter(w => itemWords.includes(w));
      
      if (commonWords.length > 0 && item.query.toLowerCase() !== query.toLowerCase()) {
        const jaccard = commonWords.length / new Set([...words, ...itemWords]).size;
        const relatedItem = related[item.query] || { similarity: 0, coOccurrence: 0 };
        
        related[item.query] = {
          similarity: Math.max(relatedItem.similarity, jaccard),
          coOccurrence: relatedItem.coOccurrence + 1,
        };
      }
    });

    return Object.entries(related)
      .map(([q, data]) => ({
        query: q,
        similarity: Math.round(data.similarity * 100) / 100,
        coOccurrence: data.coOccurrence,
      }))
      .sort((a, b) => b.similarity * b.coOccurrence - a.similarity * a.coOccurrence)
      .slice(0, count);
  }

  getPersonalizedRecommendations(userId?: string, count: number = 5): Recommendation[] {
    // 简化版个性化：基于最近搜索的扩展
    const recentQueries = this.history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(h => h.query);

    const allRelated = new Map<string, number>();
    
    recentQueries.forEach(q => {
      const related = this.getRelatedQueries(q, 3);
      related.forEach(r => {
        allRelated.set(r.query, (allRelated.get(r.query) || 0) + r.similarity);
      });
    });

    return Array.from(allRelated.entries())
      .filter(([q]) => !recentQueries.includes(q))
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([query, score]) => ({
        query,
        score: Math.min(1, score / recentQueries.length),
        reason: '基于您的搜索历史推荐',
        category: this.inferCategory(query),
      }));
  }

  private calculateScore(item: SearchHistoryItem): number {
    const now = Date.now();
    const age = now - item.timestamp;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 天
    
    const recencyScore = Math.max(0, Math.pow(this.decayFactor, age / (24 * 60 * 60 * 1000)));
    const frequencyScore = Math.min(1, item.resultCount / 100);
    const lengthScore = Math.min(1, item.query.length / 20);
    const uniquenessScore = this.getUniquenessScore(item.query);

    return (
      recencyScore * this.weights.recency +
      frequencyScore * this.weights.frequency +
      lengthScore * this.weights.length +
      uniquenessScore * this.weights.uniqueness
    );
  }

  private getUniquenessScore(query: string): number {
    const queryLower = query.toLowerCase();
    const similarCount = this.history.filter(h => 
      h.query.toLowerCase() !== queryLower && 
      this.calculateStringSimilarity(h.query, query) > 0.7
    ).length;
    
    return similarCount === 0 ? 1 : Math.max(0.2, 1 - (similarCount / this.history.length));
  }

  private getReason(item: SearchHistoryItem): string {
    const days = Math.floor((Date.now() - item.timestamp) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天搜索过';
    if (days === 1) return '昨天搜索过';
    if (days < 7) return `${days}天前搜索过`;
    if (days < 30) return `${Math.floor(days / 7)}周前搜索过`;
    return `${Math.floor(days / 30)}月前搜索过`;
  }

  private getTrend(query: string): 'up' | 'down' | 'stable' {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    
    const recentCount = this.history.filter(h => h.query === query && h.timestamp >= weekAgo).length;
    const previousCount = this.history.filter(h => h.query === query && h.timestamp >= twoWeeksAgo && h.timestamp < weekAgo).length;
    
    if (previousCount === 0) return recentCount > 0 ? 'up' : 'stable';
    
    const change = (recentCount - previousCount) / previousCount;
    if (change > 0.3) return 'up';
    if (change < -0.3) return 'down';
    return 'stable';
  }

  private getSearchCount(query: string): number {
    return this.history.filter(h => h.query === query).length;
  }

  private countQueries(history: SearchHistoryItem[]): Record<string, number> {
    const counts: Record<string, number> = {};
    history.forEach(item => {
      counts[item.query] = (counts[item.query] || 0) + 1;
    });
    return counts;
  }

  private getFirstSeenMap(): Record<string, number> {
    const map: Record<string, number> = {};
    this.history.forEach(item => {
      if (!map[item.query]) map[item.query] = item.timestamp;
    });
    return map;
  }

  private getLastSeenMap(): Record<string, number> {
    const map: Record<string, number> = {};
    this.history.forEach(item => {
      map[item.query] = item.timestamp;
    });
    return map;
  }

  private inferCategory(query: string): string {
    const q = query.toLowerCase();
    if (/movie|film|cinema|avengers|batman|spider/i.test(q)) return '电影';
    if (/series|tv|show|episode|season|house of/i.test(q)) return '剧集';
    if (/game|steam|epic|playstation|xbox|nintendo/i.test(q)) return '游戏';
    if (/software|app|tool|utility|editor|ide/i.test(q)) return '软件';
    if (/music|album|track|mp3|flac|song|band/i.test(q)) return '音乐';
    if (/book|pdf|epub|mobi|novel|textbook/i.test(q)) return '图书';
    if (/linux|ubuntu|windows|macos|android|ios/i.test(q)) return '系统';
    if (/tutorial|course|learn|guide|lesson|lecture/i.test(q)) return '教育';
    return '综合';
  }

  private calculateStringSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    return matches / longer.length;
  }

  private getDefaultRecommendations(count: number): Recommendation[] {
    const defaults = [
      { query: 'Ubuntu 22.04 LTS', category: '系统' },
      { query: 'Avengers Endgame 4K', category: '电影' },
      { query: 'Python 完整教程', category: '教育' },
      { query: 'Cyberpunk 2077 Ultimate', category: '游戏' },
      { query: 'React 官方文档', category: '软件' },
      { query: '周杰伦 无损合集', category: '音乐' },
      { query: '三体 全集', category: '图书' },
      { query: 'Adobe CC 2024', category: '软件' },
    ];

    return defaults.slice(0, count).map((item, index) => ({
      query: item.query,
      score: 0.5 - (index * 0.05),
      reason: '热门推荐',
      category: item.category,
      trend: 'stable' as const,
      searchCount: Math.floor(Math.random() * 100) + 50,
    }));
  }
}

export function createRecommender(history: SearchHistoryItem[], config?: any): Recommender {
  return new Recommender(history, config);
}

export function mergeRecommendations(
  historyBased: Recommendation[],
  trending: TrendingQuery[],
  weight: number = 0.6
): Recommendation[] {
  const trendingRecs: Recommendation[] = trending.map(t => ({
    query: t.query,
    score: t.count / 100,
    reason: ` trending (${t.changePercent > 0 ? '+' : ''}${t.changePercent}%)`,
    category: t.category,
    trend: t.trend,
    searchCount: t.count,
  }));

  const all = [...historyBased, ...trendingRecs];
  const unique = Array.from(
    new Map(all.map(item => [item.query.toLowerCase(), item])).values()
  );

  // 加权合并
  return unique
    .map(item => {
      const isTrending = trendingRecs.some(t => t.query.toLowerCase() === item.query.toLowerCase());
      const adjustedScore = isTrending 
        ? item.score * (1 - weight) + 0.5 * weight 
        : item.score;
      return { ...item, score: adjustedScore };
    })
    .sort((a, b) => b.score - a.score);
        }
