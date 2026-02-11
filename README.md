# Website-React-FBD

## Access Model

- `public` (not signed in): sees intro + public meditations.
- `visitor` (signed in): can open app links and member pages (Art/YouTube).
- `full` (signed in): can also load full article and PDF library data.

Article and PDF payloads are served by server endpoints and require a valid full-access session cookie:

- `GET /api/articles` (full only)
- `GET /api/pdfs` (full only)
- `GET /api/meditations` (public)

## Auth Environment Variables

Set these in Vercel project settings:

- `AUTH_SESSION_SECRET` (required for secure signed session cookies)
- `VISITOR_EMAIL`
- `VISITOR_PASSWORD`
- `FULL_EMAIL`
- `FULL_PASSWORD`
