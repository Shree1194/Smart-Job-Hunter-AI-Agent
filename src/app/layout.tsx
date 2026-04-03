import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Job Hunter AI Agent | Multi-Agent Job Matching System",
  description: "An autonomous AI agent system that analyzes your resume, matches you with top jobs, and generates personalized application emails using a multi-agent architecture.",
  keywords: ["AI", "job hunting", "resume analyzer", "job matching", "multi-agent AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="app-container">
        {children}
      </body>
    </html>
  );
}
