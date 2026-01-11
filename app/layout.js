import './globals.css';

export const metadata = {
  title: 'სახარება',
  description: 'A modern Georgian Bible reader application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
