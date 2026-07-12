# Crucifixion — Deploy From Your Phone

No computer needed. GitHub and Netlify both do the heavy lifting (installing
packages, building the app) on their own servers — your phone just uploads
files and clicks buttons.

## Step 1 — Put this project on GitHub

1. Go to github.com in your phone's browser, sign in (or create a free account).
2. Tap the **+** icon (top right) → **New repository**.
3. Name it `crucifixion-app`. Keep it **Public** or **Private**, your choice.
   Don't check "Add a README" (this folder already has one). Tap **Create repository**.
4. On the new empty repo page, tap **uploading an existing file** (a blue link
   in the middle of the page).
5. Tap **choose your files**, and select every file/folder from this package —
   on iPhone, if you unzipped this into the Files app, you can select the
   whole folder's contents at once.
6. Scroll down, tap **Commit changes**.

Your code is now on GitHub. You don't need to touch Terminal, npm, or git
commands — the upload button does that for you.

## Step 2 — Connect it to Netlify (this builds + hosts the live app)

1. Go to netlify.com in your phone's browser, sign up using **"Sign up with GitHub"**
   (this links the two automatically).
2. Tap **Add new site → Import an existing project**.
3. Choose **GitHub**, then pick the `crucifixion-app` repo you just created.
4. Netlify will auto-detect it's a Vite project. Build settings should be:
   - Build command: `npm run build`
   - Publish directory: `dist`
   (These are usually filled in automatically — leave them as is.)
5. Before clicking deploy, tap **Add environment variables** and add:
   - `VITE_SUPABASE_URL` → your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon public key
   - `VITE_OPENAI_API_KEY` → your OpenAI key (optional, only needed for
     text moderation — you can skip this for now and add it later)
6. Tap **Deploy site**.

Netlify will install everything and build your app on its own servers —
takes about 1-2 minutes. When it's done, you'll get a live link like
`https://crucifixion-app-xyz123.netlify.app` — that's your real, working
app, live on the internet, viewable from any phone or computer.

## Step 3 — Every time you want to update the app

1. Make changes to files on GitHub directly (tap a file → pencil/edit icon →
   edit in the browser → Commit changes), or ask Claude for updated files
   and re-upload them the same way as Step 1.
2. Netlify automatically re-builds and re-deploys within a minute or two of
   any GitHub change. You don't need to do anything on Netlify's side again.

## What's in this folder

- `src/App.jsx` — the whole app (all tabs, all screens)
- `src/lib/` — the Supabase connection code (audiobooks, communities,
  churches, moderation)
- `schema.sql` — already run in Supabase, kept here for reference
- `.env.example` — reference for what environment variables are needed
  (you won't upload a real `.env` file to GitHub — that's why `.gitignore`
  excludes it. Real values go into Netlify's environment variables instead,
  as in Step 2 above.)

## If something breaks

Screenshot whatever error message Netlify or GitHub shows you and send it
over — that's usually enough to diagnose from here.
