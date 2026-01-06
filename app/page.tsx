import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to public login
  redirect('/login')
}
