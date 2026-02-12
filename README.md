# Website-React-FBD

## Access Model

- `public` (not signed in): sees intro + public meditations.
- `visitor` (signed in): can open app links and member pages (Art/YouTube).
- `full` (signed in): can also load full article and PDF library data, and manage school content.

Article and PDF payloads are served by server endpoints and require a valid full-access session cookie:

- `GET /api/articles` (full only)
- `GET /api/pdfs` (full only)
- `GET /api/meditations` (public)
- `GET /api/school` (visitor/full)
- `POST /api/school/questions` (visitor/full)
- `POST /api/school/announcements` (full only)
- `POST /api/school/assignments` (full only)
- `POST /api/school/resources` (full only)
- `GET /api/school/whiteboards` (visitor/full, optional `?id=<whiteboardId>` for full board data)
- `POST /api/school/whiteboards` (visitor/full, create whiteboard)
- `PUT /api/school/whiteboards` (visitor/full, save/update whiteboard)

School data is stored in a lightweight JSON database at `/tmp/lastday-school-db.json` by default.
You can override this with `SCHOOL_DB_PATH`.

The School whiteboard is built with the free `react-sketch-canvas` library and supports:
- save to school database
- export to PNG
- export to JSON path data

## Auth Environment Variables

Set these in Vercel project settings:

- `AUTH_SESSION_SECRET` (required for secure signed session cookies)
- `VISITOR_EMAIL`
- `VISITOR_PASSWORD`
- `FULL_EMAIL`
- `FULL_PASSWORD`
- `SCHOOL_DB_PATH` (optional override for the school JSON database file path)
