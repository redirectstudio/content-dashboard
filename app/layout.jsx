import './globals.css'

export const metadata = {
  title: 'Content Dashboard — Redirect Studio',
  description: 'Real-time analytics across all avatars and platforms',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
