/** Número de demonstração. Troque pelo número real da loja antes de publicar. */
export const WHATSAPP_NUMBER = "5511900000000";

/** Link do WhatsApp com texto pré-preenchido (só é aberto por clique do usuário). */
export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Mensagem inicial: apenas dados públicos do produto e a cor escolhida. */
export const productQuestion = (name: string, color?: string) =>
  `Olá! Tenho uma dúvida sobre "${name}"${color ? ` (cor ${color})` : ""}: `;
