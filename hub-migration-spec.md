# Sarvagya Hub — Migration Spec (Gemini / Qwen / Task Scheduler)

Written 19 Aug 2026. Target: move 24 scheduled tasks off Cowork without losing behaviour.

---

## 0. The decision that matters

Pick **one scheduler**, not one model.

| Layer | Choose | Why |
|---|---|---|
| Scheduler | **Windows Task Scheduler** | Runs whether or not any app is open. Cowork tasks only run while Cowork is open — that is the single biggest reliability gap today. Qwen's built-in cron is fine but ties scheduling to Qwen. Gemini CLI has no native scheduler (open feature request, Apr 2026). |
| Model | **Per task** | A line in a `.bat`/`.ps1`. Research-heavy → Gemini (Deep Research, 1M context). Code/file-shaped → Qwen. Reversible. |
| Browser | **Playwright MCP** with a persistent profile | Replaces `mcp__claude-in-chrome__*`, which is Anthropic-only and does not port. |

---

## 1. Do this first — kill the browser dependency

**Problem:** all hub state lives in browser `localStorage` on one Chrome profile. Every write requires driving that browser and typing PIN 231693. That is why migration looks hard, and why this session repeatedly stalled.

**Fix:** move state into `hub-data.json` in the `my-dashboards` repo.

```
my-dashboards/
  sarvagya-hub.html
  hub-data.json      <- new
```

`hub-data.json` shape (mirrors current keys):
```json
{
  "updatedAt": "19 Aug 2026",
  "sv-panchang":   { "daily": {}, "weekly": {}, "monthly": {}, "yearly": {} },
  "sv-wealth":     { "accounts": [], "funds": [], "policies": [], "spend": [], "history": [] },
  "sv-mailreview": { "date": "", "spendTotal": 0, "items": [], "attention": [], "actions": [] },
  "sv-kids-week":  { "weekOf": "", "theme": "", "vrinda": {}, "vedant": {}, "guidance": [] },
  "sv-neeta-updates": [],
  "sv-cowork-notes":  [],
  "sv-notes": [], "sv-initiatives": [], "sv-pulse": [], "sv-evidence": [], "sv-people": []
}
```

**Hub change** — in `init()`, before the renderers:
```js
fetch('hub-data.json?cb=' + Date.now())
  .then(r => r.ok ? r.json() : null)
  .then(d => {
    if (!d) return;
    Object.keys(d).forEach(k => {
      if (k === 'updatedAt') return;
      localStorage.setItem(k, JSON.stringify(d[k]));   // remote wins
    });
  })
  .catch(() => {});   // offline → fall back to whatever is already local
```

**Do NOT put Lifeline (`ll-*`) in this file.** It is encrypted at rest with a PIN-derived AES-GCM key and must stay browser-only. Committing it to a public repo would publish the ciphertext — 6 digits is brute-forceable given the blob.

**Result:** every task becomes *read JSON → edit → commit*. No browser, no PIN, no profile, no Chrome extension. Works from any model, any machine, any language.

---

## 2. Task inventory and porting difficulty

### Trivial — no browser, pure research + file write
| Task | Notes |
|---|---|
| `panchang-hub-sync` | Web research → JSON. Telegram via plain HTTPS (no proxy in native runtime). |
| `daily-horoscope-telegram` | Research → Telegram |
| `monthly-horoscope-telegram` | Research → Telegram |
| `astro-tips-telegram` | Research → Telegram |
| `india-news-dharmic-*` (3) | Already writes JSON for a pipeline |
| `kids-weekly-learning-plan` | Reads `sv-neeta-updates` from JSON, writes plan |
| `sarvagya-hub-midday-review` | Reads hub JSON, writes note |

**Telegram gets simpler.** Every task currently sends via browser `fetch` only because Cowork's sandbox proxy blocks `api.telegram.org`. Natively:
```bash
curl -s -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":\"8306940237\",\"text\":\"...\"}"
```

### Needs Playwright MCP + logged-in profile
| Task | Session required |
|---|---|
| `neeta-email-hub-sync` | Yahoo Mail |
| `morning-email-spending-review` | Yahoo Mail + Gmail |
| `fresh-training-manager-jobs` | LinkedIn, Naukri, Foundit, Shine, Glassdoor, Instahyre, iimjobs, Indeed |
| `pinki-linkedin-freelance-search` | LinkedIn |

