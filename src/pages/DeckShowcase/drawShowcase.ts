import { getBasePalette, getPalette } from "./palette";

export const CANVAS_SIZE = 2400;

export interface DrawState {
  title: string;
  bracket: string;
  description: string;
  keyCardImgs: (HTMLImageElement | null)[];
  commanderImg: HTMLImageElement | null;
  altImgs: (HTMLImageElement | null)[];
  colorIdentity: string[];
  colorIcons: Partial<Record<string, HTMLImageElement>>;
  showColorIcons: boolean;
  qrImg: HTMLImageElement | null;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
  rotation = 0,
) {
  const r = 14;

  function roundedRectPath() {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
    ctx.lineTo(w / 2, h / 2 - r);
    ctx.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
    ctx.lineTo(-w / 2, -h / 2 + r);
    ctx.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
    ctx.closePath();
  }

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);

  // Drop shadow
  ctx.shadowBlur = 40;
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 14;
  roundedRectPath();
  ctx.clip();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);

  // Highlight rim: bright top-left fading to dark bottom-right
  ctx.restore();
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  roundedRectPath();
  const rim = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  rim.addColorStop(0,   "rgba(255,255,255,0.35)");
  rim.addColorStop(0.4, "rgba(255,255,255,0.08)");
  rim.addColorStop(1,   "rgba(0,0,0,0.3)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

export function drawShowcase(canvas: HTMLCanvasElement, state: DrawState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(2, 0, 0, 2, 0, 0);
  const S = CANVAS_SIZE / 2;
  const palette = getPalette(state.colorIdentity);

  const subPalettes = state.colorIdentity.length === 2
    ? state.colorIdentity.map(getBasePalette).filter(Boolean) as ReturnType<typeof getBasePalette>[]
    : null;

  if (subPalettes && subPalettes.length === 2) {
    const [p1, p2] = subPalettes;

    // Base fill from darkest of the two
    ctx.fillStyle = p1!.dark;
    ctx.fillRect(0, 0, S, S);

    // Color 1 radiates from top-left
    const g1 = ctx.createRadialGradient(0, 0, 0, S * 0.1, S * 0.1, S * 0.85);
    g1.addColorStop(0, p1!.mid);
    g1.addColorStop(0.5, p1!.dark);
    g1.addColorStop(1, "transparent");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, S, S);

    // Color 2 radiates from bottom-right
    const g2 = ctx.createRadialGradient(S, S, 0, S * 0.9, S * 0.9, S * 0.85);
    g2.addColorStop(0, p2!.mid);
    g2.addColorStop(0.5, p2!.dark);
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, S, S);

    // Per-color glows
    const gg1 = ctx.createRadialGradient(S * 0.2, S * 0.3, 0, S * 0.2, S * 0.3, S * 0.5);
    gg1.addColorStop(0, p1!.glow + "30");
    gg1.addColorStop(1, "transparent");
    ctx.fillStyle = gg1;
    ctx.fillRect(0, 0, S, S);

    const gg2 = ctx.createRadialGradient(S * 0.8, S * 0.7, 0, S * 0.8, S * 0.7, S * 0.5);
    gg2.addColorStop(0, p2!.glow + "30");
    gg2.addColorStop(1, "transparent");
    ctx.fillStyle = gg2;
    ctx.fillRect(0, 0, S, S);
  } else {
    const bg = ctx.createLinearGradient(0, 0, S * 0.3, S);
    bg.addColorStop(0, palette.dark);
    bg.addColorStop(1, palette.mid);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);

    const glow1 = ctx.createRadialGradient(S * 0.31, S * 0.62, 0, S * 0.31, S * 0.62, 420);
    glow1.addColorStop(0, palette.glow + "28");
    glow1.addColorStop(1, "transparent");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, S, S);

    const glow2 = ctx.createRadialGradient(S * 0.82, S * 0.72, 0, S * 0.82, S * 0.72, 300);
    glow2.addColorStop(0, palette.glow + "18");
    glow2.addColorStop(1, "transparent");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, S, S);
  }

  const streak = ctx.createLinearGradient(0, 0, S, S);
  streak.addColorStop(0, "rgba(255,255,255,0.0)");
  streak.addColorStop(0.5, "rgba(255,255,255,0.05)");
  streak.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = streak;
  ctx.fillRect(0, 0, S, S);

  // Commander group — starts near the top of the canvas
  const cmdCX = S * 0.26;
  const altCount = state.altImgs.filter(Boolean).length;
  const headerRowY = 36;

  type CmdLayout = { dx: number; dy: number; w: number; h: number; rot: number; z: number };

  const layouts: Record<number, CmdLayout[]> = {
    0: [
      { dx:   0, dy:    0, w: 500, h: 700, rot: 0, z: 0 },
    ],
    1: [
      { dx: 130, dy:  80, w: 390, h: 546, rot:  0.07, z: 1 },
      { dx: -90, dy: -80, w: 390, h: 546, rot: -0.07, z: 0 },
    ],
    2: [
      { dx:    0, dy:  160, w: 300, h: 420, rot: 0, z: 2 },
      { dx: -130, dy: -130, w: 300, h: 420, rot: 0, z: 0 },
      { dx:  130, dy: -130, w: 300, h: 420, rot: 0, z: 1 },
    ],
    3: [
      { dx:  130, dy:  160, w: 300, h: 420, rot: 0, z: 3 },
      { dx: -130, dy: -130, w: 300, h: 420, rot: 0, z: 0 },
      { dx:  130, dy: -130, w: 300, h: 420, rot: 0, z: 1 },
      { dx: -130, dy:  160, w: 300, h: 420, rot: 0, z: 2 },
    ],
  };

  const config = layouts[altCount] ?? layouts[2];
  // Align the topmost card edge with headerRowY
  const cmdCY = headerRowY - Math.min(...config.map((c) => c.dy - c.h / 2));
  const allImgs = [state.commanderImg, ...state.altImgs];

  // Draw in z order so higher z cards appear in front
  const drawOrder = Array.from({ length: config.length }, (_, i) => i)
    .sort((a, b) => config[a].z - config[b].z);
  for (const i of drawOrder) {
    const img = allImgs[i];
    if (!img) continue;
    const { dx, dy, w, h, rot } = config[i];
    drawCard(ctx, img, cmdCX + dx - w / 2, cmdCY + dy - h / 2, w, h, rot);
  }

  const rightX = S * 0.56;
  const rightW = S - rightX - 35;

  // Title — top of right column, wraps to second line if needed
  const titleSize = 84;
  let titleBottomY = 36;
  if (state.title) {
    ctx.save();
    ctx.font = `bold ${titleSize}px 'Cormorant Garamond', serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowOffsetY = 3;
    const titleCX = rightX + rightW / 2;
    const lines = state.title.split("\n").filter((l) => l.trim());
    lines.forEach((line, i) => {
      ctx.fillText(line, titleCX, 110 + i * (titleSize + 8), rightW);
    });
    titleBottomY = 110 + lines.length * (titleSize + 8);
    ctx.restore();
  }

  // Bracket badge + color icons — below title
  const rowY = titleBottomY - 30;
  const iconSize = 48;
  const iconGap = 8;
  const WUBRG = ['W', 'U', 'B', 'R', 'G'];
  const activeColors = WUBRG.filter((c) => state.colorIdentity.includes(c));

  // Bracket + icons row — right-aligned below title
  const totalIconW = (state.showColorIcons && activeColors.length > 0)
    ? activeColors.length * iconSize + (activeColors.length - 1) * iconGap
    : 0;

  let bracketW = 0;
  if (state.bracket) {
    ctx.font = "bold 30px Philosopher, 'Segoe UI', Tahoma, serif";
    bracketW = ctx.measureText(state.bracket).width + 36;
  }

  const rowGap = bracketW > 0 && totalIconW > 0 ? 16 : 0;
  // Centre bracket + icons within the right column
  const totalRowW = bracketW + rowGap + totalIconW;
  const titleCX = rightX + rightW / 2;
  const rowStartX = titleCX - totalRowW / 2;
  const iconsStartX = rowStartX + bracketW + rowGap;

  if (state.bracket) {
    ctx.save();
    ctx.font = "bold 30px Philosopher, 'Segoe UI', Tahoma, serif";
    const bw = bracketW;
    const bh = 48;
    const br = bh / 2;
    const bx = rowStartX;
    const by = rowY;
    ctx.fillStyle = palette.accent + "cc";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(bx + br, by); ctx.lineTo(bx + bw - br, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
    ctx.arcTo(bx + bw, by + bh, bx + bw - br, by + bh, br);
    ctx.lineTo(bx + br, by + bh);
    ctx.arcTo(bx, by + bh, bx, by + bh - br, br);
    ctx.arcTo(bx, by, bx + br, by, br);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(state.bracket, bx + 18, by + 33);
    ctx.restore();
  }

  if (state.showColorIcons && activeColors.length > 0) {
    let ix = iconsStartX;
    for (const color of activeColors) {
      const img = state.colorIcons[color];
      if (img) ctx.drawImage(img, ix, rowY, iconSize, iconSize);
      ix += iconSize + iconGap;
    }
  }

  const iconsVisible = state.showColorIcons && activeColors.length > 0;
  const headerBottomY = (state.bracket || iconsVisible) ? rowY + iconSize + 8 : rowY;

  // Description — top-right area, below header elements
  const descAreaTop = Math.max(headerBottomY + 30, 120);
  const keyCardsTop = S * 0.67;

  if (state.description) {
    const descSize = 38;
    ctx.save();
    ctx.font = `${descSize}px 'Segoe UI', Tahoma, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    let y = descAreaTop + descSize;
    const wrappedLines = state.description
      .split("\n")
      .flatMap((para) => para === "" ? [""] : wrapText(ctx, para, rightW));
    for (const line of wrappedLines) {
      if (y + descSize > keyCardsTop - 20) break;
      ctx.fillText(line, rightX, y);
      y += descSize + 10;
    }
    ctx.restore();
  }

  // Key Cards — bottom third, full width
  const validKeys = state.keyCardImgs.filter(Boolean) as HTMLImageElement[];
  if (validKeys.length > 0) {
    const keyAreaH = S - 40 - keyCardsTop;
    const keyH = Math.min(keyAreaH * 0.88, 260);
    const keyW = keyH * (115 / 161);
    const totalKeysW = validKeys.length * keyW + (validKeys.length - 1) * 20;
    const startX = (S - totalKeysW) / 2;
    const cardY = keyCardsTop + (keyAreaH - keyH) / 2;

    // Section label — centred
    ctx.save();
    ctx.font = "bold 48px 'Cormorant Garamond', serif";
    ctx.fillStyle = palette.accent;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("Key Cards", S / 2, keyCardsTop - 10);
    ctx.restore();

    for (let i = 0; i < validKeys.length; i++) {
      drawCard(ctx, validKeys[i], startX + i * (keyW + 20), cardY, keyW, keyH);
    }
  }

  const vig = ctx.createRadialGradient(S / 2, S / 2, S * 0.35, S / 2, S / 2, S * 0.85);
  vig.addColorStop(0, "transparent");
  vig.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, S, S);

  if (state.qrImg) {
    const qrSize = 140;
    const qrX = S - 48 - qrSize;
    const qrY = S - 48 - qrSize;
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
  ctx.strokeRect(3, 3, S - 6, S - 6);
  ctx.restore();
}
