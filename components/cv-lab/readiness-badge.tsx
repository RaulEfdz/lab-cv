'use client'

import { cn } from '@/lib/utils'
import { HelpCircle } from 'lucide-react'

interface ReadinessBadgeProps {
  score: number
  size?: 'sm' | 'md'
  onClick?: () => void
}

export function ReadinessBadge({
  score,
  size = 'md',
  onClick
}: ReadinessBadgeProps) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-600'
    if (s >= 60) return 'text-yellow-600'
    if (s >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getContainerStyle = (s: number) => {
    if (s >= 80) return 'bg-green-50 border-green-200 hover:bg-green-100'
    if (s >= 60) return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
    if (s >= 40) return 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    return 'bg-red-50 border-red-200 hover:bg-red-100'
  }

  const isSmall = size === 'sm'

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all',
        getContainerStyle(score),
        isSmall && 'px-2 py-1',
        onClick && 'cursor-pointer hover:scale-105 hover:shadow-md'
      )}
      title={onClick ? 'Clic para ver qué falta' : undefined}
    >
      {/* Circular progress with percentage */}
      <div className="relative">
        <svg className={cn(isSmall ? 'h-6 w-6' : 'h-7 w-7')} viewBox="0 0 24 24">
          <circle
            className="text-neutral-200"
            strokeWidth="3"
            stroke="currentColor"
            fill="transparent"
            r="10"
            cx="12"
            cy="12"
          />
          <circle
            className={cn('transition-all duration-500', getColor(score))}
            strokeWidth="3"
            strokeDasharray={`${score * 0.628} 100`}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="10"
            cx="12"
            cy="12"
            transform="rotate(-90 12 12)"
          />
        </svg>
        <span className={cn(
          'absolute inset-0 flex items-center justify-center font-bold',
          getColor(score),
          isSmall ? 'text-[9px]' : 'text-[10px]'
        )}>
          {score}
        </span>
      </div>

      {/* Show "¿Qué falta?" only when clickable and score < 100 */}
      {onClick && score < 100 && (
        <span className={cn(
          'flex items-center gap-1 font-medium whitespace-nowrap',
          getColor(score),
          isSmall ? 'text-xs' : 'text-sm'
        )}>
          <HelpCircle className={cn(isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          ¿Qué falta?
        </span>
      )}

      {/* Show "Listo" when score is 100 */}
      {score >= 100 && (
        <span className={cn(
          'font-medium whitespace-nowrap text-green-600',
          isSmall ? 'text-xs' : 'text-sm'
        )}>
          Listo
        </span>
      )}
    </div>
  )
}
