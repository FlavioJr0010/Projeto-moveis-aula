const nf = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const brl = (v: number) => nf.format(v);
export const round2 = (v: number) => Math.round(v * 100) / 100;

export function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
export const isCep = (v: string) => /^\d{8}$/.test(v.replace(/\D/g, ""));
