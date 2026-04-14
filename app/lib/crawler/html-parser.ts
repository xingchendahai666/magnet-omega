/**
 * HTML 解析器：Cheerio 封装、CSS 选择器提取、数据清洗、结构化数据解析
 * 提供安全、高效、类型安全的 DOM 操作接口
 */

import * as cheerio from 'cheerio';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings: string[];
  metrics: { elementsFound: number; elementsProcessed: number; timeMs: number };
}

export class HTMLParser {
  private $: cheerio.CheerioAPI;
  private warnings: string[] = [];
  private metrics = { elementsFound: 0, elementsProcessed: 0, startTime: Date.now() };

  constructor(html: string) {
    this.$ = cheerio.load(html, {
      xml: { decodeEntities: true },
      normalizeWhitespace: true,
    });
    this.metrics.startTime = Date.now();
  }

  select(selector: string): cheerio.Cheerio {
    const elements = this.$(selector);
    this.metrics.elementsFound += elements.length;
    return elements;
  }

  extractText(selector: string, fallback: string = ''): string {
    const element = this.$(selector);
    if (element.length === 0) {
      this.warnings.push(`Selector not found: ${selector}`);
      return fallback;
    }
    this.metrics.elementsProcessed++;
    return this.cleanText(element.text());
  }

  extractAttribute(selector: string, attribute: string, fallback: string = ''): string {
    const element = this.$(selector);
    if (element.length === 0) {
      this.warnings.push(`Selector not found: ${selector}`);
      return fallback;
    }
    this.metrics.elementsProcessed++;
    return element.attr(attribute) || fallback;
  }

  extractAll(selector: string): string[] {
    const results = this.$(selector).map((_, el) => this.cleanText(this.$(el).text())).get();
    this.metrics.elementsFound += results.length;
    this.metrics.elementsProcessed += results.length;
    return results;
  }

  extractLinks(selector: string): Array<{ text: string; href: string; absoluteHref?: string }> {
    const baseUrl = this.$('base').attr('href') || '';
    return this.$(selector).map((_, el) => {
      const $el = this.$(el);
      const href = $el.attr('href') || '';
      this.metrics.elementsProcessed++;
      return {
        text: this.cleanText($el.text()),
        href,
        absoluteHref: baseUrl ? new URL(href, baseUrl).href : undefined,
      };
    }).get();
  }

  extractTableRows(tableSelector: string, headerSelector: string = 'th', rowSelector: string = 'td'): Array<Record<string, string>> {
    const headers = this.$(`${tableSelector} ${headerSelector}`).map((_, el) => this.cleanText(this.$(el).text())).get();
    const rows = this.$(`${tableSelector} tbody tr, ${tableSelector} tr`);
    
    return rows.map((_, row) => {
      const $row = this.$(row);
      const rowData: Record<string, string> = {};
      let colIndex = 0;
      
      $row.find(rowSelector).each((_, cell) => {
        const key = headers[colIndex] || `column_${colIndex}`;
        rowData[key] = this.cleanText(this.$(cell).text());
        colIndex++;
        this.metrics.elementsProcessed++;
      });
      
      this.metrics.elementsFound++;
      return rowData;
    }).get();
  }

  cleanText(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#[0-9]+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getWarnings(): string[] {
    return [...this.warnings];
  }

  getMetrics(): typeof this.metrics & { timeMs: number } {
    return { ...this.metrics, timeMs: Date.now() - this.metrics.startTime };
  }

  getDocumentTitle(): string {
    return this.cleanText(this.$('title').text());
  }

  getMetaContent(name: string): string {
    return this.$(`meta[name="${name}"]`).attr('content') || '';
  }

  extractJSONLD(): any[] {
    const scripts = this.$('script[type="application/ld+json"]');
    const results: any[] = [];
    
    scripts.each((_, script) => {
      try {
        const content = this.$(script).html();
        if (content) {
          const parsed = JSON.parse(content);
          results.push(parsed);
          this.metrics.elementsProcessed++;
        }
      } catch (e) {
        this.warnings.push('Failed to parse JSON-LD');
      }
    });
    
    return results;
  }

  extractOpenGraph(): Record<string, string> {
    const og: Record<string, string> = {};
    this.$('meta[property^="og:"]').each((_, el) => {
      const $el = this.$(el);
      const property = $el.attr('property')?.replace('og:', '') || '';
      const content = $el.attr('content') || '';
      if (property && content) {
        og[property] = this.cleanText(content);
      }
    });
    return og;
  }

  extractCanonicalUrl(): string {
    return this.$('link[rel="canonical"]').attr('href') || '';
  }

  getHtmlStructure(): { tags: Record<string, number>; depth: number } {
    const tags: Record<string, number> = {};
    let maxDepth = 0;
    
    this.$('*').each((_, el) => {
      const tagName = this.$(el).prop('tagName')?.toLowerCase() || '';
      tags[tagName] = (tags[tagName] || 0) + 1;
      
      let depth = 0;
      let parent = this.$(el).parent();
      while (parent.length > 0 && parent.prop('tagName')?.toLowerCase() !== 'html') {
        depth++;
        parent = parent.parent();
      }
      maxDepth = Math.max(maxDepth, depth);
    });
    
    return { tags, depth: maxDepth };
  }
}

export function parseHTML(html: string): HTMLParser {
  return new HTMLParser(html);
}

export function extractMagnetLinksFromHTML(html: string): string[] {
  const parser = parseHTML(html);
  const links = parser.extractLinks('a[href^="magnet:"]');
  return links.map(l => l.href).filter(Boolean);
      }
