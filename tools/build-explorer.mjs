import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const countries = JSON.parse(fs.readFileSync(path.join(root, 'data/country-climate-context.json'), 'utf8'));
const atlas = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/world-atlas/countries-110m.json'), 'utf8'));
const shapes = feature(atlas, atlas.objects.countries).features;
const today = new Date().toISOString().slice(0, 10);

const metrics = {
  co2PerCapita: { slug: 'co2-emissions-per-capita', short: 'CO₂ per person', title: 'CO₂ emissions per person by country', unit: 'tonnes per person', digits: 2, direction: 'lower' },
  co2: { slug: 'total-co2-emissions', short: 'Total CO₂', title: 'Total CO₂ emissions by country', unit: 'Mt CO₂e', digits: 1, direction: 'lower' },
  renewable: { slug: 'renewable-energy-share', short: 'Renewable energy', title: 'Renewable energy share by country', unit: '% of final energy use', digits: 1, direction: 'higher' },
  stress: { slug: 'freshwater-stress', short: 'Water stress', title: 'Freshwater stress by country', unit: '% of available resources', digits: 1, direction: 'lower' },
  urban: { slug: 'urban-population-share', short: 'Urban population', title: 'Urban population share by country', unit: '% of population', digits: 1, direction: 'context' },
  forest: { slug: 'forest-area', short: 'Forest area', title: 'Forest area by country', unit: 'km²', digits: 0, direction: 'context' },
  exposure: { slug: 'historic-disaster-exposure', short: 'Historic exposure', title: 'Historic climate-disaster exposure by country', unit: '% of population, 1990–2009 average', digits: 2, direction: 'lower' },
  population: { slug: 'population-context', short: 'Population', title: 'Population context by country', unit: 'people', digits: 0, direction: 'context' }
};

const aliases = new Map(Object.entries({
  'United States of America': 'United States', 'Dem. Rep. Congo': 'Congo, Dem. Rep.', 'Congo': 'Congo, Rep.',
  'Côte d’Ivoire': "Cote d'Ivoire", 'Czechia': 'Czech Republic', 'eSwatini': 'Eswatini', 'The Gambia': 'Gambia, The',
  'Kyrgyzstan': 'Kyrgyz Republic', 'Lao PDR': 'Lao PDR', 'Macedonia': 'North Macedonia', 'North Korea': "Korea, Dem. People's Rep.",
  'South Korea': 'Korea, Rep.', 'Russia': 'Russian Federation', 'Slovakia': 'Slovak Republic', 'Syria': 'Syrian Arab Republic',
  'Turkey': 'Turkiye', 'Venezuela': 'Venezuela, RB', 'Yemen': 'Yemen, Rep.', 'Bahamas': 'Bahamas, The',
  'Egypt': 'Egypt, Arab Rep.', 'Iran': 'Iran, Islamic Rep.', 'Brunei': 'Brunei Darussalam', 'Vietnam': 'Viet Nam',
  'Tanzania': 'Tanzania', 'W. Sahara': 'Western Sahara', 'Bosnia and Herz.': 'Bosnia and Herzegovina'
}));
const byName = new Map(countries.map(c => [c.name, c]));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fmt = (value, digits = 1) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: digits }).format(value);
const jsonLd = (title, description, canonical) => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': canonical === 'https://climate99.com/' ? 'WebSite' : 'WebPage',
  name: title,
  description,
  url: canonical,
  ...(canonical === 'https://climate99.com/' ? {} : { isPartOf: { '@type': 'WebSite', name: 'Climate99', url: 'https://climate99.com/' } }),
  publisher: { '@type': 'Organization', name: '37x Limited', url: 'https://37xventures.com/' }
}).replace(/</g, '\\u003c');
const pageHead = (title, description, canonical) => `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Climate99</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${jsonLd(title, description, canonical)}</script><meta name="theme-color" content="#123b36"><meta name="37x-ga-measurement-id" content="G-SWVLQ1LFZ7"><script defer src="/analytics-consent.js"></script><link rel="icon" href="data:,"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/country.css"><link rel="stylesheet" href="/explorer.css">`;
const header = active => `<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/"><span class="brand-mark">≈</span><span>Climate<span class="brand-accent">99</span></span></a><nav aria-label="Primary"><a ${active === 'countries' ? 'aria-current="page"' : ''} href="/">Countries</a><a ${active === 'compare' ? 'aria-current="page"' : ''} href="/compare">Compare</a><a ${active === 'map' ? 'aria-current="page"' : ''} href="/map">Map</a><a href="/evidence-coverage">Sources &amp; method</a></nav></header>`;
const footer = () => `<footer><div class="footer-brand"><a class="brand" href="/"><span class="brand-mark">≈</span><span>Climate<span class="brand-accent">99</span></span></a><p>Comparable country climate context, with dates and sources visible. Data collection follows the observation year shown beside each measure; site evidence rechecked 3 September 2026.</p></div><div><b>Explore</b><a href="/compare">Compare countries</a><a href="/map">World map</a></div><div><b>Evidence</b><a href="/metric/co2-emissions-per-capita">CO₂ per person</a><a href="/metric/renewable-energy-share">Renewable energy</a></div><div><b>Trust</b><a href="/evidence-coverage">Sources &amp; method</a><span>Historic evidence, not a forecast.</span></div></footer>`;
const shell = (title, description, canonical, active, content, scripts = '') => `<!doctype html><html lang="en-GB"><head>${pageHead(title, description, canonical)}</head><body>${header(active)}<main id="main">${content}</main>${footer()}${scripts}</body></html>`;
const metricLinks = () => Object.entries(metrics).map(([key, m]) => `<a class="metric-link" href="/metric/${m.slug}"><span>${esc(m.short)}</span><b>Compare ${countries.filter(c => c.metrics[key]).length} countries</b><small>${esc(m.unit)} · years shown per value</small><em>→</em></a>`).join('');

