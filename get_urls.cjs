const fs = require('fs');

const thumbUrls = {
  mimas: 'Mimas_Cassini.jpg',
  enceladus: 'Enceladus_strip_1_PIA11686.jpg',
  tethys: 'Tethys_-_Rev_15_%2837267740632%29.png',
  dione: 'Dione_in_natural_light.jpg',
  rhea: 'PIA07763_Rhea_full_globe5.jpg',
  titan: 'Titan_in_true_color_by_Kevin_M._Gill.jpg',
  iapetus: 'Iapetus_trailing_natural_color.jpg',
  miranda: 'Miranda_mosaic_in_color_-_Voyager_2.png',
  ariel: 'Ariel_in_monochrome.jpg',
  umbriel: 'Umbriel_%28moon%29.jpg',
  titania: 'Titania_%28moon%29_color.jpg',
  oberon: 'Oberon_%28moon%29_color_1986.jpg',
  triton: 'Triton_moon_mosaic_Voyager_2_%28large%29.jpg',
  nereid: 'Nereid_image_cropped.jpg'
};

async function getTrueUrl(filename) {
  const api = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${filename}&prop=imageinfo&iiprop=url&format=json`;
  const res = await fetch(api, { headers: { 'User-Agent': 'CosmicSimulator/1.0 (test@example.com)' } });
  const data = await res.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  if (pageId === '-1') return null;
  return pages[pageId].imageinfo[0].url;
}

async function run() {
  const finalUrls = {};
  for (const [name, filename] of Object.entries(thumbUrls)) {
    console.log(`Resolving ${name}...`);
    const url = await getTrueUrl(filename);
    if (url) {
      finalUrls[name] = url;
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  fs.writeFileSync('moon_urls.json', JSON.stringify(finalUrls, null, 2));
  console.log('Done!');
}

run();
