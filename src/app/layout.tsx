import type { Metadata } from 'next'
import { ThemeProvider } from '../components/ThemeProvider'
import Sidebar from '../components/Sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'bettina george — content intelligence',
  description: 'Creator content analytics and performance prediction',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Luxurious+Script&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <div className="shell">
            <Sidebar />
            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
