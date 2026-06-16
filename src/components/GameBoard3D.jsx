/**
 * @file GameBoard3D — WebGL 3D board (Three.js) for the 11×10 Timurlenk board.
 *
 * Asset-free / procedural: tiles + pieces are built from primitives so it works
 * today; when AWS S3 piece models arrive they can replace `createPieceMesh`.
 *
 * Features (spec BOARD_VISUAL_SYSTEM):
 *  - Stylised matte board, soft studio lighting, soft shadows.
 *  - Isometric camera with orbit (drag) + zoom (wheel/pinch) via OrbitControls.
 *  - Smooth piece slide (≈350ms cubic), capture fade+scale, pulsing gold
 *    last-move glow + green selection + legal-move markers.
 *  - Raycast click→square selection (drag-aware so orbiting doesn't select).
 *
 * The scene is created once on mount; prop changes call imperative updaters
 * kept on a ref, so React re-renders never rebuild WebGL state.
 *
 * @param {object} props mirrors GameBoard.jsx
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BOARD_SIZE, COLOR, PIECE_VISUAL } from '../utils/constants.js';

const { files: FILES, ranks: RANKS } = BOARD_SIZE;
const TILE = 1;
const SLIDE_MS = 340;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const COLORS = {
  light: 0xe8d6b3,
  dark: 0x7d4a2e,
  base: 0x2b1c16,
  ivory: 0xf3ead2,
  ebony: 0x22201d,
  gold: 0xd4af37,
  select: 0x22c55e,
  last: 0xd4af37,
  legal: 0x3ddc84,
  capture: 0xdc2626,
};

/** Approx piece heights (for glyph-sprite placement). */
const TYPE_HEIGHT = { sah: 1.2, vezir: 1.05, kale: 0.78, fil: 0.86, at: 0.72, deve: 0.72, piyade: 0.56 };

/** world (x,z) for a board square given orientation. */
function worldXZ(file, rank, whiteBottom) {
  const f = whiteBottom ? file : FILES - 1 - file;
  const r = whiteBottom ? rank : RANKS - 1 - rank;
  return { x: (f - (FILES - 1) / 2) * TILE, z: ((RANKS - 1) / 2 - r) * TILE };
}

/** Billboard sprite of a piece glyph/label for at-a-glance identification. */
function makeGlyphSprite(type, isWhite) {
  const v = PIECE_VISUAL[type];
  const text = v?.glyph ?? v?.label ?? '?';
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${size * 0.7}px "Segoe UI Symbol","Noto Sans Symbols 2",serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = size * 0.06;
  ctx.strokeStyle = isWhite ? '#1b1b1b' : '#e9dcb6';
  ctx.fillStyle = isWhite ? '#f7efdc' : '#16110d';
  ctx.strokeText(text, size / 2, size / 2 + 4);
  ctx.fillText(text, size / 2, size / 2 + 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.66, 0.66, 1);
  return sprite;
}

/** Shared geometry cache (disposed on unmount). */
function makeGeometryCache() {
  return {
    base: new THREE.CylinderGeometry(0.33, 0.37, 0.12, 24),
    stem: new THREE.CylinderGeometry(0.18, 0.26, 0.5, 18),
    rook: new THREE.CylinderGeometry(0.27, 0.3, 0.52, 18),
    cren: new THREE.BoxGeometry(0.1, 0.14, 0.1),
    cone: new THREE.ConeGeometry(0.27, 0.62, 20),
    knight: new THREE.BoxGeometry(0.32, 0.5, 0.24),
    camelBody: new THREE.BoxGeometry(0.3, 0.34, 0.5),
    hump: new THREE.SphereGeometry(0.13, 14, 10),
    crown: new THREE.SphereGeometry(0.2, 18, 14),
    orb: new THREE.SphereGeometry(0.17, 16, 12),
    cross: new THREE.BoxGeometry(0.08, 0.26, 0.08),
    tile: new THREE.BoxGeometry(0.96, 0.2, 0.96),
  };
}

