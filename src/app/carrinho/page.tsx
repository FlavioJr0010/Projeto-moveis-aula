import type { Metadata } from "next";
import { CartClient } from "@/components/CartClient";
export const metadata: Metadata = { title: "Carrinho" };
export default function Carrinho() { return <div className="container section tight"><h1>Seu carrinho</h1><CartClient /></div>; }
