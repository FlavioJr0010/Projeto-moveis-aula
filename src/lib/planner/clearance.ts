import type { Product } from "@/data/products";

export { clearanceRect, frontVec } from "./geometry";

type Cat = Product["category"];
/** Pares em que estar na folga do outro é o esperado (cadeira na frente da mesa, mesa na frente do sofá…). */
const EXPECTED: Partial<Record<Cat, Cat[]>> = {
  mesas: ["cadeiras", "poltronas", "complementos"],
  balcoes: ["cadeiras", "sofas", "complementos"],
  cadeiras: ["mesas", "balcoes"],
  sofas: ["mesas", "poltronas", "complementos"],
  poltronas: ["mesas", "complementos"],
};
export const isExpectedInFront = (owner: Cat, other: Cat) => !!EXPECTED[owner]?.includes(other);
