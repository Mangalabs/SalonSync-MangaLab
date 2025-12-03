import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/pt-br'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)
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
    // Tratar como horário já no timezone do Brasil
    return dayjs(isoString).tz(SYSTEM_TIMEZONE)
  }

  static utc(): dayjs.Dayjs {
    // Pegar horário atual em UTC diretamente
    return dayjs.utc()
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

  static toISOString(dateTime: string | Date | dayjs.Dayjs): string {
    if (typeof dateTime === 'string' && dateTime.includes(' ')) {
      return dayjs.tz(dateTime, 'YYYY-MM-DD HH:mm', SYSTEM_TIMEZONE).utc().toISOString()
    }
    return dayjs(dateTime).tz(SYSTEM_TIMEZONE).utc().toISOString()
  }

  static dateTimeToISO(date: string, time: string): string {
    return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', SYSTEM_TIMEZONE).utc().toISOString()
  }

  static toDBFormat(dateTime: string | Date | dayjs.Dayjs): string {
    return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
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

  static add(
    date: string | Date | dayjs.Dayjs,
    amount: number,
    unit: dayjs.ManipulateType
  ): dayjs.Dayjs {
    return dayjs(date).add(amount, unit)
  }

  static subtract(
    date: string | Date | dayjs.Dayjs,
    amount: number,
    unit: dayjs.ManipulateType
  ): dayjs.Dayjs {
    return dayjs(date).subtract(amount, unit)
  }

  static diff(
    date1: string | Date | dayjs.Dayjs,
    date2: string | Date | dayjs.Dayjs,
    unit?: dayjs.QUnitType
  ): number {
    return dayjs(date1).diff(dayjs(date2), unit)
  }

  static generateTimeSlots(
    startTime: string = '08:00',
    endTime: string = '18:00',
    interval: number = 30
  ): string[] {
    const slots: string[] = []
    const start = dayjs(startTime, 'HH:mm')
    const end = dayjs(endTime, 'HH:mm')
    let current = start

    while (current.isBefore(end) || current.isSame(end)) {
      slots.push(current.format('HH:mm'))
      current = current.add(interval, 'minutes')
      
      // Evitar loop infinito
      if (slots.length > 200) break
    }

    return slots
  }

  static filterPastTimeSlots(date: string, timeSlots: string[]): string[] {
    const selectedDate = dayjs(date, 'YYYY-MM-DD')
    const now = this.now()

    if (!selectedDate.isSame(now, 'day')) {
      return timeSlots
    }

    return timeSlots.filter((time) => {
      const slotDateTime = dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm')
      return slotDateTime.isAfter(now)
    })
  }

  static calculateServicesDuration(
    services: Array<{ duration: number }>
  ): number {
    return services.reduce(
      (total, service) => total + (service.duration || 0),
      0
    )
  }

  static isTimeSlotOccupied(
    requestedTime: string,
    requestedDuration: number,
    occupiedSlots: Array<{ time: string; duration: number }>
  ): boolean {
    const requested = dayjs(requestedTime, 'HH:mm')
    const requestedEnd = requested.add(requestedDuration, 'minutes')

    return occupiedSlots.some((slot) => {
      const slotStart = dayjs(slot.time, 'HH:mm')
      const slotEnd = slotStart.add(slot.duration, 'minutes')

      return (
        ((requested.isSame(slotStart) || requested.isAfter(slotStart)) && requested.isBefore(slotEnd)) ||
        (requestedEnd.isAfter(slotStart) && (requestedEnd.isSame(slotEnd) || requestedEnd.isBefore(slotEnd))) ||
        ((requested.isSame(slotStart) || requested.isBefore(slotStart)) && (requestedEnd.isSame(slotEnd) || requestedEnd.isAfter(slotEnd)))
      )
    })
  }

  static fromNow(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).fromNow()
  }

  static calendar(date?: string | Date | dayjs.Dayjs): string {
    return dayjs(date).calendar()
  }

  static dayOfWeek(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format('dddd')
  }

  static monthName(date: string | Date | dayjs.Dayjs): string {
    return dayjs(date).format('MMMM')
  }

  static startOf(date: string | Date | dayjs.Dayjs, unit: dayjs.OpUnitType): dayjs.Dayjs {
    return dayjs(date).startOf(unit)
  }

  static endOf(date: string | Date | dayjs.Dayjs, unit: dayjs.OpUnitType): dayjs.Dayjs {
    return dayjs(date).endOf(unit)
  }
}

export const {
  now,
  formatDate,
  formatTime,
  formatDateTime,
  formatForInput,
  toISOString,
  isValid,
  isPast,
  isFuture,
  isToday,
} = DateTime