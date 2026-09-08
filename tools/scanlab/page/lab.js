/* eslint-disable */
/**
 * Runs inside the browser page.
 *
 * The whole simulation lives here rather than in Node on purpose: the symbol
 * is rendered by the same qr-code-styling build, through the same
 * `toQrOptions` mapping, onto the same Canvas2D implementation the real app
 * uses. A Node-side reimplementation with a headless canvas would drift from
 * the app, and a label set that describes a slightly different renderer than
 * the one users actually get is worse than no label set at all.
 *
 * Globals injected by the runner: QRCodeStyling, jsQR, TesseraLib.
 */
(() => {
  /** Deterministic PRNG, so a run is reproducible from its seed. */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Box-Muller, for sensor noise that is actually gaussian. */
  function gaussian(rng) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Renders the design at source resolution and hands back a bitmap. */
  async function renderSource(payload, style, renderSize) {
    const options = TesseraLib.toQrOptions(payload, style, renderSize);
    const qr = new QRCodeStyling(options);
    const blob = await qr.getRawData('png');
    if (!blob) throw new Error('renderer returned no data');
    return await createImageBitmap(blob);
  }

  /**
   * Applies one set of physical conditions and returns the image a camera
   * would have captured.
   *
   * Order matters and follows the real optical path: blur is applied at source
   * resolution (the lens defocuses the scene before the sensor samples it),
   * then the image is resampled down to the sensor's pixels-per-module, then
   * the light response, then sensor noise, then any compression the image
   * picks up after capture.
   */
  async function capture(bitmap, p) {
    const source = bitmap.width;
    const blurPx = p.blurModules * p.sourceDotPx;

    // Optical blur, at source scale.
    let stage = bitmap;
    if (blurPx > 0.01) {
      const bc = new OffscreenCanvas(source, source);
      const bctx = bc.getContext('2d');
      bctx.fillStyle = '#ffffff';
      bctx.fillRect(0, 0, source, source);
      bctx.filter = `blur(${blurPx}px)`;
      bctx.drawImage(bitmap, 0, 0);
      bctx.filter = 'none';
      stage = bc;
    }

    // Sensor sampling. A transparent background is not transparent in the
    // real world — it is whatever the code was printed on, and that is white
    // in almost every case that matters.
    const target = Math.max(21, Math.round((p.ppm / p.sourceDotPx) * source));
    const c = new OffscreenCanvas(target, target);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, target, target);
    ctx.drawImage(stage, 0, 0, target, target);

    let img = ctx.getImageData(0, 0, target, target);

    // Light response and sensor noise.
    const lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) {
      const gammaed = Math.pow(v / 255, p.gamma) * 255;
      lut[v] = 127.5 + (gammaed - 127.5) * p.compress;
    }
    const rng = mulberry32(p.seed);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      // One noise draw shared across channels: sensor noise at these levels is
      // dominated by the luminance component.
      const n = p.noiseSigma > 0 ? gaussian(rng) * p.noiseSigma : 0;
      d[i] = lut[d[i]] + n;
      d[i + 1] = lut[d[i + 1]] + n;
      d[i + 2] = lut[d[i + 2]] + n;
    }

    // Post-capture recompression.
    if (p.jpegQuality < 1) {
      ctx.putImageData(img, 0, 0);
      const blob = await c.convertToBlob({
        type: 'image/jpeg',
        quality: p.jpegQuality,
      });
      const bm = await createImageBitmap(blob);
      ctx.drawImage(bm, 0, 0);
      bm.close();
      img = ctx.getImageData(0, 0, target, target);
    }

    return img;
  }

  /**
   * Asks a real decoder to read the captured image.
   *
   * Two verdicts are recorded rather than one. `strict` forbids the decoder
   * from inverting the image, which models the older dark-on-light-only
   * scanners the app already warns about; `any` allows it, which models a
   * modern phone. Keeping them apart preserves the inversion signal — if every
   * decode were allowed to invert, the effect would vanish from the labels and
   * the model could never learn it.
   *
   * A decode that returns the wrong string counts as a failure. A symbol that
   * confidently reads as something else is worse than one that does not read.
   */
  function decode(img, payload) {
    const strictHit = jsQR(img.data, img.width, img.height, {
      inversionAttempts: 'dontInvert',
    });
    const strict = strictHit != null && strictHit.data === payload;
    if (strict) return { strict: true, any: true };

    // 'attemptBoth' rather than 'onlyInvert': jsQR 1.4.0 only builds the
    // inverted matrix when inversionAttempts is 'attemptBoth' or 'invertFirst',
    // but still *scans* it for 'onlyInvert' — which dereferences undefined.
    // attemptBoth re-scans the upright image first, which is redundant here
    // but cheap, since this path only runs when the strict pass already failed.
    const invertedHit = jsQR(img.data, img.width, img.height, {
      inversionAttempts: 'attemptBoth',
    });
    const any = invertedHit != null && invertedHit.data === payload;
    return { strict: false, any };
  }

  /**
   * Walks the ladder and reports where the design breaks.
   *
   * The reported rung is the last one before the *first* failure, not the
   * highest rung that happened to pass. Decoding is not perfectly monotonic —
   * a noise draw can rescue a rung the design has no business passing — and
   * scoring on first failure refuses to credit that luck. The full boolean
   * trace is kept alongside it so the choice can be revisited without
   * re-running the lab.
   */
  async function walkLadder(bitmap, spec, ladder, baseline) {
    const trace = [];
    let firstFailure = -1;

    for (let i = 0; i < ladder.length; i++) {
      const rung = ladder[i];
      const img = await capture(bitmap, {
        ...baseline,
        ppm: rung.ppm,
        blurModules: rung.blurModules,
        sourceDotPx: spec.sourceDotPx,
        seed: spec.seed + i * 7919,
      });
      const verdict = decode(img, spec.payload);
      trace.push(verdict);
      if (!verdict.any && firstFailure === -1) firstFailure = i;
    }

    return { trace, rung: firstFailure === -1 ? ladder.length - 1 : firstFailure - 1 };
  }

  /** Sweeps one defect axis and reports the first value that breaks it. */
  async function probeAxis(bitmap, spec, probe, baseline) {
    const trace = [];
    for (let i = 0; i < probe.values.length; i++) {
      const value = probe.values[i];
      const overrides =
        probe.param === 'lightStep'
          ? { gamma: value.gamma, compress: value.compress }
          : { [probe.param]: value };

      const img = await capture(bitmap, {
        ...baseline,
        ...overrides,
        sourceDotPx: spec.sourceDotPx,
        seed: spec.seed + i * 104729,
      });
      const verdict = decode(img, spec.payload);
      trace.push(verdict);
      if (!verdict.any) return { trace, breakIndex: i };
    }
    return { trace, breakIndex: probe.values.length };
  }

  window.ScanLab = {
    /**
     * Runs one design through the full lab and returns its labels.
     * `spec` carries the design plus the geometry the runner computed in Node.
     */
    async run(spec, config) {
      const bitmap = await renderSource(spec.payload, spec.style, spec.renderSize);
      try {
        const distance = await walkLadder(
          bitmap,
          spec,
          config.DISTANCE_LADDER,
          config.DISTANCE_BASELINE,
        );

        const probes = {};
        for (const [name, probe] of Object.entries(config.PROBES)) {
          probes[name] = await probeAxis(bitmap, spec, probe, config.PROBE_BASELINE);
        }

        return { distance, probes };
      } finally {
        bitmap.close();
      }
    },
  };
})();
