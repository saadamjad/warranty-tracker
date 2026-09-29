# BUSINESS — The why behind the product (from BRD+FRS v1.0)

Read this when judging a new feature, writing copy, or making a product trade-off. `SPEC.md` = what to build.

## Vision · Mission · Promise
- **Vision:** make it effortless for ordinary people to keep the information they may need later about the things they own.
- **Mission:** remove the stress of lost, scattered, forgotten or unreadable purchase records with a simple, trustworthy place to save them.
- **Promise:** "Save it now. Find it later." Principle: *make the complicated parts invisible — the user only captures, verifies, saves, finds.*

## Problem & jobs-to-be-done
People already have camera rolls, email, drives, chats and drawers. The problem is not storage; it is that proof of
purchase is scattered and unfindable exactly when needed (product fails, return window closing, warranty claim, service center asks for proof).
- Main job: "When I buy something I may need proof of later, help me save it in seconds so I can find it without remembering where I put it."
- Secondary: remember warranty expiry · find a receipt from vague memory · keep warranty card + receipt together ·
  share documents without digging through my phone · keep documents that arrive in different formats.

## Personas
| Persona | Need | Friction |
|---|---|---|
| Everyday buyer (primary) | Save proof without filing | Forgets to organize |
| High-value buyer | Receipt + warranty + serial together | Fear of loss, privacy |
| Online shopper | Centralize email/PDF/chat/screenshot invoices | Scattered channels |
| Busy household user | Find it months later | Doesn't recall exact product/store |
| Second-hand owner | Keep whatever evidence exists | Original proof missing |

## Value proposition
Capture (seconds, no training) · Organization (related docs together) · Memory (deadline reminders) ·
Search (find by remembered details) · Reliability (visible saved/backed-up state) · Trust (clear control, export, delete).

## Goals / non-goals
Goals: prevent loss, fast save, simple search, deadline memory, trust, personal-life scope, validate web before mobile.
Non-goals: replace bank/wallet/expense tracker · legal decisions on warranties/returns · guarantee document authenticity ·
marketplace/recommendations · complex family permissions in MVP · AI chatbot as a primary feature · paywalling basic usefulness.

## Account & lifecycle strategy
Open → see promise + Add Purchase → save first purchase with no account → keep using search/warranty →
after meaningful history (~3rd purchase) a friendly backup prompt → benefit framed as protecting/restoring history,
never unlocking features → user may postpone indefinitely.

## Business model
User-first; adoption, usefulness and trust over revenue. Costs exist (storage, processing, email, support), so later
options may include optional paid storage, donations, sponsorship or open-source/hosted — **none approved**.
Never cripple basic value, never undermine privacy, no ads inside document workflows.

## Retention
From accumulated utility, not engagement tricks. Natural return triggers: warranty/return reminders, repair need,
finding a receipt, checking a serial, sharing proof, saving the next purchase. Don't optimize time-in-app.

## Competitive positioning (vs current habits)
| Habit | Why used | Our edge |
|---|---|---|
| Photo gallery | Fast, familiar | Photo becomes a searchable purchase record |
| Email inbox | Receipts arrive there | Centralize key details; import later |
| Cloud drive | Generic storage | No manual naming/folders; related docs linked |
| Chat to self | Easy to send | Structured retrieval, not chat search |
| Drawer | Private, tangible | Can't physically lose it; proof preserved |
| No system | Zero effort until disaster | Saving is so easy it's worth it |

## Risks → mitigations
Low trust → privacy clarity, optional account, export/delete · Low habit → ultra-fast Add Purchase ·
Bad extraction → editable review, highlight uncertainty, keep original · Feature creep → strict scope, simplicity test ·
Storage cost → track unit economics, decide model on evidence · Data-loss fear → clear status, backup/restore, export ·
Over-notification → sparse, user-controlled · Privacy incident → privacy by design, strict per-user isolation ·
Search frustration → many remembered attributes, test with messy data · False expectations → "record-keeping and reminders, not guarantees".

## Honest pros / cons
Pros: relatable problem, simple core, value grows with records, broad use, natural return reasons, web-first is cheap.
Cons: "good enough" alternatives exist, trust barrier, extraction errors hurt credibility, offline+sync is hard to make
invisible, storage cost, easy to bloat, value is occasional not daily.

## Roadmap
0 Definition (validate problem & trust with real users) → 1 Web MVP → 2 Real-world validation (observe first-time
users, messy/long receipts, offline, measure search success & time-to-save; fix friction first) → 3 Quality
(import variety, sharing, return workflows, backup/export confidence, service history) → 4 Mobile app (inherits the
web product's behavior) → 5 Advanced (email import, photo discovery, barcode, natural-language search, family sharing).

## Open research questions
Comfort with no-account local vault? · When does backup become compelling (validate 3-purchase prompt)? ·
Most common document types? · Which reminders are useful? · How often is sharing needed? · How much history to import? ·
What storage/backup feels trustworthy? · Which privacy explanations reduce hesitation?

## Feature gate (use for every new idea — BR-18)
Does it reduce user effort or materially improve reliability, trust or findability? Does it keep the UI simple for a
normal person without explanation? What is its trust impact and ongoing operating burden? Does it belong in this
release? If not clearly yes → park it in the roadmap. Test against: *"I bought something, saved it quickly, and months later I could find exactly what I needed."*
