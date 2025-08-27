"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";

export default function ProfileDetailProtectedPage() {
  const params = useParams<{ id: string }>();
  const profileId = useMemo(() => params?.id, [params]);

  const [profile, setProfile] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");

  async function fetchProfile() {
    if (!profileId) return;
    const res = await apiFetch(`/profiles/${profileId}`);
    if (res.ok) setProfile(await res.json());
  }

  async function fetchMedia() {
    if (!profileId) return;
    const res = await apiFetch(`/media?profileId=${profileId}`);
    if (res.ok) setMedia(await res.json());
  }

  useEffect(() => {
    fetchProfile();
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function handleUpload() {
    if (!file || !profileId) return;
    setStatus("Запрашиваю presigned URL...");
    const presignRes = await apiFetch(`/media/presign-upload`, {
      method: "POST",
      body: JSON.stringify({
        profileId,
        type: "PHOTO",
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        filename: file.name,
      }),
    });
    if (!presignRes.ok) {
      setStatus("Ошибка presign");
      return;
    }
    const presign = await presignRes.json();

    setStatus("Загружаю файл в MinIO...");
    const putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!putRes.ok) {
      setStatus("Ошибка загрузки в MinIO");
      return;
    }

    setStatus("Сохраняю метаданные...");
    const saveRes = await apiFetch(`/media`, {
      method: "POST",
      body: JSON.stringify({
        profileId,
        type: "PHOTO",
        storageKey: presign.storageKey,
        url: presign.publicUrl,
        mimeType: file.type,
        size: file.size,
      }),
    });
    if (!saveRes.ok) {
      setStatus("Ошибка сохранения метаданных");
      return;
    }

    setStatus("Готово");
    setFile(null);
    fetchMedia();
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Профиль</h1>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        {profile ? (
          <div>
            <div><b>ID:</b> {profile.id}</div>
            <div><b>ФИО:</b> {profile.fullName}</div>
            <div><b>Email:</b> {profile.email}</div>
            <div><b>Телефон:</b> {profile.phone}</div>
            <div><b>Теги:</b> {(profile.tags || []).join(", ")}</div>
          </div>
        ) : (
          <div>Нет данных профиля.</div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Загрузка медиа</h2>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button onClick={handleUpload} disabled={!file} style={{ marginLeft: 12, padding: "8px 12px", borderRadius: 6, background: "#111827", color: "#fff" }}>
          Загрузить
        </button>
        {status && <div style={{ marginTop: 8, color: "#374151" }}>{status}</div>}
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Медиа</h2>
        {media?.length ? (
          <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 12, listStyle: "none", padding: 0 }}>
            {media.map(m => (
              <li key={m.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{m.type}</div>
                {m.type === "PHOTO" ? (
                  <img src={m.url} alt={m.storageKey} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6, marginTop: 6 }} />
                ) : (
                  <a href={m.url} target="_blank" rel="noreferrer">Open</a>
                )}
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{new Date(m.createdAt).toLocaleString("ru-RU")}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div>Нет медиафайлов.</div>
        )}
      </div>
    </div>
  );
}
