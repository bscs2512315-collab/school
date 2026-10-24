# Class X Mathematics Past-Paper Repair

Date: 2026-09-22  
Scope: AKUEB, Class X, Mathematics only  
Database: production

## Authoritative sources

- AKUEB Resources SSC-II Mathematics index: https://akuebresources.com/past-papers/ssc-ii/mathematics/
- Paper I PDFs for 2021, 2022, 2023, 2024, and 2025
- Paper II PDFs for 2023, 2024, and 2025
- Official answer-key PDFs for 2021 through 2025

The local source PDFs used for page-by-page visual comparison are under:

- `pastpapers/MathsXP1/`
- `pastpapers/ClassX_P2/Mathematics/`

## Production safety

Before changing production, all 8 matching `past_papers` records and all 278
original `questions` records were exported in one repeatable-read transaction.
The backup is excluded from Git and stored at:

`backups/production/class-x-mathematics/2026-09-22T08-47-56-653Z.json`

SHA-256:

`887bb7162c1379ad67e5d3397dbf71e1abf2a4749255e49ad464cd622acd7c14`

## Corrections applied

- Removed 32 formula/text screenshots that duplicated content already rendered as text.
- Added or replaced 23 question-specific source crops. Shared source figures reuse one uploaded asset.
- Restored four missing 2023 Paper II rows: Q2(a), Q2(b), Q3(a), and Q3(b).
- Updated 2023 Paper II's row count from 13 to 17.
- Removed 13 generated image-description fragments from question text.
- Corrected 47 Paper I answer keys against the published AKUEB keys.
- Corrected two missing negative signs in 2024 Paper I Q21 options.
- Added proper stacked limit rendering for `x → value` beneath `lim`.
- Added indexed-radical rendering with the index tucked into the radical and a bar over the radicand.
- Escaped untrusted source HTML before math conversion to close the stored-XSS path documented in the security audit while preserving the imported paper formatting tags.

## Verification

- 8 papers present.
- 282 question rows present after restoring the four missing rows.
- Paper I row counts are 50, 50, 45, 45, and 45 for 2021–2025.
- Paper II row counts are 17, 13, and 17 for 2023–2025.
- 104 intentional image assignments remain.
- All 98 unique referenced image URLs returned a successful HTTP response.
- All Paper I questions have four options and a valid answer ID.
- A second answer-key dry run reports zero remaining differences.
- Limit, indexed-root, allowed-formatting, and XSS regression checks pass.
- The notation examples were rendered in headless Chrome and visually inspected.
