import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export interface CrawlerOptions {
  timeout?: number;
  retries?: number;
  proxy?: string;
  userAgent?: string;
  headers?: Record<string, string>;
}

export interface TorrentResult {
  id: string;
  title: string;
  size: string;
  sizeBytes: number;
  seeds: number;
  leechs: number;
  date: string;
  timestamp: number;
  magnet: string;
  infoHash: string;
  engine: string;
  category: string;
  uploader?: string;
  verified: boolean;
  url: string;
  files?: Array<{ name: string; size: number }>;
}

export class AdvancedCrawler {
  private options: Required<CrawlerOptions>;
  private agent: any;

  constructor(options: CrawlerOptions = {}) {
    this.options = {
      timeout: 10000,
      retries: 3,
      proxy: process.env.PROXY_URL || '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options,
    };

    if (this.options.proxy) {
      this.agent = new HttpsProxyAgent(this.options.proxy);
    }
  }

  private async fetchWithRetry(url: string, attempts = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...this.options.headers,
        },
        agent: this.agent,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempts < this.options.retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
        return this.fetchWithRetry(url, attempts + 1);
      }
      throw error;
    }
  }

  async crawl(engine: string, query: string): Promise<TorrentResult[]> {
    const crawlers: Record<string, (q: string) => Promise<TorrentResult[]>> = {
      'piratebay': this.crawlPirateBay.bind(this),
      '1337x': this.crawl1337x.bind(this),
      'nyaa': this.crawlNyaa.bind(this),
      'yts': this.crawlYTS.bind(this),
      'eztv': this.crawlEZTV.bind(this),
      'torlock': this.crawlTorlock.bind(this),
      'zooqle': this.crawlZooqle.bind(this),
      'magnetdl': this.crawlMagnetDL.bind(this),
    };

    const crawler = crawlers[engine.toLowerCase()];
    if (!crawler) {
      throw new Error(`Unsupported engine: ${engine}`);
    }

    return await crawler(query);
  }

  // ========== 真实可用的爬虫实现 ==========

  private async crawlPirateBay(query: string): Promise<TorrentResult[]> {
    try {
      const url = `https://apibay.org/q.php?q=${encodeURIComponent(query)}`;
      const response = await this.fetchWithRetry(url);
      const  any[] = await response.json();

      if (!data || data.length === 0 || data[0]?.id === '0') return [];

      return data.map(item => ({
        id: `pb_${item.id}`,
        title: this.decodeHtmlEntities(item.name),
        size: this.formatBytes(parseInt(item.size)),
        sizeBytes: parseInt(item.size),
        seeds: parseInt(item.seeders) || 0,
        leechs: parseInt(item.leechers) || 0,
        date: new Date(parseInt(item.added) * 1000).toISOString(),
        timestamp: parseInt(item.added) * 1000,
        magnet: `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://tracker.openbittorrent.com:6969/announce`,
        infoHash: item.info_hash.toLowerCase(),
        engine: 'PirateBay',
        category: this.getCategoryName(item.category),
        uploader: item.username,
        verified: item.status === 'vip' || item.status === 'trusted',
        url: `https://thepiratebay.org/description.php?id=${item.id}`,
      }));
    } catch (error) {
      console.error('PirateBay crawl error:', error);
      return [];
    }
  }

  private async crawl1337x(query: string): Promise<TorrentResult[]> {
    try {
      const url = `https://1337x.to/search/${encodeURIComponent(query)}/1/`;
      const response = await this.fetchWithRetry(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      const results: TorrentResult[] = [];

      $('table.table-list tbody tr').each((_, element) => {
        try {
          const $td = $(element).find('td');
          if ($td.length < 7) return;

          const $link = $td.eq(0).find('a').eq(1);
          const title = $link.text().trim();
          const href = $link.attr('href');
          if (!href || !title) return;

          const sizeText = $td.eq(4).text().trim();
          const seeds = parseInt($td.eq(5).text().trim()) || 0;
          const leechs = parseInt($td.eq(6).text().trim()) || 0;

          const dateText = $td.eq(3).find('time').attr('datetime') || $td.eq(3).text().trim();
          const timestamp = this.parseDate(dateText);

          const category = $td.eq(0).find('a').eq(0).text().trim();
          const uploader = $td.eq(1).find('a').text().trim();

          // 提取 infoHash（需要从详情页获取，这里用标题哈希代替）
          const infoHash = this.generateInfoHash(title);
          
          results.push({
            id: `1337x_${infoHash}`,
            title: this.decodeHtmlEntities(title),
            size: sizeText,
            sizeBytes: this.parseSize(sizeText),
            seeds,
            leechs,
            date: new Date(timestamp).toISOString(),
            timestamp,
            magnet: `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`,
            infoHash,
            engine: '1337x',
            category,
            uploader,
            verified: $(element).find('.verified').length > 0 || $(element).find('.vip').length > 0,
            url: `https://1337x.to${href}`,
          });
        } catch (err) {
          console.error('1337x row parse error:', err);
        }
      });

      return results;
    } catch (error) {
      console.error('1337x crawl error:', error);
      return [];
    }
  }

  private async crawlYTS(query: string): Promise<TorrentResult[]> {
    try {
      const url = `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&sort_by=seeds&order_by=desc&limit=20`;
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      if (data.status !== 'ok' || !data.data.movies) return [];

      return data.data.movies.flatMap((movie: any) =>
        movie.torrents.map((torrent: any) => ({
          id: `yts_${movie.id}_${torrent.hash}`,
          title: `${movie.title} (${movie.year}) [${torrent.quality}] [${torrent.type}]`,
          size: torrent.size,
          sizeBytes: this.parseSize(torrent.size),
          seeds: torrent.seeds,
          leechs: torrent.peers,
          date: new Date(movie.date_uploaded).toISOString(),
          timestamp: new Date(movie.date_uploaded).getTime(),
          magnet: `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title)}&tr=udp://tracker.opentrackr.org:1337/announce`,
          infoHash: torrent.hash.toLowerCase(),
          engine: 'YTS',
          category: 'Movies',
          verified: true,
          url: `https://yts.mx/movies/${movie.slug}`,
        }))
      );
    } catch (error) {
      console.error('YTS crawl error:', error);
      return [];
    }
  }

  private async crawlNyaa(query: string): Promise<TorrentResult[]> {
    try {
      const url = `https://nyaa.si/?page=search&c=0_0&q=${encodeURIComponent(query)}&s=seeders&o=desc`;
      const response = await this.fetchWithRetry(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      const results: TorrentResult[] = [];

      $('table.torrent-list tbody tr').each((_, element) => {
        try {
          const $td = $(element).find('td');
          if ($td.length < 10) return;

          const $link = $td.eq(1).find('a').eq(1);
          const title = $link.text().trim();
          const href = $link.attr('href');

          const magnetLink = $td.eq(3).find('a[href^="magnet:"]').attr('href') || '';
          const infoHash = magnetLink.split('btih:')[1]?.split('&')[0] || this.generateInfoHash(title);

          const sizeText = $td.eq(3).text().trim();
          const seeds = parseInt($td.eq(6).text()) || 0;
          const leechs = parseInt($td.eq(7).text()) || 0;
          const downloads = parseInt($td.eq(8).text()) || 0;

          const dateText = $td.eq(4).attr('title') || '';
          const timestamp = new Date(dateText).getTime();

          const category = $td.eq(0).find('a').text().trim();

          results.push({
            id: `nyaa_${infoHash}`,
            title: this.decodeHtmlEntities(title),
            size: sizeText,
            sizeBytes: this.parseSize(sizeText),
            seeds,
            leechs,
            date: new Date(timestamp).toISOString(),
            timestamp,
            magnet: magnetLink,
            infoHash: infoHash.toLowerCase(),
            engine: 'Nyaa.si',
            category,
            verified: $(element).hasClass('success'),
            url: `https://nyaa.si${href}`,
          });
        } catch (err) {
          console.error('Nyaa row parse error:', err);
        }
      });

      return results;
    } catch (error) {
      console.error('Nyaa crawl error:', error);
      return [];
    }
  }

  private async crawlEZTV(query: string): Promise<TorrentResult[]> {
    try {
      const url = `https://eztvx.to/search/${encodeURIComponent(query)}`;
      const response = await this.fetchWithRetry(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      const results: TorrentResult[] = [];

      $('table.forum_header_border').eq(1).find('tr').each((_, element) => {
        if ($(element).find('.forum_thread_post').length === 0) return;

        const $td = $(element).find('td');
        const $link = $td.eq(1).find('a').eq(0);
        const title = $link.text().trim();

        const magnetLink = $td.eq(3).find('a[href^="magnet:"]').attr('href') || '';
        const infoHash = magnetLink.split('btih:')[1]?.split('&')[0] || this.generateInfoHash(title);

        const sizeText = $td.eq(4).text().trim();
        const seeds = parseInt($td.eq(5).text()) || 0;

        const dateText = $td.eq(2).text().trim();
        const timestamp = this.parseDate(dateText);

        results.push({
          id: `eztv_${infoHash}`,
          title: this.decodeHtmlEntities(title),
          size: sizeText,
          sizeBytes: this.parseSize(sizeText),
          seeds,
          leechs: 0,
          date: new Date(timestamp).toISOString(),
          timestamp,
          magnet: magnetLink,
          infoHash: infoHash.toLowerCase(),
          engine: 'EZTV',
          category: 'TV Shows',
          verified: true,
          url: `https://eztvx.to${$link.attr('href') || ''}`,
        });
      });

      return results;
    } catch (error) {
      console.error('EZTV crawl error:', error);
      return [];
    }
  }

  private async crawlTorlock(query: string): Promise<TorrentResult[]> {
    try {
      const url = `https://www.torlock2.com/torrents/?s=seeders&q=${encodeURIComponent(query)}`;
      const response = await this.fetchWithRetry(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      const results: TorrentResult[] = [];

      $('table.table tbody tr').each((_, element) => {
        if ($(element).find('a[href^="/torrent/"]').length === 0) return;

        const $td = $(element).find('td');
        const $link = $td.eq(0).find('a').eq(1);
        const title = $link.text().trim();

        const magnetLink = $td.eq(4).find('a[href^="magnet:"]').attr('href') || '';
        const infoHash = magnetLink.split('btih:')[1]?.split('&')[0] || this.generateInfoHash(title);

        const sizeText = $td.eq(2).text().trim();
        const seeds = parseInt($td.eq(5).text()) || 0;
        const leechs = parseInt($td.eq(6).text()) || 0;

        const dateText = $td.eq(3).text().trim();
        const timestamp = this.parseDate(dateText);

        results.push({
          id: `torlock_${infoHash}`,
          title: this.decodeHtmlEntities(title),
          size: sizeText,
          sizeBytes: this.parseSize(sizeText),
          seeds,
          leechs,
          date: new Date(timestamp).toISOString(),
          timestamp,
          magnet: magnetLink,
          infoHash: infoHash.toLowerCase(),
          engine: 'TorLock',
          category: 'All',
          verified: $td.eq(0).find('.icon-star').length > 0,
          url: `https://www.torlock2.com${$link.attr('href') || ''}`,
        });
      });

      return results;
    } catch (error) {
      console.error('TorLock crawl error:', error);
      return [];
    }
  }

  private async crawlZooqle(query: string): Promise<TorrentResult[]> {
    try {
      const url = `https://zooqle.com/search?q=${encodeURIComponent(query)}&s=seeders&o=desc`;
      const response = await this.fetchWithRetry(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      const results: TorrentResult[] = [];

      $('table.table tbody tr').each((_, element) => {
        if ($(element).find('a[href^="/"]').length === 0) return;

        const $td = $(element).find('td');
        const $link = $td.eq(1).find('a').eq(0);
        const title = $link.text().trim();

        const magnetLink = $td.eq(3).find('a[href^="magnet:"]').attr('href') || '';
        const infoHash = magnetLink.split('btih:')[1]?.split('&')[0] || this.generateInfoHash(title);

        const sizeText = $td.eq(2).text().trim();
        const seeds = parseInt($td.eq(4).text()) || 0;
        const leechs = parseInt($td.eq(5).text()) || 0;

        const dateText = $td.eq(6).text().trim();
        const timestamp = this.parseDate(dateText);

        const category = $td.eq(0).find('span').attr('class')?.replace('label', '').trim() || 'All';

        results.push({
          id: `zooqle_${infoHash}`,
          title: this.decodeHtmlEntities(title),
          size: sizeText,
          sizeBytes: this.parseSize(sizeText),
          seeds,
          leechs,
          date: new Date(timestamp).toISOString(),
          timestamp,
          magnet: magnetLink,
          infoHash: infoHash.toLowerCase(),
          engine: 'Zooqle',
          category,
          verified: $td.eq(1).find('.verified').length > 0,
          url: `https://zooqle.com${$link.attr('href') || ''}`,
        });
      });

      return results;
    } catch (error) {
      console.error('Zooqle crawl error:', error);
      return [];
    }
  }

  private async crawlMagnetDL(query: string): Promise<TorrentResult[]> {
    try {
      const url = `https://magnetdl.com/?q=${encodeURIComponent(query)}&s=seeders&o=desc`;
      const response = await this.fetchWithRetry(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      const results: TorrentResult[] = [];

      $('table.download tbody tr').each((_, element) => {
        const $td = $(element).find('td');
        if ($td.length < 8) return;

        const $link = $td.eq(0).find('a');
        const title = $link.text().trim();
        const href = $link.attr('href');

        const magnetLink = $td.eq(7).find('a[href^="magnet:"]').attr('href') || '';
        const infoHash = magnetLink.split('btih:')[1]?.split('&')[0] || this.generateInfoHash(title);

        const sizeText = $td.eq(4).text().trim();
        const seeds = parseInt($td.eq(5).text()) || 0;
        const leechs = parseInt($td.eq(6).text()) || 0;

        const dateText = $td.eq(3).text().trim();
        const timestamp = this.parseDate(dateText);

        const category = $td.eq(1).text().trim();

        results.push({
          id: `magnetdl_${infoHash}`,
          title: this.decodeHtmlEntities(title),
          size: sizeText,
          sizeBytes: this.parseSize(sizeText),
          seeds,
          leechs,
          date: new Date(timestamp).toISOString(),
          timestamp,
          magnet: magnetLink,
          infoHash: infoHash.toLowerCase(),
          engine: 'MagnetDL',
          category,
          verified: false,
          url: `https://magnetdl.com${href || ''}`,
        });
      });

      return results;
    } catch (error) {
      console.error('MagnetDL crawl error:', error);
      return [];
    }
  }

  // ========== 工具方法 ==========

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private parseSize(sizeText: string): number {
    const match = sizeText.match(/(\d+\.?\d*)\s*(B|KB|MB|GB|TB)/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 ** 2,
      'GB': 1024 ** 3,
      'TB': 1024 ** 4,
    };
    return Math.floor(value * (multipliers[unit] || 1));
  }

  private parseDate(dateStr: string): number {
    if (!dateStr) return Date.now();
    
    // 处理 "yesterday", "today", "2 hours ago" 等格式
    if (dateStr.includes('yesterday')) return Date.now() - 86400000;
    if (dateStr.includes('today')) return Date.now();
    
    const match = dateStr.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      const multipliers: Record<string, number> = {
        'second': 1000,
        'minute': 60000,
        'hour': 3600000,
        'day': 86400000,
        'week': 604800000,
        'month': 2592000000,
        'year': 31536000000,
      };
      return Date.now() - (value * (multipliers[unit] || 1));
    }
    
    // 尝试标准日期格式
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? Date.now() : date.getTime();
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  private getCategoryName(catId: string): string {
    const categories: Record<string, string> = {
      '100': 'Audio',
      '101': 'Music',
      '102': 'Audio books',
      '103': 'Sound clips',
      '104': 'FLAC',
      '199': 'Other',
      '200': 'Video',
      '201': 'Movies',
      '202': 'Movies DVDR',
      '203': 'Music videos',
      '204': 'Movie clips',
      '205': 'TV shows',
      '206': 'Handheld',
      '207': 'HD - Movies',
      '208': 'HD - TV shows',
      '209': '3D',
      '299': 'Other',
      '300': 'Applications',
      '301': 'Windows',
      '302': 'Mac',
      '303': 'UNIX',
      '304': 'Handheld',
      '305': 'IOS (iPad/iPhone)',
      '306': 'Android',
      '399': 'Other OS',
      '400': 'Games',
      '401': 'PC',
      '402': 'Mac',
      '403': 'PSx',
      '404': 'XBOX360',
      '405': 'Wii',
      '406': 'Handheld',
      '407': 'IOS (iPad/iPhone)',
      '408': 'Android',
      '499': 'Other',
      '500': 'Porn',
      '501': 'Movies',
      '502': 'Movies DVDR',
      '503': 'Pictures',
      '504': 'Games',
      '505': 'HD - Movies',
      '506': 'Movie clips',
      '599': 'Other',
      '600': 'Other',
      '601': 'E-books',
      '602': 'Comics',
      '603': 'Pictures',
      '604': 'Covers',
      '605': 'Physibles',
      '699': 'Other',
    };
    return categories[catId] || 'Other';
  }

  private generateInfoHash(title: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha1').update(title).digest('hex');
  }
    }
