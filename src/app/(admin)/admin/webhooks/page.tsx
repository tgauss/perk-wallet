export const dynamic = 'force-dynamic'

import WebhookEvents from './webhook-events'

export default function WebhooksPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">
          View webhook events received from Perk API
        </p>
      </div>

      <WebhookEvents />
    </div>
  )
}