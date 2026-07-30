# PRD — Renaștere (Platformă de recuperare din dependențe)

## Problem Statement
"Fa un site care sa ajute oamenii sa scape de independență de droguri alcool și multe altele."
Platformă în limba română care ajută oamenii să se elibereze de dependențe (alcool, droguri și altele).

## User Choices
- Toate funcționalitățile
- Culori liniștitoare (sage green + sand, light theme)
- Limba română
- Auth: JWT email+parolă (token în localStorage)
- Asistent AI: Claude Sonnet 4.5 ("Speranță"), streaming

## Architecture
- Backend: FastAPI + MongoDB (motor). Routes prefix /api. JWT Bearer auth, bcrypt.
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion + lenis + react-fast-marquee.
- Design: Cormorant Garamond (serif headings) + Outfit (body). Awwwards-level landing with kinetic hero.

## Implemented (2026-07-30)
- Auth: register/login/me/profile (JWT). Admin seeded (admin@recovery.ro/admin123).
- Landing page: kinetic masked hero, editorial marquee, numbered manifesto, features, CTA, emergency bar.
- Dashboard shell with collapsible sidebar (Prezentare, Jurnal, Asistent, Obiective, Comunitate, Resurse, Profil).
- Sobriety Tracker: days sober, money saved, milestones, reset (confirm dialog).
- Journal: mood(1-5) + emotions + note, upsert per day, list, delete.
- Goals: create (dialog), toggle complete, delete.
- Badges: computed from days/journal/goals.
- Community: posts (anon option), like, comments, delete own.
- AI Chat: streaming Claude Sonnet 4.5, session persistence, history.
- Resources: RO helplines (112, 0800 870 070), coping techniques, FAQ accordion.

## Testing
- iteration_1.json: backend 16/16 pass, frontend 100% flows. Fixed ObjectId serialization in create_post.

## Backlog / Next
- P1: Journal calendar heatmap view; mood trend chart (recharts).
- P1: Password reset flow + brute-force lockout (playbook).
- P2: Push/daily check-in reminders; shareable milestone cards.
- P2: Split server.py into routers per resource.
