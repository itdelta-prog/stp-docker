# Pytrends API

Flask API for Google Trends + Google Sheets integration.
Supports Google OAuth2 login and can be run locally or in Docker.

---

## 🚀 Setup

```bash
git clone <repo_url>
cd pytrends-api
cp .env.example .env
```

Add `credentials.json` to project root.

### Run locally

```bash
pip install -r requirements.txt
python app.py
```

→ available at `http://localhost:8000`

### Run with Docker

```bash
docker build -t pytrends-api .
docker run -p 25001:8000 pytrends-api
```

→ available at `http://localhost:25001`

---

## 🔗 Endpoints

* **GET /** → health check
* **GET /login** → Google OAuth2 login
* **GET /callback** → OAuth2 callback
* **GET /trends?q=keyword** → get Google Trends data
* **GET /sheet?q=keyword** → save data to Google Sheets

Errors:
`400` missing parameter · `404` no data · `429` too many requests
