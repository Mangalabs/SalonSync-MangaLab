const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/pt-br');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('pt-br');

export const SYSTEM_TIMEZONE = 'America/Sao_Paulo';

export class DateTime {
  static now(): any {
    return dayjs().tz(SYSTEM_TIMEZONE);
  }

  static fromDate(date: string): any {
    return dayjs(date).tz(SYSTEM_TIMEZONE);
  }

  static fromDateTime(date: string, time: string): any {
    return dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm').tz(SYSTEM_TIMEZONE);
  }

  static fromJSDate(date: Date): any {
    return dayjs(date).tz(SYSTEM_TIMEZONE);
  }

  static fromISO(isoString: string): any {
    return dayjs.utc(isoString).tz(SYSTEM_TIMEZONE);
  }

  static fromISOToLocalDate(isoString: string): Date {
    return new Date(isoString);
  }

  static formatDate(date: string | Date | any): string {
    return dayjs(date).format('DD/MM/YYYY');
  }

  static formatTime(time: string | Date | any): string {
    return dayjs(time).format('HH:mm');
  }

  static formatDateTime(dateTime: string | Date | any): string {
    return dayjs(dateTime).format('DD/MM/YYYY HH:mm');
  }

  static formatForInput(date: string | Date | any): string {
    return dayjs(date).format('YYYY-MM-DD');
  }

  static formatTimeForInput(time: string | Date | any): string {
    return dayjs(time).format('HH:mm');
  }

  static toDBFormat(dateTime: string | Date | any): string {
    return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
  }

  static toDate(dateTime: string | Date | any): Date {
    // Tratar como horário já no Brasil
    if (typeof dateTime === 'string') {
      return dayjs(dateTime).tz(SYSTEM_TIMEZONE).toDate();
    }
    return dayjs(dateTime).toDate();
  }

  static dateTimeToDate(date: string, time: string): Date {
    return dayjs
      .tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', SYSTEM_TIMEZONE)
      .toDate();
  }

  static toISOString(dateTime: string | Date | any): string {
    if (typeof dateTime === 'string' && dateTime.includes(' ')) {
      return dayjs
        .tz(dateTime, 'YYYY-MM-DD HH:mm', SYSTEM_TIMEZONE)
        .utc()
        .toISOString();
    }
    return dayjs(dateTime).tz(SYSTEM_TIMEZONE).utc().toISOString();
  }

  static isValid(date: string | Date | any): boolean {
    return dayjs(date).isValid();
  }

  static isPast(date: string | Date | any): boolean {
    return dayjs(date).isBefore(this.now());
  }

  static isFuture(date: string | Date | any): boolean {
    return dayjs(date).isAfter(this.now());
  }

  static isToday(date: string | Date | any): boolean {
    return dayjs(date).isSame(this.now(), 'day');
  }

  static isSameDay(
    date1: string | Date | any,
    date2: string | Date | any,
  ): boolean {
    return dayjs(date1).isSame(dayjs(date2), 'day');
  }

  static add(
    date: string | Date | any,
    amount: number,
    unit: string,
  ): any {
    return dayjs(date).add(amount, unit);
  }

  static subtract(
    date: string | Date | any,
    amount: number,
    unit: string,
  ): any {
    return dayjs(date).subtract(amount, unit);
  }

  static diff(
    date1: string | Date | any,
    date2: string | Date | any,
    unit?: string,
  ): number {
    return dayjs(date1).diff(dayjs(date2), unit);
  }

  static startOfDay(date: string | Date | any): any {
    return dayjs(date).startOf('day');
  }

  static endOfDay(date: string | Date | any): any {
    return dayjs(date).endOf('day');
  }

  /**
   * Extrai o horário (HH:mm) de um Date no timezone do sistema
   */
  static extractTime(date: Date): string {
    return dayjs(date).tz(SYSTEM_TIMEZONE).format('HH:mm');
  }

  /**
   * Extrai a data (YYYY-MM-DD) de um Date no timezone do sistema
   */
  static extractDate(date: Date): string {
    return dayjs(date).tz(SYSTEM_TIMEZONE).format('YYYY-MM-DD');
  }

