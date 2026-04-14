import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  details?: string;
  timestamp: string;
}

async function checkMemory(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);
    
    const status = usagePercent > 85 ? 'degraded' : 'healthy';
    const details = `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`;
    
    return {
      name: 'memory',
      status,
      responseTime: Date.now() - start,
      details,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'memory',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'Check failed',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkCPU(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const cpus = require('os').cpus();
    const avgLoad = cpus.reduce((acc: number, cpu: any) => {
      const total = Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;
    
    const status = avgLoad > 80 ? 'degraded' : 'healthy';
    const details = `Average CPU Load: ${avgLoad.toFixed(1)}%`;
    
    return {
      name: 'cpu',
      status,
      responseTime: Date.now() - start,
      details,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'cpu',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'Check failed',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkDisk(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const fs = require('fs');
    const stat = fs.statSync('/tmp'); // Vercel 临时目录
    const details = `Temp directory accessible: ${stat.isDirectory()}`;
    
    return {
      name: 'disk',
      status: 'healthy',
      responseTime: Date.now() - start,
      details,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'disk',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'Check failed',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkExternalAPI(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://api.github.com/zen', {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    return {
      name: 'external_api',
      status: response.ok ? 'healthy' : 'degraded',
      responseTime: Date.now() - start,
      details: `Status: ${response.status} | ${response.ok ? 'Accessible' : 'Limited'}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'external_api',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'Connection failed',
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkEnvironment(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const envVars = ['PROXY_URL', 'NODE_ENV', 'VERCEL_ENV'];
    const missing = envVars.filter(v => !process.env[v]);
    
    return {
      name: 'environment',
      status: missing.length === 0 ? 'healthy' : 'degraded',
      responseTime: Date.now() - start,
      details: missing.length > 0 
        ? `Missing: ${missing.join(', ')}` 
        : 'All required env vars present',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'environment',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'Check failed',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function GET(request: NextRequest) {
  const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
  const component = request.nextUrl.searchParams.get('component');
  
  let checks: HealthCheck[] = [];
  
  if (component) {
    const checkMap: Record<string, () => Promise<HealthCheck>> = {
      memory: checkMemory,
      cpu: checkCPU,
      disk: checkDisk,
      external_api: checkExternalAPI,
      environment: checkEnvironment,
    };
    
    if (checkMap[component]) {
      checks = [await checkMap[component]()];
    } else {
      return NextResponse.json({ error: `Unknown component: ${component}` }, { status: 400 });
    }
  } else {
    checks = await Promise.all([
      checkMemory(),
      checkCPU(),
      checkDisk(),
      checkExternalAPI(),
      checkEnvironment(),
    ]);
  }

  const overallStatus = checks.some(c => c.status === 'unhealthy')
    ? 'unhealthy'
    : checks.some(c => c.status === 'degraded')
    ? 'degraded'
    : 'healthy';

  const response: any = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '2.0.0',
    checks,
  };

  if (detailed) {
    response.environment = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_REGION: process.env.VERCEL_REGION,
      },
    };
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
  
  return NextResponse.json(response, { status: statusCode });
      }
