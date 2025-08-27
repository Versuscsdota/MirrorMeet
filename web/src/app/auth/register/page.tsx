"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setToken } from "../../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || "Ошибка регистрации");
      }
      const data = await res.json();
      if (!data?.access_token) throw new Error("Нет access_token в ответе");
      // Учет подтверждения рутом: токен есть, но можно показывать баннер об ожидании активации.
      setToken(data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth: 480, margin: "40px auto"}}>
      <h1 style={{fontSize: 22, fontWeight: 700, marginBottom: 12}}>Регистрация</h1>
      <form onSubmit={onSubmit} style={{display: 'grid', gap: 12}}>
        <input type="text" placeholder="Имя" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required style={{padding:10,border:'1px solid #ddd',borderRadius:8}} />
        <input type="text" placeholder="Фамилия" value={lastName} onChange={(e)=>setLastName(e.target.value)} required style={{padding:10,border:'1px solid #ddd',borderRadius:8}} />
        <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{padding:10,border:'1px solid #ddd',borderRadius:8}} />
        <input type="password" placeholder="Пароль" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{padding:10,border:'1px solid #ddd',borderRadius:8}} />
        <button disabled={loading} style={{padding:'10px 12px',borderRadius:8,background:'#111827',color:'#fff'}}>
          {loading ? 'Регистрируем…' : 'Зарегистрироваться'}
        </button>
        {error && <div style={{color:'#b91c1c'}}>{error}</div>}
      </form>
      <div style={{marginTop:12}}>
        Уже есть аккаунт? <a href="/auth/login" style={{color:'#2563eb'}}>Войти</a>
      </div>
    </div>
  );
}
