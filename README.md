# Winery for Claude Code

Wine lots, tank contents, cellar jobs and traceability in a database you own. Built by Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and try the demo. | Your cellar rules, export mappings and interfaces. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=vintrace). | Installed and operated through **Omni by Enterprise DNA**. One setup fee, then a retainer. [See the offer](https://enterprisedna.co/omni/instead-of/vintrace). |

## Start here

```bash
git clone https://github.com/Enterprise-DNA-OS/winery-for-claude-code.git
cd winery-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

Node 20 or newer. Embedded PGlite needs no database server. For shared Postgres, set DATABASE_URL in your environment and run npm run migrate. Dates use UTC. Use the demo only in a separate database. Seed data is fictional and deliberately contains overdue work, a held lot, stale samples and record gaps.

## What is included

Fifteen record types cover owners, vineyards, vessels, lots, origin fractions, vessel positions, blend lineage, movements, analyses, work orders, additions, bottlings, bulk supplies, recall exercises and notes. Receipts, transfers, blends, losses, bottlings and supplies change balances in a transaction. Held wine, over-capacity fills, short stock and cross-owner blends fail before any change is committed. Origin fractions follow the blend. Supplies retain a composition snapshot.

Read-only reports show the cellar week, attention list, capacity and owner review. Paperwork includes lot histories, wine goods supply statement drafts, bottling records, cellar work orders and recall exercise records. Change brand.json to put the winery name, logo and colours on them. Nothing sends.

## Commands

Reads show human columns by default or --json. Names match without case sensitivity; partial names and IDs work when unique. Ambiguous matches print candidates and exit 1. Writes take a JSON input file and retain the operator's evidence. [CLI reference](docs/cli.md).

| Command | Job |
|---|---|
| /clients | Owner identities and jurisdictions |
| /vineyards | Vineyard source records |
| /vessels | Vessel capacities |
| /lots | Lot register |
| /cellar | Wine by lot and vessel |
| /cellar-round | Daily cellar round |
| /tank-space | Free tank capacity |
| /lab-watch | Overdue lab sampling |
| /analyses | Recorded lab measurements |
| /work-orders | Cellar job register |
| /bottling-plan | Upcoming bottling reviews |
| /bottlings | Bottling and packaging records |
| /additions | Winemaking inputs by supplier batch |
| /supplies | Bulk wine supplied |
| /operations | Movement history |
| /recalls | Recall exercise evidence |
| /notes | Lot conversations |
| /attention | Overdue work and held wine |
| /compliance | Source-linked record checks |
| /owner-review | Contract owner review |
| /add | Add an owner, vineyard, vessel, job or recall record |
| /receive | Record a reconciled opening or receipt lot |
| /transfer | Record a completed transfer |
| /blend | Record a blend with retained parent lots |
| /loss | Record a measured loss with reason |
| /bottle | Record a completed bottling |
| /supply | Record a bulk supply with recipient details |
| /hold | Put a lot on hold |
| /release | Record a winemaker hold release |
| /analyse | Record a measured lab result |
| /addition | Record an actual winemaking input |
| /complete | Complete a cellar job |
| /cancel | Cancel an open cellar job |
| /log | Record a lot note |
| /trace | Trace a lot through blends and deliveries |
| /draft-lot | Draft a lot review |
| /import | Import vintrace records |
| /export | Export all winery records |
| /weekly-review | Monday cellar review |
| /customise | Make the cellar system yours |
| /new-view | Add a read-only winery view |

## Ten questions to ask your records

These questions are answered by the current CLI. This is not a claim that vintrace cannot answer them with its reports or configuration.

1. Which owners have held wine and overdue cellar work together? (`owner-review`)
2. Which tanks contain wine with no recent lab sample? (`lab-watch`)
3. Where is there enough spare vessel capacity for the next transfer? (`tank-space`)
4. Which overdue jobs belong to a held lot? (`work-orders`)
5. Where did this source lot go after blending? (`trace`)
6. Which bulk recipients received a descendant of this source lot? (`trace`)
7. Which packaging batches contain this source lot? (`trace`)
8. Which winemaking inputs came from a particular supplier batch? (`additions`)
9. Which Australian movements were recorded late? (`compliance`)
10. Which owner has no recent recall exercise evidence? (`compliance`)

## Your first hour: ten things to ask for

1. Put our winery name and logo on the documents.
2. Show the fictional cellar round.
3. Explain every overdue sample and held lot.
4. Preview our vineyard export.
5. Import the checked vineyard records.
6. Add our actual owners and vessel capacities.
7. Record a reconciled opening lot with origin evidence.
8. Trace a demo blend back to its recorded sources.
9. Draft a lot history for winemaker review.
10. Add our cellar location code with a tested migration.

## Switching and operating scope

[The replacement guide](docs/replace-vintrace.md) documents vineyard and numeric lab CSV imports and their limits. Full cellar history needs a separate mapping and reconciliation. [Compliance notes](docs/compliance.md) cite the exact record rules and distinguish local policies. [Why no front end](docs/why-no-front-end.md) describes mobile, offline, accounting and deployment boundaries. This is an operational base, not a certified WSMP, an excise system or a complete vintrace clone.

Run npm test for isolated migration, seed, balance, lineage, import, export and document checks. Tests ignore DATABASE_URL. An explicit TEST_DATABASE_URL is accepted only for an empty localhost database named rebuild_test. The existing CI runs embedded tests on Ubuntu and Windows plus the same suite on a disposable Postgres service. The local run does not prove the remote Windows run has completed.
