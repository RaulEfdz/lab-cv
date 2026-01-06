import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to CV Lab
  redirect('/admin/cv-lab')
}
