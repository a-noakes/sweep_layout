import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFileSync(path.join(root, name), 'utf8');
const clean = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const sources = ['config/cradio.keymap', 'config/cradio_swedish.keymap'].map(name => clean(read(name)));
const ids = Object.fromEntries([...sources.join('\n').matchAll(/#define\s+(\w+)\s+(\d+)/g)].map(m => [m[1], Number(m[2])]));
const arity = { kp: 1, sk: 1, sl: 1, mo: 1, tog: 1, to: 1, bt: 2, ht: 2 };
const symbols = {
    quote: ["'", '"'], comma: [',', '<'], dot: ['.', '>'], slash: ['/', '?'],
    excl: ['!', '!'], at: ['@', '@'], hash: ['#', '#'], colon: [':', ':'], semi: [';', ':'],
    equal: ['=', '+'], plus: ['+', '+'], bslash: ['\\', '|'], pipe: ['|', '|'],
    lbrace: ['{', '{'], rbrace: ['}', '}'], lparen: ['(', '('], rparen: [')', ')'],
    lbracket: ['[', '{'], rbracket: [']', '}'], star: ['*', '*'], minus: ['-', '_'],
    under: ['_', '_'], amps: ['&', '&'], dollar: ['$', '$'], percent: ['%', '%'],
    grave: ['`', '~'], tilde: ['~', '~'], caret: ['^', '^'],
};
for (let i = 0; i < 10; i++) symbols[`n${i}`] = [String(i), ')!@#$%^&*('[i]];
const special = {
    ESC: ['Esc', 'Escape'], SPACE: ['Space', 'Space'], LSHFT: ['Shift', 'Left Shift'],
    LCTRL: ['Ctrl', 'Left Control'], LALT: ['Alt', 'Left Alt'], LCMD: ['Win', 'Left GUI / Windows'],
    LEFT: ['←', 'Left arrow'], DOWN: ['↓', 'Down arrow'], UP: ['↑', 'Up arrow'], RIGHT: ['→', 'Right arrow'],
    TAB: ['Tab', 'Tab'], BSPC: ['Bksp', 'Backspace'], DEL: ['Del', 'Delete'], RET: ['Enter', 'Enter'],
    C_BRI_UP: ['Light +', 'Increase brightness'], C_BRI_DN: ['Light −', 'Decrease brightness'],
    C_VOL_UP: ['Vol +', 'Increase volume'], C_VOL_DN: ['Vol −', 'Decrease volume'],
    C_PREV: ['Previous', 'Previous track'], C_NEXT: ['Next', 'Next track'],
    K_MUTE: ['Mute', 'Mute audio'], C_PLAY_PAUSE: ['Play / pause', 'Play or pause media'],
    'LG(TAB)': ['App switch', 'GUI / Windows + Tab'],
    'LA(BSPC)': ['Word ⌫', 'Alt + Backspace'], 'LA(DEL)': ['Word Del', 'Alt + Delete'],
};
const names = { BASE: 'Base', SYM: 'Symbols', EXT: 'Func', SYM2: 'Media', SETTINGS: 'Settings', GAME: 'Gaming' };
const layerNames = ['base_layer', 'sym_layer', 'ext_layer', 'sym2_layer', 'settings_layer', 'game_layer'];
const metadata = [
    ['Base', 'Letters, punctuation, and Swedish chords.', 'Default layer'],
    ['Symbols', 'Coding symbols and a right-hand number pad.', 'Tap the outer right thumb · sticky layer'],
    ['Func', 'Navigation, modifiers, Swedish letters, and extra symbols.', 'Tap the outer left thumb · sticky layer'],
    ['Media', 'Audio, brightness, and the original extra symbols.', 'Both outer thumbs together · sticky layer'],
    ['Settings', 'Bluetooth profiles and bootloader access.', 'On Symbols, hold both left thumbs together'],
    ['Gaming', 'E / S / F stay in place. The other left keys become F1–F12.', 'Tap both left thumbs together · next key, then Base'],
];

function parseBindings(value) {
    return [...value.matchAll(/&\w+(?:\s+[^&<>]+)?/g)].map(m => {
        const parts = m[0].trim().split(/\s+/);
        const behavior = parts.shift().slice(1);
        const expected = behavior === 'bt' && parts[0] !== 'BT_SEL' ? 1 : (arity[behavior] ?? 0);
        if (parts.length !== expected) throw new Error(`Invalid binding: ${m[0]}`);
        return { behavior, args: parts, binding: `&${behavior}${parts.length ? ' ' + parts.join(' ') : ''}` };
    });
}

function describe(key) {
    const { behavior: b, args: a, binding } = key;
    let label, shifted, detail, kind = 'action';
    if (b.startsWith('sv_') && symbols[b.slice(3)]) {
        [label, shifted] = symbols[b.slice(3)]; kind = /^\d$/.test(label) ? 'number' : 'symbol';
        detail = ['grave', 'tilde', 'caret'].includes(b.slice(3)) ? 'Types the literal symbol; commits the Swedish dead key with Space.' : 'Swedish keycodes preserve the original symbol and Shift output.';
    } else if (b === 'sv_prev_tab' || b === 'sv_next_tab') {
        label = b === 'sv_prev_tab' ? 'Prev tab' : 'Next tab';
        detail = `Original GUI + ${b === 'sv_prev_tab' ? '{' : '}'} shortcut, translated to Swedish.`;
    } else if (b === 'kp' && ['LBKT', 'QUOT', 'SEMI'].includes(a[0])) {
        label = { LBKT: 'å', QUOT: 'ä', SEMI: 'ö' }[a[0]]; shifted = label.toUpperCase(); kind = 'letter'; detail = `Types ${label}; Shift types ${shifted}.`;
    } else if (b === 'kp' && /^[A-Z]$/.test(a[0])) {
        label = a[0]; shifted = label; kind = 'letter'; detail = `Types ${label.toLowerCase()}; Shift types ${label}.`;
    } else if (b === 'kp' && /^F\d+$/.test(a[0])) {
        label = a[0]; kind = 'function'; detail = `Function key ${label}.`;
    } else if (b === 'kp' || b === 'sk') {
        if (!special[a[0]]) throw new Error(`Missing legend for ${binding}`);
        [label, detail] = special[a[0]];
        if (b === 'sk') { kind = 'modifier'; detail = `Sticky ${detail}: tap for the next key, or hold as a modifier.`; }
        if (a[0] === 'SPACE') kind = 'space';
    } else if (b === 'ht') {
        label = a[1]; shifted = a[1]; kind = 'letter'; detail = 'Tap for z; hold for Left Control.';
    } else if (['sl', 'mo', 'tog', 'to'].includes(b)) {
        label = names[a[0]]; kind = 'layer';
        detail = { sl: `Sticky ${label}: tap for the next key, or hold to use the layer.`, mo: `Hold for ${label}.`, tog: `Toggle ${label}.`, to: `Switch to ${label}.` }[b];
    } else if (b === 'trans') { label = '↳'; detail = 'Inherits the active lower layer; Base is shown here.'; kind = 'transparent'; }
    else if (b === 'none') { label = '—'; detail = 'No action on this layer.'; kind = 'blank'; }
    else if (b === 'bootloader') { label = 'Boot'; detail = 'Enter bootloader to flash firmware.'; kind = 'system'; }
    else if (b === 'bt') { label = a[0] === 'BT_CLR' ? 'BT clear' : `BT ${Number(a[1]) + 1}`; detail = a[0] === 'BT_CLR' ? 'Clear the current Bluetooth profile.' : `Select Bluetooth profile ${Number(a[1]) + 1} (firmware index ${a[1]}).`; kind = 'system'; }
    else throw new Error(`Missing legend for ${binding}`);
    return { ...key, label, shifted, detail, kind };
}

const layersByName = new Map(), combosByName = new Map();
for (const source of sources) {
    const pattern = /(?:&\{\/keymap\/)?(\w+_layer)(?:\})?\s*\{\s*bindings\s*=\s*<([\s\S]*?)>\s*;/g;
    for (const [, name, value] of source.matchAll(pattern)) {
        const keys = parseBindings(value);
        if (keys.length !== 34) throw new Error(`${name} has ${keys.length} keys, expected 34`);
        layersByName.set(name, keys);
    }
    for (const [, name, body] of source.matchAll(/(?:&\{\/combos\/)?(combo_\w+)(?:\})?\s*\{([^{}]*)\}/g)) {
        const prior = combosByName.get(name) ?? { name };
        const cells = property => body.match(new RegExp(`${property}\\s*=\\s*<([^>]+)>`))?.[1].trim();
        if (cells('key-positions')) prior.positions = cells('key-positions').split(/\s+/).map(Number);
        if (cells('timeout-ms')) prior.timeout = Number(cells('timeout-ms'));
        if (cells('layers')) prior.layers = cells('layers').split(/\s+/).map(x => ids[x]);
        if (cells('bindings')) prior.key = describe(parseBindings(cells('bindings'))[0]);
        combosByName.set(name, prior);
    }
}
const layers = layerNames.map((name, id) => {
    const keys = layersByName.get(name)?.map(describe);
    if (!keys) throw new Error(`Missing layer ${name}`);
    const [label, description, activation] = metadata[id];
    return { id, name, label, description, activation, keys };
});
const combos = [...combosByName.values()];
for (const combo of combos) {
    if (!combo.positions?.length || !combo.key || !combo.timeout || combo.positions.some(p => !Number.isInteger(p) || p < 0 || p >= 34)) throw new Error(`Invalid combo ${combo.name}`);
    combo.layers ??= layers.map(l => l.id);
    if (combo.layers.some(id => !layers[id])) throw new Error(`Invalid combo layer ${combo.name}`);
}
const data = JSON.stringify({ layers, combos });
const filename = path.join(root, 'layout.html');
const html = readFileSync(filename, 'utf8');
const marker = /(<script id="keymap-data" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!marker.test(html)) throw new Error('Missing keymap-data element in layout.html');
const next = html.replace(marker, (_, start, end) => start + data.replace(/</g, '\\u003c') + end);
if (process.argv.includes('--check')) {
    if (html !== next) throw new Error('Layout reference is stale. Run node scripts/generate-layout-data.mjs');
    console.log(`Reference is current: ${layers.length} layers, ${combos.length} combos, 34 keys per layer.`);
} else {
    writeFileSync(filename, next);
    console.log(`Updated layout.html: ${layers.length} layers, ${combos.length} combos.`);
}
