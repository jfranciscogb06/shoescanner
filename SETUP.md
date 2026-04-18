# ShoeScanner — setup

End-to-end setup for a fresh machine. ~15 min.

## 1. Supabase

1. Go to https://supabase.com, sign in, **New project**.
2. Name: `shoescanner`. Pick a strong DB password (save it in 1Password). Region: closest to you. Create.
3. Wait for the project to finish provisioning (~2 min).

### Run the schema

- Left sidebar → **SQL Editor** → **New query**.
- Paste the contents of `supabase/schema.sql` from this repo.
- Click **Run**. You should see "Success. No rows returned."

This creates `profiles` and `scans` tables, enables RLS, adds the user-signup trigger that gives each new user 3 free scan credits, and sets up storage policies for the photo bucket.

### Create the photo bucket

- Left sidebar → **Storage** → **New bucket**.
- Name: `shoe-photos`
- Public bucket: **off** (we want authenticated-only reads)
- Create.

Policies are already installed by `schema.sql` — each user can only read/write files under their own `{user_id}/` prefix.

### Grab your keys

Left sidebar → **Project Settings** → **API**. You need three values:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

> The service_role key bypasses RLS. It lives only on the server (used in the scan API route to decrement credits). Never put it in a `NEXT_PUBLIC_` var and never ship it to the client.

### Configure auth redirect

Left sidebar → **Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:3000` (change to your prod URL when you deploy)
- **Redirect URLs**: add `http://localhost:3000/auth/callback`

The magic-link login flow uses `/auth/callback` to exchange the code for a session.

## 2. eBay developer account

1. https://developer.ebay.com → sign up (free).
2. Create a keyset for the **Production** environment.
3. Copy **App ID (Client ID)** → `EBAY_APP_ID`
4. Copy **Cert ID (Client Secret)** → `EBAY_CERT_ID`
5. Set `EBAY_MARKETPLACE=EBAY_US` (or your region).

The Browse API uses OAuth2 client-credentials — the app trades the app/cert pair for a bearer token on first request and caches it.

## 3. Anthropic

1. https://console.anthropic.com → **API Keys** → **Create Key**.
2. Copy → `ANTHROPIC_API_KEY`.

> If you previously pasted a key in chat, **revoke it** on the console first and generate a fresh one. Keys leaked in chat history are considered compromised.

## 4. Local env file

```bash
cp .env.local.example .env.local
```

Fill in all the values from steps 1–3. Leave the Stripe section commented — we'll wire that up later.

## 5. Install + run

```bash
npm install
npx playwright install chromium   # for StockX/GOAT scraping
npm run dev
```

Open http://localhost:3000.

## 6. Sanity check

1. Go to `/login`, enter your email, submit.
2. Check your inbox for the Supabase magic link, click it → you should land on `/dashboard`.
3. In Supabase **Table Editor** → `profiles`, confirm a row exists for you with `scan_credits = 3`.
4. Click **New scan**, upload 4 photos of a shoe, hit **Analyze & price**.
5. After ~30–60s you should land on `/results/{id}` with brand/model/condition/prices.

If step 5 fails, check the dev server console — the scan row's `status` will be `failed` with an `error` message in the `scans` table.

## 7. GitHub remote (optional)

The local repo is already initialized with a first commit on `main`. To push to GitHub:

```bash
# install gh if you don't have it
brew install gh
gh auth login

# from the project root
gh repo create shoescanner --private --source=. --push
```

Or create an empty repo in the GitHub web UI and:

```bash
git remote add origin git@github.com:YOUR_USER/shoescanner.git
git push -u origin main
```

## 8. Things to know

- **Playwright & StockX/GOAT** — those sites actively fight scrapers. Expect selectors to rot. Each source is isolated in `src/lib/sources/{stockx,goat}.ts` so a fix is surgical. Errors are swallowed and return `[]` so one broken source doesn't kill a scan.
- **Scan cost** — each scan does one Claude Opus 4.7 vision call (~$0.10–0.20 depending on image size) + three comp lookups. Budget accordingly before opening up free tiers.
- **Credits model** — new users get 3 free scans (set by the `handle_new_user` trigger). When you wire Stripe, top up `profiles.scan_credits` in a webhook on successful payment.
- **Photo storage** — right now photos are sent as base64 data URLs through the API (Next config allows up to 15MB bodies). When you scale, switch to direct browser-to-Supabase-Storage uploads, then pass the storage path to the scan route.
