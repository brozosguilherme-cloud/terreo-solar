import Link from 'next/link'
import { ArrowLeft, Sun } from 'lucide-react'
import ChatWindow from './ChatWindow'
import { MOCK_INTERESTS, MOCK_SPACES, MOCK_MESSAGES } from '@/lib/mock-data'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return MOCK_INTERESTS.filter((i) => i.status === 'accepted').map((i) => ({ interestId: i.id }))
}

export default function ChatPage({ params }: { params: { interestId: string } }) {
  const interest = MOCK_INTERESTS.find((i) => i.id === params.interestId)
  if (!interest) notFound()
  const space = MOCK_SPACES.find((s) => s.id === interest.space_id)
  const messages = MOCK_MESSAGES.filter((m) => m.interest_id === params.interestId)

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-stone-200 bg-white px-4 py-3 flex items-center gap-3">
        <Link href="/owner/dashboard" className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-terreo-50">
          <Sun className="h-5 w-5 text-terreo-400" />
        </div>
        <div>
          <p className="font-semibold text-stone-900">
            {space?.type === 'terreno' ? 'Terreno' : 'Telhado'} em {space?.city}, {space?.state}
          </p>
          <p className="text-xs text-stone-500">{interest.company_name}</p>
        </div>
      </div>
      <ChatWindow initialMessages={messages} interestId={params.interestId} />
    </div>
  )
}
