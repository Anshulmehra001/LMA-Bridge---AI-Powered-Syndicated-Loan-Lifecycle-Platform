/**
 * Health Check API Endpoint
 * Enterprise-grade health monitoring for load balancers and monitoring systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { enterpriseConfig, validateEnterpriseConfig } from '@/config/enterprise';
import { enterpriseSecurity } from '@/lib/enterprise-security';
import { auditLogger } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic system checks
    const systemHealth = {
      server: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };
    
    // Configuration validation
    const configValidation = validateEnterpriseConfig();
    
    // API connectivity check
    const apiHealth = {
      geminiConfigured: !!enterpriseConfig.api.geminiApiKey,
      aiAnalysisEnabled: enterpriseConfig.features.enableAIAnalysis,
    };
    
    // Security status
    const securityMetrics = enterpriseSecurity.getSecurityMetrics();
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryHealth = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    };
    
    // Determine overall health status
    let overallStatus = 'healthy';
    const issues: string[] = [];
    
    if (!configValidation.isValid) {
      overallStatus = 'degraded';
      issues.push(...configValidation.errors);
    }
    
    if (memoryHealth.rss > 1024) { // More than 1GB
      overallStatus = 'warning';
      issues.push('High memory usage detected');
    }
    
    if (securityMetrics.averageRiskScore > 50) {
      overallStatus = 'warning';
      issues.push('Elevated security risk score');
    }
    
    const responseTime = Date.now() - startTime;
    
    const healthReport = {
      status: overallStatus,
      responseTime,
      system: systemHealth,
      configuration: {
        valid: configValidation.isValid,
        errors: configValidation.errors,
      },
      api: apiHealth,
      security: {
        encryptionEnabled: securityMetrics.encryptionEnabled,
        auditingEnabled: securityMetrics.auditingEnabled,
        activeSessions: securityMetrics.activeSessions,
        riskScore: securityMetrics.averageRiskScore,
      },
      performance: {
        memory: memoryHealth,
        responseTime,
      },
      issues,
    };
    
    // Log health check (minimal logging to avoid spam)
    if (overallStatus !== 'healthy') {
      await auditLogger.log({
        action: 'API_ACCESS' as any,
        resource: 'health_check',
        details: {
          status: overallStatus,
          issues,
          responseTime,
        },
        success: true,
        riskLevel: overallStatus === 'degraded' ? 'HIGH' : 'MEDIUM',
      });
    }
    
    // Return appropriate HTTP status
    const httpStatus = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'warning' ? 200 :
                      overallStatus === 'degraded' ? 503 : 500;
    
    return NextResponse.json(healthReport, { status: httpStatus });
    
  } catch (error) {
    const errorReport = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    };
    
    return NextResponse.json(errorReport, { status: 500 });
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    const configValidation = validateEnterpriseConfig();
    const status = configValidation.isValid ? 200 : 503;
    
    return new NextResponse(null, { status });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}