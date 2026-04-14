/**
 * 数据验证器：URL、磁力链接、关键词、文件大小、引擎 ID 等严格校验
 * 提供批量验证管道，支持防注入、防 XSS、格式白名单
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
  warnings?: string[];
}

export function validateUrl(url: string): ValidationResult {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: '仅支持 HTTP/HTTPS 协议', warnings: ['非安全协议'] };
    }
    if (parsed.hostname.includes('localhost') || parsed.hostname.includes('127.0.0.1')) {
      return { valid: false, error: '不允许本地地址', warnings: ['安全风险'] };
    }
    return { valid: true, sanitized: parsed.toString(), warnings: [] };
  } catch {
    return { valid: false, error: '无效的 URL 格式', warnings: ['解析失败'] };
  }
}

export function validateMagnet(magnet: string): ValidationResult {
  const trimmed = magnet.trim();
  if (!trimmed.startsWith('magnet:?')) {
    return { valid: false, error: '不是有效的磁力链接格式', warnings: ['前缀错误'] };
  }
  
  const hasInfoHash = /xt=urn:btih:[a-fA-F0-9]{32,40}/.test(trimmed);
  if (!hasInfoHash) {
    return { valid: false, error: '缺少有效的 InfoHash', warnings: ['哈希缺失'] };
  }
  
  const match = trimmed.match(/xt=urn:btih:([a-fA-F0-9]+)/);
  if (match) {
    const hash = match[1];
    if (hash.length !== 32 && hash.length !== 40) {
      return { valid: false, error: `InfoHash 长度无效 (${hash.length})`, warnings: ['长度异常'] };
    }
  }
  
  const hasMalicious = /<script|javascript:|on\w+=/i.test(trimmed);
  if (hasMalicious) {
    return { valid: false, error: '包含恶意脚本特征', warnings: ['安全拦截'] };
  }
  
  return { valid: true, sanitized: trimmed, warnings: [] };
}

export function validateSearchQuery(query: string): ValidationResult {
  const trimmed = query.trim();
  
  if (!trimmed) return { valid: false, error: '搜索关键词不能为空', warnings: ['空输入'] };
  if (trimmed.length < 2) return { valid: false, error: '搜索关键词至少需要 2 个字符', warnings: ['过短'] };
  if (trimmed.length > 100) return { valid: false, error: '搜索关键词不能超过 100 个字符', warnings: ['过长'] };
  
  const sanitized = trimmed
    .replace(/[^\w\s\u4e00-\u9fa5\-_.()#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!sanitized) return { valid: false, error: '搜索关键词包含无效字符', warnings: ['字符过滤'] };
  
  const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b|--|;|\/\*)/i;
  if (sqlPatterns.test(sanitized)) {
    return { valid: false, error: '检测到 SQL 注入特征', warnings: ['安全拦截'] };
  }
  
  return { valid: true, sanitized, warnings: [] };
}

export function validateFileSize(sizeBytes: number): ValidationResult {
  if (!Number.isFinite(sizeBytes)) return { valid: false, error: '文件大小必须为有效数字', warnings: ['类型错误'] };
  if (sizeBytes < 0) return { valid: false, error: '文件大小不能为负数', warnings: ['负值'] };
  if (sizeBytes > 10 * 1024 ** 4) return { valid: false, error: '文件大小超出合理范围 (最大 10TB)', warnings: ['超限'] };
  return { valid: true, warnings: [] };
}

export function validateEngineId(id: string): ValidationResult {
  if (!id) return { valid: false, error: '引擎 ID 不能为空', warnings: ['空值'] };
  if (!/^[a-z0-9_-]+$/.test(id)) return { valid: false, error: '引擎 ID 只能包含小写字母、数字、下划线和连字符', warnings: ['格式非法'] };
  if (id.length > 32) return { valid: false, error: '引擎 ID 不能超过 32 个字符', warnings: ['过长'] };
  const reserved = ['all', 'search', 'api', 'admin', 'config'];
  if (reserved.includes(id.toLowerCase())) return { valid: false, error: '引擎 ID 与系统保留字冲突', warnings: ['保留字'] };
  return { valid: true, warnings: [] };
}

export function batchValidate<T>(items: T[], validator: (item: T) => ValidationResult): ValidationResult[] {
  return items.map((item, index) => {
    const result = validator(item);
    return {
      ...result,
      warnings: [`Index ${index}`, ...(result.warnings || [])],
    };
  });
}

export function validateSearchFilters(filters: Record<string, any>): ValidationResult {
  const warnings: string[] = [];
  
  if (filters.minSize !== undefined && filters.maxSize !== undefined && filters.minSize > filters.maxSize) {
    warnings.push('minSize 大于 maxSize');
  }
  if (filters.minSeeds !== undefined && filters.minSeeds < 0) {
    warnings.push('minSeeds 不能为负数');
  }
  if (filters.timeRange && !['all', 'day', 'week', 'month', 'year'].includes(filters.timeRange)) {
    warnings.push('timeRange 值无效');
  }
  
  return {
    valid: warnings.length === 0,
    error: warnings.length > 0 ? '过滤器配置存在警告' : undefined,
    warnings,
  };
}
