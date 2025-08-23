// Analytics Reports API
// Handles report generation, export, and download functionality

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { analyticsEngine } from '@/lib/services/analytics-engine';
import { businessIntelligenceEngine } from '@/lib/services/business-intelligence';
import { churnPredictionModel } from '@/lib/services/churn-prediction';
import { ReportExportRequest, ExportJob } from '@/lib/types/analytics';

// Mock export job storage (in production, use Redis or database)
const exportJobs: Map<string, ExportJob> = new Map();

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('report_type');
    const jobId = searchParams.get('job_id');

    // If job_id is provided, return job status
    if (jobId) {
      const job = exportJobs.get(jobId);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json(job);
    }

    // If report_type is provided, generate the report immediately (for small reports)
    if (reportType) {
      const startDate = searchParams.get('start_date') || 
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = searchParams.get('end_date') || new Date().toISOString();
      const advisorId = searchParams.get('advisor_id');

      switch (reportType) {
        case 'weekly_insights':
          if (!advisorId) {
            return NextResponse.json({ error: 'advisor_id is required for weekly insights' }, { status: 400 });
          }
          
          const insights = await analyticsEngine.generateWeeklyInsights(advisorId);
          if (insights.success) {
            return NextResponse.json({
              report_type: 'weekly_insights',
              data: insights.data,
              generated_at: insights.generated_at
            });
          }
          break;

        case 'advisor_summary':
          if (!advisorId) {
            return NextResponse.json({ error: 'advisor_id is required for advisor summary' }, { status: 400 });
          }
          
          const [metrics, churn] = await Promise.all([
            analyticsEngine.getAdvisorMetrics(advisorId, startDate, endDate),
            churnPredictionModel.predictAdvisorChurn(advisorId)
          ]);
          
          return NextResponse.json({
            report_type: 'advisor_summary',
            data: {
              metrics: metrics.success ? metrics.data : null,
              churn_prediction: churn.success ? churn.data : null
            },
            generated_at: new Date().toISOString()
          });

        case 'platform_overview':
          const businessIntel = await businessIntelligenceEngine.getBusinessDashboard(startDate, endDate);
          const platformChurn = await churnPredictionModel.getPlatformChurnAnalysis();
          
          return NextResponse.json({
            report_type: 'platform_overview',
            data: {
              business_intelligence: businessIntel.success ? businessIntel.data : null,
              churn_analysis: platformChurn
            },
            generated_at: new Date().toISOString()
          });

        default:
          return NextResponse.json({ error: 'Invalid report_type' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Either report_type or job_id is required' }, { status: 400 });
  } catch (error) {
    console.error('Error in analytics reports GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportRequest: ReportExportRequest = await request.json();
    
    // Validate request
    if (!exportRequest.report_type || !exportRequest.format) {
      return NextResponse.json(
        { error: 'report_type and format are required' },
        { status: 400 }
      );
    }

    // Create export job
    const jobId = Math.random().toString(36).substr(2, 12);
    const job: ExportJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString()
    };

    exportJobs.set(jobId, job);

    // Start export processing (async)
    processExportJob(jobId, exportRequest, userId);

    return NextResponse.json({
      success: true,
      job_id: jobId,
      estimated_completion: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // 3 minutes
      status_url: `/api/analytics/reports?job_id=${jobId}`
    });
  } catch (error) {
    console.error('Error in analytics reports POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Async export processing function
async function processExportJob(jobId: string, request: ReportExportRequest, userId: string) {
  try {
    const job = exportJobs.get(jobId);
    if (!job) return;

    // Update job status
    job.status = 'processing';
    job.progress = 10;
    exportJobs.set(jobId, job);

    // Generate report data based on type
    let reportData: any = null;
    
    switch (request.report_type) {
      case 'weekly_insights':
        if (request.advisor_ids && request.advisor_ids.length > 0) {
          const insights = await Promise.all(
            request.advisor_ids.map(id => analyticsEngine.generateWeeklyInsights(id))
          );
          reportData = {
            type: 'weekly_insights',
            insights: insights.filter(i => i.success).map(i => i.data)
          };
        }
        break;

      case 'churn_analysis':
        const churnAnalysis = await churnPredictionModel.getPlatformChurnAnalysis();
        reportData = {
          type: 'churn_analysis',
          analysis: churnAnalysis
        };
        break;

      case 'content_performance':
        const contentAnalytics = await analyticsEngine.getContentPerformanceAnalytics(
          request.date_range.start,
          request.date_range.end
        );
        reportData = {
          type: 'content_performance',
          analytics: contentAnalytics.success ? contentAnalytics.data : null
        };
        break;

      case 'business_intelligence':
        const businessIntel = await businessIntelligenceEngine.getBusinessDashboard(
          request.date_range.start,
          request.date_range.end
        );
        reportData = {
          type: 'business_intelligence',
          intelligence: businessIntel.success ? businessIntel.data : null
        };
        break;
    }

    job.progress = 60;
    exportJobs.set(jobId, job);

    // Generate export file based on format
    const exportResult = await generateExportFile(reportData, request.format, request.include_charts);
    
    job.progress = 90;
    exportJobs.set(jobId, job);

    // In production, upload to cloud storage and generate signed URL
    const downloadUrl = `/api/downloads/${jobId}.${request.format.toLowerCase()}`;
    
    // Complete the job
    job.status = 'completed';
    job.progress = 100;
    job.download_url = downloadUrl;
    job.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    exportJobs.set(jobId, job);

    console.log(`Export job ${jobId} completed for user ${userId}`);
  } catch (error) {
    console.error(`Error processing export job ${jobId}:`, error);
    
    const job = exportJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error_message = error instanceof Error ? error.message : 'Unknown error occurred';
      exportJobs.set(jobId, job);
    }
  }
}

async function generateExportFile(data: any, format: string, includeCharts: boolean): Promise<string> {
  // Mock export file generation
  // In production, this would generate actual PDF/Excel/CSV files
  
  switch (format.toLowerCase()) {
    case 'pdf':
      return await generatePDFReport(data, includeCharts);
    case 'excel':
      return await generateExcelReport(data, includeCharts);
    case 'csv':
      return await generateCSVReport(data);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

async function generatePDFReport(data: any, includeCharts: boolean): Promise<string> {
  // Mock PDF generation - would use libraries like Puppeteer or jsPDF
  console.log('Generating PDF report with charts:', includeCharts);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return 'pdf-report-content';
}

async function generateExcelReport(data: any, includeCharts: boolean): Promise<string> {
  // Mock Excel generation - would use libraries like exceljs
  console.log('Generating Excel report with charts:', includeCharts);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return 'excel-report-content';
}

async function generateCSVReport(data: any): Promise<string> {
  // Mock CSV generation - would convert data to CSV format
  console.log('Generating CSV report');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return 'csv-report-content';
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    // Remove export job
    const deleted = exportJobs.delete(jobId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Export job ${jobId} deleted` 
    });
  } catch (error) {
    console.error('Error deleting export job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}