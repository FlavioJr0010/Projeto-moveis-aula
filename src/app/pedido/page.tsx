import type { Metadata } from "next";
import { OrderClient } from "@/components/OrderClient";
export const metadata: Metadata = { title: "Pedido realizado" };
export default function Pedido() { return <div className="container section tight"><OrderClient /></div>; }