  /**
   * Retorna o dia da semana (0-6, onde 0 = Domingo) no timezone do sistema
   */
  static getDayOfWeek(date: string | Date): number {
    if (typeof date === 'string') {
      return dayjs.tz(date, 'YYYY-MM-DD', SYSTEM_TIMEZONE).day();
    }
    return dayjs(date).tz(SYSTEM_TIMEZONE).day();
  }

  /**
   * Cria Date para início do dia no timezone do sistema
   */
  static createStartOfDay(date: string): Date {
    return dayjs
      .tz(date, 'YYYY-MM-DD', SYSTEM_TIMEZONE)
      .startOf('day')
      .toDate();
  }

  /**
   * Cria Date para fim do dia no timezone do sistema
   */
  static createEndOfDay(date: string): Date {
    return dayjs.tz(date, 'YYYY-MM-DD', SYSTEM_TIMEZONE).endOf('day').toDate();
  }

  static generateTimeSlots(
    startTime: string = '08:00',
    endTime: string = '18:00',
    interval: number = 30,
  ): string[] {
    const slots: string[] = [];
    const start = dayjs(startTime, 'HH:mm');
    const end = dayjs(endTime, 'HH:mm');
    let current = start;

    while (current.isBefore(end)) {
      const hour = current.hour();

      if (interval === 10 && hour >= 12 && hour < 14) {
        current = current.add(interval, 'minutes');
        continue;
      }

      slots.push(current.format('HH:mm'));
      current = current.add(interval, 'minutes');
    }

    return slots;
  }

  static calculateServicesDuration(
    services: Array<{ duration: number }>,
  ): number {
    return services.reduce(
      (total, service) => total + (service.duration || 0),
      0,
    );
  }

  static hasTimeConflict(
    newStart: string | Date | any,
    newDuration: number,
    existingAppointments: Array<{ scheduledDateTime: Date; duration: number }>,
  ): boolean {
    const newStartMoment = dayjs(newStart);
    const newEndMoment = newStartMoment.add(newDuration, 'minutes');

    return existingAppointments.some((appointment) => {
      const existingStart = dayjs(appointment.scheduledDateTime);
      const existingEnd = existingStart.add(appointment.duration, 'minutes');

      return (
        ((newStartMoment.isSame(existingStart) ||
          newStartMoment.isAfter(existingStart)) &&
          newStartMoment.isBefore(existingEnd)) ||
        (newEndMoment.isAfter(existingStart) &&
          (newEndMoment.isSame(existingEnd) ||
            newEndMoment.isBefore(existingEnd))) ||
        ((newStartMoment.isSame(existingStart) ||
          newStartMoment.isBefore(existingStart)) &&
          (newEndMoment.isSame(existingEnd) ||
            newEndMoment.isAfter(existingEnd)))
      );
    });
  }

  static getAvailableTimeSlots(
    date: string,
    duration: number,
    existingAppointments: Array<{ scheduledDateTime: Date; duration: number }>,
    workingHours: { start: string; end: string } = {
      start: '08:00',
      end: '18:00',
    },
  ): string[] {
    const allSlots = this.generateTimeSlots(
      workingHours.start,
      workingHours.end,
      30,
    );

    return allSlots.filter((time) => {
      const testDateTime = this.dateTimeToDate(date, time);
      return !this.hasTimeConflict(
        testDateTime,
        duration,
        existingAppointments,
      );
    });
  }

  static createDateFilter(date: string | Date | any): {
    start: Date;
    end: Date;
  } {
    const targetDate = dayjs(date).tz(SYSTEM_TIMEZONE);
    return {
      start: this.startOfDay(targetDate).toDate(),
      end: this.endOfDay(targetDate).toDate(),
    };
  }

  static createPeriodFilter(
    startDate: string | Date | any,
    endDate: string | Date | any,
  ): { start: Date; end: Date } {
    return {
      start: this.startOfDay(startDate).toDate(),
      end: this.endOfDay(endDate).toDate(),
    };
  }

  static formatForLog(
    dateTime: string | Date | any = this.now(),
  ): string {
    return dayjs(dateTime).tz(SYSTEM_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
  }
}

export const {
  now,
  formatDate,
  formatTime,
  formatDateTime,
  formatForInput,
  formatTimeForInput,
  toDBFormat,
  toDate,
  isValid,
  isPast,
  isFuture,
  isToday,
  isSameDay,
} = DateTime;
