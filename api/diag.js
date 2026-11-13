// TEMPORAL: dice de qué proyecto es la cuenta de servicio configurada (sin revelar la clave). Borrar después.
module.exports = (req, res) => {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '', j = JSON.parse(raw);
    res.status(200).json({ project_id: j.project_id, client_email: j.client_email, private_key_id: String(j.private_key_id || '').slice(0, 8), chars: raw.length, envProject: process.env.FIREBASE_PROJECT_ID || null, gcp: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG || null });
  } catch (e) { res.status(500).json({ error: 'JSON no válido: ' + e.message, chars: (process.env.FIREBASE_SERVICE_ACCOUNT || '').length }); }
};
