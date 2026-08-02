import { Pipe, PipeTransform } from '@angular/core';
import { MachineStatus } from '../../core/models/machine.model';

const STATUS_LABELS: Record<MachineStatus, string> = {
  [MachineStatus.RUNNING]: 'Работает',
  [MachineStatus.WARNING]: 'Предупреждение',
  [MachineStatus.ERROR]: 'Ошибка',
  [MachineStatus.IDLE]: 'Простой',
  [MachineStatus.MAINTENANCE]: 'Обслуживание',
  [MachineStatus.OFFLINE]: 'Нет связи',
};

@Pipe({ name: 'machineStatus', standalone: true })
export class MachineStatusPipe implements PipeTransform {
  transform(value: MachineStatus | string): string {
    return STATUS_LABELS[value as MachineStatus] ?? value;
  }
}
