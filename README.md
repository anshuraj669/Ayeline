# Ayeline 🗳️

*Aye* is how a council member votes yes. **Ayeline** is your line to the people casting those votes.

### Decisions about your street shouldn't hide in a PDF.

Every week, somewhere in a big city, a few people in a room decide your rent rules, your bus route, your water bill, your parking and the park your kids play in. The agenda is public, but it's a long document in legal language, posted on a website nobody visits, with a comment deadline that's gone before most residents hear about it.

**Ayeline turns that agenda into something you'd actually open.** Every item gets a plain-language headline, a note on what it means *for you*, both sides of the argument, what it costs, and a one-minute way to tell the decision-makers what you think before they vote.

It works for a city council, a municipal ward, or the managing committee of a 900-flat housing society. Wherever a small group decides for a big one, Ayeline is the window between them.

> Built for the **Hyperbloom October: UI/UX & Web Design Hackathon**. The demo city, Bloomfield, is fictional, but its agenda items are modelled on real council agendas.

---

## In 60 seconds

1. **Tell it who you are.** Renter, bus rider, student, parent, senior, business owner… plus where you live. That takes 15 seconds, and nothing leaves your device.
2. **Your feed reorders itself.** The items that touch your life rise to the top, each with a reason: *"Because you rent…"*.
3. **Flip one switch to see the original wording.** *"Consideration of Ordinance 2026-112 approving a Zone Change from C-2…"* becomes *"Turn the empty Kmart lot into 240 apartments."* This is the moment people get it.
4. **Swipe through the whole agenda in a minute** with Quick take: right for support, left for oppose, up if you're not sure.
5. **Speak up.** Pick a stance, tap a sentence starter that's already filled in with *"As a renter in Eastgate, …"*, and send. You're told you're one of 220 neighbors who weighed in, and how to speak in person if you want to.
6. **See what happened.** After the vote, My voice shows how each member voted, so your effort has a visible ending.

---

## Features

### 🧭 Understand
| Feature | What it does |
| --- | --- |
| **Personal feed** | Items are sorted by whether they affect you, with "For you" notes written for each type of resident |
| **Plain ↔ official language** | One switch flips every card over to show the original wording, so people can see exactly what was simplified |
| **Item pages** | What it means for you and for others, the cost, where it's happening, why some support it and why some oppose it, and a timeline of where it is now |
| **Map** | A 3D model of the neighborhoods with a pin for each item. Pick a district to raise it and list what's happening there |
| **⌘K search** | Press Ctrl/⌘+K anywhere to find any item by topic, place or keyword, using only the keyboard |

### ⚡ Decide
| Feature | What it does |
| --- | --- |
| **Quick take** (`/swipe`) | The agenda as a stack of cards. Drag, tap or use the arrow keys, with undo. Items that affect you come first |
| **Neighbor sentiment** | Every item shows how residents have leaned so far |
| **Countdown** | A ring on the home page empties as the comment deadline approaches |

### 🗣️ Speak
| Feature | What it does |
| --- | --- |
| **Have your say** | Three stances, sentence starters, a length meter and an optional name. One minute from start to sent |
| **Quick take to comment** | Any swipe can be turned into a real comment with one tap |
| **Speak in person** | Simple steps for showing up at the meeting itself |

### 🔁 Follow through
| Feature | What it does |
| --- | --- |
| **My voice** | Your comments, quick takes and followed items in one place, with the result once the vote happens |
| **"You're with 60% of neighbors"** | Each quick take shows how many residents agree with you |
| **Council chamber** | The decision-makers in a semicircle. Seats light up with each member's vote, or wait for the majority that's needed to pass. Hover a seat to meet the member |
| **Follow and share** | Bookmark items and send a link to a neighbor, with a toast to confirm |

### 🏙️ Live in the city (`/community`)
Decisions are only half of city life. The other half is the Dussehra mela in the park, the fireworks over the river, and the pothole on your street that nobody seems to report.

