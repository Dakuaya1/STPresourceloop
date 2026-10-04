# STP Resource Loop

Complete static website export, 30 September 2026.
Updated: legal-requirement framing (Solid Waste Management Rules 2016), a "Proven elsewhere" section with sourced examples from India and abroad, and a cost planner calibrated to field data from Indian plants.
A short, interactive page: the main page says the three things that matter (required by law, good for the planet, produces resources). Details open on click: expandable cards, a clickable loop, tabbed project examples, a cost planner with optional extra inputs, and slide-in panels for the full brief.

## Publish on GitHub Pages

1. Extract the ZIP on your computer. Do not upload the ZIP itself.
2. Create a GitHub repository, for example `stp-resource-loop`. A public repository is the simplest option with GitHub Free.
3. Upload the extracted files directly into the repository root and commit to `main`. `index.html`, `site.css`, `site.js` and the media files must sit together at the top level, not inside another folder. Include `.nojekyll` if visible; it is an optional marker for this static site.
4. Open repository **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, then click **Save**.
6. Once deployment completes, GitHub shows your live website URL in Pages settings. The usual project URL is `https://YOUR-USERNAME.github.io/stp-resource-loop/`.

No Node.js, npm, API keys, backend, database, or build command is required. All website assets use relative paths so project-repository URLs work.

GitHub instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Files

- `index.html`: page text, layout structure, process SVG, calculator inputs and vendor table.
- `site.css`: desktop and mobile styles, motion graphics (loop, flowing pipes, bubbles) and reduced-motion rules. Fonts (Inter Tight, JetBrains Mono) load from Google Fonts.
- `site.js`: calculator, diagram controls, menu, scroll reveals, count-up figures and reading-progress bar.
- `og-image.png`: social-media preview image.
- `.nojekyll`: static-site marker.

## Edit and preview

Edit the HTML for copy, the CSS for appearance, and `site.js` for calculator assumptions or interactions. Commit updates to the publishing branch to update your site.

You can open `index.html` directly to inspect the basic page. For a closer match to the live site, run `python3 -m http.server 8000` inside the extracted folder and visit `http://localhost:8000/`.

## Use a branded web address

You can connect a domain you own through GitHub Pages settings and your domain provider's DNS settings. A custom domain is separate from this source package; no placeholder CNAME is included.
Official instructions: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Calculator notes

The cost planner shows what the system costs and what it produces. It does not show payback or financial returns.

- Project cost (central estimate and range), cost per home, and a cost breakdown: core system, digester tanks sized from retention time, food-waste and compost equipment, automation (hybrid and automated setups) and commissioning with start-up seeding.
- Yearly running cost (extra operator time, maintenance and spares, lab tests and consumables), also per family per month.
- Daily outputs: biogas, net electricity and compost. Gas output defaults to the field-proven level of Indian plants (about 45% of design yield); "Design yield" is an option.
- Optional inputs: thicker sludge, outside organic waste, vendor quote and the main assumptions.

Many cost figures are planning placeholders; replace them with vendor quotes. This is an early planning estimate, not a vendor quote or engineering design.

The export contains only the standalone website and this guide. Existing hosting configuration, Git history, credentials and unused artwork are excluded.
