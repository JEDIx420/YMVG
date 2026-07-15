# SWIR Club Data-Quality Report

Source: `public/SWIR CLUB STATUS 2025-26.pdf`

Extraction was checked against rendered images of all four PDF pages. The source has 169 club rows and 168 unique club iMIS IDs. The canonical seed contains one row per unique iMIS ID.

## Summary

| Check | Result |
| --- | --- |
| Source club rows | 169 |
| Unique club iMIS IDs | 168 |
| Canonical seeded clubs | 168 |
| Active clubs | 168 |
| Y's Men's Clubs | 160 |
| Y's Women's Clubs | 8 |
| Zone 1 clubs | 66 |
| Zone 2 clubs | 48 |
| Zone 3 clubs | 29 |
| Zone 4 clubs | 25 |

## Duplicate Club iMIS IDs

- `21481` appears twice for `Mukhathala`, both in District 5. The rows differ in charter-start year and member-status cells. Migration 019 seeds one canonical `Mukhathala` record keyed by iMIS ID and does not treat the second row as a separate club.

## Duplicate Club Names

- `Hamilton` appears as iMIS `21862` in District 2 and iMIS `17660` in District 3. These remain separate clubs. The selector displays district and iMIS ID so applicants can distinguish them.
- `Mukhathala` appears twice with the same iMIS ID `21481` in District 5. This is the repeated source identity described above.

## Same Name in Different Districts

- `Hamilton - District 2 - iMIS 21862`
- `Hamilton - District 3 - iMIS 17660`

## Duplicate Source Rows

There are no byte-identical full rows after all membership/date cells are considered. There is one duplicate club identity: `Mukhathala`, iMIS `21481`, District 5. It appears once with charter start `15/01/25` and once with charter start `15/01/26`; the latter is marked as a new club in the source status cells.

## Spelling and Capitalization Inconsistencies

- `Nagarcoil Star` uses `Nagarcoil`, while several other source names use `Nagercoil`.
- `ACON Kuzhithurai Youth` and `Acon Kuzhithurai Youth Glitters` use different capitalization for `Acon`.
- `Greator Polayathode` may be a source spelling issue; no correction was made.
- `Kumari Iyal Mantam`, `Vattiyoorkav`, and `Openness Thammathukonam Youth` should be checked against the official iMIS master before any spelling correction. No correction was inferred.

## Manual Review Required

- Confirm which `Mukhathala` source row carries the authoritative charter date. The club master does not store charter date, so this does not block the onboarding seed.
- Confirm the source spellings listed above against iMIS. The seed preserves the PDF exactly.
- Confirm that the internationally named clubs listed under SWIR Districts 1 and 3 are intentionally selectable. They remain selectable because the supplied master marks every row `Active` and places them within SWIR districts.

No fuzzy matching, club-name merging, or inferred spelling correction was performed.
