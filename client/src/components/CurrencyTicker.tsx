import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DISPLAYED = ["EUR", "GBP", "PLN", "CHF", "JPY", "CAD", "AUD", "CNY", "SEK", "NOK", "CZK", "HUF", "DKK"];

const WS_URL = import.meta.env.VITE_WS_URL ?? "wss://localhost:3000/ws";

type Rates = Record<string, number>;

export function CurrencyTicker() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "rates") setRates(msg.data);
        } catch {}
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  const items = rates
    ? DISPLAYED.filter((c) => rates[c] != null).map((c) => ({
        code: c,
        value: (1 / rates[c]).toFixed(4),
      }))
    : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Exchange Rates
          <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
            {connected ? "Live" : "Connecting…"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden p-0 pb-4">
        {!rates ? (
          <p className="px-6 text-sm text-muted-foreground">Waiting for data…</p>
        ) : (
          <div className="overflow-hidden">
            <div className="flex gap-8 animate-ticker w-max px-6 text-sm font-mono">
              {[...items, ...items].map((item, i) => (
                <span key={i} className="whitespace-nowrap">
                  <span className="text-muted-foreground">USD/{item.code}</span>
                  {" "}
                  <span className="text-foreground font-medium">{item.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
