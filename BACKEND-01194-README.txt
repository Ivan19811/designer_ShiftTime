ShiftTime Builder — BACKEND 01194
=================================
Purpose: synchronize the GitHub/Render backend with the current Builder 01193 backend and fix login from the canonical Live Server origin.

WHY FULL BACKEND SYNC IS REQUIRED
- GitHub main still had the older 01081 server/config layer.
- That server did not contain the current POST /api/v1/auth/login route used by Builder 01193.
- Updating only CORS would therefore expose the next incompatibility immediately.
- This package contains the complete current backend tree plus the root render.yaml.

01194 CHANGES
- backend package/release metadata -> 01194 / 0.11.94
- config stage -> 01194
- health and generic error responses use config.stage
- current auth/context/admin/tables/site publishing/cloud-sites backend is included
- production CORS accepts http://127.0.0.1:5544 through the configured loopback rule
- render.yaml uses rootDir: backend
- Render start command: npm run db:migrate && npm start
- CORS allowlist contains Netlify + localhost:* + 127.0.0.1:*

UPLOAD
1. Upload/replace the contents of backend/ in the GitHub repository, preserving paths.
2. Replace the repository-root render.yaml with the one in this package.
3. Do not upload node_modules (it is intentionally not included).
4. Let Render auto-deploy the new commit.

VERIFY AFTER RENDER DEPLOY
- Open https://designer-shifttime.onrender.com/health
- The response should identify stage 01194 (database may report unavailable only if Render DB configuration itself has a problem).
- Then reload Builder at http://127.0.0.1:5544/index.html and test login.
- Browser preflight for /api/v1/auth/login should receive Access-Control-Allow-Origin: http://127.0.0.1:5544.

LOCAL VERIFICATION BEFORE PACKAGING
- npm run check: PASS
- backend tests: 78/78 PASS
- direct applyCors preflight probe for http://127.0.0.1:5544: PASS
