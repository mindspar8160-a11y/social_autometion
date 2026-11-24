# MINDSPARK PaperFilm V2 - kya badla

## 1. Har video ka alag LOOK (remotion/src/cinematic/kit/looks.ts)
10 looks: kraft_classic, midnight_gold, saffron_dawn, emerald_grove, crimson_war, ivory_minimal,
sandstone_desert, ocean_teal, lotus_pink, indigo_dusk.
Har look me alag: board rang + pattern, sheet shape (torn/arch/ticket/scroll/rounded/polaroid),
camera route (zigzag/scroll/strip/diagonal/spiral), caption style (box/ribbon/karaoke/lower),
highlight style, particles (petals/embers/stars/leaves/bubbles/dust), SVG palette.
Python `src/look_picker.py` last 4 looks exclude karke story mood ke hisaab se id chunta hai
(state/recent-looks.json). Props me `look` aata hai. Zabardasti ek look: pf_props.json me "look": "crimson_war".

## 2. 49 naye SVG (remotion/src/cinematic/kit/)
Figures: devi_shakti, shiva_dhyan, krishna_flute, hanuman_gada, ganesha_modak, rama_bow, rishi_tapasya,
warrior_sword, rani_veer, bhakt_thali, vishnu_chakra.
Objects: om_sun, lotus_pond, diya_row, kalash, conch_shankh, damru_drum, bow_arrows, swords_shield,
mandala_yantra, temple_bell, scroll_granth, throne_crown, havan_kund, mala_rudraksha, daan_pot, dhwaja_flag, vajra_storm.
Places: shaktipeeth_shrine, gopuram_south, fort_gate, ghat_river, himalaya_peaks, banyan_grove, cave_mouth,
sea_ship, village_well, desert_camel, palace_arches.
Nature: lion_vahana, elephant_gaj, peacock_mor, naga_snake, horse_ashwa, crocodile_magar, garuda_eagle,
sun_rays, moon_night, fire_blaze.
Purane 13 cutouts bhi pool me hain (kam weight). Har scene me hero + companions + backdrop frame
(disc/arch/rect) alag composition (solo/duo/trio/back) me bante hain; ek video me same asset repeat nahi hota.
Naya SVG jodna: assetsFigures/Objects/World.ts me ek entry (id, tags, draw) - bas.

## 3. Map wapas
- src/geo_places.py: 65 jagah (shaktipeeth, jyotirlinga, qile, dham) + 36 rajya ke naam.
- Jagah mile -> pin; pin pakka nahi -> district highlight; kuch nahi -> sirf rajya ka map.
- Kahani me jagah ka naam na bhi aaye to scene 2 par map aata hai. MapItem ab district-only zoom bhi karta hai.
- Standalone prompt me map scene ki zaroori instruction.

## 4. Hashtags (src/hashtags.py)
Title: `... #Shorts #TopicTag`; description me 11 topic + channel hashtags; tags me ~25 keywords.
Video ke aakhri pull-back me 4 hashtag chips bhi dikhte hain (props "hashtags").