| Feature | What it does |
| --- | --- |
| **City notices** | Festivals, games, town halls and alerts from the city. The next event gets a large card with a tear-off calendar date, and each card has its own animated scene |
| **RSVP with a headcount** | "I'm going" in one tap, then + / − for how many are coming with you, so the city can plan buses, staff and space. Totals are shared by everyone |
| **Add to calendar** | Downloads an `.ics` file that works with Google, Apple and Outlook calendars |
| **Alerts** | Water main repairs, road closures and the like appear as a banner at the top, with no RSVP |
| **Report a problem** | A 311-style service desk: potholes, dark streetlights, missed garbage pickup, fallen trees, water leaks, blocked drains, graffiti and traffic signals. Give a location and neighborhood, optionally snap or drop in a **photo** of the problem, and get a printed request number (e.g. **PT-08**) |
| **Live queues** | Every phone sees the same queues. Follow your request from Reported to Crew on it to Fixed, with your place in line and a rough wait |
| **Dispatch board** | City staff unlock it with a PIN, send the next free crew to the next report in request order, and close jobs when they're fixed. Residents' screens update within a moment. First come, first served |
| **Around town** | My voice lists your open reports and the events you're going to |

---

## Made for any city, ward or housing society

Ayeline doesn't care what the room is called. Every decision-making body runs the same loop: **agenda → discussion → input → vote → outcome**. Only the words change.

| In Ayeline | City council | Municipal ward / corporation | Housing society / RWA | Campus or union |
| --- | --- | --- | --- | --- |
| Council | City council | Ward committee, corporators | Managing committee | Senate, executive board |
| Neighborhoods | Districts | Wards, sectors | Towers, wings, blocks | Hostels, departments |
| Meeting | Council meeting | Ward sabha | General body meeting / AGM | Board meeting |
| Agenda item | Ordinance, resolution | Proposal, works item | Maintenance hike, repairs, bylaw change | Policy, fee change |
| Public comment | Written comment | Suggestion or objection | Member feedback before the AGM | Student or staff input |
| Personas | Renter, bus rider, senior… | Shop owner, commuter… | Owner, tenant, senior, parent, pet owner, car owner… | Student, staff, resident… |
| Notice board | City events, road closures | Ward camps, water cuts | Festivals, tournaments, AGM, water-tank cleaning | Fests, matches, exams |
| Service desk | 311-style requests | Streetlight and drain complaints | AC, plumbing, electrician, housekeeping | Hostel maintenance |

**An example from a housing society.** Item 4: *"Proposal to revise monthly maintenance charges under bye-law 65 with effect from 1 April and to create a sinking fund for lift replacement."* In Ayeline it becomes: **"Maintenance goes up ₹600 a month to pay for new lifts in Towers B and D."** Tenants, owners and seniors each see what it means for them, the committee sees members' views before the AGM, and everyone sees the result afterwards.

### Adapt it for your community

Everything about the place lives in **one file, `src/lib/data.ts`**. It's plain TypeScript, with no CMS or database to set up, and TypeScript tells you if you miss a step (for example, a neighborhood with no map tile).

1. **The basics**
   - `CITY` is the name of your city or society.
   - `NEIGHBORHOODS` lists your wards, towers or wings.
   - `PERSONAS` lists the kinds of people who live there (`label`, `emoji`, and `who` for the phrase "As a ___").
   - `TOPICS` holds your categories and their colors.
   - `MEETINGS` has the dates and comment deadlines. Each meeting's title, time and place come from `PLACE.meeting`.
   - `ITEMS` is the agenda: an official title and text, a plain title and summary, `forYou` notes for each persona, arguments for and against, cost, timeline, and the result once it's decided.
   - `TODAY` pins the demo's "today". Point it at the real date for live use.
