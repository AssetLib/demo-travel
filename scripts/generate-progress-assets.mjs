import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// New original illustrations. All stages share the same pot, canvas, and anchor.
// The existing audit fixtures are intentionally untouched.
const root = fileURLToPath(new URL('../assets/', import.meta.url));
await mkdir(`${root}/source`, { recursive: true });
const base = '<path fill="#edf0e8" d="M0 0h600v400H0z"/><ellipse cx="300" cy="347" rx="153" ry="15" fill="#dce2d4"/>';
const pot = '<path fill="#dfba73" d="M211 258h178l-25 80H236z"/><path fill="#ebcf98" d="M200 241h200v27H200z"/><path fill="#8a704b" d="M216 241h168v8H216z"/>';
const stem = (path) => `<path d="${path}" fill="none" stroke="#425e49" stroke-width="8" stroke-linecap="round"/>`;
const leaf = (path) => `<path d="${path}" fill="#71916e"/>`;
const plants = {
  empty: '<ellipse cx="300" cy="239" rx="12" ry="5" fill="#6e593c"/>',
  started: stem('M300 241v-57') + leaf('M300 206c-37 1-53-21-47-42 30-1 49 13 47 42zM301 190c-1-30 21-45 46-40-1 25-14 40-46 40z'),
  growing: stem('M300 241V119m0 81-63-50m63 34 63-48') + leaf('M299 154c-46-23-30-63-6-80 28 21 33 55 6 80zM269 184c-56 4-78-31-68-60 39-1 70 18 68 60zM329 169c-6-47 26-64 61-56 3 33-11 57-61 56z'),
  complete: stem('M300 241V88m0 134-70-45m70 15 74-46m-74-6-57-37m57 6 54-44') + leaf('M266 209c-59 2-81-29-73-58 43-2 75 19 73 58zM331 180c-5-47 29-69 67-60 3 35-16 61-67 60zM275 151c-48 1-71-28-61-53 37-1 63 18 61 53zM319 126c-3-40 25-62 57-56 4 31-11 54-57 56z') + '<g fill="#e7c777"><ellipse cx="300" cy="55" rx="15" ry="22"/><ellipse cx="324" cy="71" rx="22" ry="15" transform="rotate(-28 324 71)"/><ellipse cx="316" cy="98" rx="15" ry="22" transform="rotate(-34 316 98)"/><ellipse cx="285" cy="98" rx="15" ry="22" transform="rotate(34 285 98)"/><ellipse cx="276" cy="71" rx="22" ry="15" transform="rotate(28 276 71)"/></g><circle cx="300" cy="79" r="17" fill="#b68742"/>',
};
for (const [state, plant] of Object.entries(plants)) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">${base}${plant}${pot}</svg>`;
  await writeFile(`${root}/source/task-garden-${state}.svg`, source);
  await sharp(Buffer.from(source)).resize(600, 400).png().toFile(`${root}/task-garden-${state}.png`);
}
const placeholder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><path fill="#e7e7da" d="M0 0h120v90H0z"/><circle cx="83" cy="26" r="11" fill="#d6ccb1"/><path fill="#c3ccb9" d="m0 90 37-46 25 22 17-15 41 39z"/></svg>';
await writeFile(`${root}/source/destination-placeholder.svg`, placeholder);
await sharp(Buffer.from(placeholder)).resize(120, 90).png().toFile(`${root}/destination-placeholder.png`);
console.log('Generated four plant stages and one shared destination placeholder.');
