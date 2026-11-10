import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { VLibras } from "@/components/VLibras";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Casa Raiz | Móveis para o seu lar", template: "%s | Casa Raiz" },
  description: "Móveis próprios, sustentáveis e com atendimento de verdade. Descubra o que cabe no seu espaço.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <a className="skip" href="#conteudo">Pular para o conteúdo</a>
        <CartProvider>
          <Header />
          <main id="conteudo" tabIndex={-1}>{children}</main>
          <Footer />
          <ChatWidget />
          <VLibras />
        </CartProvider>
      </body>
    </html>
  );
}
