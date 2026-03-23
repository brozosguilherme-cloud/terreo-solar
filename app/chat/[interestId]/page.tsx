import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Sun, ArrowLeft, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ChatWindow from './ChatWindow'
import { markMessagesAsRead } from '@/app/actions/messages'
import { spaceTypeLabel, formatArea } from '@/lib/utils'

export default async function ChatPage({
  params,
}: {
  params: { interestId: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch interest with related data
  const { data: interest } = await supabase
    .from('interests')
    .select(`
      id, status,
      company_id,
      spaces(
        id, type, city, state, area_m2, owner_id,
        profiles!spaces_owner_id_fkey(id, name)
      ),
      profiles!interests_company_id_fkey(id, name),
      company_profiles(company_name)
    `)
    .eq('id', params.interestId)
    .single()

  if (!interest) notFound()
  if (interest.status !== 'accepted') redirect('/owner/dashboard')

  const space = interest.spaces as {
    id: string
    type: string
    city: string
    state: string
    area_m2: number
    owner_id: string
    profiles: { id: string; name: string }
  } | null

  const ownerProfile = space?.profiles
  const companyProfile = interest.profiles as { id: string; name: string } | null
  const companyInfo = interest.company_profiles as { company_name: string } | null

  // Verify user is part of this chat
  const isOwner = space?.owner_id === user.id
  const isCompany = interest.company_id === user.id
  if (!isOwner && !isCompany) redirect('/owner/dashboard')

  // Fetch messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles(id, name)')
    .eq('interest_id', params.interestId)
    .order('created_at', { ascending: true })

  // Mark as read
  await markMessagesAsRead(params.interestId)

  const otherPartyName = isOwner
    ? companyInfo?.company_name ?? companyProfile?.name ?? 'Empresa'
    : ownerProfile?.name ?? 'Proprietário'

  const backHref = isOwner ? '/owner/dashboard' : '/company/dashboard'

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex h-16 items-center gap-4">
            <Link href={backHref} className="text-stone-400 hover:text-stone-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-terreo-800">
                <Sun className="h-4 w-4 text-white" />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-900 truncate">{otherPartyName}</p>
              <p className="text-xs text-stone-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {spaceTypeLabel(space?.type ?? '')} em {space?.city}, {space?.state} —{' '}
                {formatArea(space?.area_m2 ?? 0)}
              </p>
            </div>
            <Link href={`/spaces/${space?.id}`}>
              <span className="text-xs text-terreo-700 hover:underline">Ver espaço →</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Chat window */}
      <ChatWindow
        interestId={params.interestId}
        initialMessages={messages ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}