Persistent profile config:
```json
{ "mcpServers": { "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--user-data-dir", "C:\\Users\\sharm\\playwright-profile"]
}}}
```
Log in once manually into that profile. Sessions persist across runs.

**Carry these hard-won quirks across — they cost real debugging time:**
- Yahoo attachment previews need a *genuine* mouse click. A scripted `element.click()` opens an empty viewer that never loads.
- Yahoo's CSP blocks `api.telegram.org`. Irrelevant once you use curl, but do not send from a Yahoo page.
- Yahoo search box (`search-box-pills-typeahead-input`) is a React input — `.value =` does not stick; use `execCommand('insertText')`.

### Needs shell / SSH — easiest of all natively
`algobot-intraday-monitor`, `algobot-eod-analysis`, `algobot-paper-daily-report` — SSH into `algotrader-vm`. Native runtime has a real shell; no GCP Cloud Shell hop needed.

### Blocked today, trivial after migration
The **56 bhajan + harvest tasks**. Their `SKILL.md` files sit in `C:\Users\sharm\Claude\Scheduled\`. Cowork's sandbox cannot read that path — this is the one thing that stayed unsolved all session. A native agent reads them directly.

---

## 3. Wiring pattern

`C:\Users\sharm\Automation\panchang.ps1`:
```powershell
$prompt = Get-Content "C:\Users\sharm\Automation\prompts\panchang.md" -Raw
gemini -p $prompt *> "C:\Users\sharm\Automation\logs\panchang-$(Get-Date -f yyyy-MM-dd).log"
```

Register:
```powershell
schtasks /create /tn "Hub-Panchang" /tr "powershell -File C:\Users\sharm\Automation\panchang.ps1" /sc daily /st 06:00
```

Swap `gemini -p` for `qwen -p` per task. That is the whole model-choice surface.

---

## 4. Migration order

1. `hub-data.json` + hub fetch loader — removes browser lock-in
2. Port the 8 no-browser tasks; run both systems in parallel a week
3. Set up Playwright MCP profile; log in to Yahoo, Gmail, LinkedIn, Naukri
4. Port the 4 browser tasks
5. Port the 3 algobot tasks
6. Restore the 56 bhajan/harvest tasks from disk
7. Disable Cowork schedules only once each replacement has run clean for a week

---

## 5. Known traps

- **Silent failure is the enemy.** 76 tasks vanished from Cowork's registry and nothing alerted. Add a heartbeat: each task appends `{task, timestamp, ok}` to `hub-data.json`, and a weekly job reports anything that has not run.
- **Data shapes are strict.** `renderCoworkNotes()` reads only `n.date`, `n.id`, `n.body` — it ignores `title` and `createdAt`. Notes written without `date` render as "No date" with the heading invisible. That bug silently ate every note from 14 Jul to 15 Aug.
- **`vaar`, not `var`** in the panchang daily object. `var` is a JS reserved word.
- **Times need AM/PM.** The hub parses both 12h and 24h, but a bare `02:03` is read as 2 AM.
- **Festival dates must be `05 Sep` or `05 Sep 2026`** — the countdown parser needs that shape.
- **One bot per task.** Panchang → SanataanPanchangBot, Jyotish → SanataanJyotishBot, Mail → SanataanMailBot, Hub + kids → HubUpdateBot, trading → AlgoTrader. Chat ID `8306940237` throughout.
- **Init order.** `init()` must run after all `const` declarations. A `const` referenced before its declaration line throws a temporal-dead-zone error that kills the *rest of init silently* — that single bug disabled 20 renderers.

---

## 6. Subscription note

Your logs show quota already binding — `weekly-summary-report` failed twice on session/weekly limits before doing any work.

- **Google AI Pro ($19.99/mo)** — Gemini 3.1 Pro, 1M context, Deep Research, higher CLI limits. Matches this workload.
- **AI Ultra ($99.99–199.99/mo)** — 5×–20× caps, plus **$100/mo Google Cloud credits**. Only worth it if `algotrader-vm` costs enough that the credits offset the difference. Check the GCP bill first.
- Gemini CLI's free tier is generous — run the three heaviest tasks on it before paying anything.
