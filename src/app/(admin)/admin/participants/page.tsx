export const dynamic = 'force-dynamic'

import ParticipantsSearch from './participants-search'

export default function ParticipantsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
        <p className="text-muted-foreground">
          Search and manage loyalty program participants
        </p>
      </div>

      <ParticipantsSearch />
    </div>
  )
}