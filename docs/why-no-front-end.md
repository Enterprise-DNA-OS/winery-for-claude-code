# Views without an application

A cellar operator asks for tank contents, a lab follow-up or a trace. The agent runs the CLI against a database the winery owns. Four read-only HTML views and five document types supply the week, the exceptions, tank space, owner reviews and printable records. No web application is needed to use the base.

Screens are useful for quick mobile entry, offline harvest work, barcode scanning and shared visual planning. This base has no mobile app, offline sync, authentication interface, device feeds, accounting, finished-goods dispatch or purchasing. Bottling records trace the source lot and packaging reference but are not a finished-goods warehouse. Additions record measured inputs and supplier batches but do not calculate doses or maintain consumables stock. Lab watch is a simple time-since-any-sample rule. No claim is made that this covers every vintrace dashboard.

Transfers and blends record completed, verified events. There is no replay engine for retroactive stock history, no silent correction of past operations and no delete command. Correct a recorded loss or movement with a reviewed migration and preserve the old evidence. New blends require an empty destination and one owner. Bulk transfers keep the same lot. Blends create a new lot and weighted composition. A shared Postgres database uses a transaction lock to serialise CLI writes. Embedded PGlite is for one process at a time.

The open-source base runs locally for one operator or against a shared database. Secure network access, least-privilege accounts, backups and restore tests belong to the actual deployment. This repo does not provision them. Enterprise DNA builds the winery's interfaces and connections through Omni by Enterprise DNA, with one setup fee then a retainer.