const home = `<section class="explorer-hero"><div><p class="eyebrow">Country climate evidence</p><h1>See the climate context.<br><em>Change the question.</em></h1><p>Explore ${countries.length} countries through dated evidence for CO₂, renewable energy, water stress, forests and urbanisation. Compare places directly or change the metric on the world map.</p><div class="hero-actions"><a class="primary-link" href="/compare">Compare countries</a><a class="outline-button" href="/map">Explore the map</a></div></div><aside class="hero-preview" aria-label="Explorer preview"><span>Explore by metric</span><strong>CO₂ per person</strong><div class="preview-bars"><i style="height:35%"></i><i style="height:70%"></i><i style="height:48%"></i><i style="height:88%"></i><i style="height:57%"></i></div><small>Every bar keeps its source year.</small></aside></section><section class="metric-directory"><div class="section-heading"><div><p class="eyebrow">Eight ways into the evidence</p><h2>What do you want to compare?</h2></div><p>Each ranking is a stable, crawlable page. The comparison and map tools let you change the view without inventing a blended climate score.</p></div><div class="metric-links">${metricLinks()}</div></section><section class="country-directory"><div class="section-heading"><div><p class="eyebrow">${countries.length} evidence pages</p><h2>Find a country</h2></div><label class="compact-search">Search countries<input id="country-filter" type="search" autocomplete="off" placeholder="e.g. France or Japan"></label></div><div class="country-grid">${countries.map(c => `<a class="country-card" data-country="${esc(c.name.toLowerCase())}" href="/country/${c.iso3.toLowerCase()}"><span>${c.iso3}</span><strong>${esc(c.name)}</strong><small>${Object.keys(c.metrics).length} measures available</small><b>→</b></a>`).join('')}</div><p id="empty-state" hidden>No country matches that search.</p></section><section class="method-banner"><div><p class="eyebrow">Honest comparisons</p><h2>Dates stay attached to the data.</h2></div><p>Indicators update on different schedules. Climate99 shows the year beside every number and never presents these national observations as live weather or a forecast.</p><a class="outline-button" href="/evidence-coverage">Read the method →</a></section>`;
fs.writeFileSync(path.join(root, 'index.html'), shell('Climate evidence and country comparisons', `Compare sourced climate and environmental indicators for ${countries.length} countries using rankings, charts and an interactive map.`, 'https://climate99.com/', 'countries', home, `<script>const q=document.querySelector('#country-filter'),cards=[...document.querySelectorAll('[data-country]')],empty=document.querySelector('#empty-state');q.addEventListener('input',()=>{let n=0,s=q.value.trim().toLowerCase();cards.forEach(c=>{const show=c.dataset.country.includes(s);c.hidden=!show;if(show)n++});empty.hidden=n>0})</script>`));

