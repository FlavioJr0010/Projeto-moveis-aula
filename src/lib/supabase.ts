import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Cliente com a chave publicável (a RLS do banco protege os dados). Nulo se não configurado. */
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
