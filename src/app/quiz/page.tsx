import type { Metadata } from "next";
import { QuizClient } from "@/components/QuizClient";
export const metadata: Metadata = { title: "Descubra seu estilo" };
export default function Quiz() { return <div className="container section tight"><h1>Descubra seu estilo</h1><p className="muted" style={{ maxWidth: 620 }}>Quatro perguntas rápidas e mostramos o ambiente e as peças ideais para você.</p><QuizClient /></div>; }