const options = countries.map(c => `<option value="${c.iso3}">${esc(c.name)}</option>`).join('');
const compareContent = `<section class="tool-hero"><p class="eyebrow">Interactive comparison</p><h1>Compare countries,<br><em>one measure at a time.</em></h1><p>Select a metric and up to five countries. The chart changes immediately; its table preserves every observation year and source.</p></section><section class="tool-shell"><div class="tool-controls"><label>Metric<select id="metric">${Object.entries(metrics).map(([key,m])=>`<option value="${key}">${esc(m.short)}</option>`).join('')}</select></label><fieldset><legend>Countries</legend>${[0,1,2,3,4].map((_,i)=>`<label><span>Country ${i+1}</span><select class="country-select"><option value="">Choose…</option>${options}</select></label>`).join('')}</fieldset><button id="share-view" class="outline-button" type="button">Copy this view</button><span id="copy-status" role="status"></span></div><div class="chart-panel"><div class="chart-heading"><div><p class="eyebrow">Current view</p><h2 id="chart-title">CO₂ per person</h2></div><span id="chart-unit"></span></div><div id="comparison-chart" class="comparison-chart" role="img" aria-label="Country comparison bar chart"></div><div class="table-wrap"><table><thead><tr><th>Country</th><th>Value</th><th>Year</th><th>Source</th></tr></thead><tbody id="comparison-table"></tbody></table></div><p class="chart-caveat">Different observation years are not aligned or interpolated. Compare the values with their years, not as if all were measured today.</p></div></section><section class="ranking-cta"><div><p class="eyebrow">Need the full table?</p><h2>Browse every country for this measure.</h2></div><a id="ranking-link" class="primary-link" href="/metric/co2-emissions-per-capita">Open the ranking</a></section>`;
fs.writeFileSync(path.join(root, 'compare.html'), shell('Compare climate indicators by country', 'Compare up to five countries across CO₂, renewable energy, water stress, forest and urban indicators, with source years visible.', 'https://climate99.com/compare', 'compare', compareContent, `<script>window.CLIMATE_DATA=${JSON.stringify(countries)};window.CLIMATE_METRICS=${JSON.stringify(metrics)}</script><script src="/explorer.js"></script>`));

