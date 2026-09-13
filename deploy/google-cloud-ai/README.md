# Cloud Run opcional para el microservicio de IA

El sitio y la API de datos no requieren Cloud Run. Este despliegue es únicamente para `services/ai/`.

Desde la raíz del proyecto, con Google Cloud configurado:

```bash
gcloud run deploy prodisa-ai \
  --source services/ai \
  --region=northamerica-south1 \
  --allow-unauthenticated \
  --set-env-vars=AI_SHARED_SECRET=CAMBIA_ESTE_VALOR \
  --set-secrets=GEMINI_API_KEY=prodisa-gemini-api-key:latest
```

Después coloca en el `prodisa-config.php` de producción, fuera de `public_html`:

```php
'AI_SERVICE_URL' => 'https://URL-DE-CLOUD-RUN',
'AI_SHARED_SECRET' => 'EL_MISMO_VALOR',
```

La API PHP recupera el contexto RAG desde MariaDB local y envía a Cloud Run únicamente la pregunta y el contexto necesario.
