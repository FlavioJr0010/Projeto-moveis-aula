import type { Metadata } from "next";
import { CheckoutClient } from "@/components/CheckoutClient";
export const metadata: Metadata = { title: "Finalizar compra" };
export default function Checkout() { return <div className="container section tight"><h1>Finalizar compra</h1><CheckoutClient /></div>; }
