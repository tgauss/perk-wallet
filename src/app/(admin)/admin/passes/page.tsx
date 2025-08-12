export const dynamic = 'force-dynamic'

import PassesFilter from './passes-filter'

export default function PassesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Passes</h1>
        <p className="text-muted-foreground">
          Manage wallet passes and their sync status
        </p>
      </div>

      <PassesFilter />
    </div>
  )
}