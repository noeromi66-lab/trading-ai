# 🔄 CRON JOB - Paramètres de Configuration

## ✅ Paramètres à Copier-Coller

### 📍 URL de la Fonction
```
https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan
```

### 🔐 Headers (En-têtes HTTP)

**Header 1:**
- Nom: `Content-Type`
- Valeur: `application/json`

**Header 2:**
- Nom: `Authorization`
- Valeur: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY`

### 📦 Body (Corps de la Requête)
```json
{}
```
*(Laisser vide ou mettre `{}`)*

### 🌐 Méthode HTTP
```
POST
```

### ⏰ Fréquence Recommandée
```
*/15 * * * *
```
*(Toutes les 15 minutes)*

---

## 📋 Configuration Step-by-Step

### Si vous utilisez **cron-job.org** :

1. **Create Cronjob**
2. Remplir les champs:
   - **Title**: `Trading AI Auto-Scan`
   - **Address (URL)**: `https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan`
   - **Schedule**: Every 15 minutes (ou personnalisé)

3. **Advanced** → **Request Method**: POST

4. **Advanced** → **Headers**: Cliquer "Add header" 2 fois:
   ```
   Content-Type: application/json
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY
   ```

5. **Advanced** → **Request Body**: `{}`

6. **Save** et **Enable**

---

### Si vous utilisez **EasyCron** :

1. **Create Cron Job**
2. Remplir:
   - **Cron Job Name**: `Trading AI Auto-Scan`
   - **URL**: `https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan`
   - **Cron Expression**: `*/15 * * * *`
   - **HTTP Method**: POST

3. **HTTP Headers** (cliquer +):
   ```
   Content-Type: application/json
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY
   ```

4. **POST Data**: `{}`

5. **Create**

---

### Si vous utilisez **Supabase SQL** (Recommandé) :

Allez dans Supabase Dashboard → SQL Editor, et exécutez:

```sql
-- Enable cron extension
create extension if not exists pg_cron;

-- Schedule the job
select cron.schedule(
  'trading-ai-auto-scan',
  '*/15 * * * *',
  $$
  select
    net.http_post(
      url:='https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

Pour vérifier:
```sql
-- Voir les jobs
select * from cron.job;

-- Voir l'historique
select * from cron.job_run_details order by start_time desc limit 10;
```

---

## 🧪 Tester Manuellement

### Avec CURL:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bXRzZ3B5YnB3dHZxaWVybHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDE5ODYsImV4cCI6MjA3NjAxNzk4Nn0.Mz9ln7_i6gm0pBKQE-4W0Txl5tl1qCoiCSUnJNkYHvY" \
  -d '{}' \
  https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan
```

### Avec Postman:
1. Méthode: **POST**
2. URL: `https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer eyJh...`
4. Body (raw JSON): `{}`
5. **Send**

---

## ✅ Réponse Attendue

Si tout fonctionne, vous devriez recevoir:

```json
{
  "message": "Auto-scan completed",
  "scanned": 5,
  "users": 1
}
```

Ou si aucun utilisateur avec auto-scan activé:
```json
{
  "message": "No users with auto-scan enabled",
  "scanned": 0
}
```

---

## 🔍 Vérification des API Keys

### ✅ Polygon.io
```bash
curl "https://api.polygon.io/v2/aggs/ticker/C:EURUSD/range/15/minute/$(date -d '1 hour ago' +%s)000/$(date +%s)000?apiKey=_OSxpOFyFmoejpLLo1qnJ7r4e4Ajie9F"
```

**Résultat attendu**: JSON avec données de marché

### ✅ OpenAI (optionnel)
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer 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"
```

**Résultat attendu**: Liste des modèles disponibles

---

## ⚙️ Fréquences Alternatives

- **Toutes les 5 minutes**: `*/5 * * * *`
- **Toutes les 10 minutes**: `*/10 * * * *`
- **Toutes les 15 minutes** (recommandé): `*/15 * * * *`
- **Toutes les 30 minutes**: `*/30 * * * *`
- **Toutes les heures**: `0 * * * *`
- **Toutes les 4 heures**: `0 */4 * * *`
- **1 fois par jour à 9h**: `0 9 * * *`

---

## 📊 Monitoring

### Dans l'Application:
1. Allez dans **History**
2. Voyez tous les scans automatiques
3. Filtrez par type: `SCAN_STARTED`

### Dans Supabase:
1. Dashboard → Edge Functions → auto-scan
2. Onglet **Logs**
3. Voyez les exécutions en temps réel

### Polygon.io Usage:
1. https://polygon.io/dashboard
2. Voyez votre consommation API
3. Free tier: 5 calls/minute

---

## ⚠️ Important

1. **N'oubliez pas** d'activer Auto-Scan dans Settings de l'app
2. **Sélectionnez** vos paires préférées
3. **Configurez** l'intervalle de scan
4. **Sauvegardez** les settings (maintenant fixé!)

Le cron job ne scannera QUE pour les utilisateurs avec `auto_scan_enabled = true` dans leurs settings.

---

## 🎯 Résumé Ultra-Rapide

**URL**: `https://wumtsgpybpwtvqierlxr.supabase.co/functions/v1/auto-scan`
**Méthode**: POST
**Headers**: `Content-Type: application/json` + `Authorization: Bearer eyJh...`
**Body**: `{}`
**Fréquence**: Toutes les 15 minutes

C'est tout! 🚀
