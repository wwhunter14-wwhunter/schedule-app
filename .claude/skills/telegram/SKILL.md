---
name: telegram
description: Bridge a Telegram chat to this Claude Code session. Use when the user invokes "/telegram:access pair <CODE>" to pair a Telegram bot with the current session, or when the user wants to receive and respond to Telegram DMs from within Claude Code.
---

# Telegram Bridge

This skill bridges a Telegram chat to the current Claude Code session. After pairing, DMs sent to the bot are forwarded here and you respond back via Telegram.

## App Base URL

`https://schedule-app-v2-khaki.vercel.app`

## Session File

Store session state at `/tmp/.telegram-bridge.json`:
```json
{ "sessionToken": "...", "chatId": "..." }
```

---

## Command: `access pair <CODE>`

When invoked as `/telegram:access pair <CODE>` (where CODE is a 6-char alphanumeric string):

### Step 1 — Pair with the code

```bash
curl -s -X POST https://schedule-app-v2-khaki.vercel.app/api/telegram/pair \
  -H "Content-Type: application/json" \
  -d '{"code": "<CODE>"}'
```

Expected response:
```json
{ "ok": true, "sessionToken": "...", "chatId": "..." }
```

If `ok` is false, report the error and stop.

### Step 2 — Save session

Write the result to `/tmp/.telegram-bridge.json`:
```bash
echo '{"sessionToken":"<TOKEN>","chatId":"<CHAT_ID>"}' > /tmp/.telegram-bridge.json
```

### Step 3 — Confirm and start listening

Tell the user: "Paired with Telegram chat `<chatId>`. Listening for messages..."

Then proceed directly to the **Polling Loop** below.

---

## Resuming an Existing Session

If invoked without a code (just `/telegram:access`) and `/tmp/.telegram-bridge.json` exists:
1. Read the file to get `sessionToken` and `chatId`
2. Skip pairing, go directly to the **Polling Loop**

---

## Polling Loop

Once paired, run this loop continuously:

### Each iteration:

1. **Fetch new messages:**
```bash
curl -s "https://schedule-app-v2-khaki.vercel.app/api/telegram/messages?sessionToken=<TOKEN>"
```

2. **If `messages` array is non-empty**, for each message:
   - Display: `Telegram [chatId]: <text>`
   - Process the message as if the user typed it — use your full Claude Code capabilities to respond
   - Keep your reply concise (Telegram messages have a 4096 char limit)
   - Send the reply:
```bash
curl -s -X POST https://schedule-app-v2-khaki.vercel.app/api/telegram/messages \
  -H "Content-Type: application/json" \
  -d '{"sessionToken":"<TOKEN>","reply":"<YOUR RESPONSE>"}'
```

3. **If no messages**, wait 5 seconds:
```bash
sleep 5
```

4. Repeat from step 1.

### Stopping

The user can interrupt the loop at any time with Ctrl+C or by sending "stop" in this Claude Code session. When stopped, inform the user the bridge is paused and they can resume with `/telegram:access`.

---

## Notes

- Treat each Telegram message as a genuine user request — respond helpfully using all your tools
- Keep responses concise and plain-text (no markdown rendering in Telegram by default)
- The `sessionToken` is a secret credential — never include it in Telegram messages
- If the session becomes invalid (401 response), tell the user to re-pair with a new code
- Multiple messages arriving at once should each get a reply, sent sequentially
