---
description: "Complete a cellar job"
---

# Complete a cellar job

Read the affected records first with `npm run winery -- lots --json` and the matching owner, vessel or work-order read. Obtain the actual values from the operator. Follow docs/cli.md and write the input to a local JSON file, then run `npm run winery -- complete --file=<input.json> --json`. Report the saved record and re-read the affected state. Never invent a measurement, approval or event. This records work; it never tells a worker to carry out a physical treatment.
