import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor: 'green' | 'blue' | 'purple' | 'orange' | 'red'
}

const ICON_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
}

const CHANGE_COLORS: Record<string, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-orange-500',
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
}) => (
  <div className="relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-transform duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col justify-between">
    <div
      className={`absolute -top-4 right-4 w-14 h-14 rounded-xl flex items-center justify-center ${ICON_COLORS[iconColor]} shadow-lg`}
    >
      <Icon className="w-7 h-7" />
    </div>

    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <div className={`flex items-center gap-1 text-sm font-semibold ${CHANGE_COLORS[changeType]}`}>
        <span>{CHANGE_ICONS[changeType]}</span>
        <span>{change}</span>
      </div>
    </div>

    <div className="mt-4 text-xs text-gray-400 uppercase tracking-wide">
        Última atualização
    </div>
  </div>
)
