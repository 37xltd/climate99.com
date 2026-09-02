# Climate99

Static country-level climate and environmental evidence site deployed to the Cloudflare Pages project `climate99`.

## Data and publication rule

Pages are generated from governed R2 imports of seven World Bank country indicators and the public-domain OurAirports country reference. A country page is only generated when at least four measures are available. No personal data is used.

The site deliberately does not claim to provide live weather, forecasts, city-level conditions or personal exposure. Every displayed indicator retains its observation year. Calculated CO2 per-person values are only produced when source years are within two years.

## Rebuild

Download the approved source objects to the `/tmp/climate99-*` paths declared at the top of `tools/build-country-pages.mjs`, then run:

```sh
node tools/build-country-pages.mjs
```

The generator creates the homepage, country pages, sitemap, public data projection and checksum manifest. Commit generated outputs so Git remains the recoverable deployment source.

## Deployment

Deploy the site root to Cloudflare Pages project `climate99`. The governed public projection is stored in `atlas-raw` under `public-projections/climate99/`.
