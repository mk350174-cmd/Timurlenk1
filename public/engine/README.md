# Apex Timur Motor — drop-in location

`engineService` (src/services/engineService.js) automatically uses the Apex
Timur WASM motor when it is available, and otherwise falls back to the bundled
JS engine. **No code changes are needed to switch** — just provide the binaries.

## How to enable the WASM motor

Compile Apex Timur with Emscripten (see `APEX_TIMUR_REFERENCE.md`):

```bash
emcc -O3 apex_timur.cpp -o apex_timur.js \
  -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_is_legal","_solve_puzzle","_get_bot_move","_analyze_game","_eval_position"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]'
```

Then place the output here:

```
public/engine/
├── apex_timur.js     ← ES module exporting the motor API
├── apex_timur.wasm   ← WebAssembly binary (~500KB–1MB)
└── apex_timur.worker.js  (optional, for Web Worker offloading)
```

`engineService.init()` will load `/engine/apex_timur.js` (or `window.ApexMotor`
if you attach it globally) and call its `is_legal` / `solve_puzzle` /
`get_bot_move` / `analyze_game` methods. A position converter hook
(`engineService.encodeForMotor`) is provided for matching the motor's expected
encoding.

Until then, the JS fallback engine (utils/aiEngine.js) powers bot play, puzzle
hints and analysis — so the game is fully playable today.
