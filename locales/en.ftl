# Open-gate-bot — English

# Reply-keyboard button labels.
# Important: the text here is also what Telegram echoes back when tapped,
# so it's matched by `bot.hears(i18n.t(...))`. Adding a new locale = new
# .ftl file with the same keys.
button-open = 🚪 Open Gate
button-manage = 👥 Manage Users
button-approve = ✅ Approve
button-deny = ❌ Deny

# /start replies
start-welcome-admin = Welcome, admin. Tap to open the gate or manage users.
start-welcome-user = You're authorized. Tap below to open the gate.
start-request-pending = Your request is pending admin approval.
start-not-authorized = Hi! You're not authorized yet. I've sent your request to the admin — you'll hear back once it's reviewed.

# Access-request flow
access-already-authorized = You're already authorized.
access-request-sent = Request sent. The admin will review it.
access-approved-dm = You've been approved! Tap below to open the gate.
access-admin-only = Admin only.
access-bad-request-id = Bad request id.
access-request-not-found = Request not found.
access-approved-ack = ✅ Approved {$name} ({$id})
access-denied-ack = ❌ Denied {$id}
access-admin-dm =
  🔔 Access request:

  Name: {$name}
  {$usernameLine}Telegram ID: `{$id}`

access-username-line = Username: @{$username}

# Open gate
open-not-authorized = You're not authorized. Send /start to request access.
open-cooldown = Slow down — try again in {$seconds}s.
open-firing = 🚪 {$gate} opening…
open-rejected = Gate didn't open: {$reason}
open-auth-failed = Gate didn't open — admin notified.
open-failed = Gate didn't open: {$reason}

# Admin commands
admin-only = Admin only.
admin-manage-help =
  Admin commands:
  /users — list authorized users
  /adduser <id> <name> or /adduser @username — add user manually
  /revoke <id> or /revoke @username — revoke access
  /gates — list gates on your Palgate account
  /log — last 20 events

# /adduser
adduser-usage = Usage: /adduser <telegram_id> <name>  or  /adduser @username [name]
adduser-ok = ✅ Added {$name} ({$id})
adduser-username-not-found = Couldn't find @{$username}. They need to have messaged the bot at least once (or use their numeric ID instead).

# /revoke
revoke-usage = Usage: /revoke <telegram_id> or /revoke @username
revoke-ok = 🚫 Revoked {$id}
revoke-username-not-found = Couldn't find an authorized user @{$username}.

# /users
users-empty = No authorized users (other than you).
users-header = Authorized users:

# /gates
gates-empty = No gates returned by Palgate.
gates-header = Gates on your Palgate account:
gates-failed = Failed to list gates: {$reason}
gates-marker-configured = ← configured
gates-status-latched-open = 🔓 latched open
gates-status-closed = 🔒 closed (openable)
gates-status-sim = SIM: {$status}
gates-status-valid-until = valid until {$date}

# /log
log-empty = No events yet.

# Admin alerts (DM)
alert-prefix = ⚠️ {$message}
alert-palgate-auth-on-open = Palgate auth failed (HTTP {$status}). Re-run the token extractor and update PALGATE_TOKEN.
alert-palgate-auth-daily = Palgate token rejected on daily check (HTTP {$status}). Re-run the token extractor and update PALGATE_TOKEN before users notice.

# Command descriptions (BotFather menu)
cmd-start = Get started
cmd-open = Open the gate
cmd-lang = Change your language
cmd-version = Show the deployed version
cmd-users = List authorized users
cmd-adduser = Add a user: <id> <name> or @username
cmd-revoke = Revoke a user: <id> or @username
cmd-gates = List gates on your Palgate account
cmd-log = Last 20 open events

# /version reply
version-info = 🛠 {$branch} @ {$commit}
