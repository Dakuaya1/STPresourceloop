# STP Resource Loop

Complete static website export, 30 September 2026.
Updated: legal-requirement framing (Solid Waste Management Rules 2016), a "Proven elsewhere" section with sourced examples from India and abroad, and a cost planner calibrated to field data from Indian plants.
Includes the project brief, animated resource-loop graphic, interactive system diagram and cost planner.

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

The planner compares three setups (manual, hybrid, automated) and includes:

- core system cost from the workbook, scaled by STP capacity;
- digester and covered digestate tank volume sized from retention time (default 30 days) and daily feed, priced per m³ above the workbook's built-in 50 m³/MLD;
- food-waste preparation (shredder line) and composting equipment;
- an automation package for the hybrid and automated setups;
- commissioning and start-up seeding;
- yearly running costs: extra operator time, maintenance and spares, lab testing and consumables;
- a gas-output basis: "Field-proven" (default, about 45% of design yield, matching Pune plant data) or "Design yield";
- an optional comparison against the simplest legally compliant alternative;
- value from net electricity (after the plant's own use), avoided disposal spend and fertilizer value.

An "Improve the returns" block adds thicker sludge (smaller tanks), outside organic waste with a fee, and compost sales. A step-by-step table shows what each improvement adds, and a button applies the recommended package. Maintenance is charged on equipment rather than tanks, operator cost grows with tonnes handled, and food-waste equipment gets cheaper per kg above 1 tonne/day.

Digester tank rate, automation packages, operator cost, maintenance rate and electricity value are planning placeholders. The advanced assumptions panel makes the main ones editable; replace them with vendor and site figures. Payback is simple and undiscounted, and excludes financing, taxes and major replacements. Carbon-credit revenue is excluded. Inputs outside 1,000–10,000 homes extrapolate the reference model. This is an early planning estimate, not a vendor quote or engineering design.

The export contains only the standalone website and this guide. Existing hosting configuration, Git history, credentials and unused artwork are excluded.
