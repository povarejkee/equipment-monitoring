export enum MachineStatus {
  RUNNING = 'running',
  WARNING = 'warning',
  ERROR = 'error',
  IDLE = 'idle',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline'
}

export enum MachineType {
  CNC = 'cnc',
  LATHE = 'lathe',
  MILLING = 'milling',
  GRINDING = 'grinding',
  PRESS = 'press'
}

export interface MachineMetrics {
  temperature: number;
  load: number;
  output: number;
  uptime: number;
  powerConsumption: number;
  spindleSpeed?: number;
  vibration?: number;
}

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  location: string;
  status: MachineStatus;
  metrics: MachineMetrics;
  lastUpdated: Date;
  assignedOperator?: string;
}

export interface DowntimeEntry {
  id: string;
  machineId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  reason: string;
}

export interface MetricHistoryPoint {
  timestamp: Date;
  temperature: number;
  load: number;
  output: number;
  vibration: number;
  powerConsumption: number;
}
