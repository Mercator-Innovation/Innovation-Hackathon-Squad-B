# Good practice, proportionately

It's a hackathon, so don't produce compliance paperwork. But do build the habits a public sector client would expect, and if you can't meet something in the time, say so at show and tell.

## Accessibility (always)

- Aim for WCAG 2.2 AA: UK public sector services are legally required to be accessible.
- Headings in order, a label on every form field, everything works with a keyboard, visible focus, text contrast at least 4.5:1, alt text on meaningful images, and nothing shown by colour alone.
- Check at phone width (about 375 pixels) as well as on a laptop.

## Patterns and look

- Good, tested references: the [GOV.UK Design System](https://design-system.service.gov.uk), the [NHS digital service manual](https://service-manual.nhs.uk) and other accessible pattern libraries. Ask `/find-out` for a pattern that fits.
- You don't have to look like GOV.UK. Use whatever suits the people and organisations in your challenge.
- A prototype mustn't pass itself off as a real organisation's brand.

## Data and privacy (always)

- **Synthetic or open data only.** Never real personal data, client data or real business figures.
- Health and substance use are **special category** data under UK GDPR. Design as if a real service would need a data protection impact assessment.
- Collect or show only what's needed. If information moves between organisations, show how the person would know and agree.

## People and fairness

- If a design flags or scores households or people (likely in challenge 1), keep a human in the loop, show why something was flagged, and give people a way to challenge it.
- Be honest about uncertainty: show ranges and assumptions, especially for numbers investors would rely on (challenge 3).

## Content

- Plain English: short sentences, "you", no jargon, a reading age of about 9.
- Person-first, non-stigmatising language, especially about substance use, poverty and housing.

## Security basics

- No keys or passwords in the code or the repo (use `.env`, which git ignores).
- No real credentials, and no production systems.
