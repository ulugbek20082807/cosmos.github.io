#!/bin/bash
mkdir -p /Users/ulugbekrahmatullayev28gmail.com/Documents/Project/cosmic-simulator/public/textures/nasa

# Map of names to their direct URLs (removed /thumb/ and the resized suffix)
declare -A urls=(
  ["mimas"]="https://upload.wikimedia.org/wikipedia/commons/e/e0/Mimas_Cassini.jpg"
  ["enceladus"]="https://upload.wikimedia.org/wikipedia/commons/c/cd/Enceladus_strip_1_PIA11686.jpg"
  ["tethys"]="https://upload.wikimedia.org/wikipedia/commons/8/87/Tethys_-_Rev_15_%2837267740632%29.png"
  ["dione"]="https://upload.wikimedia.org/wikipedia/commons/4/42/Dione_in_natural_light.jpg"
  ["rhea"]="https://upload.wikimedia.org/wikipedia/commons/a/ab/PIA07763_Rhea_full_globe5.jpg"
  ["titan"]="https://upload.wikimedia.org/wikipedia/commons/f/fe/Titan_in_true_color_by_Kevin_M._Gill.jpg"
  ["iapetus"]="https://upload.wikimedia.org/wikipedia/commons/a/ad/Iapetus_trailing_natural_color.jpg"
  ["miranda"]="https://upload.wikimedia.org/wikipedia/commons/c/c2/Miranda_mosaic_in_color_-_Voyager_2.png"
  ["ariel"]="https://upload.wikimedia.org/wikipedia/commons/8/84/Ariel_in_monochrome.jpg"
  ["umbriel"]="https://upload.wikimedia.org/wikipedia/commons/a/ad/Umbriel_%28moon%29.jpg"
  ["titania"]="https://upload.wikimedia.org/wikipedia/commons/8/89/Titania_%28moon%29_color.jpg"
  ["oberon"]="https://upload.wikimedia.org/wikipedia/commons/6/60/Oberon_%28moon%29_color_1986.jpg"
  ["triton"]="https://upload.wikimedia.org/wikipedia/commons/a/a6/Triton_moon_mosaic_Voyager_2_%28large%29.jpg"
  ["nereid"]="https://upload.wikimedia.org/wikipedia/commons/1/1a/Nereid_image_cropped.jpg"
)

for name in "${!urls[@]}"; do
  url="${urls[$name]}"
  ext="${url##*.}"
  dest="/Users/ulugbekrahmatullayev28gmail.com/Documents/Project/cosmic-simulator/public/textures/nasa/${name}.${ext}"
  echo "Downloading $name from $url"
  curl -sL -A "CosmicSimulator/1.0 (test@example.com)" "$url" -o "$dest"
  sleep 1
done

echo "Done!"
