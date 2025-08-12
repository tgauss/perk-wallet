export const dynamic = 'force-dynamic'

import JobsFilter from './jobs-filter'

export default function JobsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">
          Monitor background jobs and task execution
        </p>
      </div>

      <JobsFilter />
    </div>
  )
}