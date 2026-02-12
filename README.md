# Website-React-FBD

## Access Model

- `public` (not signed in): sees landing and can open Bible Mastery Lab from Home.
- `visitor` (signed in): can open member routes and activity links.
- `full` (signed in): can also load full article and PDF library data, and manage school content.

## Main Routes

- `#/` Home (simplified landing hub + daily rotating masterworks panel)
- `#/activities` member route for external apps and activity links
- `#/reflections` member route for sacred media, liturgy, and daily thoughts
- `#/library` full-access articles, PDFs, and site assistant
- `#/art` member page
- `#/youtube` member page
- `#/school` member page

When signed out, the Home quick-launch grid shows only Bible Mastery Lab; other route cards appear after sign-in.

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
- `POST /api/school` (full only, set `action: "assistant"` for site guide assistant)

School data is stored in a lightweight JSON database at `/tmp/lastday-school-db.json` by default.
You can override this with `SCHOOL_DB_PATH`.

The School whiteboard is built with the free `react-sketch-canvas` library and supports:
- save to school database
- multi-page annotations per board
- PDF upload to background (one uploaded PDF page becomes one annotatable board page)
- expanded large-window mode for focused writing
- export current page to PNG
- export whole board as JSON path data

The School page also includes a built-in compact video panel using `meet.jit.si` for 1:1 or small-group sessions.
The Home page includes a full-access Site Guide Assistant that answers navigation/content questions.

## Auth Environment Variables

Set these in Vercel project settings:

- `AUTH_SESSION_SECRET` (required for secure signed session cookies)
- `VISITOR_EMAIL`
- `VISITOR_PASSWORD`
- `FULL_EMAIL`
- `FULL_PASSWORD`
- `SCHOOL_DB_PATH` (optional override for the school JSON database file path)
- `OPENAI_API_KEY` (optional for LLM-backed assistant responses)
- `OPENAI_MODEL` (optional, default `gpt-4o-mini`)
