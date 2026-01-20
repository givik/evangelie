import './globals.css';

export const metadata = {
  title: 'სახარება',
  description: 'A modern Georgian Bible reader application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
