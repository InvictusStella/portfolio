# Image credits and licences

Every photo or video used on the site is listed here with its source and licence.
The footer shows a short credits line in both languages.

| File | What | Source | Licence / terms | Credit shown |
|---|---|---|---|---|
| `public/textures/sun-sdo-304.webp` | The sun's surface (AIA 304 Å, 2026-09-21 15:49 UT) | [SDO latest images](https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_0304.jpg) | [SDO data rules](https://sdo.gsfc.nasa.gov/data/rules.php): not copyrighted; non-commercial use (incl. public information) needs no authorisation; acknowledgement required | "Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams." |

## How the sun texture was prepared

From the 2048 px original: cropped to the solar disc (centre ≈ 1010, 1023; radius ≈ 810 px) with a 12% margin,
which also removes the burned-in timestamp; colour collapsed to one brightness channel (0.55 × red + 0.45 × green);
contrast stretched (1st–99.6th percentile); resized to 1536 px; saved as WebP (quality 86).
The disc's radius is 0.4465 of the texture width (used by the shader).
