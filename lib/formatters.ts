/**
 * 数据格式化器：专业级单位转换、时间渲染、速度计算、ETA 预估、数字紧凑化
 */

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  if (!Number.isFinite(bytes) || bytes < 0) return 'N/A';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function parseBytes(input: string): number {
  if (!input) return 0;
  const match = input.match(/(\d+\.?\d*)\s*(B|KB|MB|GB|TB|PB)/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = {
    'B': 1, 'KB': 1024, 'MB': 1024 ** 2, 'GB': 1024 ** 3, 'TB': 1024 ** 4, 'PB': 1024 ** 5,
  };
  
  return Math.floor(value * (multipliers[unit] || 1));
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return 'N/A';
  if (seconds === Infinity) return '∞';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  if (minutes > 0) return `${minutes}分钟 ${secs}秒`;
  return `${secs}秒`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond < 0) return '0 B/s';
  return formatBytes(bytesPerSecond) + '/s';
}

export function calculateETA(totalBytes: number, downloadedBytes: number, speedBytesPerSec: number): string {
  if (!Number.isFinite(totalBytes) || !Number.isFinite(downloadedBytes) || !Number.isFinite(speedBytesPerSec)) return 'N/A';
  if (speedBytesPerSec <= 0) return '∞';
  
  const remainingBytes = totalBytes - downloadedBytes;
  if (remainingBytes <= 0) return '已完成';
  
  const etaSeconds = remainingBytes / speedBytesPerSec;
  return formatDuration(etaSeconds);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.min(100, Math.max(0, value)).toFixed(decimals)}%`;
}

export function formatTimestamp(timestamp: number | string, format: 'relative' | 'short' | 'long' | 'iso' = 'relative'): string {
  const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
  if (isNaN(date.getTime())) return '无效时间';
  
  const now = new Date();
  
  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'long':
      return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    case 'short':
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    case 'relative':
    default:
      const diff = now.getTime() - date.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);
      
      if (seconds < 60) return '刚刚';
      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;
      if (weeks < 4) return `${weeks}周前`;
      if (months < 12) return `${months}月前`;
      return `${years}年前`;
  }
}

export function formatNumber(num: number, compact: boolean = false, locale: string = 'zh-CN'): string {
  if (!Number.isFinite(num)) return '0';
  
  if (compact) {
    if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  
  return num.toLocaleString(locale);
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + suffix;
}

export function formatFileSizeRange(min: number, max: number): string {
  return `${formatBytes(min)} ~ ${formatBytes(max)}`;
}

export function formatBitrate(bps: number): string {
  if (bps < 1000) return `${bps} bps`;
  if (bps < 1_000_000) return `${(bps / 1000).toFixed(1)} Kbps`;
  return `${(bps / 1_000_000).toFixed(1)} Mbps`;
}
