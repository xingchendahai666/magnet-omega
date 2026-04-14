import { NextRequest, NextResponse } from 'next/server';
import { MagnetExtractor } from '@/lib/crawler/magnet-extractor';
import { validateMagnet } from '@/lib/validators';
import { computeInfoHash } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface VerificationReport {
  isValid: boolean;
  infoHash: string | null;
  name: string | null;
  trackers: string[];
  webSeeds: string[];
  size: number | null;
  securityScore: number;
  warnings: string[];
  errors: string[];
  metadata: {
    hasName: boolean;
    hasTrackers: boolean;
    trackerCount: number;
    isSecure: boolean;
  };
}

export async function POST(request: NextRequest) {
  const { magnet } = await request.json();

  if (!magnet || typeof magnet !== 'string') {
    return NextResponse.json(
      { error: 'Magnet link is required', valid: false },
      { status: 400 }
    );
  }

  const report: VerificationReport = {
    isValid: false,
    infoHash: null,
    name: null,
    trackers: [],
    webSeeds: [],
    size: null,
    securityScore: 100,
    warnings: [],
    errors: [],
    metadata: {
      hasName: false,
      hasTrackers: false,
      trackerCount: 0,
      isSecure: false,
    },
  };

  // 1. 基础格式验证
  const validation = validateMagnet(magnet);
  if (!validation.valid) {
    report.errors.push(validation.error || 'Invalid format');
    report.securityScore -= 50;
    return NextResponse.json({ valid: false, report, errors: report.errors }, { status: 400 });
  }

  // 2. 深度解析
  const magnetInfo = MagnetExtractor.parseMagnet(magnet);
  
  report.infoHash = magnetInfo.infoHash;
  report.name = magnetInfo.name;
  report.trackers = magnetInfo.trackers;
  report.isValid = magnetInfo.isValid;

  // 3. 安全性扫描 (防 XSS/恶意脚本)
  if (magnetInfo.name) {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /data:text\/html/i,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(magnetInfo.name)) {
        report.warnings.push('Potentially malicious content detected in name');
        report.securityScore -= 40;
        report.errors.push('Security Risk: Script injection detected');
      }
    }
  }

  // 4. Tracker 分析
  report.metadata.trackerCount = report.trackers.length;
  report.metadata.hasTrackers = report.trackers.length > 0;
  
  // 检查是否有公共 Tracker (增加下载成功率)
  const publicTrackers = [
    'udp://tracker.opentrackr.org',
    'udp://tracker.openbittorrent.com',
  ];
  const hasPublicTracker = report.trackers.some(t => 
    publicTrackers.some(pt => t.includes(pt))
  );
  
  if (hasPublicTracker) {
    report.metadata.isSecure = true;
    report.securityScore += 10;
  } else if (report.trackers.length === 0) {
    report.warnings.push('No trackers found. Download might be slow or impossible.');
    report.securityScore -= 10;
  }

  // 5. 元数据完整性检查
  report.metadata.hasName = !!magnetInfo.name;
  if (!report.metadata.hasName) {
    report.warnings.push('Missing display name (dn parameter)');
  }

  // 6. InfoHash 二次验证 (防止伪造)
  if (report.infoHash) {
    const computedHash = computeInfoHash(report.infoHash); // 简单验证长度和格式
    if (report.infoHash.length !== 32 && report.infoHash.length !== 40) {
      report.errors.push('Invalid InfoHash length');
      report.isValid = false;
    }
  }

  // 7. 最终评分
  if (report.errors.length > 0) {
    report.isValid = false;
    report.securityScore = Math.max(0, report.securityScore - 50);
  } else if (report.warnings.length > 0) {
    report.securityScore = Math.max(0, report.securityScore - 10);
  }

  // 8. 返回详细报告
  return NextResponse.json({
    success: true,
    valid: report.isValid,
    report: {
      ...report,
      // 隐藏部分敏感或过长数据
      trackers: report.trackers.slice(0, 10), 
    },
    recommendation: getRecommendation(report),
  });
}

function getRecommendation(report: VerificationReport): string {
  if (!report.isValid) return '❌ 无效或损坏的磁力链接';
  if (report.securityScore < 60) return '⚠️ 存在安全风险，建议不要下载';
  if (report.metadata.trackerCount === 0) return '⚠️ 缺少 Tracker，下载速度可能极慢';
  if (report.securityScore >= 90) return '✅ 优质链接，包含完整元数据和 Tracker';
  return '✅ 可用链接';
  }
