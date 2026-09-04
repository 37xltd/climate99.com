import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const countries = JSON.parse(read('data/country-climate-context.json'));

test('interactive explorer pages are generated and indexable', () => {
  for (const file of ['index.html', 'compare.html', 'map.html']) {
    const html = read(file);
    assert.match(html, /<meta name="robots" content="index,follow/);
    assert.match(html, /<link rel="canonical" href="https:\/\/climate99\.com\//);
    assert.match(html, /Sources &amp; method/);
  }
});

test('all metric ranking pages exist with dated observations', () => {
  const files = fs.readdirSync(path.join(root, 'metric')).filter(f => f.endsWith('.html'));
  assert.equal(files.length, 8);
  for (const file of files) {
    const html = read(path.join('metric', file));
    assert.match(html, /Observation year/);
    assert.match(html, /World Bank/);
  }
});

test('country pages expose comparison and map navigation', () => {
  assert.equal(countries.length, 213);
  for (const country of countries) {
    const html = read(path.join('country', `${country.iso3.toLowerCase()}.html`));
    assert.match(html, new RegExp(`/compare#countries=${country.iso3}`));
    assert.match(html, new RegExp(`/map#country=${country.iso3}`));
  }
});

test('sitemap contains every country, metric and explorer', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /https:\/\/climate99\.com\/compare/);
  assert.match(sitemap, /https:\/\/climate99\.com\/map/);
  for (const country of countries) assert.match(sitemap, new RegExp(`country/${country.iso3.toLowerCase()}`));
  assert.equal((sitemap.match(/<url>/g) || []).length, 227);
});

test('public navigation does not cross-link to other portfolio domains', () => {
  const files = ['index.html','compare.html','map.html', ...fs.readdirSync(path.join(root,'metric')).map(f=>path.join('metric',f))];
  for (const file of files) {
    const html = read(file);
    const external = [...html.matchAll(/href=["']https:\/\/([^/"']+)/g)].map(m=>m[1]).filter(host=>host !== 'climate99.com');
    assert.deepEqual(external, [], `${file} contains an unexpected external domain`);
  }
});
