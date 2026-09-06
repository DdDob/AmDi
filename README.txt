AMDI — deploy in 2 minutes (no coding, no account needed to start)
====================================================================

This folder is a complete, self-contained website:
  index.html
  manifest.json
  icons/ (apple-touch-icon.png, icon-192.png, icon-512.png, favicon-32.png)

It saves everything using your browser's local storage on your phone —
private to your device.

OPTION A — Netlify Drop (easiest, ~2 minutes, free)
----------------------------------------------------
1. On your computer, go to: https://app.netlify.com/drop
2. Drag this whole "deploy" folder onto the page.
3. Netlify gives you a live link like https://random-name-123.netlify.app
   (You can rename it in Netlify's site settings to something like
   amdi-yourname.netlify.app.)
4. Open that link on your phone in Safari (iPhone) or Chrome (Android).

OPTION B — Vercel or GitHub Pages
----------------------------------
Same idea: upload this folder, get a URL. Any static host works
(Netlify, Vercel, GitHub Pages, Cloudflare Pages) since there's no
server code — just these files.

ADD TO HOME SCREEN (this is what gives it a real app icon)
------------------------------------------------------------
iPhone (Safari):
  1. Open your deployed link in Safari.
  2. Tap the Share icon (square with an arrow) at the bottom.
  3. Scroll down, tap "Add to Home Screen".
  4. You'll see the wine-and-gold A♥D icon — tap Add.

Android (Chrome):
  1. Open your deployed link in Chrome.
  2. Tap the ⋮ menu (top right).
  3. Tap "Add to Home screen" / "Install app".

After that, tapping the icon opens AMDI full-screen, no browser bar,
with its own icon — like a real app.

ASK AMDI (the AI chat tab)
------------------------------------------------------------
This only works once you add your own Anthropic API key:
  1. Go to https://console.anthropic.com and create an API key.
  2. In AMDI, go to Myself → "Ask AMDI setup" and paste it in.
It's stored only on your device and used only to power that tab.
(This step isn't required for anything else in the app — hair-oil
schedule, wishlist, dates, letters, etc. all work without it.)

NOTES
------
- Push-up and hair-oil in-app alerts only fire while the page is open
  in your browser. The reminders already set up in your phone's
  Reminders app are the reliable ones for actual alarms.
- Everything is stored locally on whichever device you open it on —
  it does not sync between your phone and computer automatically.
