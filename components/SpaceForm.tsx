'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Space, SpacePhoto, SolarOrientation } from '@/types/database'

interface SpaceFormProps {
  action: (formData: FormData) => Promise<void>
  space?: Space
  existingPhotos?: SpacePhoto[]
  submitLabel?: string
}

const ORIENTATIONS: SolarOrientation[] = ['Norte', 'Sul', 'Leste', 'Oeste']

export default function SpaceForm({
  action,
  space,
  existingPhotos = [],
  submitLabel = 'Salvar espaço',
}: SpaceFormProps) {
  const [type, setType] = useState(space?.type ?? 'terreno')
  const [status, setStatus] = useState(space?.status ?? 'available')
  const [roofType, setRoofType] = useState(space?.roof_type ?? '')
  const [orientations, setOrientations] = useState<SolarOrientation[]>(
    (space?.solar_orientation as SolarOrientation[]) ?? []
  )
  const [previews, setPreviews] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function toggleOrientation(o: SolarOrientation) {
    setOrientations((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
    )
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const newFiles = Array.from(fileList).slice(0, 10 - files.length - existingPhotos.length)
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f))
    setFiles((prev) => [...prev, ...newFiles])
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  function removeNewPhoto(index: number) {
    URL.revokeObjectURL(previews[index])
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (orientations.length === 0) {
      alert('Selecione ao menos uma orientação solar')
      return
    }
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)
    // Add orientations manually (checkboxes in FormData)
    formData.delete('solar_orientation')
    orientations.forEach((o) => formData.append('solar_orientation', o))
    // Add files
    formData.delete('photos')
    files.forEach((f) => formData.append('photos', f))
    await action(formData)
    setSubmitting(false)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Type */}
      <div className="space-y-2">
        <Label>Tipo de espaço *</Label>
        <div className="grid grid-cols-2 gap-3">
          {(['terreno', 'telhado'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'rounded-xl border-2 py-3 text-sm font-medium capitalize transition-all',
                type === t
                  ? 'border-terreo-700 bg-terreo-50 text-terreo-800'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              )}
            >
              {t === 'terreno' ? '🏕️ Terreno' : '🏠 Telhado'}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="font-semibold text-stone-800 border-b pb-2">Localização</h3>
        <div className="space-y-2">
          <Label htmlFor="address">Endereço completo *</Label>
          <Input
            id="address"
            name="address"
            placeholder="Rua das Palmeiras, 123"
            defaultValue={space?.address}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              name="city"
              placeholder="São Paulo"
              defaultValue={space?.city}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado *</Label>
            <Input
              id="state"
              name="state"
              placeholder="SP"
              maxLength={2}
              defaultValue={space?.state}
              required
              className="uppercase"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude (opcional)</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              placeholder="-23.5505"
              defaultValue={space?.lat ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitude (opcional)</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              placeholder="-46.6333"
              defaultValue={space?.lng ?? ''}
            />
          </div>
        </div>
      </div>

      {/* Space details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-stone-800 border-b pb-2">Características</h3>
        <div className="space-y-2">
          <Label htmlFor="area_m2">Área disponível (m²) *</Label>
          <Input
            id="area_m2"
            name="area_m2"
            type="number"
            step="0.01"
            placeholder="500"
            defaultValue={space?.area_m2}
            required
            min="1"
          />
        </div>

        {/* Solar orientation */}
        <div className="space-y-2">
          <Label>Orientação solar *</Label>
          <div className="grid grid-cols-4 gap-2">
            {ORIENTATIONS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => toggleOrientation(o)}
                className={cn(
                  'rounded-lg border-2 py-2 text-xs font-medium transition-all',
                  orientations.includes(o)
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                )}
              >
                {o === 'Norte' ? '⬆️' : o === 'Sul' ? '⬇️' : o === 'Leste' ? '➡️' : '⬅️'} {o}
              </button>
            ))}
          </div>
        </div>

        {/* Roof type (only for telhado) */}
        {type === 'telhado' && (
          <div className="space-y-2">
            <Label htmlFor="roof_type">Tipo de estrutura do telhado</Label>
            <Select value={roofType} onValueChange={setRoofType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ceramica">Cerâmica</SelectItem>
                <SelectItem value="metalico">Metálico</SelectItem>
                <SelectItem value="laje">Laje</SelectItem>
                <SelectItem value="fibrocimento">Fibrocimento</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="roof_type" value={roofType} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="desired_rent">Valor de locação desejado (R$/mês)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">R$</span>
            <Input
              id="desired_rent"
              name="desired_rent"
              type="number"
              step="0.01"
              placeholder="1.200,00"
              defaultValue={space?.desired_rent ?? ''}
              className="pl-8"
            />
          </div>
          <p className="text-xs text-stone-400 flex items-center gap-1">
            <Info className="h-3 w-3" /> Deixe em branco para exibir &quot;A negociar&quot;
          </p>
        </div>
      </div>

      {/* Status (only for editing) */}
      {space && (
        <div className="space-y-2">
          <Label>Status do espaço</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="negotiating">Em negociação</SelectItem>
              <SelectItem value="rented">Locado</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="status" value={status} />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição livre</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Descreva o espaço: acesso, infraestrutura disponível, características relevantes..."
          defaultValue={space?.description ?? ''}
          rows={4}
        />
      </div>

      {/* Photos */}
      <div className="space-y-3">
        <h3 className="font-semibold text-stone-800 border-b pb-2">
          Fotos ({existingPhotos.length + files.length}/10)
        </h3>

        {/* Existing photos */}
        {existingPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                <Image src={photo.url} alt="Foto" fill className="object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* New photo previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                <Image src={url} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewPhoto(i)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        {existingPhotos.length + files.length < 10 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 py-8 text-stone-400 hover:border-terreo-600 hover:text-terreo-700 transition-colors"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm">
              Clique para adicionar fotos (máx. {10 - existingPhotos.length - files.length} restantes)
            </span>
            <span className="text-xs">JPG, PNG até 5MB cada</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {existingPhotos.length === 0 && files.length === 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <Info className="h-3 w-3" /> Adicione ao menos 1 foto para atrair mais interesse
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