/** Build a procedural piece mesh group for a type/colour. */
function createPieceMesh(type, isWhite, geo) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: isWhite ? COLORS.ivory : COLORS.ebony,
    roughness: 0.55,
    metalness: 0.12,
    transparent: true,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: COLORS.gold,
    roughness: 0.3,
    metalness: 0.7,
    transparent: true,
  });

  const add = (g, mat, y, rotZ = 0) => {
    const m = new THREE.Mesh(g, mat);
    m.position.y = y;
    if (rotZ) m.rotation.z = rotZ;
    m.castShadow = true;
    group.add(m);
    return m;
  };

  add(geo.base, goldMat, 0.06); // gold base ring for every piece

  switch (type) {
    case 'piyade':
      add(geo.stem, bodyMat, 0.32);
      add(geo.orb, bodyMat, 0.62);
      break;
    case 'kale':
      add(geo.rook, bodyMat, 0.38);
      for (let i = 0; i < 4; i += 1) {
        const a = (i / 4) * Math.PI * 2;
        const c = add(geo.cren, bodyMat, 0.66);
        c.position.x = Math.cos(a) * 0.18;
        c.position.z = Math.sin(a) * 0.18;
      }
      break;
    case 'fil':
      add(geo.stem, bodyMat, 0.3);
      add(geo.cone, bodyMat, 0.7);
      break;
    case 'at':
      add(geo.stem, bodyMat, 0.3);
      add(geo.knight, bodyMat, 0.62, 0.35);
      break;
    case 'deve':
      add(geo.stem, bodyMat, 0.28);
      add(geo.camelBody, bodyMat, 0.56);
      { const h1 = add(geo.hump, bodyMat, 0.74); h1.position.z = 0.1; }
      { const h2 = add(geo.hump, bodyMat, 0.74); h2.position.z = -0.1; }
      break;
    case 'vezir':
      add(geo.stem, bodyMat, 0.34);
      add(geo.crown, goldMat, 0.78);
      break;
    case 'sah':
      add(geo.stem, bodyMat, 0.4);
      add(geo.crown, bodyMat, 0.86);
      add(geo.cross, goldMat, 1.12);
      break;
    default:
      add(geo.stem, bodyMat, 0.32);
  }

  const sprite = makeGlyphSprite(type, isWhite);
  sprite.position.y = (TYPE_HEIGHT[type] ?? 0.6) + 0.34;
  group.add(sprite);

  group.userData = { type, isWhite, mats: [bodyMat, goldMat], sprite };
  return group;
}

