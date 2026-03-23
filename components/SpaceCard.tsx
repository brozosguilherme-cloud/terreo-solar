import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Maximize2, Sun, Banknote } from 'lucide-react'
import {
  formatCurrency,
  formatArea,
  spaceTypeLabel,
  spaceStatusLabel,
  spaceStatusColor,
} from '@/lib/utils'
import type { SpaceWithPhotos } from '@/types/database'

interface SpaceCardProps {
  space: SpaceWithPhotos
  showStatus?: boolean
}

export default function SpaceCard({ space, showStatus = true }: SpaceCardProps) {
  const mainPhoto = space.space_photos?.sort((a, b) => a.order - b.order)[0]

  return (
    <Link href={`/spaces/${space.id}`} className="group block">
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-stone-300 transition-all">
        {/* Photo */}
        <div className="relative h-44 w-full bg-stone-100">
          {mainPhoto ? (
            <Image
              src={mainPhoto.url}
              alt={`${spaceTypeLabel(space.type)} em ${space.city}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Sun className="h-10 w-10 text-stone-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur-sm">
              {spaceTypeLabel(space.type)}
            </span>
            {showStatus && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${spaceStatusColor(space.status)}`}>
                {spaceStatusLabel(space.status)}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="mb-3 flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 text-terreo-600 shrink-0" />
            <span className="font-semibold text-stone-800">
              {space.city}, {space.state}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <Maximize2 className="h-3 w-3 text-stone-400" />
              <span>{formatArea(space.area_m2)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sun className="h-3 w-3 text-stone-400" />
              <span className="truncate">{space.solar_orientation.join(', ')}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
            <div className="flex items-center gap-1.5">
              <Banknote className="h-4 w-4 text-terreo-600" />
              <span className="font-bold text-terreo-800 text-sm">
                {formatCurrency(space.desired_rent)}
                {space.desired_rent && (
                  <span className="text-xs font-normal text-stone-400">/mês</span>
                )}
              </span>
            </div>
            <span className="text-xs text-terreo-600 font-medium group-hover:underline">
              Ver detalhes →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
