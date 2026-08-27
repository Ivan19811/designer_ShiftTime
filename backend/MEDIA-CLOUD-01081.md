# 01081 · Media Cloud Storage R2/S3

Binary files never go into PostgreSQL. `media_cloud_assets` stores only object metadata and lifecycle state.

## Provider configuration

Set backend-only environment variables from `.env.example`:

- `MEDIA_STORAGE_PROVIDER=r2`
- `MEDIA_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `MEDIA_S3_REGION=auto`
- `MEDIA_S3_BUCKET=<bucket>`
- `MEDIA_S3_ACCESS_KEY_ID=<R2 access key>`
- `MEDIA_S3_SECRET_ACCESS_KEY=<R2 secret>`
- optional `MEDIA_PUBLIC_BASE_URL=https://media.example.com`

Do not put these credentials into frontend files.

## Browser upload

1. Browser asks authenticated ShiftTime API to prepare an upload.
2. Backend validates Store membership, MIME, size and SHA-256.
3. Backend inserts an `uploading` metadata row and returns a short-lived presigned PUT URL.
4. Browser uploads bytes directly to R2/S3.
5. Browser calls `complete`.
6. Backend performs `HeadObject`, verifies size/MIME and marks the asset `ready`.
7. For images, a `thumbnail` derivative job is created with `pending` status for a future worker.
8. MarketplaceStore stores only Media ID/URL/metadata.

## R2 CORS

Apply a bucket CORS policy matching the Studio origin. A starting template is `storage/r2-cors.example.json`.

## Delivery

If `MEDIA_PUBLIC_BASE_URL` is configured, public media delivery redirects to that stable CDN/custom-domain URL. Otherwise `/api/v1/public/media/:assetId` redirects to a short-lived signed GET URL.