2. **`PLACE`, the wording about your community**
   - `words` is what to call things everywhere they appear: the body (`council` → `committee`), one `member` and several `members`, the `meeting` (→ `general body meeting`), the original wording (`council language` → `official wording`), who writes the agenda (`the city` → `the society office`), the whole `area`, and the label for items that affect `everywhere` (→ `society-wide`).
   - `sendLabel` is the comment button ("Send to City Council" → "Send to the committee").
   - `inPerson` lists the steps for speaking at the meeting in person.
   - `body` is who decides, as residents would say it (e.g. `"Sunrise Towers Managing Committee"`).
   - `roster` is the people who vote: name, seat and initials. `COUNCIL_SIZE` and the majority needed to pass are calculated from it.
   - `meeting` sets every meeting's `title`, `time` and `place`.
   - `venue` is where meetings happen, in a few words.
   - `hero` holds the home page headline, its accent line and the intro paragraph.
   - `searchHint` gives example searches for the ⌘K box.
   - `note` is the footer line.
   - `process` explains, in three steps, how input reaches the decision-makers.
3. **`MAP`, the 3D map**
   - Place each neighborhood as a one-tile square at grid position `x`, `y`, with a one-line `blurb`, and `tall: true` for a district of high-rises.
   - Add a `river` band, or set it to `null`.
   - The map resizes itself to fit whatever layout you give it.
4. **Community: notices and service requests**
   - `COMMUNITY` names who posts notices (`office`) and runs the service desk (`desk`), what a work unit is called (`crewLabel`), and the location field (`locationLabel`, `locationExample`).
   - `NOTICES` holds events and alerts: `kind` (festival, sports, alert or meeting), `art` (the animated scene: `diya`, `snow`, `fireworks`, `shuttle`, `water` or `plain`), date, time, venue, neighborhoods, a short body, optional `details`, and how many are already `going` (0 hides RSVP).
   - `SERVICES` is the list of problems residents can report: label, emoji, typical job length in `minutes`, the crews (`team`) who handle them (so several jobs can run at once), and a request `code`.
   - `SEED_JOBS` lists reports already in the queues the first time the server starts. Empty it for a real launch.
5. **Rebrand if you like.** Every color is a token at the top of `src/app/globals.css`.

---

## The design: "Blue Hour"

Ayeline is a **spatial interface** in the style of Apple's visionOS. Glass windows float in front of a city skyline just after sunset. Civic tech usually looks like a tax form; this is meant to look like somewhere you'd want to spend a minute.

- **Palette.** Deep lagoon teal and warm amber are complementary colors, like a dusk sky with the last light on the horizon. Aqua (`#6ff0d8`) is the "light" color. A marigold-to-coral gradient (`#ffd88a → #ff8f8f`) is kept for actions only, so the next step is always obvious. Coral and lilac are small accents, and each topic has its own soft pastel.
- **The scene: flying into the city.**
  - A slow, endless glide down a boulevard toward City Hall, which glows at the far end of the avenue. Buildings with lit windows stream past on both sides and rise out of the evening haze ahead.
  - Streetlights pass overhead and pool light on the road, the center line rushes by, and car headlights and tail lights move through the traffic.
  - The camera leans toward your mouse, and scrolling gives it a burst of speed.
  - A large glass lens hangs in the sky as a moon, with slowly turning rings. A soft light follows the pointer like gaze in a headset, and glowing specks drift upward.
  - Lights fade as they pass close by, and a soft wash sits behind the text, so the motion never fights the words.
