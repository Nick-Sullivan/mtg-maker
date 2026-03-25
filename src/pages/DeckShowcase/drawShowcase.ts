import type { DrawState } from "./drawHelpers";
import { CANVAS_SIZE, WUBRG } from "./drawHelpers";
import { drawHorizontalLayout } from "./drawHorizontal";
import { drawSquareLayout } from "./drawSquare";
import { drawVerticalLayout } from "./drawVertical";
import { getBasePalette, getPalette } from "./palette";

export { CANVAS_SIZE, getCanvasDimensions } from "./drawHelpers";
export type { DrawState } from "./drawHelpers";

export function drawShowcase(canvas: HTMLCanvasElement, state: DrawState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const S = CANVAS_SIZE / 2;
  const scale = canvas.width / S;
  const W = S;
  const H = Math.round((canvas.height * S) / canvas.width);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const palette = getPalette(state.colorIdentity);

  const sortedColors = [...state.colorIdentity].sort(
    (a, b) => WUBRG.indexOf(a) - WUBRG.indexOf(b),
  );
  const subPalettes =
    sortedColors.length >= 2
      ? (sortedColors.map(getBasePalette).filter(Boolean) as NonNullable<
          ReturnType<typeof getBasePalette>
        >[])
      : null;

  // ─── Background ───
  if (subPalettes && subPalettes.length >= 2) {
    const ANCHORS: [number, number][][] = [
      [],
      [],
      [
        [0, 0],
        [1, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [0.5, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [0.5, 0.5],
        [0, 1],
        [1, 1],
      ],
    ];
    const anchors = ANCHORS[subPalettes.length];

    const [ax0, ay0] = anchors[0];
    const [axN, ayN] = anchors[anchors.length - 1];
    const baseBg = ctx.createLinearGradient(W * ax0, H * ay0, W * axN, H * ayN);
    baseBg.addColorStop(0, subPalettes[0].dark);
    baseBg.addColorStop(1, subPalettes[subPalettes.length - 1].dark);
    ctx.fillStyle = baseBg;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < subPalettes.length; i++) {
      const p = subPalettes[i];
      const [fx, fy] = anchors[i];
      const cx = W * fx;
      const cy = H * fy;
      const g = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        Math.max(W, H) * 0.9,
      );
      g.addColorStop(0, p.mid);
      g.addColorStop(0.45, p.dark);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    const glowInset = 0.2;
    for (let i = 0; i < subPalettes.length; i++) {
      const p = subPalettes[i];
      const [fx, fy] = anchors[i];
      const gx = fx === 0 ? glowInset : fx === 1 ? 1 - glowInset : fx;
      const gy = fy === 0 ? glowInset : fy === 1 ? 1 - glowInset : fy;
      const gg = ctx.createRadialGradient(
        W * gx,
        H * gy,
        0,
        W * gx,
        H * gy,
        Math.max(W, H) * 0.5,
      );
      gg.addColorStop(0, p.glow + "30");
      gg.addColorStop(1, "transparent");
      ctx.fillStyle = gg;
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
    bg.addColorStop(0, palette.dark);
    bg.addColorStop(1, palette.mid);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow1 = ctx.createRadialGradient(
      W * 0.31,
      H * 0.62,
      0,
      W * 0.31,
      H * 0.62,
      H * 0.35,
    );
    glow1.addColorStop(0, palette.glow + "28");
    glow1.addColorStop(1, "transparent");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(
      W * 0.82,
      H * 0.72,
      0,
      W * 0.82,
      H * 0.72,
      H * 0.25,
    );
    glow2.addColorStop(0, palette.glow + "18");
    glow2.addColorStop(1, "transparent");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);
  }

  const streak = ctx.createLinearGradient(0, 0, W, H);
  streak.addColorStop(0, "rgba(255,255,255,0.0)");
  streak.addColorStop(0.5, "rgba(255,255,255,0.05)");
  streak.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = streak;
  ctx.fillRect(0, 0, W, H);

  // ─── Shape-specific layout ───
  if (state.shape === "vertical") {
    drawVerticalLayout(ctx, state, W, H, palette);
  } else if (state.shape === "horizontal") {
    drawHorizontalLayout(ctx, state, W, H, palette);
  } else {
    drawSquareLayout(ctx, state, W, H, palette);
  }

  // ─── Common: vignette, QR, border ───
  const vig = ctx.createRadialGradient(
    W / 2,
    H / 2,
    W * 0.35,
    W / 2,
    H / 2,
    Math.hypot(W / 2, H / 2) * 1.2,
  );
  vig.addColorStop(0, "transparent");
  vig.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  if (state.qrImg) {
    const qrSize = state.shape === "vertical" ? 210 : 140;
    const qrX = state.shape === "horizontal" ? 33 : 48;
    const qrY =
      state.shape === "horizontal" ? H - 36 - qrSize : H - 48 - qrSize;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 8);
    ctx.fill();
    ctx.drawImage(state.qrImg, qrX, qrY, qrSize, qrSize);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = palette.accent + "55";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.restore();
}