const projection = geoNaturalEarth1().fitExtent([[16, 16], [984, 484]], { type: 'Sphere' });
const draw = geoPath(projection);
const mapPaths = shapes.map(s => { const sourceName = aliases.get(s.properties.name) || s.properties.name; const c = byName.get(sourceName); return `<path d="${draw(s)}" ${c ? `data-iso3="${c.iso3}" tabindex="0"` : ''}><title>${esc(c?.name || s.properties.name)}</title></path>`; }).join('');
const mapContent = `<section class="tool-hero map-hero"><p class="eyebrow">Visual climate explorer</p><h1>Change the metric.<br><em>See the world differently.</em></h1><p>This map colours countries only where Climate99 has an approved observation. Choose a measure, then select a country for its value, year and evidence page.</p></section><section class="map-shell"><div class="map-toolbar"><label>Colour map by<select id="map-metric">${Object.entries(metrics).map(([key,m])=>`<option value="${key}">${esc(m.short)}</option>`).join('')}</select></label><div id="map-legend" class="map-legend" aria-label="Map colour scale"></div></div><div class="world-map-wrap"><svg id="world-map" class="world-map" viewBox="0 0 1000 500" role="img" aria-labelledby="map-title map-desc"><title id="map-title">World map of climate indicators</title><desc id="map-desc">Countries are coloured according to the selected dated indicator.</desc><path class="sphere" d="${draw({ type: 'Sphere' })}"></path>${mapPaths}</svg><aside id="map-detail" class="map-detail" aria-live="polite"><p class="eyebrow">Select a country</p><h2>Explore the map</h2><p>Tap or focus a coloured country to see its value and observation year.</p></aside></div><p class="chart-caveat">Boundaries are a generalised Natural Earth reference for visual navigation and do not imply any position on territorial status. Small territories may not appear at this map scale.</p></section><section class="metric-directory"><div class="section-heading"><div><p class="eyebrow">Accessible alternative</p><h2>Use the full country rankings</h2></div><p>Every map measure also has a sortable text table suitable for keyboard and screen-reader users.</p></div><div class="metric-links">${metricLinks()}</div></section>`;
fs.writeFileSync(path.join(root, 'map.html'), shell('Interactive world climate map', 'Change the metric on an interactive world map of CO₂, renewables, water stress, forests and other dated country indicators.', 'https://climate99.com/map', 'map', mapContent, `<script>window.CLIMATE_DATA=${JSON.stringify(countries)};window.CLIMATE_METRICS=${JSON.stringify(metrics)}</script><script src="/explorer.js"></script>`));

const metricDir = path.join(root, 'metric'); fs.mkdirSync(metricDir, { recursive: true });
for (const [key, metric] of Object.entries(metrics)) {
  const rows = countries.filter(c => c.metrics[key]?.value != null).sort((a,b) => b.metrics[key].value - a.metrics[key].value);
  const description = `${metric.title}: compare ${rows.length} countries using dated World Bank evidence, with links to country context and an interactive chart.`;
  const content = `<section class="tool-hero ranking-hero"><p class="eyebrow">Country ranking · ${rows.length} observations</p><h1>${esc(metric.title)}.</h1><p>${esc(description)} This is a descriptive table, not a judgement of national performance.</p><div class="hero-actions"><a class="primary-link" href="/compare#metric=${key}">Compare selected countries</a><a class="outline-button" href="/map#metric=${key}">View on map</a></div></section><section class="ranking-shell"><div class="ranking-controls"><label>Filter countries<input id="rank-filter" type="search" placeholder="Type a country name"></label><button id="rank-order" class="outline-button" type="button">Highest first</button></div><div class="table-wrap"><table id="ranking-table" class="ranking-table"><thead><tr><th>Rank</th><th>Country</th><th>${esc(metric.short)}</th><th>Observation year</th></tr></thead><tbody>${rows.map((c,i)=>`<tr data-country="${esc(c.name.toLowerCase())}" data-value="${c.metrics[key].value}"><td>${i+1}</td><td><a href="/country/${c.iso3.toLowerCase()}">${esc(c.name)}</a></td><td>${fmt(c.metrics[key].value, metric.digits)} ${esc(metric.unit)}</td><td>${esc(c.metrics[key].year)}</td></tr>`).join('')}</tbody></table></div><p class="chart-caveat">Source: ${key === 'co2PerCapita' ? 'calculated from World Bank emissions and population inputs no more than two years apart' : 'World Bank'}. Observation years vary by country and remain visible above.</p></section>`;
  fs.writeFileSync(path.join(metricDir, `${metric.slug}.html`), shell(metric.title, description, `https://climate99.com/metric/${metric.slug}`, 'countries', content, `<script>const q=document.querySelector('#rank-filter'),b=document.querySelector('#rank-order'),body=document.querySelector('#ranking-table tbody');let desc=true;function draw(){const rows=[...body.rows];rows.sort((a,z)=>(+z.dataset.value-+a.dataset.value)*(desc?1:-1));rows.forEach((r,i)=>{r.cells[0].textContent=i+1;body.append(r)});b.textContent=desc?'Highest first':'Lowest first'}q.addEventListener('input',()=>{const s=q.value.trim().toLowerCase();[...body.rows].forEach(r=>r.hidden=!r.dataset.country.includes(s))});b.addEventListener('click',()=>{desc=!desc;draw()})</script>`));
}

