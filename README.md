# FP&P Tools

Interne webapp van FP&P (straks op tools.fpnp.nl). Alles staat achter een login. Je logt in met een code die je per mail krijgt. Partners hebben voor Governance een extra code.

**Lagen:** partner ⊃ grasmaaier ⊃ fellowship. Een partner ziet alles van de grasmaaiers, een grasmaaier alles van de fellowship.

| Onderdeel | Wie | Status |
|---|---|---|
| Home met de &-fly-through | iedereen | klaar |
| AI literacy: leerlijn + 3 modules | iedereen | klaar |
| LinkedIn-versterker | grasmaaiers + partners | in aanbouw (fase 2) |
| Governance (DACI) | partners, met extra code | na 10 december (fase 3) |

## Eenmalige setup

### 1. Supabase
1. **SQL Editor → New query:** plak `supabase/setup.sql` en klik Run. Dit maakt de ledenlijst en de rechten aan. Je kunt het veilig opnieuw draaien.
2. **Authentication → Email Templates.** Pas zowel **Magic Link** als **Confirm signup** aan, zodat de code in de mail staat. Bijvoorbeeld:

   ```html
   <h2>Je code voor FP&P Tools</h2>
   <p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
   <p>Of klik: <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">inloggen</a></p>
   ```
3. **Authentication → URL Configuration:** zet de Site URL op het Vercel-adres (later `https://tools.fpnp.nl`).
4. Optioneel: **Authentication → Providers → Email:** zet "Email OTP Expiration" op 600 seconden.

> De ingebouwde mailer van Supabase verstuurt maar een paar mails per uur. Voor 15 mensen is dat krap. Koppel daarom bij Authentication → SMTP een eigen afzender, bijvoorbeeld Resend (gratis tot 3.000 mails per maand).

### 2. Vercel
1. **Add New → Project:** importeer de GitHub-repo `rjspar/fpnptools`.
2. **Environment Variables** (zie `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `PARTNER_COOKIE_SECRET`: een lange willekeurige string, bijvoorbeeld uit `openssl rand -hex 32`
3. Deploy.
4. Domein (later): Settings → Domains → `tools.fpnp.nl`. Vercel toont de DNS-regel (CNAME) die de beheerder van fpnp.nl moet toevoegen.

## Leden beheren
In Supabase → Table Editor → `members`. Kolommen: `email` (kleine letters), `name`, `role` (`partner`, `grasmaaier` of `fellowship`), `is_admin`. Alleen wie in deze tabel staat, kan inloggen.

## Nieuwe AI literacy-module
Voeg een object toe aan `src/content/modules.ts` met het juiste `level`:

- 0 = Jezelf
- 1 = Koppelen
- 2 = Toepassen
- 3 = Bouwen

De leerlijn en het overzicht groeien vanzelf mee. Downloadbare bestanden gaan in `src/content/files/` en in de lijst `ALLOWED_FILES` in `src/lib/files.ts`.

## Lokaal draaien
```bash
cp .env.example .env.local   # en vul in
npm install
npm run dev
```

## Techniek
Next.js 16 (App Router, `src/proxy.ts` voor de login-check), Supabase (auth + Postgres met RLS), three.js voor de animaties, Lenis voor vloeiend scrollen.
