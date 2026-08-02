export enum ErrorType {
  EMERGENCY_STOP = 'emergency_stop',
  OVERHEATING = 'overheating',
  MECHANICAL_FAILURE = 'mechanical_failure',
  ELECTRICAL_FAULT = 'electrical_fault',
  SENSOR_FAILURE = 'sensor_failure',
  COMMUNICATION_LOST = 'communication_lost',
  SOFTWARE_ERROR = 'software_error'
}

export interface ErrorLogEntry {
  id: string;
  machineId: string;
  machineName: string;
  errorCode: string;
  errorType: ErrorType;
  description: string;
  timestamp: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  duration?: number;
  impact: string;
}