for (const c of countries) {
  const file = path.join(root, 'country', `${c.iso3.toLowerCase()}.html`);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<nav><a href="\/">Countries<\/a><a href="\/evidence-coverage">Sources &amp; method<\/a><\/nav>/, `<nav aria-label="Primary"><a href="/">Countries</a><a href="/compare#countries=${c.iso3}">Compare</a><a href="/map#country=${c.iso3}">Map</a><a href="/evidence-coverage">Sources &amp; method</a></nav>`);
  if (!html.includes('country-actions')) html = html.replace('</section><section class="metric-grid">', `<div class="country-actions"><a class="primary-link" href="/compare#countries=${c.iso3}">Compare ${esc(c.name)}</a><a class="outline-button" href="/map#country=${c.iso3}">Find on map</a></div></section><section class="metric-grid">`);
  fs.writeFileSync(file, html);
}

let evidence = fs.readFileSync(path.join(root, 'evidence-coverage.html'), 'utf8');
evidence = evidence.replace('<strong>7</strong>approved measures', '<strong>8</strong>published measures');
if (!evidence.includes('Natural Earth')) evidence = evidence.replace('</section><section class="scope-note"><h2>Known limits</h2>', `<article class="source-card"><h2>Natural Earth map reference</h2><p>Generalised country boundaries power the interactive map. They are used for visual navigation only.</p><div class="source-meta"><span>Public domain</span><span>110m scale</span><span>No personal data</span></div><p><a href="https://www.naturalearthdata.com/" rel="nofollow external">Natural Earth</a></p></article></section><section class="scope-note"><h2>Known limits</h2>`);
fs.writeFileSync(path.join(root, 'evidence-coverage.html'), evidence);

const manifestFile = path.join(root, 'data/projection-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
manifest.generatedAt = new Date().toISOString();
manifest.sources = manifest.sources || [];
if (!manifest.sources.some(source => source.publisher === 'Natural Earth')) manifest.sources.push({
  publisher: 'Natural Earth',
  licence: 'Public domain',
  url: 'https://www.naturalearthdata.com/',
  use: 'Generalised country boundaries for visual navigation only'
});
manifest.publicInterfaces = {
  countryPages: countries.length,
  metricRankingPages: Object.keys(metrics).length,
  interactiveComparison: true,
  interactiveMap: true,
  mapBoundaryScale: 'Natural Earth 1:110m'
};
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

const staticUrls = ['', 'compare', 'map', 'evidence-coverage', 'uk-solar-deployment', 'camden-air-quality-history'];
const urls = [...staticUrls, ...Object.values(metrics).map(m => `metric/${m.slug}`), ...countries.map(c => `country/${c.iso3.toLowerCase()}`)];
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u,i)=>`  <url><loc>https://climate99.com/${u}</loc><lastmod>${today}</lastmod><changefreq>${i < 14 ? 'monthly' : 'yearly'}</changefreq><priority>${i === 0 ? '1.0' : i < 14 ? '0.8' : '0.7'}</priority></url>`).join('\n')}\n</urlset>\n`);
console.log(JSON.stringify({ countries: countries.length, metrics: Object.keys(metrics).length, sitemapUrls: urls.length, mapShapes: shapes.length }, null, 2));
