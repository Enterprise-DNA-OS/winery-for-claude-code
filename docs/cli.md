# Cellar CLI

`npm run winery -- help` lists reads. All commands support --json. Reads need no input file. `trace "lot name"` follows descendant blends; `draft-lot "lot name"` writes a local HTML draft. Names and partial IDs must resolve uniquely. Do not use a raw database write to bypass a validation error.

Every write uses `npm run winery -- <command> --file=<input.json>`. JSON examples below contain fictional records. Read the actual lot, owner and vessel before writing. Optional occurred_on defaults to today in UTC; supplied dates must be real YYYY-MM-DD dates and cannot be in the future, except job due dates. Movement dates cannot predate receipt. Backdated writes update today's balance; they do not recalculate historical inventories.

| Command | Input fields |
|---|---|
| add client | type: client, name, address, jurisdiction: NZ or AU |
| add vineyard | type: vineyard, name, grower, region, address |
| add vessel | type: vessel, name, capacity_l, location |
| add work-order | type: work-order, name, lot, kind, due_on, assigned_to, note |
| add recall | type: recall, name, lot, performed_on, reviewer, evidence, follow_up |
| receive | name, client, vessel, litres, source_ref, supplier, supplier_address, origins, recorded_by, note, optional occurred_on |
| transfer | lot, vessel, to_vessel, litres, recorded_by, note, optional occurred_on |
| blend | name, vessel, source_ref, inputs, recorded_by, note, optional occurred_on |
| loss | lot, vessel, litres, recorded_by, note, optional occurred_on |
| bottle | name, lot, vessel, bottles, bottle_ml, packaging_ref, recorded_by, note, optional occurred_on |
| supply | name, lot, vessel, litres, recipient, address, statement_ref, recorded_by, note, optional occurred_on |
| hold / release | lot, recorded_by, note, optional occurred_on |
| analyse | lot, sampled_on, metric, value, unit, lab_ref, optional vessel |
| addition | lot, material, supplier, supplier_batch, quantity, unit, recorded_by, note, optional occurred_on |
| complete / cancel | job, recorded_by, note, optional occurred_on |
| log | lot, recorded_by, note |

`origins` is a nonempty list of objects with vineyard, vintage, variety, region and fraction. Fractions sum to one. `inputs` is a list of distinct parent lots with lot, vessel and litres. Blend inputs must have one owner and the destination vessel must be empty. Transfer keeps the same lot. Capacity, holdings and positive quantities are checked inside the transaction. Litres allow three decimal places. Bottles and bottle_ml are positive integers.

```json
{
  "name": "26-SB-OPENING",
  "client": "Kauri Estate",
  "vessel": "T04",
  "litres": 1000,
  "source_ref": "SIGNED-STOCKTAKE-01",
  "supplier": "Kauri Estate",
  "supplier_address": "10 Demo Lane, Marlborough",
  "origins": [{"vineyard":"River Block","vintage":2026,"variety":"Sauvignon Blanc","region":"Marlborough","fraction":1}],
  "recorded_by": "Demo operator",
  "note": "Reconciled opening balance"
}
```

See examples/transfer.json and examples/blend.json. Run each in a fresh demo database because the destination capacity and contents change. Set DATA_DIR through your shell or environment file to separate experiments. Do not use the same embedded database from concurrent processes.

Bulk import, previews, field maps and exports are documented in docs/replace-vintrace.md. No CLI command sends, deletes business history or files regulatory returns. A supply statement reference records where the operator kept the signed statement; generating a draft does not deliver it.
