import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null): string {
  if (value === null) return 'A negociar'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatArea(value: number): string {
  return `${value.toLocaleString('pt-BR')} m²`
}

export function spaceTypeLabel(type: string): string {
  return type === 'terreno' ? 'Terreno' : 'Telhado'
}

export function spaceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Disponível',
    negotiating: 'Em negociação',
    rented: 'Locado',
  }
  return labels[status] ?? status
}

export function spaceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    negotiating: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    rented:      'bg-stone-100 text-stone-500',
  }
  return colors[status] ?? 'bg-stone-100 text-stone-500'
}

export function interestStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Aguardando resposta',
    accepted: 'Aceito',
    rejected: 'Recusado',
  }
  return labels[status] ?? status
}

export function roofTypeLabel(type: string | null): string {
  if (!type) return '—'
  const labels: Record<string, string> = {
    ceramica: 'Cerâmica',
    metalico: 'Metálico',
    laje: 'Laje',
    fibrocimento: 'Fibrocimento',
  }
  return labels[type] ?? type
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays === 1) return 'ontem'
  return `${diffDays} dias atrás`
}
