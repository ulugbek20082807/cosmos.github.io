const moons = {
  mimas: 'Mimas',
  enceladus: 'Enceladus',
  tethys: 'Tethys_(moon)',
  dione: 'Dione_(moon)',
  rhea: 'Rhea_(moon)',
  titan: 'Titan_(moon)',
  iapetus: 'Iapetus_(moon)',
  miranda: 'Miranda_(moon)',
  ariel: 'Ariel_(moon)',
  umbriel: 'Umbriel_(moon)'
};

async function run() {
  for (const [name, title] of Object.entries(moons)) {
    try {
      const api = `https://en.wikipedia.org/w/api.php?action=query&titles=${title}&prop=pageimages&pithumbsize=1024&format=json`;
      const res = await fetch(api, { headers: { 'User-Agent': 'CosmicSimulator/1.0' } });
      const data = await res.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      if (pageId !== '-1' && pages[pageId].thumbnail) {
        console.log(`  ${name}: '${pages[pageId].thumbnail.source}',`);
      }
    } catch (e) { }
    await new Promise(r => setTimeout(r, 1000));
  }
}
run();
