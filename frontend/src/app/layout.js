import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AgentChat — Agentic AI Assistant",
  description:
    "An agentic AI chatbot powered by LangGraph with tools for weather, stocks, web search, document Q&A, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ height: "100%", overflow: "hidden" }}
    >
      <body style={{ height: "100%", overflow: "hidden", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
