"use client";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Profile = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  tags?: string[];
  createdAt?: string;
};

export default function ProfilesPage() {
  const [items, setItems] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => q.trim(), [q]);

  async function load() {
    setLoading(true);
    try {
      const url = `/profiles${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:8}}>Профили</h1>
      <form onSubmit={onSearch} style={{display:'flex', gap:8, marginBottom:12}}>
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск" style={{flex:1, padding:8, border:'1px solid #eee', borderRadius:8}} />
        <button disabled={loading} style={{padding:'8px 12px', borderRadius:8, border:'1px solid #ddd'}}>{loading? 'Поиск…':'Найти'}</button>
      </form>

      {items.length ? (
        <ul style={{listStyle:'none', padding:0, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12}}>
          {items.map(p => (
            <li key={p.id} style={{border:'1px solid #eee', borderRadius:8, padding:12}}>
              <div style={{fontWeight:600}}>{p.fullName}</div>
              <div style={{color:'#6b7280', fontSize:12}}>{p.email || '—'}</div>
              <a href={`/profiles/${p.id}`} style={{display:'inline-block', marginTop:8, color:'#2563eb'}}>Открыть</a>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{color:'#6b7280'}}>Нет записей</div>
      )}
    </div>
  );
}
