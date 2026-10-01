# Moving records from vintrace

## One-command vineyard import

In vintrace, use Set Up, Fruit Sources, Configure, Import/Export Block, Export Vineyard to CSV. The user needs Import/Export Setup Data permission. Keep VINx2 ID unchanged. These steps and the field matching screen are documented in [vintrace's vineyard export guide](https://support.vintrace.com/hc/en-us/articles/32301319847828-Updating-Blocks-and-Vineyards-in-Bulk). Its [CSV guide](https://support.vintrace.com/hc/en-us/articles/32303307646868-Importing-and-Exporting-Data) explains headers and source identifiers. Checked 1 October 2026.

```bash
npm run migrate
npm run winery -- import vintrace vineyards.csv --kind=vineyards --preview
npm run winery -- import vintrace vineyards.csv --kind=vineyards
```

The second import command writes the checked export in one step. VINx2 ID becomes the stable source identifier, Name becomes vineyard name, Grower remains grower, GI/Region/AVA becomes region, Street 1/Street 2/City become address. Every source column remains in source_record. Missing region or address stays unknown. No grower, region or quantity is invented. Duplicate source IDs with identical content are unchanged. Conflicting IDs or names abort the whole file for reconciliation. Preview rolls back every row. UTF-8 BOM, quoted commas, embedded newlines, doubled quotes and CRLF are supported. Files with invalid headers or row lengths fail.

## Lab history

vintrace documents Lab, search, Export, All Matching in its [lab export guide](https://support.vintrace.com/hc/en-us/articles/32301343026964-Exporting-and-Importing-Lab-Results). Its example includes id, RequestDate, Winery, Batch, Vessel, Lab Ref, Brix, FSO2, TA, Temp and pH. R and NR are request markers, not measured values.

```bash
npm run winery -- import vintrace lab.csv --kind=lab --sampled-on=2026-10-01 --preview
npm run winery -- import vintrace lab.csv --kind=lab --sampled-on=2026-10-01
```

Reconcile and create the named lots first. Batch resolves to an existing lot. The importer accepts numeric pH, Brix, FSO2, TA and Temp and skips R/NR/empty cells. Units are pH, degrees Brix, mg/L, g/L and Celsius. Confirm these match your export. id plus metric prevents duplicate results. A changed existing result aborts for review. Extra fields stay in source_record alongside each imported result. An all-marker row creates no analysis; the import summary reports numeric metrics written.

RequestDate is the request time, not proof of sampling. Supply a verified Sampled On column in YYYY-MM-DD, or --sampled-on for a file whose results share that date. Split mixed-date exports or add the verified dates. Do not infer dates from Excel display fragments. Fixtures in examples are fictional, using documented columns, not exports from a customer account.

## Reconcile before the first cellar day

The free import does not recreate vessel balances, transfers, blends, work orders, invoices, attachments, completed lab requests or bottling history. Export and preserve those records from vintrace. Establish owners and vessels, then receive reconciled opening lots with source references, supplier addresses and complete origin fractions. Check totals by owner and vessel against the signed stocktake. Map historical movement and traceability records before relying on this system for a recall or audit. Enterprise DNA can build those mappings for your version.

The vineyard and numeric lab imports can be run in a day. A complete winery cutover depends on the condition and scope of the historical records. Retain access to your source archives and validate recovery before retiring any system.

## Your records out

`npm run winery -- export ./exports/first-backup` writes every domain record to JSON plus a count manifest in a consistent read snapshot. This is a portable records export, not a tested full-server backup or an automatic restore command. Keep database backups separately and test a restore in an isolated database.
