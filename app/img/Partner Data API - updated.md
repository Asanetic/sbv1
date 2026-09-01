# Partner Data API

**Base URL:** `https://sandbox.octaneobit.com/orb/api/octanev4/partner`

Read-only endpoints unless otherwise noted. All JSON. Results are automatically scoped to your account — you don't need to pass a site ID.

---

## 1. Authentication

Send your token in the Authorization header on every request:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

Watch the spacing. Exactly one space after `Bearer`. Two spaces breaks it silently.

---

## 2. Read endpoints (GET)

| Endpoint | What it returns | Optional filters |
|---|---|---|
| [`/fuelstations`](#21-get-fuelstations) | Your fuel stations | none |
| [`/pumps`](#22-get-pumps) | Pumps, with nozzles included | `fuelStationId` |
| [`/fuelsales`](#23-get-fuelsales) | Fuel sale transactions | `fuelStationId`, `pump`, `pumpNozzleId` |
| [`/merchants`](#24-get-merchants) | Merchant / company records | none |

All filter values must be base64-encoded — see [§3](#3-filter-values-must-be-base64-encoded). All GET endpoints also accept the pagination/sorting params in [§5](#5-pagination--sorting-optional-plain-text--no-encoding) and share the response envelope and error shapes in [§6](#6-response-envelope--errors).

---

### 2.1 GET /fuelstations

```bash
curl "https://sandbox.octaneobit.com/orb/api/octanev4/partner/fuelstations" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

No filters — returns every station scoped to your account.

**Sample response**

```json
{
  "status": "success",
  "message": "Fuel stations data retrieved",
  "data": [
    {
      "record_id": "STN00001",
      "station_name": "Example Fuel Station",
      "station_code": "EX-001",
      "country": "Kenya",
      "county": "Example County",
      "region": "Example Region",
      "location": "Example Town, along Example Road",
      "contact_number": "+254700000000",
      "email": "station@example.com",
      "manager_name": "John Doe",
      "status": "active",
      "latitude": "-1.00000",
      "longitude": "37.00000",
      "google_maps_link": "https://maps.google.com/?q=-1.00000,37.00000",
      "opening_hours": "06:00-22:00",
      "is_operational": 1,
      "has_atg_system": 1,
      "licence_number": "LIC-0000-00000",
      "licence_expiry_date": "2027-03-31",
      "erp_integration_code": "ERP-EX001",
      "till_number": "000000",
      "paybill_number": "000000",
      "bank_account_name": "Example Fuels Ltd",
      "bank_account_number": "0000000000",
      "default_payment_mode": "M-Pesa",
      "storage_capacity_litres": 40000,
      "additional_details": null,
      "created_on": "2026-06-30 08:28:03"
    }
  ],
  "pagination": {
    "total_records": 6,
    "page_count": 1,
    "current_page": 1,
    "page_size": 20,
    "first_row": 1,
    "last_row": 6,
    "has_next": false,
    "has_prev": false
  }
}
```

**Field reference**

| Field | Description |
|---|---|
| `record_id` | Unique station identifier. Use this value for `fuelStationId` filters on other endpoints |
| `station_name` / `station_code` | Display name and short code |
| `country` / `county` / `region` / `location` | Geographic details |
| `contact_number` / `email` / `manager_name` | Station contact info |
| `status` | `active` / presumably `inactive` — confirm full enum |
| `latitude` / `longitude` / `google_maps_link` | Map coordinates |
| `opening_hours` | Free-text operating hours |
| `is_operational` | `1`/`0` — whether the station is currently trading |
| `has_atg_system` | `1`/`0` — whether an Automatic Tank Gauge is installed |
| `licence_number` / `licence_expiry_date` | Regulatory licence details |
| `erp_integration_code` | Code used to match this station in your own ERP, if applicable |
| `till_number` / `paybill_number` | M-Pesa collection details |
| `bank_account_name` / `bank_account_number` | Settlement bank account |
| `default_payment_mode` | Default payment method recorded at this station |
| `storage_capacity_litres` | Total tank storage capacity |
| `additional_details` | Free-text notes, often `null` |
| `created_on` | Record creation timestamp |

---

### 2.2 GET /pumps

```bash
curl "https://sandbox.octaneobit.com/orb/api/octanev4/partner/pumps?fuelStationId=BASE64_VALUE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Optional: `?fuelStationId=` to filter to one station (base64-encoded, see [§3](#3-filter-values-must-be-base64-encoded)).

**Sample response**

```json
{
  "status": "success",
  "message": "Fuel pumps data retrieved",
  "data": [
    {
      "record_id": "PMP00006",
      "fuel_station_id": "STN00001",
      "pump_id": "6",
      "pump_name": "6",
      "manufacturer": "",
      "model_number": "",
      "installation_date": "2026-06-30",
      "status": "active",
      "created_on": "2026-06-30 08:28:03",
      "_fuel_stations_station_name_fuel_station_id": "Example Fuel Station",
      "nozzles": [
        {
          "pump_id": "PMP00006",
          "nozzle_label": "1",
          "fuel_type": "VPOWER",
          "tank_reference": "TNK00001"
        },
        {
          "pump_id": "PMP00006",
          "nozzle_label": "3",
          "fuel_type": "DIESEL",
          "tank_reference": "TNK00001"
        }
      ]
    }
  ],
  "pagination": {
    "total_records": 6,
    "page_count": 1,
    "current_page": 1,
    "page_size": 20,
    "first_row": 1,
    "last_row": 6,
    "has_next": false,
    "has_prev": false
  }
}
```

**Field reference — pump record**

| Field | Description |
|---|---|
| `record_id` | Unique pump identifier. **Use this value (not `pump_id`) when filtering `/fuelsales?pump=`** |
| `fuel_station_id` | The station this pump belongs to |
| `pump_id` | Human-readable pump number as displayed at the station (e.g. `"1"`–`"6"`) — for display only |
| `pump_name` | Display label, currently mirrors `pump_id` |
| `manufacturer` / `model_number` | Equipment details (often blank in sandbox data) |
| `installation_date` | Date the pump was installed |
| `status` | `active` / presumably `inactive` — confirm full enum |
| `created_on` | Record creation timestamp |
| `_fuel_stations_station_name_fuel_station_id` | Joined station name, for display convenience |
| `nozzles[]` | Array of nozzles attached to this pump (max 10) |

**Field reference — nozzle object (nested in `nozzles[]`)**

| Field | Description |
|---|---|
| `pump_id` | ⚠️ Despite the name, this holds the **parent pump's `record_id`** (e.g. `PMP00006`), not the display `pump_id` number. Don't confuse the two |
| `nozzle_label` | Nozzle number on the pump (e.g. `"1"`, `"2"`, `"3"`) |
| `fuel_type` | Fuel grade dispensed by this nozzle (`VPOWER`, `DIESEL`, `UNLEADED`, etc.) |
| `tank_reference` | Underground tank this nozzle draws from |

---

### 2.3 GET /fuelsales

```bash
curl "https://sandbox.octaneobit.com/orb/api/octanev4/partner/fuelsales?fuelStationId=BASE64_VALUE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Optional: `?fuelStationId=`, `&pump=`, `&pumpNozzleId=` (each value base64-encoded, see [§3](#3-filter-values-must-be-base64-encoded)). `pump` and `pumpNozzleId` take the `record_id` values from `/pumps`, not the display pump number.

**Sample response**

```json
{
  "status": "success",
  "message": "Fuel sales data retrieved",
  "data": [
    {
      "primkey": 10482,
      "record_id": "FS-20260830-0001",
      "sale_date": "2026-08-30T14:22:10.000Z",
      "pump": "PMP00003",
      "pump_nozzle_id": "NOZ00003A",
      "fuel_type": "Diesel",
      "quantity_sold_litres": 45.75,
      "sale_price_per_litre": 182.50,
      "total_amount": 8349.38,
      "total_paid": 8349.38,
      "kra_id": "KRA-INV-00001",
      "sold_by_staff_id": "STF00001",
      "shift_id": "SHF00001",
      "fuel_station_id": "STN00001",
      "sale_method": "M-Pesa",
      "vehicle_plate": "KAA 000A",
      "customer_id": "CMP00001",
      "_fuel_pumps_pump_name_pump": "Pump 3",
      "_fuel_pump_nozzles_nozzle_label_pump_nozzle_id": "Nozzle A",
      "_system_users_name_sold_by_staff_id": "John Doe",
      "_shifts_shift_name_shift_id": "Morning Shift",
      "_fuel_stations_station_name_fuel_station_id": "Example Fuel Station",
      "_clients_client_name_customer_id": "Example Corp"
    },
    {
      "primkey": 10481,
      "record_id": "FS-20260830-0000",
      "sale_date": "2026-08-30T13:58:47.000Z",
      "pump": "PMP00001",
      "pump_nozzle_id": "NOZ00001B",
      "fuel_type": "Petrol",
      "quantity_sold_litres": 20.00,
      "sale_price_per_litre": 194.20,
      "total_amount": 3884.00,
      "total_paid": 3884.00,
      "kra_id": "KRA-INV-00002",
      "sold_by_staff_id": "STF00002",
      "shift_id": "SHF00001",
      "fuel_station_id": "STN00001",
      "sale_method": "Cash",
      "vehicle_plate": null,
      "customer_id": null,
      "_fuel_pumps_pump_name_pump": "Pump 1",
      "_fuel_pump_nozzles_nozzle_label_pump_nozzle_id": "Nozzle B",
      "_system_users_name_sold_by_staff_id": "Jane Doe",
      "_shifts_shift_name_shift_id": "Morning Shift",
      "_fuel_stations_station_name_fuel_station_id": "Example Fuel Station",
      "_clients_client_name_customer_id": null
    }
  ],
  "pagination": {
    "total_records": 4820,
    "page_count": 2410,
    "current_page": 1,
    "page_size": 2,
    "first_row": 1,
    "last_row": 2,
    "has_next": true,
    "has_prev": false
  }
}
```

**Field reference**

| Field | Description |
|---|---|
| `record_id` | Unique transaction identifier. Use this as `fuelSaleId` when posting to the IPN listener ([§7](#7-posting-payment-confirmation--ipn-listener-post)) |
| `sale_date` | Timestamp the sale was recorded |
| `pump` | Pump's `record_id` (see `/pumps`), not the display pump number |
| `pump_nozzle_id` | Nozzle's `record_id` (see `nozzles[]` in `/pumps`) |
| `fuel_type` | Fuel grade dispensed (e.g. `Diesel`, `Petrol`) |
| `quantity_sold_litres` | Volume dispensed |
| `sale_price_per_litre` | Unit price at time of sale |
| `total_amount` | `quantity_sold_litres × sale_price_per_litre` |
| `total_paid` | Amount actually paid — compare against `total_amount` to detect under/over payment |
| `kra_id` | KRA e-tims invoice reference, if issued |
| `sold_by_staff_id` | Attendant who processed the sale |
| `shift_id` | Shift the sale falls under |
| `fuel_station_id` | Station where the sale occurred |
| `sale_method` | Payment method (e.g. `Cash`, `M-Pesa`, `Card`) |
| `vehicle_plate` | Vehicle plate, if captured — `null` when not recorded |
| `customer_id` | Linked client/customer record, if any — `null` for walk-in sales |
| `_fuel_pumps_pump_name_pump` | Joined pump display name, for convenience |
| `_fuel_pump_nozzles_nozzle_label_pump_nozzle_id` | Joined nozzle label |
| `_system_users_name_sold_by_staff_id` | Joined staff name |
| `_shifts_shift_name_shift_id` | Joined shift name |
| `_fuel_stations_station_name_fuel_station_id` | Joined station name |
| `_clients_client_name_customer_id` | Joined client/company name, if `customer_id` is set |

An empty result set (e.g. filtered to a station/pump with no matching sales) still returns `status: "success"` with `"data": []` and a `pagination` block showing `"total_records": 0`.

---

### 2.4 GET /merchants

```bash
curl "https://sandbox.octaneobit.com/orb/api/octanev4/partner/merchants" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

No filters — returns every merchant/company record scoped to your account.

**Sample response**

```json
{
  "status": "success",
  "message": "Merchants data retrieved",
  "data": [
    {
      "company_id": "CMP00001",
      "business_no": "BN-0000-0001",
      "name": "John Doe",
      "mobile": "+254700000000",
      "email": "john.doe@example.com",
      "business_name": "Example Corp",
      "location": "Example Business District",
      "specialty": "Example Industry",
      "remark": null,
      "logo": "https://cdn.example.com/logos/example-corp.png",
      "bank_name": "Example Bank",
      "account_no": "0000000000000",
      "pin_no": "P000000000X",
      "swort_code": "00000"
    }
  ],
  "pagination": {
    "total_records": 1,
    "page_count": 1,
    "current_page": 1,
    "page_size": 20,
    "first_row": 1,
    "last_row": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Field reference**

| Field | Description |
|---|---|
| `company_id` | Unique merchant identifier. Matches `customer_id` on `/fuelsales` records for this merchant |
| `business_no` | Business registration number |
| `name` | Contact person's name |
| `mobile` / `email` | Contact details |
| `business_name` | Registered/trading name — corresponds to `_clients_client_name_customer_id` on `/fuelsales` |
| `location` | Business address |
| `specialty` | Business category/industry |
| `remark` | Free-text notes, often `null` |
| `logo` | URL to the merchant's logo image |
| `bank_name` / `account_no` | Settlement bank account |
| `pin_no` | KRA PIN |
| `swort_code` | Bank branch/swift-style sort code |

---

## 3. Filter values must be base64-encoded

If you add any filter (like `fuelStationId=`), encode the value first. Plain text will not match.

```bash
# bash
echo -n "FS018" | base64
```
```python
# python
base64.b64encode(b"FS018").decode()
```
```javascript
// node
Buffer.from("FS018").toString("base64")
```
```powershell
# powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("FS018"))
```

---

## 4. Response envelope (all GET endpoints)

Every GET endpoint returns the same shape — only `message` and the contents of `data`/`pagination` differ:

```json
{
  "status": "success",
  "message": "...",
  "data": [ /* rows */ ],
  "pagination": {
    "total_records": 42,
    "page_count": 3,
    "current_page": 1,
    "page_size": 20,
    "first_row": 1,
    "last_row": 20,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 5. Pagination & sorting (optional, plain text — no encoding)

| Param | Example |
|---|---|
| `pageNo` | `?pageNo=2` |
| `pageSize` | `?pageSize=50` (max 2000, default 20) |
| `orderBy` | `?orderBy=saleDate` |
| `orderType` | `?orderType=DESC` |

---

## 6. Errors

| Status | `status` value | Meaning |
|---|---|---|
| 403 | `unauthorized` | Bad, missing, or expired token |
| 200 | `error` | Token is valid but your role lacks permission for this endpoint's data — `data` is `[]` |
| 500 | `error` | Server error |

**Bad/expired token**
```json
{
  "status": "unauthorized",
  "message": "Invalid signature"
}
```

**Valid token, insufficient role**
```json
{
  "status": "error",
  "message": "Access denied: role does not have permission to select fuel_sales",
  "data": []
}
```

**Server error**
```json
{
  "status": "error",
  "message": "Connection lost: The server closed the connection."
}
```

---

## 7. Posting payment confirmation — IPN Listener (POST)

Once a fuel transaction has been processed on your PDQ/payment terminal, post the result back to us here so we can mark the transaction as **PAID** on our side. This corresponds to steps 16–17 of the PayFuel payment flow (POS sends payment result → server updates fuel transaction as PAID).

**Endpoint**
```
POST https://sandbox.octaneobit.com/orb/api/octanev4/ipnlistener
```

**Headers**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Sample request body — DRAFT, TO BE CONFIRMED**

> ⚠️ The field names below are a proposed schema based on the payment flow diagram (transaction, pump/nozzle, amount, PDQ approval, status). They have **not** been verified against the live endpoint yet — confirm exact field names, types, and required/optional status internally before sharing this with Crystal Soft.

```json
{
  "fuelSaleId": "TXN00123",
  "fuelStationId": "FS018",
  "pumpId": "PMP04",
  "pumpNozzleId": "NZ01",
  "amount": 4500.00,
  "currency": "KES",
  "paymentStatus": "APPROVED",
  "paymentMethod": "CARD",
  "pdqReference": "PDQ-REF-8891234",
  "approvalCode": "AUTH00456",
  "transactionDate": "2026-08-31T10:15:00Z"
}
```

| Field | Description |
|---|---|
| `fuelSaleId` | The transaction ID returned by `/fuelsales` for the sale being paid |
| `fuelStationId` | Station identifier (plain text in this body — not base64, unlike GET filters) |
| `pumpId` / `pumpNozzleId` | Pump and nozzle that dispensed the fuel |
| `amount` / `currency` | Amount charged and currency |
| `paymentStatus` | e.g. `APPROVED` / `DECLINED` — confirm accepted enum values |
| `paymentMethod` | e.g. `CARD`, `MOBILE_WALLET`, `QR` — confirm accepted values |
| `pdqReference` | Reference/receipt number from the PDQ terminal |
| `approvalCode` | Bank/processor authorization code, if applicable |
| `transactionDate` | ISO 8601 timestamp of when payment was processed |

**Expected response**

```json
{
  "status": "success",
  "message": "Fuel transaction updated as PAID"
}
```

On failure, expect the same error shapes as [§6](#6-errors) (403 for bad/expired token, 500 for server error) — confirm whether a 4xx is also returned for a `fuelSaleId` that doesn't exist or is already marked PAID.

---

Questions or need a token? Contact us directly — don't share tokens over email/chat that isn't secure.
