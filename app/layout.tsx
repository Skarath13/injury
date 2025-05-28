import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "California Auto Injury Settlement Calculator",
  description: "Calculate potential auto injury settlement amounts in California with our comprehensive tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}