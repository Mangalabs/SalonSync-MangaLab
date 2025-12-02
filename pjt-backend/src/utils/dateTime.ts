import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

export const SYSTEM_TIMEZONE = 'America/Sao_Paulo'

export class DateTime {
  static now(): dayjs.Dayjs {
    return dayjs().tz(SYSTEM_TIMEZONE)
  }

  static fromDate(date: string): dayjs.Dayjs {
    return dayjs(date).tz(SYSTEM_TIMEZONE)
  }

  static fromDateTime(date: string, time: string): dayjs.Dayjs {
    return dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm').tz(SYSTEM_TIMEZONE)
  }

  static fromJSDate(date: Date): dayjs.Dayjs {
    return dayjs(date).tz(SYSTEM_TIMEZONE)
  }

  static fromISO(isoString: string): dayjs.Dayjs {
    return dayjs.utc(isoString).tz(SYSTEM_TIMEZONE)
  }

  static fromISOToLocalDate(isoString: string): Date {
    return new Date(isoString)
  }

  static formatDate(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format('DD/MM/YYYY')
  }

  static formatTime(time: string | Date | dayjs.Dayjs): string {
    return dayjs(time).format('HH:mm')
  }

  static formatDateTime(dateTime: string | Date | dayjs.Dayjs): string {
    return dayjs(dateTime).format('DD/MM/YYYY HH:mm')
  }

  static formatForInput(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format('YYYY-MM-DD')
  }

  static formatTimeForInput(time: string | Date | dayjs.Dayjs): string {
    return dayjs(time).format('HH:mm')
  }

  static toDBFormat(dateTime: string | Date | dayjs.Dayjs): string {
    return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
  }

  static toDate(dateTime: string | Date | dayjs.Dayjs): Date {
    // Tratar como horário já no Brasil
    if (typeof dateTime === 'string') {
      return dayjs(dateTime).tz(SYSTEM_TIMEZONE).toDate()
    }
    return dayjs(dateTime).toDate()
  }

  static dateTimeToDate(date: string, time: string): Date {
    return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', SYSTEM_TIMEZONE).toDate()
  }

  static toISOString(dateTime: string | Date | dayjs.Dayjs): string {
    if (typeof dateTime === 'string' && dateTime.includes(' ')) {
      return dayjs.tz(dateTime, 'YYYY-MM-DD HH:mm', SYSTEM_TIMEZONE).utc().toISOString()
    }
    return dayjs(dateTime).tz(SYSTEM_TIMEZONE).utc().toISOString()
  }

  static isValid(date: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date).isValid()
  }

  static isPast(date: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date).isBefore(this.now())
  }

  static isFuture(date: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date).isAfter(this.now())
  }

  static isToday(date: string | Date | dayjs.Dayjs): boolean {
    return dayjs(date).isSame(this.now(), 'day')
  }

  static isSameDay(
    date1: string | Date | dayjs.Dayjs,
    date2: string | Date | dayjs.Dayjs,
  ): boolean {
    return dayjs(date1).isSame(dayjs(date2), 'day')
  }

  static add(
    date: string | Date | dayjs.Dayjs,
    amount: number,
    unit: dayjs.ManipulateType,
  ): dayjs.Dayjs {
    return dayjs(date).add(amount, unit)
  }

  static subtract(
    date: string | Date | dayjs.Dayjs,
    amount: number,
    unit: dayjs.ManipulateType,
  ): dayjs.Dayjs {
    return dayjs(date).subtract(amount, unit)
  }

  static diff(
    date1: string | Date | dayjs.Dayjs,
    date2: string | Date | dayjs.Dayjs,
    unit?: dayjs.QUnitType,
  ): number {
    return dayjs(date1).diff(dayjs(date2), unit)
  }

  static startOfDay(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    return dayjs(date).startOf('day')
  }

  static endOfDay(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    return dayjs(date).endOf('day')
  }

  static generateTimeSlots(
    startTime: string = '08:00',
    endTime: string = '18:00',
    interval: number = 30,
  ): string[] {
    const slots: string[] = []
    const start = dayjs(startTime, 'HH:mm')
    const end = dayjs(endTime, 'HH:mm')
    let current = start

    while (current.isBefore(end)) {
      const hour = current.hour()

      if (interval === 10 && hour >= 12 && hour < 14) {
        current = current.add(interval, 'minutes')
        continue
      }

      slots.push(current.format('HH:mm'))
      current = current.add(interval, 'minutes')
    }

    return slots
  }

  static calculateServicesDuration(
    services: Array<{ duration: number }>,
  ): number {
    return services.reduce(
      (total, service) => total + (service.duration || 0),
      0,
    )
  }

  static hasTimeConflict(
    newStart: string | Date | dayjs.Dayjs,
    newDuration: number,
    existingAppointments: Array<{ scheduledDateTime: Date; duration: number }>,
  ): boolean {
    const newStartMoment = dayjs(newStart)
    const newEndMoment = newStartMoment.add(newDuration, 'minutes')

    return existingAppointments.some((appointment) => {
      const existingStart = dayjs(appointment.scheduledDateTime)
      const existingEnd = existingStart.add(appointment.duration, 'minutes')

      return (
        ((newStartMoment.isSame(existingStart) || newStartMoment.isAfter(existingStart)) &&
          newStartMoment.isBefore(existingEnd)) ||
        (newEndMoment.isAfter(existingStart) &&
          (newEndMoment.isSame(existingEnd) || newEndMoment.isBefore(existingEnd))) ||
        ((newStartMoment.isSame(existingStart) || newStartMoment.isBefore(existingStart)) &&
          (newEndMoment.isSame(existingEnd) || newEndMoment.isAfter(existingEnd)))
      )
    })
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
    )

    return allSlots.filter((time) => {
      const testDateTime = this.dateTimeToDate(date, time)
      return !this.hasTimeConflict(
        testDateTime,
        duration,
        existingAppointments,
      )
    })
  }

  static createDateFilter(date: string | Date | dayjs.Dayjs): {
    start: Date;
    end: Date;
  } {
    const targetDate = dayjs(date).tz(SYSTEM_TIMEZONE)
    return {
      start: this.startOfDay(targetDate).toDate(),
      end: this.endOfDay(targetDate).toDate(),
    }
  }

  static createPeriodFilter(
    startDate: string | Date | dayjs.Dayjs,
    endDate: string | Date | dayjs.Dayjs,
  ): { start: Date; end: Date } {
    return {
      start: this.startOfDay(startDate).toDate(),
      end: this.endOfDay(endDate).toDate(),
    }
  }

  static formatForLog(
    dateTime: string | Date | dayjs.Dayjs = this.now(),
  ): string {
    return dayjs(dateTime).tz(SYSTEM_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
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
} = DateTime