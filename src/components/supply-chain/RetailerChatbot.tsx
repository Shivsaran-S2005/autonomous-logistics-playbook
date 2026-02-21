import { useState, useRef, useEffect } from "react";
import type { Retailer } from "@/data/types";
import {
  getRetailerDeliveryViews,
  getProducts,
  getSuppliers,
  getRetailerRequests,
  addRetailerRequest,
} from "@/data/db";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

function answerRetailerQuery(query: string, retailer: Retailer): string {
  const q = query.toLowerCase().trim();
  const deliveries = getRetailerDeliveryViews(retailer.retailerId);
  const products = getProducts();
  const suppliers = getSuppliers();
  const requests = getRetailerRequests(retailer.retailerId);

  // ----- REQUEST STATUS -----
  if (q.includes("request") && (q.includes("status") || q.includes("my ") || q.includes("update") || q.includes("resolution"))) {
    const openReqs = requests.filter((r) => r.status === "Pending");
    const resolved = requests.filter((r) => r.status === "Resolved" && r.resolutionNote);
    if (openReqs.length > 0) {
      let reply = `You have ${openReqs.length} open request(s): `;
      openReqs.forEach((r) => {
        reply += `[${r.type}] "${r.message}" (${new Date(r.createdAt).toLocaleDateString()}). `;
      });
      reply += "Supplier will resolve; you'll see the resolution here when done.";
      return reply;
    }
    if (resolved.length > 0) {
      const r = resolved[0];
      return `Latest resolution (${r.resolvedBy === "ai" ? "AI" : "Manual"}): ${r.resolutionNote}`;
    }
    return "You have no requests yet. Say 'raise restock for [product]' or use the Raise Request form on this page.";
  }

  // ----- RAISE REQUEST FROM CHAT -----
  if (q.includes("raise") || q.includes("request restock") || q.includes("report delay")) {
    const restockMatch = q.match(/restock\s+(?:for\s+)?([a-z0-9\s]+?)(?:\s|$|\.)/i) || q.match(/need\s+more\s+([a-z0-9\s]+)/i);
    const productName = restockMatch ? restockMatch[1].trim() : "";
    const product = productName ? products.find((p) => p.name.toLowerCase().includes(productName) && retailer.authorizedSupplierIds.includes(p.supplierId)) : null;
    if (q.includes("delay") || q.includes("report delay")) {
      addRetailerRequest({ retailerId: retailer.retailerId, type: "delay_report", message: "Delay reported via chatbot." });
      return "Delay report raised. Supplier has been notified and will update you (check request status).";
    }
    if (product) {
      addRetailerRequest({
        retailerId: retailer.retailerId,
        type: "restock",
        supplierId: product.supplierId,
        productId: product.productId,
        message: `Restock requested for ${product.name} via chatbot.`,
      });
      return `Restock request for ${product.name} raised. Supplier will see it and may trigger a transfer (watch their map). Ask "request status" for updates.`;
    }
    if (q.includes("restock")) {
      addRetailerRequest({ retailerId: retailer.retailerId, type: "restock", message: "Restock requested via chatbot." });
      return "Restock request raised. Supplier will respond; ask 'request status' for resolution.";
    }
    addRetailerRequest({ retailerId: retailer.retailerId, type: "general", message: "Request from chatbot: " + query.slice(0, 200) });
    return "Request raised. Supplier will handle it. Ask 'my request status' for updates.";
  }

  // ----- SUPPLIER STATUS -----
  if (q.includes("supplier") && (q.includes("status") || q.includes("who") || q.includes("which"))) {
    const names = suppliers.filter((s) => retailer.authorizedSupplierIds.includes(s.supplierId)).map((s) => s.name);
    return `Your authorized suppliers: ${names.join(", ")}. For live active/inactive status, check the "Live supplier status" card on this page (linked to supplier operations).`;
  }

  if (q.includes("shipment") || q.includes("delivery") || q.includes("tracking")) {
    const delayed = deliveries.filter((d) => d.status === "delayed");
    if (delayed.length > 0) {
      return `You have ${delayed.length} delayed shipment(s): ${delayed.map((d) => d.productName + " (" + d.shipmentId + ")").join(", ")}. Current location: ${delayed[0].currentLocation}. ETA: ${new Date(delayed[0].eta).toLocaleString()}.`;
    }
    const inTransit = deliveries.filter((d) => d.status === "in_transit");
    if (inTransit.length > 0) {
      return `${inTransit.length} delivery(s) in transit. Latest: ${inTransit[0].productName} — ${inTransit[0].currentLocation}. ETA: ${new Date(inTransit[0].eta).toLocaleString()}.`;
    }
    return "No shipments currently in transit for your account. All recent deliveries are either delivered or pending.";
  }

  if (q.includes("stock") || q.includes("availability") || q.includes("quantity")) {
    const mySupplierIds = retailer.authorizedSupplierIds;
    const myProducts = products.filter((p) => mySupplierIds.includes(p.supplierId));
    const low = myProducts.filter((p) => p.quantityInStock > 0 && p.quantityInStock < 30);
    if (low.length > 0) {
      return `Low stock (under 30 units): ${low.map((p) => p.name + " (" + p.quantityInStock + ")").join(", ")}. You can raise a restock request.`;
    }
    return `You have ${myProducts.length} product(s) from your authorized suppliers. All are adequately stocked.`;
  }

  if (q.includes("eta") || q.includes("arrival") || q.includes("when")) {
    const next = deliveries.filter((d) => d.status === "in_transit" || d.status === "delayed").sort(
      (a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime()
    )[0];
    if (next) {
      return `Next expected arrival: ${next.productName} (${next.shipmentId}) — ETA ${new Date(next.eta).toLocaleString()}. Location: ${next.currentLocation}.`;
    }
    return "No pending arrivals in your tracking list.";
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("help")) {
    return "I'm your live link to the supplier. You can ask: shipment/delivery status, stock availability, ETA, delayed deliveries, 'my request status', 'raise restock for [product]', 'report delay', or supplier status. Resolutions from the supplier appear when you ask for request status.";
  }

  for (const d of deliveries) {
    if (q.includes(d.productName.toLowerCase())) {
      return `${d.productName}: Status ${d.status}. Location: ${d.currentLocation}. ETA: ${new Date(d.eta).toLocaleString()}. Remaining qty: ${d.remainingQuantity}. Shipment ID: ${d.shipmentId}.`;
    }
  }

  return "I can help with: shipments, stock, ETA, request status, or raising a request (e.g. 'raise restock for Dairy Milk'). Ask 'help' for more.";
}

interface RetailerChatbotProps {
  retailer: Retailer;
}

export function RetailerChatbot({ retailer }: RetailerChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      text: "Ask me about shipment status, stock updates, or expected arrival times.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const reply = answerRetailerQuery(userMsg.text, retailer);
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      text: reply,
      timestamp: new Date(),
    };
    setTimeout(() => setMessages((m) => [...m, botMsg]), 300);
  };

  return (
    <div className="flex flex-col h-[320px] border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-border font-mono text-xs text-neon-cyan bg-muted/30">
        CHATBOT — Shipment & stock queries
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-md px-3 py-1.5 text-xs font-mono ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-border flex gap-2">
        <input
          type="text"
          className="flex-1 rounded border border-input bg-background px-2 py-1.5 font-mono text-xs"
          placeholder="Shipment, stock, ETA, request status, raise restock..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          type="button"
          onClick={send}
          className="px-3 py-1.5 rounded bg-primary text-primary-foreground font-mono text-xs hover:opacity-90"
        >
          Send
        </button>
      </div>
    </div>
  );
}
