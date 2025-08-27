"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function DashboardPage() {
  const [health, setHealth] = useState<string>("");

  useEffect(() => {
    apiFetch("/health").then(async (r) => {
      setHealth(r.ok ? await r.text() : "ошибка");
    });
  }, []);

  return (
    <div>
      <h1 style={{fontSize:22, fontWeight:700, marginBottom:8}}>Дашборд</h1>
      <div style={{color:'#6b7280', marginBottom:12}}>Состояние API: {health || '…'}</div>
      <div style={{display:'grid', gap:12}}>
        <a href="/profiles" style={{display:'block', padding:12, border:'1px solid #eee', borderRadius:8}}>Перейти к профилям</a>
        <a href="/calendar" style={{display:'block', padding:12, border:'1px solid #eee', borderRadius:8}}>Календарь (скоро)</a>
      </div>
    </div>
  );
}
