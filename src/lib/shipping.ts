import { FREE_SHIPPING_FROM } from "./pricing";
import { round2 } from "./format";

export interface ShippingOption {
  id: "economico" | "agendado" | "retirada";
  label: string;
  price: number;
  daysMin: number;
  daysMax: number;
  note: string;
}

const REGIONS: Record<string, { name: string; base: number; perKg: number; days: [number, number] }> = {
  "0": { name: "São Paulo", base: 49, perKg: 0.9, days: [3, 6] },
  "1": { name: "São Paulo", base: 59, perKg: 1.0, days: [3, 7] },
  "2": { name: "Rio de Janeiro / Espírito Santo", base: 79, perKg: 1.3, days: [5, 9] },
  "3": { name: "Minas Gerais", base: 89, perKg: 1.4, days: [5, 10] },
  "4": { name: "Bahia / Sergipe", base: 149, perKg: 2.0, days: [8, 14] },
  "5": { name: "Nordeste", base: 169, perKg: 2.2, days: [9, 15] },
  "6": { name: "Norte / Nordeste", base: 199, perKg: 2.6, days: [10, 18] },
  "7": { name: "Centro-Oeste", base: 139, perKg: 1.9, days: [7, 12] },
  "8": { name: "Paraná / Santa Catarina", base: 99, perKg: 1.5, days: [6, 10] },
  "9": { name: "Rio Grande do Sul", base: 119, perKg: 1.7, days: [7, 12] },
};

/** Simulação: calcula pela 1ª faixa do CEP. Troque por uma transportadora real depois. */
export function estimateShipping(cep: string, merchandise: number, weightKg: number) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const r = REGIONS[digits[0]];
  const free = merchandise >= FREE_SHIPPING_FROM && ["0", "1", "2", "3", "8", "9"].includes(digits[0]);
  const standard = free ? 0 : round2(r.base + r.perKg * weightKg);
  const options: ShippingOption[] = [
    {
      id: "economico", label: "Entrega econômica", price: standard,
      daysMin: r.days[0], daysMax: r.days[1],
      note: free ? "Frete grátis para sua região" : "Entrega consolidada: menos viagens, menos emissões",
    },
    {
      id: "agendado", label: "Entrega agendada (você escolhe o dia)", price: round2(standard + 35),
      daysMin: r.days[0] + 1, daysMax: r.days[1] + 2, note: "Janela de 4 horas, com aviso por WhatsApp",
    },
  ];
  if (digits[0] === "0" || digits[0] === "1") {
    options.push({ id: "retirada", label: "Retirar no ponto parceiro", price: 0, daysMin: 2, daysMax: 4, note: "Grátis, em São Paulo (demo)" });
  }
  return { region: r.name, options };
}

export const addBusinessDays = (days: number, from = new Date()) => {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return d;
};
export const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
