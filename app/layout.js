import './globals.css'
export const metadata = { title: 'Cabinet Pneumologie', description: 'Cabinet Pneumologie Timișoara' }
export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  )
}
