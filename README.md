# STP Resource Loop

Complete static website export, 30 September 2026.
Includes the redesigned project brief, animated headline, interactive system diagram, cost calculator, narrated video and English captions.

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
- `site.css`: desktop and mobile styles, headline animation and reduced-motion rules.
- `site.js`: calculator, diagram controls, menu and scroll reveals.
- `STP_Resource_Loop_Explainer_Voiceover.mp4`: narrated explainer and download.
- `explainer-poster.jpg`: video cover image.
- `explainer.vtt`: English captions.
- `.nojekyll`: static-site marker.

## Edit and preview

Edit the HTML for copy, the CSS for appearance, and `site.js` for calculator assumptions or interactions. Commit updates to the publishing branch to update your site.

You can open `index.html` directly to inspect the basic page. For more reliable media/caption testing, run `python3 -m http.server 8000` inside the extracted folder and visit `http://localhost:8000/`.

## Use a branded web address

You can connect a domain you own through GitHub Pages settings and your domain provider's DNS settings. A custom domain is separate from this source package; no placeholder CNAME is included.
Official instructions: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Calculator notes

The model includes core system cost plus food-waste and compost equipment. Annual value is before O&M, auxiliary electricity consumption, downtime, financing and taxes. Carbon-credit revenue is excluded. Inputs outside 1,000–10,000 homes extrapolate the reference model. This is an early planning estimate, not a vendor quote or engineering design.

The export contains only the standalone website and this guide. Existing hosting configuration, Git history, credentials and unused artwork are excluded.
