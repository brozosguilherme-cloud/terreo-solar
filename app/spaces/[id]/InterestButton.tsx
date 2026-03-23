'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createInterest } from '@/app/actions/interests'

interface InterestButtonProps {
  spaceId: string
  spaceStatus: string
}

export default function InterestButton({ spaceId, spaceStatus }: InterestButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await createInterest(spaceId)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Interesse enviado! O proprietário será notificado.')
      setDone(true)
    }
    setLoading(false)
  }

  if (spaceStatus !== 'available') {
    return (
      <div className="rounded-lg bg-stone-100 py-3 text-center text-sm text-stone-500">
        Espaço não disponível para novos interesses
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-terreo-50 border border-terreo-200 py-3 text-sm font-medium text-terreo-800">
        ✓ Interesse enviado com sucesso!
      </div>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="w-full gap-2"
      size="lg"
      variant="default"
    >
      <Zap className="h-4 w-4" />
      {loading ? 'Enviando...' : 'Demonstrar Interesse'}
    </Button>
  )
}
