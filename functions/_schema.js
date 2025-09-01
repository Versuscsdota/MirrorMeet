// Shared schema and helpers for unified data blocks across slots and models

// Standardized keys we recognize in model_data entries
// Each entry: { field: string, value: any }
export const STANDARD_MODEL_FIELDS = new Set([
  'fullName',
  'phone',
  'telegram',
  'birthDate',
  'docType',
  'docNumber',
  'internshipDate',
]);

export function normalizeDataBlock(input) {
  const db = input && typeof input === 'object' ? input : {};
  const model_data = Array.isArray(db.model_data)
    ? db.model_data.map(x => ({ field: String(x.field), value: x.value }))
    : [];
  const forms = Array.isArray(db.forms) ? db.forms : [];
  const user_id = db.user_id ?? undefined;
  const edit_history = Array.isArray(db.edit_history) ? db.edit_history : [];
  return { model_data, forms, user_id, edit_history };
}

// Merge src into dst without destructive removal. Prefer src values, keep dst when src missing.
export function mergeDataBlocks(dstRaw, srcRaw, { recordEdit = true, editedBy } = {}) {
  const dst = normalizeDataBlock(dstRaw);
  const src = normalizeDataBlock(srcRaw);

  const map = new Map(dst.model_data.map(x => [String(x.field), x.value]));
  const changes = [];

  for (const item of src.model_data) {
    const key = String(item.field);
    const prev = map.has(key) ? map.get(key) : undefined;
    const next = item.value;
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      changes.push({ field: key, old_value: prev ?? null, new_value: next });
      map.set(key, next);
    }
  }

  const mergedModelData = Array.from(map.entries()).map(([field, value]) => ({ field, value }));
  const mergedForms = dst.forms.concat(src.forms || []);
  const mergedUser = src.user_id ?? dst.user_id;
  const out = {
    model_data: mergedModelData,
    forms: mergedForms,
    user_id: mergedUser,
    edit_history: Array.isArray(dst.edit_history) ? dst.edit_history.slice() : []
  };

  if (recordEdit && changes.length) {
    const iso = new Date().toISOString();
    const userId = editedBy || src.user_id || dst.user_id || null;
    for (const ch of changes) out.edit_history.push({ edited_at: iso, user_id: userId, changes: ch });
  }
  return out;
}

// Extract well-known fields for model entity from a data_block
export function extractModelFieldsFromDataBlock(dbRaw) {
  const db = normalizeDataBlock(dbRaw);
  const pick = (key) => {
    const found = db.model_data.find(x => x.field === key);
    return found ? found.value : undefined;
  };
  const fullName = pick('fullName');
  const phone = pick('phone');
  const telegram = pick('telegram');
  const birthDate = pick('birthDate');
  const docType = pick('docType');
  const docNumber = pick('docNumber');
  const internshipDate = pick('internshipDate');
  return { fullName, phone, telegram, birthDate, docType, docNumber, internshipDate };
}
