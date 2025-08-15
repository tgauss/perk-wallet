import { redirect } from 'next/navigation'

// Legacy participant routes redirect to admin dashboard with helpful message
export default function LegacyParticipantRedirect() {
  redirect('/admin?message=participants-moved-to-program-context')
}