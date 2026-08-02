export interface ReportParams {
  dateFrom: Date;
  dateTo: Date;
  machineIds: string[];
  metrics: string[];
  groupBy: 'hour' | 'day' | 'week' | 'month';
}

export interface TimeSeriesPoint {
  timestamp: Date;
  output: number;
  uptime: number;
  avgTemperature: number;
  avgLoad: number;
  errorCount: number;
}

export interface MachineReportRow {
  machineId: string;
  machineName: string;
  totalOutput: number;
  uptimePercent: number;
  downtimeHours: number;
  errorCount: number;
  efficiency: number;
}

export interface ReportData {
  generatedAt: Date;
  params: ReportParams;
  summary: {
    totalOutput: number;
    avgUptime: number;
    totalDowntime: number;
    totalErrors: number;
    efficiency: number;
  };
  timeSeries: TimeSeriesPoint[];
  machineBreakdown: MachineReportRow[];
}
