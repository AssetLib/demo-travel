import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../assets/', import.meta.url));
await mkdir(`${root}/source`, { recursive: true });
const svg = (body, viewBox = '0 0 1200 900') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;

// Original geometric illustrations for this demo. No remote or stock imagery.
const coast = svg(`
  <path fill="#e5dcbf" d="M0 0h1200v900H0z"/>
  <circle cx="896" cy="198" r="99" fill="#db9252"/>
  <path fill="#a7b3bf" d="M0 397h1200v503H0z"/>
  <path fill="#546f93" d="M0 483q220-89 468 11t732-12v418H0z"/>
  <path fill="#273d69" d="M0 567q240-90 467 1t733 1v331H0z"/>
  <path fill="#d4bb84" d="M0 505q163-86 290 66t394 164l221 165H0z"/>
  <path fill="#e7ce99" d="M0 690q204-71 383 28t218 182H0z"/>
  <path fill="#efe9d8" d="M157 278h270v358H157z"/>
  <path fill="#faf4e3" d="m132 278 160-110 161 110z"/>
  <path fill="#c47e4c" d="m132 278 160-110 161 110h-36L291 198 165 278z"/>
  <path fill="#304360" d="M255 462a41 41 0 0 1 82 0v174h-82z"/>
  <path fill="#72899e" d="M198 332h50v70h-50zm150 0h39v70h-39z"/>
  <path fill="#b6a581" d="M337 462h26v174h-26z"/>
  <path fill="#f4eddc" d="M254 636h190v25H254zm-31 25h221v25H223zm-30 25h251v25H193zm-31 25h282v25H162z"/>
  <path fill="#435648" d="M95 602c-98-59-43-225 0-281 51 92 79 221 0 281z"/>
  <path stroke="#667153" stroke-width="12" d="M95 433v226"/>
  <path fill="#435648" d="M476 573c-89-52-39-188 0-248 49 86 72 201 0 248z"/>
  <path stroke="#667153" stroke-width="11" d="M476 429v204"/>
  <path stroke="#adc0d0" stroke-width="6" stroke-linecap="round" fill="none" d="M788 574h132m-70 52h178M677 459h145m155 34h89"/>
  <path fill="#f5eedc" d="m976 373-9 53h74z"/><path stroke="#293e61" stroke-width="5" d="M1011 372v63"/>
  <path fill="#263c61" d="m962 438 87-1-20 12h-46z"/>
  <path fill="#c3a66f" d="M0 796q215-2 311 104H0z"/>
`);

const ridge = svg(`
  <path fill="#e4e7e0" d="M0 0h1200v900H0z"/>
  <circle cx="292" cy="234" r="105" fill="#edc772"/>
  <path fill="#a3b3ad" d="m0 546 279-209 180 119L723 181l477 298v421H0z"/>
  <path fill="#759b93" d="m0 617 310-123 209 146 244-313 437 274v299H0z"/>
  <path fill="#396b67" d="m0 767 236-155 412 175 225-267 327 193v187H0z"/>
  <path fill="#244e52" d="m0 856 377-111 222 155H0zm709 44 491-124v124z"/>
  <path stroke="#dfd9bc" stroke-width="34" fill="none" d="M607 912c19-81 170-74 153-143s-141-38-117-103 127-116 129-143"/>
  <path fill="#faf3dd" d="m496 549 91-70 86 70z"/><path fill="#d2ad78" d="M514 549h137v103H514z"/>
  <path fill="#354e52" d="M564 586h35v66h-35z"/>
  <path fill="#2c5c56" d="m157 601 43-106 43 106zm-14 49 57-116 57 116z"/>
  <path stroke="#395a4e" stroke-width="9" d="M200 572v127"/>
  <path fill="#2c5c56" d="m946 535 43-106 43 106zm-14 49 57-116 57 116z"/>
  <path stroke="#395a4e" stroke-width="9" d="M989 506v127"/>
`);

const garden = svg(`
  <path fill="#edf0e8" d="M0 0h600v400H0z"/>
  <ellipse cx="305" cy="345" rx="161" ry="17" fill="#dce2d4"/>
  <path fill="#dfba73" d="M208 244h178l-25 94H233z"/>
  <path fill="#ebcf98" d="M197 228h199v28H197z"/>
  <path stroke="#425e49" stroke-width="9" fill="none" d="M295 235V108m0 89 73-71m-73 57-77-59"/>
  <path fill="#71916e" d="M290 144c-69-33-36-90-6-105 36 29 43 73 6 105zm-24 30c-71 5-96-40-83-77 51-1 86 22 83 77zm64-4c-7-60 35-83 77-72 4 42-14 73-77 72z"/>
  <circle cx="147" cy="81" r="15" fill="#e8c97e"/>
  <path stroke="#b69b61" stroke-width="4" stroke-linecap="round" d="M448 214v24m-12-12h24"/>
`, '0 0 600 400');

const icon = svg(`
  <rect width="128" height="128" rx="32" fill="#283b68"/>
  <path fill="#eee6ce" d="m26 94 23-60h19L45 94zm31 0 22-60h19L75 94z"/>
  <circle cx="96" cy="91" r="7" fill="#e6b35f"/>
`, '0 0 128 128');

for (const [name, source] of Object.entries({ coast, ridge, garden, icon })) {
  await writeFile(`${root}/source/${name}.svg`, source);
}

await sharp(Buffer.from(coast)).resize(4096, 3072).png().toFile(`${root}/coast-hero.png`);
await copyFile(`${root}/coast-hero.png`, `${root}/coast-hero-copy.png`);
await sharp(Buffer.from(ridge)).resize(1200, 900).png().toFile(`${root}/ridge-card.png`);
await sharp(Buffer.from(garden)).resize(600, 400).png().toFile(`${root}/task-garden.png`);
await sharp(Buffer.from(icon)).resize(64, 64).png().toFile(`${root}/essential-mark.png`);
await sharp(Buffer.from(icon)).resize(1024, 1024).png().toFile(`${root}/app-icon.png`);
console.log('Generated original bundled assets, including the documented duplicate and oversize audit fixtures.');
