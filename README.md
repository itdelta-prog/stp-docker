```bash
project-root/
├── docker-compose.yml
├── nginx/
│   ├── nginx.conf        # Main Nginx configuration
│
├── laravel-keyword-planner/       # Laravel API
├── trends/        # Python Pytrends API
└── scraper/       # Node Scraper API
```

---

# 🚀 Setup Instructions

### 1. Clone repository

### 2. Laravel (Planner API)

1. Copy credentials:

```bash
cp planner/google_ads_php.ini.example planner/google_ads_php.ini
```

Fill in **Google Ads API credentials**. Same with .env

2. Install dependencies **inside container**:

```bash
docker compose up -d
docker exec -it stp-docker-planner-1 composer install
docker exec -it stp-docker-planner-1 php artisan key:generate
```

---

### 3. Python (Trends API)

Dependencies installed automatically during Docker build. Need credentials.json and .env file. Read pytrends-api/README.md
---

### 4. Node (Scraper API)

Dependencies installed automatically during Docker build.

---

### 5. Build & Start All Containers

```bash
docker compose build
docker compose up -d
```

---

# 🌐 Services Endpoints

| Service | Endpoint                             | Description                  |
| ------- | ------------------------------------ | ---------------------------- |
| Laravel | `/planner/historical-metrics/...`    | Historical metrics           |
| Laravel | `/planner/customers/list`            | List of customers            |
| Laravel | `/planner/create/customer`           | Create new customer          |
| Python  | `/trends/`                           | Health check                 |
| Python  | `/trends?q=word1,word2`              | Get trends                   |
| Python  | `/trends/login`                      | Login                        |
| Python  | `/trends/sheet?q=...`                | Save trends to Google Sheets |
| Node    | `/scraper/api/get-data?category=URL` | Scrape category page         |



From nginx you could just run localhost:8181/report/sheet?q=iphone

Note, that with VPN pytrends can have some problem. 