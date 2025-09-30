import * as React from 'react'

import { cn } from '@/lib/utils'

interface InputProps extends React.ComponentProps<'input'> {
  format?: 'phone'
  onRawChange?: (rawValue: string) => void
}

function Input({
  className,
  type,
  format,
  onChange,
  onRawChange,
  ...props
}: InputProps) {
  const [displayValue, setDisplayValue] = React.useState(props.value || '')

  const formatPhone = (value: string) => {
    const raw = value.replace(/\D/g, '').substring(0, 11)
    if (!raw) {return ''}

    if (raw.length <= 10) {
      return raw.replace(
        /^(\d{0,2})(\d{0,4})(\d{0,4}).*/,
        (m, p1, p2, p3) =>
          `${p1 ? `(${p1}` : ''}${p1.length === 2 ? ')' : ''}${
            p2 ? ` ${p2}` : ''
          }${p3 ? `-${p3}` : ''}`,
      )
    } else {
      return raw.replace(
        /^(\d{0,2})(\d{0,5})(\d{0,4}).*/,
        (m, p1, p2, p3) =>
          `${p1 ? `(${p1}` : ''}${p1.length === 2 ? ')' : ''}${
            p2 ? ` ${p2}` : ''
          }${p3 ? `-${p3}` : ''}`,
      )
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (format === 'phone') {
      const input = e.target
      const selectionStart = input.selectionStart ?? 0

      const digitsBeforeCursor = input.value
        .slice(0, selectionStart)
        .replace(/\D/g, '').length

      const raw = input.value.replace(/\D/g, '').substring(0, 11)
      const formatted = formatPhone(input.value)

      setDisplayValue(formatted)
      onRawChange?.(raw)
      onChange?.(e)

      requestAnimationFrame(() => {
        let pos = 0
        let digitsCount = 0
        while (pos < formatted.length && digitsCount < digitsBeforeCursor) {
          if (/\d/.test(formatted[pos])) {digitsCount++}
          pos++
        }
        input.setSelectionRange(pos, pos)
      })
    } else {
      onChange?.(e)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (format !== 'phone') {return}

    if (e.key === 'Backspace' || e.key === 'Delete') {
      const input = e.currentTarget
      const selectionStart = input.selectionStart ?? 0
      const selectionEnd = input.selectionEnd ?? 0

      if (selectionStart === selectionEnd) {
        let newPos = selectionStart

        if (e.key === 'Backspace' && newPos > 0) {
          while (newPos > 0 && /\D/.test(displayValue[newPos - 1])) {newPos--}
          if (newPos > 0) {newPos--}
        }

        if (e.key === 'Delete' && newPos < displayValue.length) {
          while (newPos < displayValue.length && /\D/.test(displayValue[newPos]))
          {newPos++}
        }

        const raw = displayValue.replace(/\D/g, '')
        const rawArray = raw.split('')
        const cursorDigits = displayValue
          .slice(0, newPos)
          .replace(/\D/g, '').length

        if (cursorDigits < rawArray.length) {rawArray.splice(cursorDigits, 1)}

        const newRaw = rawArray.join('')
        const newFormatted = formatPhone(newRaw)

        setDisplayValue(newFormatted)
        onRawChange?.(newRaw)

        requestAnimationFrame(() => {
          input.setSelectionRange(newPos, newPos)
        })

        e.preventDefault()
      }
    }
  }

  return (
    <input
      type={type}
      value={format === 'phone' ? displayValue : props.value}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      maxLength={format === 'phone' ? 15 : props.maxLength}
      placeholder={format === 'phone' ? '(00) 00000-0000' : props.placeholder}
    />
  )
}

export { Input }
