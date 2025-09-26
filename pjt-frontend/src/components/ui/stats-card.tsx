import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor: 'green' | 'blue' | 'purple' | 'orange' | 'red'
  cardStyle?: React.CSSProperties
}

const ICON_BG_COLORS: Record<string, string> = {
  green: 'var(--color-green-100, #DCFCE7)',
  blue: 'var(--color-blue-100, #DBEAFE)',
  purple: 'var(--color-purple-100, #E9D5FF)',
  orange: 'var(--color-orange-100, #FFEDD5)',
  red: 'var(--color-red-100, #FECACA)',
}

const ICON_TEXT_COLORS: Record<string, string> = {
  green: 'var(--color-green-600, #16A34A)',
  blue: 'var(--color-blue-600, #2563EB)',
  purple: 'var(--color-purple-600, #7C3AED)',
  orange: 'var(--color-orange-600, #D97706)',
  red: 'var(--color-red-600, #B91C1C)',
}

const CHANGE_COLORS: Record<string, string> = {
  positive: 'var(--color-green-500, #22C55E)',
  negative: 'var(--color-red-500, #EF4444)',
  neutral: 'var(--color-orange-500, #F97316)',
}

const CHANGE_ICONS: Record<string, string> = {
  positive: '↗',
  negative: '↘',
  neutral: '→',
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconColor,
  cardStyle,
}) => (
  <div
    className="relative rounded-2xl p-6 shadow-md hover:shadow-xl transition-transform duration-300 hover:-translate-y-1 border flex flex-col justify-between"
    style={{
      backgroundColor: 'var(--color-card)',
      borderColor: 'var(--color-border)',
      color: 'var(--color-card-foreground)',
      boxShadow: '0 2px 4px var(--color-shadow)',
      ...cardStyle,
    }}
  >
    <div
      className="absolute -top-4 right-4 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
      style={{
        backgroundColor: ICON_BG_COLORS[iconColor],
        color: ICON_TEXT_COLORS[iconColor],
      }}
    >
      <Icon className="w-7 h-7" />
    </div>

    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
      <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
      <div
        className="flex items-center gap-1 text-sm font-semibold"
        style={{ color: CHANGE_COLORS[changeType] }}
      >
        <span>{CHANGE_ICONS[changeType]}</span>
        <span>{change}</span>
      </div>
    </div>

    <div className="mt-4 text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
      Última atualização
    </div>
  </div>
)
