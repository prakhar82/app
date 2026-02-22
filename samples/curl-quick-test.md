# Quick local checks (after docker compose up)

# 1) DEV login
curl -X POST http://localhost:8080/api/identity/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@grocery.local\",\"password\":\"Admin@123\"}"

# 2) Catalog list
curl http://localhost:8080/api/catalog/catalog/products

# 3) Inventory list (requires token)
# Replace TOKEN value with accessToken from login response
curl http://localhost:8080/api/inventory/inventory/items -H "Authorization: Bearer TOKEN"

# 4) Checkout COD
curl -X POST http://localhost:8080/api/orders/orders/checkout -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d "{\"userEmail\":\"user@grocery.local\",\"paymentMethod\":\"COD\",\"items\":[{\"sku\":\"SKU-ORANGE\",\"name\":\"Orange\",\"qty\":2,\"unitPrice\":60.0}]}"
