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

---

## Compiling the real engine (source is in the repo)

The full Apex Timurlenk v0.7.0 engine source is checked in at
`engine/apex_timur_v2-1.cpp` (monolithic C++17, 11×10 board + 2 citadels = 112
squares, 11 piece types, FEN I/O, alpha-beta `Searcher`, swap + citadel rules).
It exposes a C++ class API (`Board`, `Searcher`, `MoveGenerator` in the `Apex::`
namespace), so an Emscripten build needs thin `extern "C"` wrappers that map to
the JS surface `engineService` expects.

### 1. Add wrappers (new file, e.g. `engine/wasm_bindings.cpp`)
Wrap the class API into flat C functions and return JSON/strings:

```cpp
extern "C" {
  // position is a Timurlenk FEN string; move is "from,to" (square indices)
  int   apex_is_legal(const char* fen, int from, int to);
  // returns "from,to,eval" — best move for `difficulty` (1–5 → depth)
  const char* apex_get_bot_move(const char* fen, int difficulty);
  // returns "from,to,depth,eval"
  const char* apex_solve_puzzle(const char* fen, int maxDepth);
  const char* apex_analyze_game(const char* movesJson);
  int   apex_eval_position(const char* fen);
}
```
Internally: `Board b; b.from_string(fen); Searcher s; s.start_search({depth});
Move m = s.best_move();` etc. Expose a small JS shim (`apex_timur.js`) that
`cwrap`s these and presents `is_legal/get_bot_move/solve_puzzle/analyze_game`.

### 2. Build
```bash
emcc -O3 -std=c++17 engine/apex_timur_v2-1.cpp engine/wasm_bindings.cpp \
  -o public/engine/apex_timur.js \
  -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_ES6=1 \
  -s EXPORTED_FUNCTIONS='["_apex_is_legal","_apex_get_bot_move","_apex_solve_puzzle","_apex_analyze_game","_apex_eval_position","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]'
```

### 3. Position converter
The motor speaks Timurlenk FEN over the 112-square board (11 piece types +
citadels), while the JS app currently uses a 7-type 110-square model. Implement
the converter inside `engineService.encodeForMotor(position)` when wiring the
real motor (the seam already exists). Until the binaries are dropped in, the JS
fallback keeps everything working.

