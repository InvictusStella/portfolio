# Image credits and licences

Every photo or video used on the site is listed here with its source and licence.
The footer shows a short credits line in both languages.

| File | What | Source | Licence / terms | Credit shown |
|---|---|---|---|---|
| `public/textures/sun-sdo-304.webp` | The sun's surface (AIA 304 Å, 2026-09-21 15:49 UT) | [SDO latest images](https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_0304.jpg) | [SDO data rules](https://sdo.gsfc.nasa.gov/data/rules.php): not copyrighted; non-commercial use (incl. public information) needs no authorisation; acknowledgement required | "Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams." |
| `public/textures/milky-way-eso.webp` | Star-field backdrop: the Milky Way around the Galactic Centre (next to Scorpius) | [ESO eso0932a](https://www.eso.org/public/images/eso0932a/) | [CC BY 4.0](https://www.eso.org/public/outreach/copyright/) | "ESO/S. Brunier" + licence link + "cropped, resized and colour-adjusted" |
| `public/textures/southern-ring-webb.webp` | Southern Ring Nebula (NIRCam), behind About | [ESA/Webb weic2207b](https://esawebb.org/images/weic2207b/) | [CC BY 4.0](https://esawebb.org/copyright/) | "NASA, ESA, CSA, STScI, and the Webb ERO Production Team" + licence link + changes |
| `public/textures/ring-nebula-webb.webp` | Ring Nebula (NIRCam), near the star chart | [ESA/Webb weic2320b](https://esawebb.org/images/weic2320b/) | [CC BY 4.0](https://esawebb.org/copyright/) | "ESA/Webb, NASA, CSA, M. Barlow, N. Cox, R. Wesson" + licence link + changes |

## How the sun texture was prepared

From the 2048 px original: cropped to the solar disc (centre ≈ 1010, 1023; radius ≈ 810 px) with a 12% margin,
which also removes the burned-in timestamp; colour collapsed to one brightness channel (0.55 × red + 0.45 × green);
contrast stretched (1st–99.6th percentile); resized to 1536 px; saved as WebP (quality 86).
The disc's radius is 0.4465 of the texture width (used by the shader).

## How the space photos were prepared

Downloaded as each source's "Publication JPEG". Milky Way: 1600 × 1600 crop at (1200, 180) of the 4000 × 2000 panorama.
Southern Ring: 3725 × 3725 crop from the top-left; Ring Nebula: 3943 × 3943 crop at (0, 28). Nebulae resized to 1024 px.
All saved as WebP. On the page the shader removes the dark background haze (a "black point"), fades the edges, dims
the images and blends them additively — hence "cropped, resized and colour-adjusted" in the credit, as CC BY and the
ESO/ESA terms ask that changes be indicated.

**Credit placement:** ESO prefers credits next to the image. These photos are full-page backgrounds, so the credits
sit in the page footer (the conventional place for page-wide imagery), with active links to the source and licence.
Rejected: NASA APOD images of the Antares region — they are owned by their individual photographers, not openly licensed.