export default function GameBoard3D({
  position,
  selected = null,
  legalTargets = [],
  lastMove = null,
  onSquareClick,
  whiteBottom = true,
  interactive = true,
}) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  // Latest props for the (mount-only) event/render closures.
  const propsRef = useRef({ onSquareClick, interactive });
  propsRef.current = { onSquareClick, interactive };

  // ── Build the scene once ───────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const geo = makeGeometryCache();
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 12, 12.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 9;
    controls.maxDistance = 26;
    controls.maxPolarAngle = 1.35; // keep above the board

    // Lighting: soft ambient + front-left key + soft fill.
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xfff1d6, 1.0);
    key.position.set(-7, 13, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -9;
    key.shadow.camera.right = 9;
    key.shadow.camera.top = 9;
    key.shadow.camera.bottom = -9;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x88aaff, 0.3);
    fill.position.set(7, 8, -7);
    scene.add(fill);

    // Base plate (brown frame).
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(FILES + 0.6, 0.3, RANKS + 0.6),
      new THREE.MeshStandardMaterial({ color: COLORS.base, roughness: 0.85 }),
    );
    base.position.y = -0.22;
    base.receiveShadow = true;
    scene.add(base);

    // Tiles.
    const tileLayer = new THREE.Group();
    scene.add(tileLayer);
    const tiles = []; // index → mesh
    for (let sq = 0; sq < FILES * RANKS; sq += 1) {
      const file = sq % FILES;
      const rank = Math.floor(sq / FILES);
      const dark = (file + rank) % 2 === 0;
      const mat = new THREE.MeshStandardMaterial({
        color: dark ? COLORS.dark : COLORS.light,
        roughness: 0.9,
        metalness: 0.0,
        emissive: 0x000000,
        emissiveIntensity: 0,
      });
      const tile = new THREE.Mesh(geo.tile, mat);
      tile.receiveShadow = true;
      tile.userData.square = sq;
      tiles[sq] = tile;
      tileLayer.add(tile);
    }

    const pieceLayer = new THREE.Group();
    const markerLayer = new THREE.Group();
    scene.add(pieceLayer, markerLayer);

    const state = {
      renderer, scene, camera, controls, geo, tiles, pieceLayer, markerLayer,
      meshBySquare: new Map(),
      anims: [],
      whiteBottom,
      prevPosition: null,
      highlight: { selected: null, lastFrom: null, lastTo: null },
      raf: 0,
      disposed: false,
    };

    // Position tiles per orientation.
    const layoutTiles = () => {
      for (let sq = 0; sq < tiles.length; sq += 1) {
        const { x, z } = worldXZ(sq % FILES, Math.floor(sq / FILES), state.whiteBottom);
        tiles[sq].position.set(x, -0.1, z);
      }
    };
    layoutTiles();

    const disposeGroup = (group) => {
      group.userData?.mats?.forEach((m) => m.dispose());
      group.userData?.sprite?.material?.map?.dispose();
      group.userData?.sprite?.material?.dispose();
    };

    const rebuildPieces = (pos) => {
      for (const child of [...pieceLayer.children]) {
        disposeGroup(child);
        pieceLayer.remove(child);
      }
      state.meshBySquare.clear();
      for (let sq = 0; sq < pos.length; sq += 1) {
        const p = pos[sq];
        if (!p) continue;
        const mesh = createPieceMesh(p.t, p.c === COLOR.WHITE, geo);
        const { x, z } = worldXZ(sq % FILES, Math.floor(sq / FILES), state.whiteBottom);
        mesh.position.set(x, 0, z);
        mesh.userData.square = sq;
        pieceLayer.add(mesh);
        state.meshBySquare.set(sq, mesh);
      }
    };

    const sameCell = (a, b) => (!a && !b) || (a && b && a.c === b.c && a.t === b.t);

    const fadeOutAndRemove = (mesh) => {
      state.anims.push({
        mesh, kind: 'fade', start: performance.now(), dur: 240,
        onDone: () => {
          disposeGroup(mesh);
          pieceLayer.remove(mesh);
        },
      });
    };

    const syncPieces = (pos) => {
      const prev = state.prevPosition;
      if (!prev) {
        rebuildPieces(pos);
        state.prevPosition = pos;
        return;
      }
      const diffs = [];
      for (let sq = 0; sq < pos.length; sq += 1) if (!sameCell(prev[sq], pos[sq])) diffs.push(sq);

      const lm = lastMove;
      const isSimpleMove =
        lm &&
        diffs.length <= 2 &&
        diffs.every((d) => d === lm.from || d === lm.to) &&
        prev[lm.from] &&
        pos[lm.to] &&
        state.meshBySquare.get(lm.from);

      if (isSimpleMove) {
        const movingMesh = state.meshBySquare.get(lm.from);
        // Capture: fade the previous occupant of the destination.
        if (prev[lm.to]) {
          const cap = state.meshBySquare.get(lm.to);
          if (cap && cap !== movingMesh) fadeOutAndRemove(cap);
        }
        state.meshBySquare.delete(lm.from);
        state.meshBySquare.set(lm.to, movingMesh);
        movingMesh.userData.square = lm.to;

        const fromXZ = worldXZ(lm.from % FILES, Math.floor(lm.from / FILES), state.whiteBottom);
        const toXZ = worldXZ(lm.to % FILES, Math.floor(lm.to / FILES), state.whiteBottom);
        movingMesh.position.set(fromXZ.x, 0, fromXZ.z);
        const promoted = prev[lm.from].t !== pos[lm.to].t;
        state.anims.push({
          mesh: movingMesh, kind: 'slide', start: performance.now(), dur: SLIDE_MS,
          from: new THREE.Vector3(fromXZ.x, 0, fromXZ.z),
          to: new THREE.Vector3(toXZ.x, 0, toXZ.z),
          onDone: () => {
            movingMesh.position.set(toXZ.x, 0, toXZ.z);
            if (promoted) {
              disposeGroup(movingMesh);
              pieceLayer.remove(movingMesh);
              const np = pos[lm.to];
              const nm = createPieceMesh(np.t, np.c === COLOR.WHITE, geo);
              nm.position.set(toXZ.x, 0, toXZ.z);
              nm.userData.square = lm.to;
              pieceLayer.add(nm);
              state.meshBySquare.set(lm.to, nm);
            }
          },
        });
      } else {
        rebuildPieces(pos);
      }
      state.prevPosition = pos;
    };

    const updateMarkers = (targets, pos) => {
      for (const child of [...markerLayer.children]) {
        child.geometry.dispose();
        child.material.dispose();
        markerLayer.remove(child);
      }
      for (const sq of targets) {
        const { x, z } = worldXZ(sq % FILES, Math.floor(sq / FILES), state.whiteBottom);
        const capture = !!pos[sq];
        const g = capture
          ? new THREE.TorusGeometry(0.42, 0.05, 10, 24)
          : new THREE.CylinderGeometry(0.15, 0.15, 0.04, 18);
        const m = new THREE.MeshBasicMaterial({
          color: capture ? COLORS.capture : COLORS.legal,
          transparent: true,
          opacity: 0.85,
        });
        const marker = new THREE.Mesh(g, m);
        marker.position.set(x, 0.06, z);
        if (capture) marker.rotation.x = Math.PI / 2;
        markerLayer.add(marker);
      }
    };

    // ── Raycast click (drag-aware) ──────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down = null;
    const onPointerDown = (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onPointerUp = (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.t < 400;
      down = null;
      if (moved > 6 || !quick) return; // it was an orbit drag
      if (!propsRef.current.interactive || !propsRef.current.onSquareClick) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(tiles, false)[0];
      if (hit) propsRef.current.onSquareClick(hit.object.userData.square);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // ── Resize ──────────────────────────────────────────────────────────
    const resize = () => {
      const w = mount.clientWidth;
      const h = Math.max(320, Math.min(w * 0.82, 560));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    // ── Render loop ─────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    const renderLoop = () => {
      if (state.disposed) return;
      state.raf = requestAnimationFrame(renderLoop);
      const now = performance.now();

      // Advance animations.
      for (let i = state.anims.length - 1; i >= 0; i -= 1) {
        const a = state.anims[i];
        const t = Math.min(1, (now - a.start) / a.dur);
        if (a.kind === 'slide') {
          const k = easeInOut(t);
          a.mesh.position.lerpVectors(a.from, a.to, k);
          a.mesh.position.y = Math.sin(k * Math.PI) * 0.6; // little arc
        } else if (a.kind === 'fade') {
          a.mesh.scale.setScalar(1 - 0.4 * t);
          a.mesh.userData.mats?.forEach((m) => (m.opacity = 1 - t));
          if (a.mesh.userData.sprite) a.mesh.userData.sprite.material.opacity = 1 - t;
        }
        if (t >= 1) {
          a.onDone?.();
          state.anims.splice(i, 1);
        }
      }

      // Pulse highlights.
      const pulse = 0.5 + 0.5 * Math.sin(now / 350);
      const { selected: sel, lastFrom, lastTo } = state.highlight;
      for (let sq = 0; sq < state.tiles.length; sq += 1) {
        const mat = state.tiles[sq].material;
        if (sq === sel) {
          mat.emissive.setHex(COLORS.select);
          mat.emissiveIntensity = 0.35 + 0.3 * pulse;
        } else if (sq === lastFrom || sq === lastTo) {
          mat.emissive.setHex(COLORS.last);
          mat.emissiveIntensity = 0.2 + 0.25 * pulse;
        } else if (mat.emissiveIntensity !== 0) {
          mat.emissiveIntensity = 0;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      clock.getDelta();
    };
    renderLoop();

    // Imperative API for prop-change effects.
    apiRef.current = {
      syncPieces,
      updateMarkers,
      setHighlight: (h) => {
        state.highlight = h;
      },
      setOrientation: (wb) => {
        state.whiteBottom = wb;
        layoutTiles();
        state.prevPosition = null; // force full rebuild at new orientation
      },
      getPosition: () => state.prevPosition,
    };

    // Initial content.
    syncPieces(position);
    updateMarkers(legalTargets, position);
    state.highlight = {
      selected: selected,
      lastFrom: lastMove?.from ?? null,
      lastTo: lastMove?.to ?? null,
    };

    return () => {
      state.disposed = true;
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      for (const child of [...pieceLayer.children]) disposeGroup(child);
      for (const t of tiles) t.material.dispose();
      for (const child of [...markerLayer.children]) {
        child.geometry.dispose();
        child.material.dispose();
      }
      Object.values(geo).forEach((g) => g.dispose());
      base.geometry.dispose();
      base.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Prop-change effects → imperative updates ────────────────────────────
  useEffect(() => {
    apiRef.current?.setOrientation(whiteBottom);
    apiRef.current?.syncPieces(position);
    apiRef.current?.updateMarkers(legalTargets, position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whiteBottom]);

  useEffect(() => {
    apiRef.current?.syncPieces(position);
    apiRef.current?.updateMarkers(legalTargets, position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  useEffect(() => {
    apiRef.current?.updateMarkers(legalTargets, position);
    apiRef.current?.setHighlight({
      selected,
      lastFrom: lastMove?.from ?? null,
      lastTo: lastMove?.to ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, legalTargets, lastMove]);

  return (
    <div
      ref={mountRef}
      className="w-full overflow-hidden rounded-xl border-4 border-timur-700 shadow-2xl"
      style={{ touchAction: 'none', cursor: interactive ? 'pointer' : 'grab' }}
      role="img"
      aria-label="Timurlenk 3B satranç tahtası"
    />
  );
}
