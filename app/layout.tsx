/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '明日の環（アスノワ）｜災害時共助アプリ',
  description: '被災者と支援者をつなぐ、災害時の共助・物資マッチングアプリ。',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/asunowa.png',
        type: 'image/png',
      },
    ],
    apple: '/asunowa.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="bg-background">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
