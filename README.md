# UrbanThread React storefront

React + Vite client for the Django REST API in `../urbanthread`.

## Run locally

1. Start Django from the `urbanthread` directory:

   ```powershell
   .\venv\Scripts\Activate.ps1
   python manage.py migrate
   python manage.py runserver 127.0.0.1:8000
   ```

   If the virtual environment is at the workspace root, activate it with `..\venv\Scripts\Activate.ps1` instead. Create an admin account with `python manage.py createsuperuser` when needed.

2. In this directory, install frontend dependencies and start Vite:

   ```powershell
   npm install
   npm run dev
   ```

3. Open the URL Vite prints (normally `http://localhost:5173`). The client sends requests to `http://127.0.0.1:8000` by default. Set `VITE_API_URL` in a local `.env` file to use another Django API origin.

## Connected flows

- Register and sign in through Django JWT endpoints. Tokens refresh automatically and logout blacklists the refresh token.
- Browse products, categories, brands, sizes and colors; product detail checks real inventory variants before adding them to the cart.
- Manage delivery addresses in Profile, then place an order from Cart with a coupon and either cash on delivery or SSLCommerz.
- Review orders, cancel eligible orders, inspect payment history, and submit product reviews.

The backend API docs are available at `http://127.0.0.1:8000/api/docs/` while Django is running.
