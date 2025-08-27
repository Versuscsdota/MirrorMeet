"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setToken } from "../../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || "Ошибка авторизации");
      }
      const data = await res.json();
      if (!data?.access_token) throw new Error("Нет access_token в ответе");
      setToken(data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth: 420, margin: "40px auto"}}>
      <h1 style={{fontSize: 22, fontWeight: 700, marginBottom: 12}}>Вход</h1>
      <form onSubmit={onSubmit} style={{display: 'grid', gap: 12}}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{padding: 10, border: '1px solid #ddd', borderRadius: 8}}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{padding: 10, border: '1px solid #ddd', borderRadius: 8}}
        />
        <button disabled={loading} style={{padding: '10px 12px', borderRadius: 8, background: '#111827', color: '#fff'}}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
        {error && <div style={{color: '#b91c1c'}}>{error}</div>}
      </form>
      <div style={{marginTop: 12}}>
        Нет аккаунта? <a href="/auth/register" style={{color: '#2563eb'}}>Зарегистрироваться</a>
      </div>
    </div>
  );
}
