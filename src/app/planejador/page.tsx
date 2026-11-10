import type { Metadata } from "next";
import { PlannerApp } from "@/components/planner/PlannerApp";

export const metadata: Metadata = {
  title: "Planejador de ambientes",
  description: "Monte a planta do seu quarto, sala, escritório ou loja em escala, posicione os móveis e veja o total antes de comprar.",
};

export default function PlanejadorPage() {
  return (
    <div className="container section tight">
      <h1 style={{ fontSize: "2rem" }}>Planejador de ambientes</h1>
      <PlannerApp />
    </div>
  );
}
