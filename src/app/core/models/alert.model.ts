export enum AlertType {
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  MACHINE_DOWN = 'machine_down',
  MACHINE_OFFLINE = 'machine_offline',
  MAINTENANCE_DUE = 'maintenance_due',
  ANOMALY_DETECTED = 'anomaly_detected'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface Alert {
  id: string;
  machineId: string;
  machineName: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface AlertThreshold {
  metric: string;
  label: string;
  unit: string;
  warningValue: number;
  criticalValue: number;
}
