# Asset Harvest

## Minimum URL Harvest

When the user gives a product, app, or landing-page URL, fetch safe public assets before designing the ad:

- HTML metadata: title, description, canonical URL.
- Open Graph image: `og:image`.
- Favicon and apple touch icon.
- Public logo image when clearly linked.
- Public product/app screenshots when clearly part of the marketing page.
- CSS color tokens or obvious brand colors.

For ecommerce product URLs, the product page is the source of truth. Run the
root harvester before writing creative:

```bash
node scripts/harvest-ecommerce-assets.mjs "<product-url>" --brand "<brand>" --out-dir <public-brand-dir>
```

Product-link rules:

- Product main image is mandatory for a product-first ad when the page exposes one.
- Search engines are last-resort fallback only; never use search before trying the supplied product URL.
- Do not treat platform chrome, category banners, empty-state art, app-store badges, logo files, risk/challenge pages, or generic brand imagery as product photos.
- If the harvester reports `blocked: true` or exits with `Main image: not harvested`, stop the production path and report the blocker. Do not make a fake product ad from placeholders.
- If the user's own browser can open the page but headless/curl cannot, use a browser-backed extraction mode or ask for browser access/image URLs instead of switching to search.
- If crawler plus browser-backed extraction still cannot get the product image, stop and ask the user to provide product images/screenshots. Do not generate or search a substitute for the product main image.
- Ecommerce copy should introduce the linked item first; platform or store context can be secondary proof only.

Store harvested assets under the generated example or target project `public/<brand>/` folder and reference them with Remotion `staticFile()`.

When practical, create an asset manifest after harvesting:

```bash
node skills/remotion-ad-video/scripts/build_asset_manifest.mjs <public-brand-dir> --brand <Brand> --source <URL> --out <public-brand-dir>/asset-manifest.json
```

## Use Rules

- Use logos, icons, screenshots, and OG images as source-page references unless the user confirms commercial rights.
- Prefer local copies for stable renders.
- Keep the asset source URL and rights status in the source summary.
- Keep asset dimensions, inferred type, source URL, and rights status in `asset-manifest.json` when generated.
- If no product visual is available, create a custom motion graphic instead of leaving an empty placeholder.

## Minimum Visual Bar

Do not ship an ad that is only text panels. Every commercial sample should include at least one of:

- Product screenshot or app screenshot.
- Logo/icon plus animated product UI reconstruction.
- OG/hero image.
- Generated or custom-coded motion scene that visualizes the product outcome.
