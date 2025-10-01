
# Google Ads Keyword Planner API – Laravel Service

This project provides several API endpoints to work with the Google Ads Keyword Planner, including retrieving historical metrics, listing accessible customers, and creating new client accounts (via MCC).

---

## 🔹 Project Setup

1. Copy the example Google Ads SDK configuration:

```bash
cp google_ads_php.ini.example google_ads_php.ini
```

2. Open `google_ads_php.ini` and fill in your sensitive credentials:

```ini
clientId = YOUR_CLIENT_ID
clientSecret = YOUR_CLIENT_SECRET
refreshToken = YOUR_REFRESH_TOKEN
loginCustomerId = YOUR_LOGIN_CUSTOMER_ID  ; Required only if using MCC
developerToken = YOUR_DEVELOPER_TOKEN
```

> ⚠️ `loginCustomerId` is required only when working with client accounts through an MCC. For a standard account, it can be left empty.

3. Copy `.env` and generate the Laravel application key:

```bash
cp .env.example .env
php artisan key:generate
```

4. Set up the storage link (for logs, files, etc.):

```bash
php artisan storage:link
```

5. Start the Laravel development server:

```bash
php artisan serve
```

---

## 🔹 Available Endpoints

### 1. Retrieve Historical Keyword Metrics

```
GET /historical-metrics/{customer_id}?keywords=keyword1,keyword2
```

**Parameters:**

* `customer_id` – Google Ads account ID (without dashes)
* `keywords` – comma-separated list of keywords

**Example:**

```
GET /historical-metrics/5872432115?keywords=iphone,macbook
```

**Response:**

```json
[
    {
        "search_query": "iphone",
        "search_query_variants": "iphon,iphones",
        "approximate_avg_monthly_searches": "1000000",
        "competition_level": "HIGH",
        "competition_index": 85,
        "percentile_20th": 2000000,
        "percentile_80th": 5000000,
        "monthly_search_volumes_data": [
            { "monthly_search_volume": 80000, "month_of_year": "JANUARY", "year": 2025 },
            ...
        ]
    }
]
```

---

### 2. List Accessible Customers

```
GET /customers/list
```

**Description:**
Returns all `customer_id`s accessible by the `refreshToken` of the current user.

**Example Response:**

```json
{
    "accessible_customers": ["1234567890", "5872432115"]
}
```

---

### 3. Create a New Client Account (via MCC)

```
GET /create/customer
```

**Parameters (JSON Body):**

```json
{
    "descriptive_name": "new_user_1"
}
```

**Description:**
Creates a new client account under the MCC specified in `loginCustomerId`.

**Example Response:**

```json
{
    "message": "Created a customer with resource name \"customers/9876543210\" under the manager account with customer ID 4396097849"
}
```

> ⚠️ The `refreshToken` must belong to a user with admin access to the MCC. A standard account cannot create clients.

---

### 🔹 Notes

* Ensure your `developerToken` is active and has **Standard Access**; otherwise, client creation will be blocked.
* All `customer_id`s must be specified **without dashes** (e.g., `5872432115`).
* When working with MCC, always set `loginCustomerId` in `google_ads_php.ini`.
* For historical metrics with a standard account (non-MCC), `loginCustomerId` is **not required**.
