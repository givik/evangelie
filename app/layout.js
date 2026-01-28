import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'სახარება',
  description: 'A modern Georgian Bible reader application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/cross-orthodox.svg" sizes="any" />
      </head>
      <body>
        {children}
        <Analytics debug={false} />
      </body>
    </html>
  );
}
