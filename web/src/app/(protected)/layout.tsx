"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, clearToken } from "../../lib/api";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  function onLogout() {
    clearToken();
    router.replace("/auth/login");
  }

  if (!ready) return null;

  return (
    <div style={{padding: "8px 0 24px"}}>
      <nav style={{display:'flex', gap:12, alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:8, marginBottom:16}}>
        <a href="/dashboard" style={{color:'#111'}}>Дашборд</a>
        <a href="/profiles" style={{color:'#111'}}>Профили</a>
        <button onClick={onLogout} style={{marginLeft:'auto', padding:'6px 10px', border:'1px solid #ddd', borderRadius:8}}>Выйти</button>
      </nav>
      {children}
    </div>
  );
}
