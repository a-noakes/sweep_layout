# 34 key keyboard layout

This layout was inspired by [Seniply](https://stevep99.github.io/seniply/) & [duckyb](https://github.com/duckyb/zmk-sweep)

The repository contains the [ZMK](https://zmk.dev/) keymap config for the wireless Ferris Sweep with the Nice!Nano board.

![Schematics](./images/Sweep_layout.jpg)

Two firmware variants are built by GitHub Actions:

| Computer's keyboard input source | Left half | Right half |
| --- | --- | --- |
| US (original) | `cradio_left-nice_nano_v2-zmk.uf2` | `cradio_right-nice_nano_v2-zmk.uf2` |
| Swedish (Windows/Linux) | `cradio_left-swedish-nice_nano_v2-zmk.uf2` | `cradio_right-swedish-nice_nano_v2-zmk.uf2` |

Download the `firmware` archive from a successful Actions build and flash the
matching files for your chosen variant. The Swedish variant requires the computer's
**keyboard input source** to be Swedish; changing only the display language is not
enough. There is no automatic language detection or on-keyboard layout switch.

The Swedish variant translates punctuation and symbols (including their Shift
combinations) to Swedish keycodes. The dead keys for grave accent, tilde, and caret
are followed by Space so they type literal characters. The original US firmware
is unchanged. Existing GUI/Command-based shortcuts on the right of Func remain;
this variant does not convert them to Windows/Linux Control-based shortcuts.

Open [the interactive layout reference](./layout.html) in a browser to inspect all
six layers and six combos. It is a standalone HTML file that works offline, with
a Shift view, clickable key details, combo highlighting, and printing for all
layers.

Swedish-specific changes:

- On Base, press **T + P** for `å`, **G + '** for `ä`, and **L + F** for `ö`.
  Press the two keys within 40 ms. Add Shift for uppercase `Å`, `Ä`, `Ö`.
- The left inner thumb is **Space**; the right inner thumb is **sticky Shift**.
- Both left thumbs together toggle **Gaming** on/off from Base or Gaming
  (50 ms combo window). E, S, and F keep their original positions. The remaining
  left-hand positions are F1–F12, in row order. The right hand and thumbs inherit
  Base. Toggle Gaming off before using the left-side Func or Symbols mappings.
- On Symbols, both left thumbs still **hold Settings** (200 ms combo window).
  This has a separate layer scope from the Gaming combo.
- Func's left rows are `Esc å ä ö 1`, `Shift Ctrl Alt Win 2`, and
  `` ` & ^ $ % ``. The modifiers remain sticky. This replaces the former Caps
  Word and left-hand editing shortcuts. The right-hand navigation is unchanged.
- Both outer thumbs still open **Media / SYM2** as a sticky layer outside Gaming.
  Its original symbols remain available there too.

`config/cradio_swedish.keymap` includes the original keymap and overrides its text
and bracket-shortcut bindings. `config/swedish.dtsi` defines the Swedish symbol
behaviors. The mappings follow the [standard Swedish keyboard layout](https://github.com/qmk/qmk_firmware/blob/master/quantum/keymap_extras/keymap_swedish.h)
and are not intended for macOS Swedish.

For a local ZMK build, select the variant with an absolute path:

```sh
west build -s zmk/app -d build/swedish-left -b nice_nano@2.0.0//zmk -- \
  -DSHIELD=cradio_left -DZMK_CONFIG=/absolute/path/to/sweep_layout/config \
  -DKEYMAP_FILE=/absolute/path/to/sweep_layout/config/cradio_swedish.keymap
```

Use `cradio_right` and a separate build directory for the right half. Both variants
share `config/cradio.conf`.

The HTML's layer and combo data is generated from the keymap sources. After
changing a binding, regenerate it with `node scripts/generate-layout-data.mjs`.
Use `node scripts/generate-layout-data.mjs --check` to check that it is current.
