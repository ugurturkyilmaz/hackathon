export const metadata = {
  title: "Hello World",
  description: "Next.js hello world",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
