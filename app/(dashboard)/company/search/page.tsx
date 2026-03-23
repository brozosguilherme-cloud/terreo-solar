'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import SpaceCard from '@/components/SpaceCard'
import { MOCK_SPACES } from '@/lib/mock-data'
import type { SpaceWithPhotos } from '@/types/database'

export default function CompanySearchPage() {
  const [filters, setFilters] = useState({
    type: '',
    city: '',
    state: '',
    min_area: '',
    max_rent: '',
    orientation: '',
  })

  const results = useMemo(() => {
    return MOCK_SPACES.filter((s) => {
      if (s.status !== 'available') return false
      if (filters.type && s.type !== filters.type) return false
      if (filters.city && !s.city.toLowerCase().includes(filters.city.toLowerCase())) return false
      if (filters.state && s.state.toLowerCase() !== filters.state.toLowerCase()) return false
      if (filters.min_area && s.area_m2 < parseFloat(filters.min_area)) return false
      if (filters.max_rent && s.desired_rent && s.desired_rent > parseFloat(filters.max_rent)) return false
      if (filters.orientation && !s.solar_orientation?.includes(filters.orientation)) return false
      return true
    })
  }, [filters])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Buscar Espaços</h1>
        <p className="text-stone-500">{results.length} espaços encontrados</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sticky top-24 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-stone-700">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Tipo</label>
              <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terreo-500">
                <option value="">Todos</option>
                <option value="terreno">Terreno</option>
                <option value="telhado">Telhado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Estado</label>
              <select value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terreo-500">
                <option value="">Todos</option>
                <option value="SP">São Paulo</option>
                <option value="MG">Minas Gerais</option>
                <option value="PR">Paraná</option>
                <option value="CE">Ceará</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Área mínima (m²)</label>
              <input type="number" value={filters.min_area} onChange={(e) => setFilters((f) => ({ ...f, min_area: e.target.value }))}
                placeholder="Ex: 500"
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terreo-500" />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Aluguel máx (R$/mês)</label>
              <input type="number" value={filters.max_rent} onChange={(e) => setFilters((f) => ({ ...f, max_rent: e.target.value }))}
                placeholder="Ex: 2000"
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terreo-500" />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Orientação solar</label>
              <select value={filters.orientation} onChange={(e) => setFilters((f) => ({ ...f, orientation: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terreo-500">
                <option value="">Qualquer</option>
                <option value="norte">Norte</option>
                <option value="sul">Sul</option>
                <option value="leste">Leste</option>
                <option value="oeste">Oeste</option>
              </select>
            </div>

            <button onClick={() => setFilters({ type: '', city: '', state: '', min_area: '', max_rent: '', orientation: '' })}
              className="w-full rounded-lg border border-stone-200 py-2 text-sm text-stone-500 hover:bg-stone-50">
              Limpar filtros
            </button>
          </div>
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 py-20 text-center">
              <Search className="h-12 w-12 text-stone-300 mb-4" />
              <h3 className="text-lg font-semibold text-stone-600 mb-2">Nenhum espaço encontrado</h3>
              <p className="text-stone-400 text-sm max-w-xs">Tente ajustar os filtros ou ampliar a área de busca.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((space) => (
                <SpaceCard key={space.id} space={space as unknown as SpaceWithPhotos} showStatus={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
