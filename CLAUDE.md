# Winery operating instructions

Business: fill in your winery name. Operator: winery owner or cellar manager. Demo: fictional Kauri Estate and Wattle Wines. Priorities: accurate balances, owner separation, traceable origins and recorded evidence.

Read README.md, docs/cli.md, docs/replace-vintrace.md and docs/compliance.md before real work. Start every answer from the CLI. Never invent measurements, historical records, physical work, notifications, winemaker approvals or legal compliance. Reads precede writes. Resolve ambiguous names with the operator. Never send, notify a regulator, direct chemical dosing, delete history or run destructive migrations without explicit approval. Drafts stay in drafts/. Never seed live records.

One CLI: `npm run winery -- help`. Reads use --json. Writes take --file=<input.json>. The matching recipe in .claude/commands is the one path for each recurring job. Commands apply equally to Claude Code, Codex, OpenCode and Cursor. Never make a separate workflow library.

- /clients: Owner identities and jurisdictions.
- /vineyards: Vineyard source records.
- /vessels: Vessel capacities.
- /lots: Lot register.
- /cellar: Wine by lot and vessel.
- /cellar-round: Daily cellar round.
- /tank-space: Free tank capacity.
- /lab-watch: Overdue lab sampling.
- /analyses: Recorded lab measurements.
- /work-orders: Cellar job register.
- /bottling-plan: Upcoming bottling reviews.
- /bottlings: Bottling and packaging records.
- /additions: Winemaking inputs by supplier batch.
- /supplies: Bulk wine supplied.
- /operations: Movement history.
- /recalls: Recall exercise evidence.
- /notes: Lot conversations.
- /attention: Overdue work and held wine.
- /compliance: Source-linked record checks.
- /owner-review: Contract owner review.
- /add: Add an owner, vineyard, vessel, job or recall record.
- /receive: Record a reconciled opening or receipt lot.
- /transfer: Record a completed transfer.
- /blend: Record a blend with retained parent lots.
- /loss: Record a measured loss with reason.
- /bottle: Record a completed bottling.
- /supply: Record a bulk supply with recipient details.
- /hold: Put a lot on hold.
- /release: Record a winemaker hold release.
- /analyse: Record a measured lab result.
- /addition: Record an actual winemaking input.
- /complete: Complete a cellar job.
- /cancel: Cancel an open cellar job.
- /log: Record a lot note.
- /trace: Trace a lot through blends and deliveries.
- /draft-lot: Draft a lot review.
- /import: Import vintrace records.
- /export: Export all winery records.
- /weekly-review: Monday cellar review.
- /customise: Make the cellar system yours.
- /new-view: Add a read-only winery view.

Use npm run view for read-only HTML and npm run docs for paperwork. brand.json holds the winery identity. Migrations live in supabase/migrations. Writes are serialised within the CLI. Direct SQL can bypass business checks and needs reviewed migrations and independent validation.

Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=vintrace
