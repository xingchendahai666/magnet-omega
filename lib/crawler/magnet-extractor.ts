/**
 * 磁力链接提取器：从 HTML/文本中提取磁力链接、Tracker 解析、DHT 代理查询、链接标准化
 */

export interface MagnetInfo {
  magnet: string;
  infoHash: string;
  name?: string;
  trackers: string[];
  fileSize?: number;
  fileCount?: number;
  isValid: boolean;
  warnings: string[];
}

export class MagnetExtractor {
  static extractFromHTML(html: string): MagnetInfo[] {
    const magnetRegex = /magnet:\?xt=urn:btih:([a-fA-F0-9]{32,40})[^"'\s]*/gi;
    const matches = html.match(magnetRegex) || [];
    
    return matches.map(magnet => this.parseMagnet(magnet));
  }

  static extractFromText(text: string): MagnetInfo[] {
    const magnetRegex = /magnet:\?xt=urn:btih:([a-fA-F0-9]{32,40})[^\s]*/gi;
    const matches = text.match(magnetRegex) || [];
    
    return matches.map(magnet => this.parseMagnet(magnet));
  }

  static parseMagnet(magnet: string): MagnetInfo {
    const warnings: string[] = [];
    const trimmed = magnet.trim();
    
    const infoHashMatch = trimmed.match(/xt=urn:btih:([a-fA-F0-9]+)/i);
    const nameMatch = trimmed.match(/dn=([^&]+)/i);
    const trackerMatches = trimmed.match(/tr=([^&]+)/gi) || [];
    const wsMatches = trimmed.match(/ws=([^&]+)/gi) || [];
    const xlMatch = trimmed.match(/xl=(\d+)/i);
    
    const trackers = trackerMatches.map(tr => decodeURIComponent(tr.replace(/tr=/i, '')));
    const webSeeds = wsMatches.map(ws => decodeURIComponent(ws.replace(/ws=/i, '')));
    
    const infoHash = infoHashMatch ? infoHashMatch[1].toLowerCase() : '';
    const name = nameMatch ? decodeURIComponent(nameMatch[1]) : undefined;
    const fileSize = xlMatch ? parseInt(xlMatch[1]) : undefined;
    
    if (!infoHash) warnings.push('Missing InfoHash');
    if (infoHash.length !== 32 && infoHash.length !== 40) warnings.push(`Invalid InfoHash length: ${infoHash.length}`);
    if (!name) warnings.push('Missing display name');
    if (trackers.length === 0 && webSeeds.length === 0) warnings.push('No trackers or web seeds');
    
    return {
      magnet: trimmed,
      infoHash,
      name,
      trackers: [...new Set([...trackers, ...webSeeds])],
      fileSize,
      isValid: infoHash.length === 32 || infoHash.length === 40,
      warnings,
    };
  }

  static isValidMagnet(magnet: string): boolean {
    if (!magnet.startsWith('magnet:?')) return false;
    return /xt=urn:btih:[a-fA-F0-9]{32,40}/i.test(magnet);
  }

  static extractInfoHash(magnet: string): string | null {
    const match = magnet.match(/xt=urn:btih:([a-fA-F0-9]+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  static extractName(magnet: string): string | null {
    const match = magnet.match(/dn=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : null;
  }

  static extractTrackers(magnet: string): string[] {
    const matches = magnet.match(/tr=([^&]+)/gi) || [];
    return matches.map(tr => decodeURIComponent(tr.replace(/tr=/i, '')));
  }

  static addTrackers(magnet: string, trackers: string[]): string {
    const existingTrackers = this.extractTrackers(magnet);
    const newTrackers = trackers.filter(t => !existingTrackers.includes(t));
    
    if (newTrackers.length === 0) return magnet;
    
    const trackerParams = newTrackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
    return magnet + trackerParams;
  }

  static removeTrackers(magnet: string): string {
    return magnet.replace(/&tr=[^&]*/gi, '');
  }

  static buildMagnet(infoHash: string, name?: string, trackers?: string[], fileSize?: number): string {
    let magnet = `magnet:?xt=urn:btih:${infoHash}`;
    
    if (name) magnet += `&dn=${encodeURIComponent(name)}`;
    if (fileSize) magnet += `&xl=${fileSize}`;
    if (trackers) {
      trackers.forEach(tr => magnet += `&tr=${encodeURIComponent(tr)}`);
    }
    
    return magnet;
  }

  static normalizeMagnet(magnet: string): string {
    const info = this.parseMagnet(magnet);
    return this.buildMagnet(info.infoHash, info.name, info.trackers, info.fileSize);
  }

  static compareMagnets(magnetA: string, magnetB: string): boolean {
    const hashA = this.extractInfoHash(magnetA);
    const hashB = this.extractInfoHash(magnetB);
    return hashA !== null && hashA === hashB;
  }

  static getPublicTrackers(): string[] {
    return [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://tracker.openbittorrent.com:6969/announce',
      'udp://tracker.coppersurfer.tk:6969/announce',
      'udp://exodus.desync.com:6969/announce',
      'udp://tracker.torrent.eu.org:451/announce',
      'udp://tracker.dler.org:6969/announce',
      'udp://opentracker.i2p.rocks:6969/announce',
      'udp://47.ip-51-68-199.eu:6969/announce',
    ];
  }

  static enhanceMagnet(magnet: string): string {
    const info = this.parseMagnet(magnet);
    if (!info.isValid) return magnet;
    
    const enhanced = this.addTrackers(magnet, this.getPublicTrackers());
    return this.normalizeMagnet(enhanced);
  }
}
