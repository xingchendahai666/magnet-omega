/**
 * 请求限流器：令牌桶算法、并发控制、延迟策略、队列管理
 * 防止 IP 封禁，优化爬虫稳定性
 */

export interface RateLimiterConfig {
  maxRequests: number;
  timeWindow: number; // milliseconds
  concurrentLimit?: number;
  delayStrategy?: 'fixed' | 'exponential' | 'random' | 'adaptive';
  minDelay?: number;
  maxDelay?: number;
  adaptiveFactor?: number;
}

export interface RateLimiterStats {
  tokens: number;
  activeRequests: number;
  queueLength: number;
  totalRequests: number;
  totalWaitTime: number;
  avgWaitTime: number;
  rejectedRequests: number;
}

export class RateLimiter {
  private config: Required<RateLimiterConfig>;
  private tokens: number;
  private lastRefillTime: number;
  private activeRequests: number = 0;
  private queue: Array<{ resolve: () => void; reject: (err: Error) => void; timestamp: number }> = [];
  private stats: Omit<RateLimiterStats, 'avgWaitTime'>;
  private consecutiveFailures: number = 0;
  private lastSuccessTime: number = Date.now();

  constructor(config: RateLimiterConfig) {
    this.config = {
      maxRequests: 10,
      timeWindow: 1000,
      concurrentLimit: 3,
      delayStrategy: 'fixed',
      minDelay: 1000,
      maxDelay: 5000,
      adaptiveFactor: 1.5,
      ...config,
    };
    this.tokens = this.config.maxRequests;
    this.lastRefillTime = Date.now();
    this.stats = {
      tokens: this.tokens,
      activeRequests: 0,
      queueLength: 0,
      totalRequests: 0,
      totalWaitTime: 0,
      rejectedRequests: 0,
    };
  }

  async acquire(): Promise<void> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    // 检查并发限制
    if (this.config.concurrentLimit && this.activeRequests >= this.config.concurrentLimit) {
      await this.waitForConcurrency(startTime);
    }

    // 检查令牌
    await this.waitForToken(startTime);

    this.tokens--;
    this.activeRequests++;
    this.stats.tokens = this.tokens;
  }

  release(success: boolean = true): void {
    this.activeRequests--;
    this.stats.activeRequests = this.activeRequests;
    
    if (success) {
      this.consecutiveFailures = 0;
      this.lastSuccessTime = Date.now();
    } else {
      this.consecutiveFailures++;
    }
    
    this.processQueue();
  }

  private async waitForToken(startTime: number): Promise<void> {
    this.refillTokens();

    while (this.tokens <= 0) {
      const waitTime = this.calculateDynamicDelay();
      if (waitTime > 0) {
        this.stats.totalWaitTime += waitTime;
        await this.delay(waitTime);
      }
      this.refillTokens();
    }
  }

  private async waitForConcurrency(startTime: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject, timestamp: Date.now() });
      this.stats.queueLength = this.queue.length;
    });
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const tokensToAdd = Math.floor(elapsed / this.config.timeWindow) * this.config.maxRequests;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.config.maxRequests, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
      this.stats.tokens = this.tokens;
    }
  }

  private calculateDynamicDelay(): number {
    switch (this.config.delayStrategy) {
      case 'fixed':
        return this.config.minDelay;
      case 'exponential':
        return Math.min(
          this.config.minDelay * Math.pow(2, this.consecutiveFailures),
          this.config.maxDelay
        );
      case 'random':
        return this.config.minDelay + Math.random() * (this.config.maxDelay - this.config.minDelay);
      case 'adaptive':
        const timeSinceSuccess = Date.now() - this.lastSuccessTime;
        const factor = Math.max(1, this.config.adaptiveFactor * (this.consecutiveFailures + 1));
        return Math.min(this.config.minDelay * factor + timeSinceSuccess * 0.1, this.config.maxDelay);
      default:
        return this.config.minDelay;
    }
  }

  private processQueue(): void {
    while (this.queue.length > 0 && 
           (!this.config.concurrentLimit || this.activeRequests < this.config.concurrentLimit)) {
      const next = this.queue.shift();
      if (next) {
        next.resolve();
        this.stats.totalWaitTime += Date.now() - next.timestamp;
      }
    }
    this.stats.queueLength = this.queue.length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): RateLimiterStats {
    return {
      ...this.stats,
      avgWaitTime: this.stats.totalRequests > 0 
        ? this.stats.totalWaitTime / this.stats.totalRequests 
        : 0,
    };
  }

  reset(): void {
    this.tokens = this.config.maxRequests;
    this.activeRequests = 0;
    this.queue = [];
    this.consecutiveFailures = 0;
    this.lastSuccessTime = Date.now();
    this.stats = {
      tokens: this.tokens,
      activeRequests: 0,
      queueLength: 0,
      totalRequests: 0,
      totalWaitTime: 0,
      rejectedRequests: 0,
    };
  }

  updateConfig(newConfig: Partial<RateLimiterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config);
}

export async function withRateLimiter<T>(
  limiter: RateLimiter,
  fn: () => Promise<T>
): Promise<T> {
  await limiter.acquire();
  try {
    const result = await fn();
    limiter.release(true);
    return result;
  } catch (error) {
    limiter.release(false);
    throw error;
  }
}

export function createConcurrentLimiter(maxConcurrent: number): {
  acquire: () => Promise<void>;
  release: () => void;
  stats: () => { active: number; queued: number };
} {
  let active = 0;
  const queue: Array<() => void> = [];

  return {
    async acquire() {
      if (active >= maxConcurrent) {
        await new Promise<void>(resolve => queue.push(resolve));
      }
      active++;
    },
    release() {
      active--;
      const next = queue.shift();
      if (next) next();
    },
    stats: () => ({ active, queued: queue.length }),
  };
}
