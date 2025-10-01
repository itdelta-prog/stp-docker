# Scraper


## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone
cd php-scraper
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
npm start
# or, during development (with auto-restart)
npm run dev
```

> 💡 `nodemon` is used in dev mode. Install it globally or locally:
> 
> ```bash
> npm install -g nodemon
> # or
> npm install -D nodemon
> ```

---

## API Usage

### `GET /api/get-data`

#### Example:

```http
GET http://localhost:3000/api/get-data?category=https://category-url
```

#### Example Response:

```json
{
  "category": "category name",
  "topProduct": "Apple iPhone 15",
}
```