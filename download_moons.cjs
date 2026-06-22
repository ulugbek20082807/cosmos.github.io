const fs = require('fs');
const path = require('path');
const https = require('https');

const moons = {
  mimas: 'Mimas_(moon)',
  enceladus: 'Enceladus',
  tethys: 'Tethys_(moon)',
  dione: 'Dione_(moon)',
  rhea: 'Rhea_(moon)',
  titan: 'Titan_(moon)',
  iapetus: 'Iapetus_(moon)',
  miranda: 'Miranda_(moon)',
  ariel: 'Ariel_(moon)',
  umbriel: 'Umbriel_(moon)',
  titania: 'Titania_(moon)',
  oberon: 'Oberon_(moon)',
  triton: 'Triton_(moon)',
  nereid: 'Nereid_(moon)'
};

const destDir = path.join(__dirname, 'public', 'textures', 'nasa');

async function download(name, title) {
  try {
    const api = `https://en.wikipedia.org/w/api.php?action=query&titles=${title}&prop=pageimages&pithumbsize=1024&format=json`;
    const res = await fetch(api, { headers: { 'User-Agent': 'CosmicSimulator/1.0' } });
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId === '-1' || !pages[pageId].thumbnail) {
      console.log(`No thumbnail for ${title}`);
      return;
    }
    const url = pages[pageId].thumbnail.source;
    
    // Download image
    const ext = url.split('.').pop().split('?')[0];
    const dest = path.join(destDir, `${name}.jpg`); // Force .jpg for consistency or use real ext
    
    console.log(`Downloading ${name} from ${url}...`);
    const imgRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buffer = await imgRes.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
    console.log(`Saved ${name}`);
  } catch (e) {
    console.error(`Error with ${name}:`, e.message);
  }
}

async function run() {
  for (const [name, title] of Object.entries(moons)) {
    await download(name, title);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('Finished downloading moons!');
}

run();
