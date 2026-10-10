# 20grams Cafe

Independent cafe management system based on the AS-Cafe application.

## Project
- Cafe: 20grams Cafe
- Designed & Developed by: Mohamed Abdelkareem
- Phone: 01034469004
- Source baseline: AS-Cafe commit `e470780c3daa01d59221747291fc7e9e46f047b7`

## Independence
The original GitHub repository is not modified. A separate Supabase project is used for 20grams Cafe (`qnkddysjbiauplefuxaq`).

## Implemented backend
- Separate cafe settings, categories, products, modifier groups/modifiers, tables, orders and order items.
- Row-level security enabled on exposed tables.
- Customer Edge Function: menu loading, active tables, order creation, modifier validation, totals, tracking tokens and order tracking.
- Initial 10 active tables and owner profile created.

## Deployment
The repository contains a GitHub Actions bootstrap workflow that copies the pinned frontend baseline, applies the 20grams Cafe branding/footer, points the customer frontend at the new Supabase project, removes source-side workflow files from the generated build, and installs GitHub Pages deployment.

## Remaining production blocker
The original Supabase project is not accessible with the current connection (database/Edge Function inspection is denied). The original GitHub repository contains the frontend but not the backend Edge Function source/schema. Therefore the admin backend cannot be truthfully declared a complete 1:1 clone yet without access to the original Supabase backend or an export of its Edge Functions/schema.

Do not connect this project back to the original Supabase project if data isolation is required.
