**Online Testing**
This repo is now set up so you can keep local development exactly as it is while also running a separate public test deployment.

**Local Dev**
- Frontend stays local with `yarn start` in [frontend](/C:/Users/jantz/Documents/luayou/luayou/frontend)
- Backend stays local with `uvicorn server:app --host 0.0.0.0 --port 8001 --reload` in [backend](/C:/Users/jantz/Documents/luayou/luayou/backend)
- Your existing local `.env` files remain separate from hosted testing

**Hosted Test Stack**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

**Files Added**
- [render.yaml](/C:/Users/jantz/Documents/luayou/luayou/render.yaml): Render blueprint for the backend
- [backend/.env.example](/C:/Users/jantz/Documents/luayou/luayou/backend/.env.example): backend env template for hosted setup
- [frontend/.env.example](/C:/Users/jantz/Documents/luayou/luayou/frontend/.env.example): frontend env template
- [frontend/vercel.json](/C:/Users/jantz/Documents/luayou/luayou/frontend/vercel.json): SPA rewrite config for Vercel

**Render Backend Setup**
1. Push this repo to GitHub.
2. In Render, create a new Web Service from the repo.
3. If Render detects [render.yaml](/C:/Users/jantz/Documents/luayou/luayou/render.yaml), use that blueprint.
4. In Render environment variables, fill in the real values from [backend/.env.example](/C:/Users/jantz/Documents/luayou/luayou/backend/.env.example):
   `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_USE_TLS`, `REQUIRE_EMAIL_VERIFICATION`
5. After deploy, copy the public backend URL.

**Vercel Frontend Setup**
1. In Vercel, import the same GitHub repo.
2. Set the project root directory to `frontend`.
3. Build command: `yarn build`
4. Output directory: `build`
5. Add `REACT_APP_BACKEND_URL` and point it to your Render backend URL.
6. Deploy and copy the frontend URL.

**Connect Frontend And Backend**
1. Take the Vercel frontend URL.
2. Add it to `CORS_ORIGINS` in Render, for example:
   `https://your-frontend-domain.vercel.app`
3. Redeploy the backend if needed.

**Important**
- Do not upload your real local `.env` files.
- Rotate any secrets that were ever stored in the repo locally.
- Hosted test and local dev should use different secrets when possible.
- If Gmail is used for verification in the hosted test, keep using a valid Gmail App Password.

**Quick Deploy Summary**
- Local testing remains unchanged.
- Hosted testing uses:
  frontend on Vercel
  backend on Render
  database on MongoDB Atlas
