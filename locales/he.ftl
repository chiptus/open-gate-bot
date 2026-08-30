# Open-gate-bot — עברית
# Phrased in gender-neutral / impersonal forms where possible.

# Reply-keyboard button labels.
button-open = 🚪 פתיחת שער
button-manage = 👥 ניהול משתמשים
button-approve = ✅ אישור
button-deny = ❌ דחייה

# /start
start-welcome-admin = ברוכים הבאים, מנהל. לחיצה כאן תפתח את השער או תאפשר ניהול משתמשים.
start-welcome-user = ההרשאה אושרה. לחיצה כאן תפתח את השער.
start-request-pending = הבקשה ממתינה לאישור המנהל.
start-not-authorized = שלום! אין עדיין הרשאה. הבקשה שלך נשלחה למנהל — תקבל/י תשובה לאחר הבדיקה.

# Access-request flow
access-already-authorized = ההרשאה כבר קיימת.
access-request-sent = הבקשה נשלחה. המנהל יבחן אותה.
access-approved-dm = ההרשאה אושרה! לחיצה כאן תפתח את השער.
access-admin-only = למנהל בלבד.
access-bad-request-id = מזהה בקשה לא תקין.
access-request-not-found = הבקשה לא נמצאה.
access-approved-ack = ✅ אושר/ה: {$name} ({$id})
access-denied-ack = ❌ נדחה: {$id}
access-admin-dm =
  🔔 בקשת גישה:

  שם: {$name}
  {$usernameLine}מזהה טלגרם: `{$id}`

access-username-line = שם משתמש: @{$username}

# Open gate
open-not-authorized = אין הרשאה. שליחת /start תאפשר לבקש גישה.
open-cooldown = רגע, יש להמתין {$seconds} שניות ולנסות שוב.
open-firing = 🚪 {$gate} נפתח…
open-rejected = השער לא נפתח: {$reason}
open-auth-failed = השער לא נפתח — המנהל קיבל התראה.
open-failed = השער לא נפתח: {$reason}

# Admin commands
admin-only = למנהל בלבד.
admin-manage-help =
  פקודות ניהול:
  /users — רשימת משתמשים מורשים
  /adduser <מזהה> <שם> או /adduser @username — הוספת משתמש ידנית
  /revoke <מזהה> או /revoke @username — שלילת הרשאה
  /gates — רשימת השערים בחשבון Palgate
  /log — 20 האירועים האחרונים

# /adduser
adduser-usage = שימוש: /adduser <מזהה_טלגרם> <שם>  או  /adduser @username [שם]
adduser-ok = ✅ נוסף: {$name} ({$id})
adduser-username-not-found = לא נמצא @{$username}. על המשתמש לשלוח לבוט הודעה לפחות פעם אחת (או להשתמש במזהה המספרי).

# /revoke
revoke-usage = שימוש: /revoke <מזהה_טלגרם> או /revoke @username
revoke-ok = 🚫 הרשאה נשללה: {$id}
revoke-username-not-found = לא נמצא משתמש מורשה בשם @{$username}.

# /users
users-empty = אין משתמשים מורשים נוספים.
users-header = משתמשים מורשים:

# /gates
gates-empty = Palgate לא החזיר שערים.
gates-header = שערים בחשבון Palgate:
gates-failed = שליפת השערים נכשלה: {$reason}
gates-marker-configured = ← מוגדר
gates-status-latched-open = 🔓 פתוח קבוע
gates-status-closed = 🔒 סגור (ניתן לפתיחה)
gates-status-sim = SIM: {$status}
gates-status-valid-until = בתוקף עד {$date}

# /log
log-empty = אין עדיין אירועים.

# Admin alerts (DM)
alert-prefix = ⚠️ {$message}
alert-palgate-auth-on-open = הזדהות מול Palgate נכשלה (HTTP {$status}). יש להריץ שוב את כלי החילוץ ולעדכן את PALGATE_TOKEN.
alert-palgate-auth-daily = אסימון Palgate נדחה בבדיקה היומית (HTTP {$status}). מומלץ להריץ שוב את כלי החילוץ ולעדכן את PALGATE_TOKEN לפני שמשתמשים נתקלים בכך.

# Command descriptions (BotFather menu)
cmd-start = התחלה
cmd-open = פתיחת השער
cmd-lang = שינוי שפה
cmd-version = הצגת הגרסה המותקנת
cmd-users = רשימת משתמשים מורשים
cmd-adduser = הוספת משתמש: <מזהה> <שם> או @username
cmd-revoke = שלילת הרשאה: <מזהה> או @username
cmd-gates = רשימת השערים בחשבון Palgate
cmd-log = 20 האירועים האחרונים

# הודעת /version
version-info = 🛠 {$branch} @ {$commit}
