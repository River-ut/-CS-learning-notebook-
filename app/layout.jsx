import Script from 'next/script';

export const metadata = {
  title: '个人学习工作台',
  description: '将学习笔记、待办与进展日记集中在一个工作台。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
