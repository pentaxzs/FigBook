import type { Metadata } from 'next'
import { Fira_Sans, Fira_Code } from 'next/font/google'
import './globals.css'
// import { BottomNav } from '@/components/layout/BottomNav'

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MetricsPad',
  description: '프로덕트 지표 메모장',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${firaSans.variable} ${firaCode.variable}`}>
      <body className="bg-background min-h-dvh font-sans">
        <main className="max-w-lg mx-auto pt-14 pb-20 min-h-dvh">
          {children}
        </main>
        {/* <BottomNav /> */}
      </body>
    </html>
  )
}