- **Glass windows.** Panels catch light from the top-left and blur the city behind them. Key panels have a visionOS window handle underneath. Cards tilt toward the pointer, lift slightly, and a rim of light follows the cursor around their edge.
- **Type.** Bricolage Grotesque for headlines, Public Sans (the U.S. government's design-system typeface) for reading, and Instrument Serif italic for accent words.
- **Logo.** A lens with City Hall seen through it, catching a glint now and then.

## Animations

| Where | What moves |
| --- | --- |
| Background | A continuous flight down the avenue toward City Hall: buildings, windows, streetlights and traffic stream past. It leans with the mouse and speeds up as you scroll |
| First visit | The camera dives in from high above the rooftops at speed, then glides down to street level as the headline lands (once per browser session) |
| Card to item page | The card's title and topic tag fly across the screen and settle as the item page's heading. Going in slides the page forward, and "← Agenda" slides it back |
| Every other page change | The old page sinks back into the haze while the new one comes forward. The header, phone tab bar and moving city stay pinned and live throughout |
| Headlines | Words lift into place one by one |
| Hero | Call-to-action buttons lean toward the pointer, stat tiles count up and tilt, and a scroll cue drips downward |
| Scrolling | Cards and sections fade and tilt into view in a staggered order |
| Header and topic filter | The active option is a pill that glides between choices with a spring |
| Next-meeting countdown | The ring draws itself in, a light circles it, ripples pulse outward and the day count counts up |
| Agenda ticker | A news-style strip of items scrolls under the hero and pauses on hover |
| Cards | Support/oppose bars fill in, totals count up and "Near you" glows softly |
| Plain ↔ official switch | Each card flips over like a placard |
| Quick take | Cards follow your drag with 3D tilt, a stamp fades in, the background glows in the color you're leaning toward, and the next card steps forward. Finishing sets off a burst of sparks |
| Map | The selected district lifts on a spring, pins bob and ripple, and the river shimmers |
| Council chamber | The arc's dashes flow, seats pop in one by one with their vote, and empty seats rise and fall in a wave |
| Vote results and timeline | Vote dots pop in one by one, and the timeline fills step by step |
| Sending a comment | The form flies off toward City Hall, then a burst of sparks appears and a checkmark draws itself |
| ⌘K search | Springs forward out of the scene over a blurred backdrop, with a glowing marker on the selected result |
| Toasts | Confirmations float up from the bottom and sink away |
| Notice art | Diya flames flicker under a swaying marigold toran with rising embers; snow falls past blinking fairy lights; rockets climb and burst into fireworks; a shuttlecock rallies over the net; water drops fall onto a rolling wave |
| Notice cards | The tear-off date swings when you point at a card, and the "Up next" illustration floats |
| RSVP | The button pops into a headcount stepper, and attendee avatars pop in one by one |
| Service tiles | Icons hop and tilt on hover, and tiles lean toward the pointer |
| Reporting | The report window springs forward, then your request number prints out of a slot, with punched ticket edges. An attached photo develops like an instant print, from washed out to sharp |
| Queues | Requests glide forward on a spring as the line moves, and crews out on jobs pulse in place |
| Phone tab bar | The navigation floats up from the bottom on phones, with a sliding highlight |
| Buttons and chips | Light sweeps across buttons on hover, chips bounce when picked, and switches move with a spring |

Everything is CSS, a few small React hooks, one canvas and React's built-in `<ViewTransition>`, with **no animation library**. Browsers without the View Transitions API simply switch pages instantly. The city flight draws at about 40 frames a second, uses roughly 1 ms of script per frame, and pauses when the tab is hidden. With `prefers-reduced-motion` set, all motion turns off. Scroll-revealed content is only hidden once JavaScript is running, so nothing is lost if scripts fail.

---

## Built for everyone, not just the usual voices

The people least likely to read a 200-page agenda are often the ones most affected by it. So:

- **Plain language first.** The official wording is always one tap away, but never the default.
- **WCAG AA contrast** for body text on the darkest and lightest glass.
- **Real controls.** Every interactive element is a real button, link or input, with `aria-pressed`, `role="switch"` and `role="combobox"` states.
- **Keyboard only works everywhere**, including Quick take (arrow keys), search (↑ ↓ ↵ Esc) and the report window (Esc closes it).
- **Thumb-friendly on phones.** Navigation moves to a bottom tab bar within reach of your thumb.
- **Colour is never the only signal.** Vote results are announced as text ("6 voted yes, 1 voted no"), and each council seat is listed for screen readers.
- **Numbers and decoration.** Count-up numbers give screen readers the final value straight away, and the decorative scene and ticker are hidden from assistive tech.
- **The basics.** A skip link, visible focus rings, semantic landmarks and headings, and support for reduced motion.
- **Works on any screen.** Checked from a 320 px phone to a 1920 px desktop, including phones in landscape and tablets: nothing runs off the edge, and tap targets meet a 32 px minimum. On phones the council seats show names on tap instead of hover.

## Private by default

There's no account and no tracking.

- **Photos:** a photo you attach is shrunk on your phone before it's sent, which also strips its location and camera details. Only you and city staff can see it.
- **On your device:** your profile, follows, quick takes and comments stay in your browser's `localStorage`. In a real deployment, a sent comment would go to the clerk's inbox, and only because you chose to send it.
- **Shared with everyone:** service requests and RSVP headcounts go to the server, because the whole point is that every phone sees the same queue. Each browser gets an anonymous random ID, so you can withdraw your own reports. Other residents see a request's neighborhood and location, but never your ID, and your note to the crew is visible only to you and city staff.

## The shared backend

Service requests and RSVPs sync across every phone through a backend built into the app, backed by **Postgres**.

- **API:** `GET /api/community` returns what the current viewer may see. `POST /api/community` makes one change (report, withdraw, dispatch, mark fixed, RSVP) and returns the fresh state. `GET /api/community/photo/:id` returns a report's photo to its reporter and to staff only.
- **Live updates:** `GET /api/community/stream` is a server-sent-events stream. Every change is announced with Postgres `NOTIFY`, so even with several app instances, a crew marking a job fixed on one shows up on residents' phones served by another within a moment. Pages also refresh when you come back to the tab, and poll every 30 seconds as a safety net.
- **Storage:** four tables (`community_jobs`, `community_photos`, `community_rsvps`, `community_meta`), created on first use, with the demo's `SEED_JOBS` added once. There are no migrations to run.
- **Request numbers:** each is handed out under a per-service lock, with a unique constraint as a backstop, so simultaneous reports never share a number, even across instances.
- **Rules the server enforces:** only the device that made a report can withdraw it; dispatching and closing jobs need the staff PIN; a device can have at most 3 open reports of the same kind; and every input is validated.
- **Failing fast:** if the database is slow or down, requests give up after 10 seconds with an error instead of hanging, and recover on their own when it's back.
- **Without a database:** if `DATABASE_URL` isn't set, local development falls back to a JSON file in `.data/`, so you can work without Postgres. In production the service desk refuses to run without it, rather than lose data on a disk that gets wiped.

| Environment variable | What it does |
| --- | --- |
| `DATABASE_URL` | Postgres connection string, e.g. `postgres://user:password@host:5432/ayeline`. **Required in production** |
| `STAFF_PIN` | PIN that unlocks the dispatch board. **Set this in production**: without it, the board stays locked. In development it defaults to `1234` |
| `DATABASE_SSL` | Set to `no-verify` if your host's database certificate can't be verified. Prefer `?sslmode=verify-full` in the URL when it can |
| `DATABASE_POOL_MAX` | Most database connections per app instance (default 5). Lower it on small database plans |
| `DATA_DIR` | Development only: where the fallback JSON file and photos go (default `.data/`) |

Copy `.env.example` to `.env.local` to set these while developing.

**Deploying.** The app needs a Node host that runs `npm run build` and `npm start`, plus any Postgres 13 or newer (managed or your own). Set `DATABASE_URL` and `STAFF_PIN` and deploy; the tables are created on the first request. Two things depend on the host:

- **Live push needs long-lived connections.** Hosts that keep the server running (VPS, containers, Render, Railway, Fly.io) push changes instantly. Serverless hosts cut streams short, so pages fall back to refreshing on reconnect and every 30 seconds.
- **Connection poolers.** If the database URL goes through PgBouncer in transaction mode, `LISTEN` isn't available. Each instance then only pushes its own changes, and the 30-second refresh covers the rest. Use the database's direct URL to avoid that.

**As a container.** Hosts that deploy from a Dockerfile can use the one in the repo. It builds a small self-contained server that listens on `$PORT` (default 3000):

```bash
docker build -t ayeline .
docker run -p 3000:3000 -e DATABASE_URL=postgres://… -e STAFF_PIN=… ayeline
```

Point the host's health check at `/api/health`. It answers 200 while the server is up and reports whether the database is `connected`, `unreachable` or `not configured`.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

For production:

```bash
npm run build
npm start
```

No API keys are needed, and local development works without a database. For production, set `DATABASE_URL` and `STAFF_PIN` (see [The shared backend](#the-shared-backend)).

To develop against Postgres locally:

```bash
docker run -d --name ayeline-db -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=ayeline -p 5432:5432 postgres:16
DATABASE_URL=postgres://postgres:dev@localhost:5432/ayeline npm run dev
```

To try the sync, open the app on two phones on the same Wi-Fi (use `npm run dev -- -H 0.0.0.0` and your computer's local IP address). Report a problem on one, then switch the other to **City crew** and dispatch it.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4. That's it.

## Project map

| Path | What's there |
| --- | --- |
| `src/lib/data.ts` | Everything about the place: city, wording (`PLACE`), map layout (`MAP`), neighborhoods, personas, topics, council, meetings, agenda items |
| `src/lib/store.ts` | Local state: profile, follows, comments, quick takes, language switch |
| `src/lib/community.ts` · `photo.ts` | Shared state on the client: fetches, the live stream, and actions · shrinking a photo before upload |
| `src/server/community/index.ts` | Rules and permission checks; picks Postgres or the dev file store |
| `src/server/community/pgStore.ts` · `fileStore.ts` | Postgres storage with locks and `NOTIFY` · the JSON file used in development |
| `src/server/community/shared.ts` | Input validation and the limits both stores follow |
| `src/app/api/community/route.ts` · `stream/route.ts` · `photo/[id]/route.ts` | The community API · the live update stream · report photos |
| `src/app/page.tsx` | Home: hero, stats, ticker, filters, feed, map, recent decisions |
| `src/app/item/[id]/page.tsx` | Item page with the comment box and council chamber |
| `src/app/swipe/page.tsx` | Quick take |
| `src/app/my-voice/page.tsx` | My voice |
| `src/app/community/page.tsx` | City notices: alerts, up next, RSVP and calendar export |
| `src/app/community/services/page.tsx` | Report a problem: request numbers, live queues and the dispatch board |
| `src/components/NoticeArt.tsx` · `CommunityTabs.tsx` | The animated notice scenes · the City notices / Report a problem switch |
| `src/components/CommentBox.tsx` | The comment flow |
| `src/components/CityMap.tsx` · `Chamber.tsx` | The 3D neighborhood map · the council chamber |
| `src/components/CommandPalette.tsx` · `Toast.tsx` | ⌘K search · toasts |
| `src/components/Ambient.tsx` · `CityFlight.tsx` | The sky, lens and gaze light · the canvas flight down the avenue |
| `src/components/Motion.tsx` · `Tilt.tsx` · `Magnetic.tsx` | Scroll reveal, count-up and sliding pills · tilt and rim light · magnetic buttons |
| `src/app/globals.css` | Color tokens, glass surfaces and every keyframe animation |
| `src/app/template.tsx` | Page-to-page view transitions (forward, back and default) |

---

## What's next

This is a working prototype. To run it for a real city, these are the next steps:

- [x] **A shared queue**, so service requests, RSVPs and the dispatch board sync across every phone
- [ ] **Send comments for real**, by email or webhook to the city clerk, with a receipt for the resident
- [x] **A real database**: Postgres, safe with several app instances
- [ ] **Staff accounts**: named staff logins instead of one shared PIN
- [ ] **Photos and a map pin** on each report, so crews find the exact spot
- [ ] **Notify residents** when a crew is on their report, by push, SMS or WhatsApp
- [ ] **Spot duplicates**: merge reports of the same pothole into one request
- [ ] **More languages**, with the plain-language summaries translated (e.g. Hindi, Marathi, Tamil, Spanish)
- [ ] **An admin editor**, so the clerk can publish an agenda or a notice without touching code
- [ ] **Agenda import**: paste in the official PDF and get draft plain-language summaries to review
- [ ] **Reminders** by SMS or WhatsApp before the comment deadline and after the vote

---

## License

[MIT](LICENSE). Use it, adapt it for your city, ward or society, and share it.

---

<p align="center"><b>Ayeline</b> · your city, made readable</p>
