(() => {
  const data = window.CLIMATE_DATA || [];
  const metrics = window.CLIMATE_METRICS || {};
  const byIso = new Map(data.map(country => [country.iso3, country]));
  const number = (value, digits) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: digits }).format(value);
  const hash = new URLSearchParams(location.hash.slice(1));
  const metricKey = key => metrics[key] ? key : 'co2PerCapita';

  if (document.querySelector('#comparison-chart')) {
    const metricSelect = document.querySelector('#metric');
    const countrySelects = [...document.querySelectorAll('.country-select')];
    metricSelect.value = metricKey(hash.get('metric'));
    const requested = (hash.get('countries') || 'GBR,USA,FRA,DEU,JPN').split(',').filter(byIso.has.bind(byIso));
    requested.slice(0, 5).forEach((iso, i) => countrySelects[i].value = iso);
    const draw = () => {
      const key = metricSelect.value, metric = metrics[key];
      const selected = countrySelects.map(select => byIso.get(select.value)).filter(Boolean).filter(country => country.metrics[key]);
      const max = Math.max(...selected.map(country => country.metrics[key].value), 1);
      document.querySelector('#chart-title').textContent = metric.short;
      document.querySelector('#chart-unit').textContent = metric.unit;
      document.querySelector('#comparison-chart').innerHTML = selected.length ? selected.map(country => { const m = country.metrics[key]; return `<div class="bar-row"><a href="/country/${country.iso3.toLowerCase()}">${country.name}</a><div class="bar-track"><i style="width:${Math.max(2, m.value / max * 100)}%"></i></div><strong>${number(m.value, metric.digits)}</strong><small>${m.year}</small></div>`; }).join('') : '<p class="empty-tool">Choose countries with data for this measure.</p>';
      document.querySelector('#comparison-table').innerHTML = selected.map(country => { const m = country.metrics[key]; return `<tr><td><a href="/country/${country.iso3.toLowerCase()}">${country.name}</a></td><td>${number(m.value, metric.digits)} ${metric.unit}</td><td>${m.year}</td><td>${m.source}</td></tr>`; }).join('');
      document.querySelector('#ranking-link').href = `/metric/${metric.slug}`;
      history.replaceState(null, '', `#metric=${key}&countries=${countrySelects.map(select => select.value).filter(Boolean).join(',')}`);
    };
    metricSelect.addEventListener('change', draw); countrySelects.forEach(select => select.addEventListener('change', draw)); draw();
    document.querySelector('#share-view').addEventListener('click', async () => { await navigator.clipboard.writeText(location.href); document.querySelector('#copy-status').textContent = 'Link copied'; });
  }

  if (document.querySelector('#world-map')) {
    const select = document.querySelector('#map-metric'), paths = [...document.querySelectorAll('[data-iso3]')], detail = document.querySelector('#map-detail');
    select.value = metricKey(hash.get('metric'));
    const colours = ['#edf2ea','#cde3d1','#87bea0','#3d8c76','#123b36'];
    const show = iso => { const country = byIso.get(iso), m = country?.metrics[select.value], metric = metrics[select.value]; if (!country) return; detail.innerHTML = `<p class="eyebrow">${country.iso3} · ${m ? m.year : 'no observation'}</p><h2>${country.name}</h2>${m ? `<strong>${number(m.value, metric.digits)} <small>${metric.unit}</small></strong><p>${m.label}. Source: ${m.source}.</p>` : '<p>No approved observation is available for this map measure.</p>'}<a class="primary-link" href="/country/${country.iso3.toLowerCase()}">Open country evidence</a>`; history.replaceState(null, '', `#metric=${select.value}&country=${iso}`); };
    const drawMap = () => { const key = select.value, metric = metrics[key], values = data.map(c => c.metrics[key]?.value).filter(Number.isFinite).sort((a,b)=>a-b); const cuts = [.2,.4,.6,.8].map(p => values[Math.floor((values.length-1)*p)]); paths.forEach(path => { const m = byIso.get(path.dataset.iso3)?.metrics[key]; if (!m) { path.style.fill = '#d9ddd6'; path.classList.remove('has-data'); return; } const band = cuts.filter(cut => m.value > cut).length; path.style.fill = colours[band]; path.classList.add('has-data'); }); document.querySelector('#map-legend').innerHTML = colours.map((colour,i)=>`<span><i style="background:${colour}"></i>${i===0?'Lower':i===4?'Higher':''}</span>`).join('') + `<b>${metric.unit}</b>`; history.replaceState(null, '', `#metric=${key}`); };
    paths.forEach(path => { path.addEventListener('click', () => show(path.dataset.iso3)); path.addEventListener('focus', () => show(path.dataset.iso3)); });
    select.addEventListener('change', drawMap); drawMap(); if (hash.get('country')) show(hash.get('country'));
  }
})();
