'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchFiltersProps {
  currentFilters: {
    type?: string
    city?: string
    state?: string
    min_area?: string
    max_rent?: string
    orientation?: string
    status?: string
  }
}

export default function SearchFilters({ currentFilters }: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams()
      const current = { ...currentFilters, [key]: value }
      Object.entries(current).forEach(([k, v]) => {
        if (v) params.set(k, v)
      })
      router.push(`${pathname}?${params.toString()}`)
    },
    [currentFilters, router, pathname]
  )

  function clearFilters() {
    router.push(pathname)
  }

  const hasFilters = Object.values(currentFilters).some(Boolean)

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Status
        </Label>
        <Select
          value={currentFilters.status ?? 'available'}
          onValueChange={(v) => updateFilter('status', v)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Disponível</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="negotiating">Em negociação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Tipo
        </Label>
        <Select
          value={currentFilters.type ?? 'all'}
          onValueChange={(v) => updateFilter('type', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="terreno">Terreno</SelectItem>
            <SelectItem value="telhado">Telhado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Cidade
        </Label>
        <Input
          className="h-9 text-sm"
          placeholder="Ex: São Paulo"
          defaultValue={currentFilters.city}
          onBlur={(e) => updateFilter('city', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilter('city', (e.target as HTMLInputElement).value)
            }
          }}
        />
      </div>

      {/* State */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Estado
        </Label>
        <Input
          className="h-9 text-sm uppercase"
          placeholder="SP"
          maxLength={2}
          defaultValue={currentFilters.state}
          onBlur={(e) => updateFilter('state', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilter('state', (e.target as HTMLInputElement).value)
            }
          }}
        />
      </div>

      {/* Min area */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Área mínima (m²)
        </Label>
        <Input
          className="h-9 text-sm"
          type="number"
          placeholder="Ex: 200"
          defaultValue={currentFilters.min_area}
          onBlur={(e) => updateFilter('min_area', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilter('min_area', (e.target as HTMLInputElement).value)
            }
          }}
        />
      </div>

      {/* Max rent */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Valor máximo (R$/mês)
        </Label>
        <Input
          className="h-9 text-sm"
          type="number"
          placeholder="Ex: 2000"
          defaultValue={currentFilters.max_rent}
          onBlur={(e) => updateFilter('max_rent', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilter('max_rent', (e.target as HTMLInputElement).value)
            }
          }}
        />
      </div>

      {/* Orientation */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Orientação solar
        </Label>
        <Select
          value={currentFilters.orientation ?? ''}
          onValueChange={(v) => updateFilter('orientation', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Qualquer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer</SelectItem>
            <SelectItem value="Norte">Norte</SelectItem>
            <SelectItem value="Sul">Sul</SelectItem>
            <SelectItem value="Leste">Leste</SelectItem>
            <SelectItem value="Oeste">Oeste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full text-stone-500"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
