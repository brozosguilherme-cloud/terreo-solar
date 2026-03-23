'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CompanyOnboardingPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/company/dashboard') }, [router])
  return null
}
