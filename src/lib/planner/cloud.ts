import { supabase } from "@/lib/supabase";
import { newId, UUID_RE } from "./ids";
import { sanitizePlan } from "./serialize";
import type { Plan } from "./types";

const KEY = "casaraiz:planner:cloud:v1";
interface Link { share: string; edit: string }

const read = (): Record<string, Link> => { try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {}; } catch { return {}; } };
const write = (m: Record<string, Link>) => { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* ignora: modo privado */ } };

export type Published = { ok: true; url: string } | { ok: false; error: string };

/**
 * Publica o projeto no Supabase e devolve o link de leitura.
 * A chave de edição nasce e fica SÓ neste aparelho: quem recebe o link consegue abrir uma cópia, nunca alterar o original.
 */
export async function publishPlan(plan: Plan): Promise<Published> {
  if (!supabase) return { ok: false, error: "Compartilhamento indisponível: o banco não está configurado." };
  const links = read();
  const link = links[plan.id] ?? { share: UUID_RE.test(plan.id) ? plan.id : newId(), edit: newId() };
  const { error } = await supabase.rpc("publish_project", { p_share: link.share, p_edit: link.edit, p_nome: plan.nome || "Meu ambiente", p_data: plan });
  if (error) {
    if (error.code === "42501") return { ok: false, error: "Este projeto pertence a outro aparelho. Salve uma cópia e compartilhe a cópia." };
    return { ok: false, error: "Não foi possível publicar agora. Verifique a conexão e tente de novo." };
  }
  write({ ...links, [plan.id]: link });
  return { ok: true, url: `${location.origin}/planejador?projeto=${link.share}` };
}

export type Shared = { ok: true; plan: Plan } | { ok: false; error: string };

/** Abre um projeto compartilhado como CÓPIA (id novo): editar a cópia nunca altera o original. */
export async function fetchShared(shareId: string): Promise<Shared> {
  if (!UUID_RE.test(shareId)) return { ok: false, error: "Link de projeto inválido." };
  if (!supabase) return { ok: false, error: "Não foi possível abrir: o banco não está configurado." };
  const { data, error } = await supabase.rpc("get_shared_project", { p_share: shareId });
  if (error) return { ok: false, error: "Não foi possível abrir o projeto agora. Tente de novo." };
  const row = Array.isArray(data) ? data[0] : data;
  const plan = row ? sanitizePlan({ ...(row.data as object), nome: row.nome }) : null;
  if (!plan) return { ok: false, error: "Projeto não encontrado. O link pode estar incorreto ou ter sido removido." };
  return { ok: true, plan: { ...plan, id: newId(), updatedAt: new Date().toISOString() } };
}
