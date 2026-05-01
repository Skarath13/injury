# Brevo Outreach Setup

## What Brevo Can Do Here

- Inspect account, sender, domain, and list setup through the Brevo REST API.
- Add a sending domain and return the DNS records that need to go into Cloudflare.
- Create a verified sender after the email address can receive Brevo's verification message.
- Create campaign drafts and send test emails to yourself for review.

For the public law-firm prospect list, do not import scraped/public website emails into a Brevo campaign list unless you have confirmed the contacts are legitimate under Brevo's rules and applicable law. Brevo says copied public website/social emails and purchased/rented/third-party lists are forbidden. Use one-to-one outreach from your mailbox for cold feelers, or use Brevo Campaigns only for legitimate/consented contacts.

## Local Secret Setup

Keep secrets out of git. This repo ignores `.env*`, so use one of these:

```bash
export BREVO_API_KEY="xkeysib-your-key"
```

or add this to `.env.local`:

```bash
BREVO_API_KEY=xkeysib-your-key
```

If Brevo gave you a base64 MCP/API envelope, this helper can also read it as:

```bash
BREVO_API_KEY_B64=base64-json-envelope
```

## CLI Commands

```bash
npm run brevo -- account
npm run brevo -- senders
npm run brevo -- domains
npm run brevo -- domain:create yourdomain.com
npm run brevo -- domain:check yourdomain.com
npm run brevo -- domain:authenticate yourdomain.com
npm run brevo -- lists
npm run brevo -- sender:validate 2 123456
```

For `contact@californiasettlementcalculator.com`, Brevo returned these DNS records:

| Type | Name | Value |
| --- | --- | --- |
| TXT | `californiasettlementcalculator.com` | `v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com mx ~all` |
| CNAME | `brevo1._domainkey.californiasettlementcalculator.com` | `b1.californiasettlementcalculator-com.dkim.brevo.com` |
| CNAME | `brevo2._domainkey.californiasettlementcalculator.com` | `b2.californiasettlementcalculator-com.dkim.brevo.com` |
| TXT | `californiasettlementcalculator.com` | `brevo-code:49f60760d4fe0e48f3bc73028ee841ab` |
| TXT | `_dmarc.californiasettlementcalculator.com` | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` |

The SPF value above replaces the existing root SPF record. Keep it as one SPF TXT record; do not create a second `v=spf1` TXT record.

If a Cloudflare API token with Zone:Read and DNS:Edit is available:

```bash
npm run cloudflare:dns -- plan-brevo-email-auth
npm run cloudflare:dns -- upsert-brevo-email-auth
npm run cloudflare:dns -- verify-brevo-dns
```

Create a sender after the address can receive mail through Cloudflare Email Routing:

```bash
npm run brevo -- sender:create "Dylan" hello@yourdomain.com
```

Create a campaign draft from the example file:

```bash
npm run brevo -- campaign:draft outreach/brevo_campaign_draft.example.json
```

Send only a test email:

```bash
npm run brevo -- campaign:test 123 your-inbox@example.com
```

Preview and test the one-to-one sponsorship feeler:

```bash
npm run brevo -- feeler:preview "CallJacob"
npm run brevo -- feeler:test "CallJacob" drburton369@gmail.com
```

Send exactly one prepared firm email from the high-confidence queue:

```bash
npm run brevo -- feeler:send-one outreach/sponsorship_feeler_queue.json calljacob --confirm-send-one-to-one
```

The helper deliberately blocks accidental live sends. If you later decide to send a reviewed campaign to a legitimate list:

```bash
BREVO_ALLOW_SEND_NOW=1 npm run brevo -- campaign:send-now 123 --confirm-send-now
```

## Optional Brevo MCP Config

Brevo's docs expose a remote MCP server at:

```text
https://mcp.brevo.com/v1/brevo/mcp
```

For Codex-style MCP config, use an environment variable rather than writing the token directly into config:

```toml
[mcp_servers.brevo]
command = "npx"
args = [
  "mcp-remote",
  "https://mcp.brevo.com/v1/brevo/mcp",
  "--header",
  "Authorization: Bearer ${BREVO_MCP_TOKEN}"
]
```

Then launch Codex with `BREVO_MCP_TOKEN` set. The MCP server may require a Brevo MCP token specifically, not only a normal `xkeysib-*` REST API key.

## Useful Docs

- Brevo MCP server: https://developers.brevo.com/docs/mcp-protocol
- Create email campaign: https://developers.brevo.com/reference/create-email-campaign
- Send transactional email: https://developers.brevo.com/docs/send-a-transactional-email
- Senders and domains: https://developers.brevo.com/docs/getting-started-with-senders-and-domains
- Domain authentication: https://developers.brevo.com/docs/domain-authentication-and-verification
- Contact list legitimacy: https://help.brevo.com/hc/en-us/articles/213405965-Build-a-legitimate-contacts-database-for-optimal-deliverability-and-compliance
