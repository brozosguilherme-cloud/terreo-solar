'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateInterestStatus } from '@/app/actions/interests'

export default function InterestActions({ interestId }: { interestId: string }) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  async function handleAccept() {
    setLoading('accept')
    const result = await updateInterestStatus(interestId, 'accepted')
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Interesse aceito! O chat está aberto.')
    }
    setLoading(null)
  }

  async function handleReject() {
    setLoading('reject')
    const result = await updateInterestStatus(interestId, 'rejected')
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Interesse recusado.')
    }
    setLoading(null)
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        size="sm"
        onClick={handleAccept}
        disabled={!!loading}
        className="gap-1.5"
      >
        <Check className="h-3.5 w-3.5" />
        {loading === 'accept' ? 'Aceitando...' : 'Aceitar'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={!!loading}
        className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
      >
        <X className="h-3.5 w-3.5" />
        {loading === 'reject' ? 'Recusando...' : 'Recusar'}
      </Button>
    </div>
  )
}
