# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Owners:** Bangkok University students and staff, including international students (English, Chinese, Japanese), who have just lost something on campus. They open the site on a phone, often while walking between buildings and anxious about the item.
- **Finders:** anyone on campus who picked up an item and wants to log it and hand it to a drop-off point.
- **Guards (รปภ.):** security staff at the booths who confirm pickups and clear long-unclaimed items from the guard panel.

## Product Purpose

One place for everything found on campus. An owner searches found items, proves ownership by answering a verification question, and collects the item at the listed drop-off point. If nothing matches yet, they file a lost report and get an email (SNS) when a matching item is logged. Success: the owner finds or is notified about their item without walking booth to booth.

## Positioning

Campus-scoped and tied to the physical drop-off points (security booths, library counter, Student Affairs). Ownership is proven by a question only the owner can answer; the answer is never sent to the browser.

## Operating Context

- Primary use is mobile web on campus; the guard panel is used at a booth on a phone or desktop.
- Delivered as a CS446 Cloud Computing final project and demoed to the instructor and guards; it must read as a real, usable product.
- Static build hosted on S3 + CloudFront, API on ALB + EC2 Auto Scaling + RDS, photos on S3, labels from Rekognition, email via SNS. A mock mode (localStorage) is used for the Vercel demo.

## Capabilities and Constraints

- Routes: found-items list with search and filters (category, location, open/all), item detail with claim flow, report found (photo upload), report lost (university email required), sign in, guard panel (pending returns, stale items).
- Four UI languages: Thai (default), English, Chinese, Japanese. Light and dark themes.
- Stack is fixed: React 19, React Router (HashRouter), Tailwind CSS v4, Vite, lucide-react icons.
- `verificationAnswer` never appears in any response.

## Brand Commitments

Name "BU Lost & Found". No binding obligation to Bangkok University's official colours or logo; the visual identity is free.

## Evidence on Hand

- Sample places, drop-off points, found items, and test accounts live in `src/fixtures/mockData.ts`.
- No real usage numbers, testimonials, or partner endorsements exist; do not fabricate any.

## Product Principles

1. The anxious owner first: searching and recognising an item must be fast on a phone.
2. Physical places are the anchor: every item says where it was found and where to pick it up.
3. Trust through verification, not exposure: never reveal enough to let someone fake a claim.
4. Every language is first-class; Thai text sets the type requirements.

## Accessibility & Inclusion

WCAG AA contrast in both themes, keyboard-reachable controls, and layouts that survive Thai, Chinese, and Japanese text lengths.
