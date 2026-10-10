# 20grams Cafe

Independent cafe management system based on the AS-Cafe application.

## Project
- Cafe: 20grams Cafe
- Designed & Developed by: Mohamed Abdelkareem
- Phone: 01034469004
- Source baseline: AS-Cafe commit `e470780c3daa01d59221747291fc7e9e46f047b7`

## Independence
The original GitHub repository is not modified. A separate Supabase project is used for 20grams Cafe (`qnkddysjbiauplefuxaq`).

## Deployment
Bootstrap preserves the project's own workflows while copying only the application source from the pinned AS-Cafe baseline. GitHub Pages is managed separately.

## Build check
Final bootstrap trigger after isolating project workflows from the source copy.

## Remaining production blocker
The original Supabase project is not accessible with the current connection (database/Edge Function inspection is denied). The original GitHub repository contains the frontend but not the backend Edge Function source/schema. Therefore the admin backend cannot be truthfully declared a complete 1:1 clone yet without access to the original Supabase backend or an export of its Edge Functions/schema.
