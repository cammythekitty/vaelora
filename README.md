# vaelora

Base framework for the new Vaelora site: a showcase of what the developer behind it can build. Plain HTML, CSS and JS with no build step.

## Structure

```
index.html              Home: orbit hero, what I can do, selected work, how I work
about/index.html        About: intro, text, at-a-glance facts
projects/index.html     Projects: featured project with design preview, then the full list
contact/index.html      Contact: ways to reach a real person, things I love hearing about
404.html                Not found page (orbit hero)
_template.html          Blank starter for new pages
assets/
  css/
    tokens.css          Colors, type, spacing, night/dawn themes. Change the look here.
    base.css            Reset and element defaults
    layout.css          Container, header, nav, footer
    components.css      Orbit hero, page intro, sections, project list, capabilities, ways, sparkle list, buttons
  js/
    main.js             Theme toggle, mobile nav, orbit reduced-motion, footer year
  img/
    favicon.svg
    logos/              Orbit logo files (icon + horizontal lockups)
```

No photos of people or real places. Project logos are inline SVG line icons, and the featured project shows a render from the project itself (`assets/img/projects/`).

## Design

Everything comes from the orbit logo:

- **Color:** Night `#140B1F` / Dawn `#FBF7FD`, with the Rose `#D4558B` → Iris `#9A72BC` → Azure `#1D88DD` spectrum kept for the orbit, links and focus.
- **Type:** Jost (geometric, like the wordmark) with light-weight headlines. JetBrains Mono only for the footer status line. Both load from Google Fonts.
- **Signature:** the orbit ring on the home and 404 heroes passes behind the headline and back in front, like the ring around the V. The sparkle travels along it and stops when reduced motion is on.

## Components

| Class | What it is |
| --- | --- |
| `.orbit-hero` | Big headline with the orbit ring (copy the markup from `index.html`) |
| `.page-intro`, `.lead` | Inner-page heading block and large muted paragraph |
| `.section`, `.section-heading` | Page band and its heading row with a hairline (optional link on the right) |
| `.capabilities` | Two-column list of skill areas: name, one line, tools |
| `.project-list`, `.project` | Rows of projects: logo, name, description, "built with", status |
| `.project-mark` | Project logo tile holding an inline SVG icon (or an `<img class="project-mark">`) |
| `.featured-project` | Large design preview beside a project write-up |
| `.status-orbit` / `-pad` / `-drafting` | Project status: shipped, in progress, planned |
| `.split` | Two columns on wide screens, stacked on phones |
| `.facts` | Label and value rows (definition list) |
| `.button-primary` / `.button-secondary` | Buttons; wrap several in `.button-row` |
| `.placeholder` | Stand-in box for a future screenshot; set `--ratio` (currently unused) |
| `.ways` | Ways to reach out: where, what it's for, the address |
| `.sparkle-list` | List with the logo's four-point sparkle as bullets |
| `.stack` | Even vertical spacing between children |

## Adding a page

Copy `_template.html` to `<name>/index.html`, change the `<title>`, description and `<main>`, then add the link to `.nav-links` on every page. Set `aria-current="page"` on the new page's own link.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Asset paths start with `/`, so serve from the repo root. Opening the file directly won't work.
