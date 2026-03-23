import { getBasePalette, getPalette } from "./palette";

export const CANVAS_SIZE = 2400;

export function getCanvasDimensions(
  shape: "square" | "vertical" | "horizontal",
  size = CANVAS_SIZE,
) {
  if (shape === "vertical") return { width: size, height: Math.round((size * 7) / 5) };
  if (shape === "horizontal") return { width: Math.round((size * 7) / 5), height: size };
  return { width: size, height: size };
}

const WUBRG = ["W", "U", "B", "R", "G"];

export interface DrawState {
  title: string;
  bracket: string;
  description: string;
  keyCardImgs: (HTMLImageElement | null)[];
  keyCardLoadingStates: boolean[];
  commanderImg: HTMLImageElement | null;
  commanderImgLoading: boolean;
  altImgs: (HTMLImageElement | null)[];
  altImgLoadingStates: boolean[];
  backgroundImgs: (HTMLImageElement | null)[];
  backgroundImgLoadingStates: boolean[];
  partnerImgs: (HTMLImageElement | null)[];
  partnerImgLoadingStates: boolean[];
  colorIdentity: string[];
  colorIcons: Partial<Record<string, HTMLImageElement>>;
  showColorIcons: boolean;
  tags: string[];
  qrImg: HTMLImageElement | null;
  shape: "square" | "vertical" | "horizontal";
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
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
  x: number,
  y: number,
  w: number,
  h: number,
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

  ctx.restore();
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  roundedRectPath();
  const rim = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  rim.addColorStop(0, "rgba(255,255,255,0.35)");
  rim.addColorStop(0.4, "rgba(255,255,255,0.08)");
  rim.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

function drawPlaceholderCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rotation = 0,
) {
  const r = 14;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);

  ctx.shadowBlur = 40;
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 14;

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

  ctx.fillStyle = "rgba(90, 90, 90, 0.55)";
  ctx.fill();
  ctx.restore();
}

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

  // ─── Shared commander data ───
  const altCount = state.altImgs.reduce(
    (n, img, i) => n + (img || state.altImgLoadingStates[i] ? 1 : 0),
    0,
  );
  const allImgs = [state.commanderImg, ...state.altImgs];
  const allImgLoadingStates = [
    state.commanderImgLoading,
    ...state.altImgLoadingStates,
  ];

  if (state.shape === "vertical") {
    // ═══════════════════════════════════════
    // Vertical (card) mode layout
    // ═══════════════════════════════════════

    // Title — full width, centred
    const cardTitleSize = 116;
    const titleBaselineY = 140;
    let cardTitleBottomY = titleBaselineY;
    const titleLines = state.title
      ? state.title.split("\n").filter((l) => l.trim())
      : [];
    let actualTitleSize = cardTitleSize;
    if (titleLines.length > 0) {
      ctx.font = `bold ${cardTitleSize}px 'Cormorant Garamond', serif`;
      const minScale = Math.min(
        ...titleLines.map((l) => {
          const lw = ctx.measureText(l).width;
          return lw > W * 0.9 ? (W * 0.9) / lw : 1;
        }),
      );
      actualTitleSize = Math.floor(cardTitleSize * minScale);
      ctx.font = `bold ${actualTitleSize}px 'Cormorant Garamond', serif`;
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowOffsetY = 3;
      titleLines.forEach((l, i) =>
        ctx.fillText(l, W / 2, titleBaselineY + i * (actualTitleSize + 8)),
      );
      cardTitleBottomY =
        titleBaselineY + titleLines.length * (actualTitleSize + 8);
      ctx.restore();
    }

    // Colours + bracket — below title, left half (or centred if no tags)
    // Tags — right half, centred
    const metaIconSize = 74;
    const metaIconGap = 10;
    const cardActiveColors = WUBRG.filter((c) =>
      state.colorIdentity.includes(c),
    );
    const iconsVisible = state.showColorIcons && cardActiveColors.length > 0;
    const totalIconW = iconsVisible
      ? cardActiveColors.length * metaIconSize +
        (cardActiveColors.length - 1) * metaIconGap
      : 0;
    ctx.font = "bold 44px Philosopher, 'Segoe UI', Tahoma, serif";
    const bracketTextW = state.bracket
      ? ctx.measureText(state.bracket).width + 40
      : 0;
    const vMetaContentW = Math.max(totalIconW, bracketTextW);
    const vHasTags = state.tags.length > 0;
    const vPad = 60;
    const vColMid = W / 2;
    const vMetaOffsetX = vHasTags
      ? vPad + (W / 2 - vPad - vMetaContentW) / 2
      : vPad + (W - 2 * vPad - vMetaContentW) / 2;
    // last baseline - descender + same gap as above title
    const vMetaRowY =
      cardTitleBottomY -
      (actualTitleSize + 8) +
      Math.round(titleBaselineY - actualTitleSize * 0.75);
    const bracketH = 70;

    if (iconsVisible) {
      let x = vMetaOffsetX + (vMetaContentW - totalIconW) / 2;
      for (const color of cardActiveColors) {
        const img = state.colorIcons[color];
        if (img) ctx.drawImage(img, x, vMetaRowY, metaIconSize, metaIconSize);
        x += metaIconSize + metaIconGap;
      }
    }

    let vMetaBlockH = iconsVisible ? metaIconSize : 0;
    if (state.bracket) {
      vMetaBlockH += (iconsVisible ? 8 : 0) + bracketH;
      const bw = bracketTextW;
      const br = bracketH / 2;
      const by = vMetaRowY + (iconsVisible ? metaIconSize + 8 : 0);
      const bx = vMetaOffsetX + (vMetaContentW - bw) / 2;
      ctx.save();
      ctx.font = "bold 44px Philosopher, 'Segoe UI', Tahoma, serif";
      ctx.fillStyle = palette.accent + "cc";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
      ctx.arcTo(bx + bw, by + bracketH, bx + bw - br, by + bracketH, br);
      ctx.lineTo(bx + br, by + bracketH);
      ctx.arcTo(bx, by + bracketH, bx, by + bracketH - br, br);
      ctx.arcTo(bx, by, bx + br, by, br);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(state.bracket, bx + 16, by + bracketH * 0.69);
      ctx.restore();
    }

    let vTagsBottomY = vMetaRowY;
    if (vHasTags) {
      const tagAreaX = vColMid;
      const tagAreaW = W - vPad - tagAreaX;
      const tagFontSize = 34;
      const tagH = 52;
      const tagPadX = 22;
      const tagGapX = 10;
      const tagGapY = 10;
      const tagR = tagH / 2;
      ctx.font = `${tagFontSize}px 'Segoe UI', Tahoma, sans-serif`;

      const rows: { tag: string; tw: number }[][] = [];
      let currentRow: { tag: string; tw: number }[] = [];
      let currentRowW = 0;
      for (const tag of state.tags) {
        const tw = ctx.measureText(tag).width + tagPadX * 2;
        const needed = currentRow.length > 0 ? tagGapX + tw : tw;
        if (currentRow.length > 0 && currentRowW + needed > tagAreaW) {
          rows.push(currentRow);
          currentRow = [{ tag, tw }];
          currentRowW = tw;
        } else {
          currentRow.push({ tag, tw });
          currentRowW += needed;
        }
      }
      if (currentRow.length > 0) rows.push(currentRow);

      const totalTagsH = rows.length * tagH + (rows.length - 1) * tagGapY;
      const tyStart = vMetaRowY + (vMetaBlockH - totalTagsH) / 2;

      for (let ri = 0; ri < rows.length; ri++) {
        const row = rows[ri];
        const rowW = row.reduce((s, r) => s + r.tw, 0) + (row.length - 1) * tagGapX;
        let tx = tagAreaX + (tagAreaW - rowW) / 2;
        const ty = tyStart + ri * (tagH + tagGapY);
        for (const { tag, tw } of row) {
          ctx.save();
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.beginPath();
          ctx.moveTo(tx + tagR, ty);
          ctx.lineTo(tx + tw - tagR, ty);
          ctx.arcTo(tx + tw, ty, tx + tw, ty + tagR, tagR);
          ctx.arcTo(tx + tw, ty + tagH, tx + tw - tagR, ty + tagH, tagR);
          ctx.lineTo(tx + tagR, ty + tagH);
          ctx.arcTo(tx, ty + tagH, tx, ty + tagH - tagR, tagR);
          ctx.arcTo(tx, ty, tx + tagR, ty, tagR);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.fillText(tag, tx + tagPadX, ty + tagH * 0.68);
          ctx.restore();
          tx += tw + tagGapX;
        }
      }
      vTagsBottomY = tyStart + totalTagsH + 8;
    }

    // Description — below header, above commanders
    const cardHeaderH = Math.max(
      cardTitleBottomY + 2,
      vMetaRowY + vMetaBlockH + 2,
      vTagsBottomY + 2,
      200,
    );
    const descMaxW = W * 0.82;
    const maxDescH = H * 0.28;
    const maxDescSize = 54;
    const minDescSize = 14;
    let descSize = maxDescSize;
    let wrappedDescLines: string[] = [];
    if (state.description) {
      while (descSize >= minDescSize) {
        ctx.font = `${descSize}px 'Segoe UI', Tahoma, sans-serif`;
        wrappedDescLines = state.description
          .split("\n")
          .flatMap((para) =>
            para === "" ? [""] : wrapText(ctx, para, descMaxW),
          );
        if (wrappedDescLines.length * (descSize + 10) <= maxDescH) break;
        descSize--;
      }
    }
    const descBlockH =
      wrappedDescLines.length > 0
        ? wrappedDescLines.length * (descSize + 10) - 10
        : 0;
    const descTop = cardHeaderH + 28;

    if (wrappedDescLines.length > 0) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.textAlign = "center";
      ctx.font = `${descSize}px 'Segoe UI', Tahoma, sans-serif`;
      let descY = descTop + descSize;
      for (const line of wrappedDescLines) {
        ctx.fillText(line, W / 2, descY);
        descY += descSize + 10;
      }
      ctx.restore();
    }

    // Commander(s) — anchor top of cards just below description
    const descEndY = descBlockH > 0 ? descTop + descBlockH : descTop;
    const cmdAreaBot = H - 48; // align with QR code bottom
    const cmdCardTop = descEndY + (altCount === 0 ? 36 : altCount === 1 ? 80 : altCount === 2 ? 40 : 36);
    const availCmdH = cmdAreaBot - cmdCardTop;
    const cmdAspect = 161 / 115;

    const cardLayouts: {
      dx: number;
      dy: number;
      extraDy?: number;
      w: number;
      h: number;
      rot: number;
      z: number;
    }[] = (() => {
      const maxH = altCount >= 3 ? availCmdH : Math.min(availCmdH, H * 0.5);
      const maxW = W * 0.72;
      const baseW = Math.round(Math.min(maxW, maxH / cmdAspect));
      const baseH = Math.round(baseW * cmdAspect);
      const n = 1 + altCount;
      if (n <= 1) return [{ dx: 0, dy: 0, w: baseW, h: baseH, rot: 0, z: 0 }];
      const sm = Math.round(baseW * 0.76);
      const smH = Math.round(sm * cmdAspect);
      if (n === 2) {
        const lg = Math.round(baseW * 1.0);
        const lgH = Math.round(lg * cmdAspect);
        return [
          { dx: 220, dy: -30, w: lg, h: lgH, rot: 0.04, z: 1 },
          { dx: -220, dy: -30, w: lg, h: lgH, rot: -0.04, z: 0 },
        ];
      }
      if (n === 3) {
        const md = Math.round(baseW * 0.86);
        const mdH = Math.round(md * cmdAspect);
        return [
          { dx: 0, dy: 80, extraDy: 20, w: md, h: mdH, rot: 0, z: 2 },
          { dx: -290, dy: -60, w: md, h: mdH, rot: -0.08, z: 0 },
          { dx: 290, dy: -60, w: md, h: mdH, rot: 0.08, z: 1 },
        ];
      }
      return [
        { dx: 265, dy: 110, w: sm, h: smH, rot: 0, z: 3 },
        { dx: -265, dy: -110, w: sm, h: smH, rot: 0, z: 0 },
        { dx: 265, dy: -110, w: sm, h: smH, rot: 0, z: 1 },
        { dx: -265, dy: 110, w: sm, h: smH, rot: 0, z: 2 },
      ];
    })();

    const cmdCenterX = W / 2;
    // Anchor bottommost card's bottom edge to cmdAreaBot
    const bottomDy = Math.max(0, ...cardLayouts.map((l) => l.dy));
    const cmdCenterY = cmdAreaBot - bottomDy - cardLayouts[0].h / 2;
    const cardDrawOrder = cardLayouts
      .map((_, i) => i)
      .sort((a, b) => cardLayouts[a].z - cardLayouts[b].z);

    const CARD_PEEK_RATIO = 65 / 700;
    for (const i of cardDrawOrder) {
      const { dx, dy, extraDy = 0, w: cw, h: ch, rot } = cardLayouts[i];
      const slotCX = cmdCenterX + dx;
      const slotCY = cmdCenterY + dy + extraDy;
      const mainImg = allImgs[i] ?? null;
      const mainLoading = allImgLoadingStates[i] ?? false;
      const bgImg = state.backgroundImgs[i] ?? null;
      const bgLoading = state.backgroundImgLoadingStates[i] ?? false;
      const partnerImg = state.partnerImgs[i] ?? null;
      const partnerLoading = state.partnerImgLoadingStates[i] ?? false;

      const hasPartner = !!partnerImg || partnerLoading;
      const hasBg = !!bgImg || bgLoading;
      const pw = hasPartner ? Math.round(cw * 0.82) : cw;
      const ph = hasPartner ? Math.round(pw * cmdAspect) : ch;
      const peekH = hasBg ? Math.round(ph * CARD_PEEK_RATIO) : 0;
      const w = hasBg ? Math.round(pw * (1 - CARD_PEEK_RATIO)) : pw;
      const h = hasBg ? Math.round(ph * (1 - CARD_PEEK_RATIO)) : ph;

      if (hasPartner) {
        const SUB_ROT = 0.14;
        const ox = w * 0.14;
        const oy = h * 0.04;
        const shiftY = h * 0.12;
        if (bgImg) {
          drawCard(
            ctx,
            bgImg,
            slotCX + ox - w / 2 - w * 0.06,
            slotCY + shiftY + oy - peekH - h / 2,
            w,
            h,
            rot + SUB_ROT,
          );
        } else if (bgLoading) {
          drawPlaceholderCard(
            ctx,
            slotCX + ox - w / 2 - w * 0.06,
            slotCY + shiftY + oy - peekH - h / 2,
            w,
            h,
            rot + SUB_ROT,
          );
        }
        if (partnerImg) {
          drawCard(
            ctx,
            partnerImg,
            slotCX - ox - w / 2,
            slotCY + shiftY - oy - h / 2,
            w,
            h,
            rot - SUB_ROT,
          );
        } else if (partnerLoading) {
          drawPlaceholderCard(
            ctx,
            slotCX - ox - w / 2,
            slotCY + shiftY - oy - h / 2,
            w,
            h,
            rot - SUB_ROT,
          );
        }
        if (mainImg) {
          drawCard(
            ctx,
            mainImg,
            slotCX + ox - w / 2,
            slotCY + oy - h / 2,
            w,
            h,
            rot + SUB_ROT,
          );
        } else if (mainLoading) {
          drawPlaceholderCard(
            ctx,
            slotCX + ox - w / 2,
            slotCY + oy - h / 2,
            w,
            h,
            rot + SUB_ROT,
          );
        }
      } else {
        if (bgImg) {
          drawCard(
            ctx,
            bgImg,
            slotCX - w / 2 - w * 0.06,
            slotCY - peekH - h / 2,
            w,
            h,
            rot,
          );
        } else if (bgLoading) {
          drawPlaceholderCard(
            ctx,
            slotCX - w / 2 - w * 0.06,
            slotCY - peekH - h / 2,
            w,
            h,
            rot,
          );
        }
        if (mainImg) {
          drawCard(ctx, mainImg, slotCX - w / 2, slotCY - h / 2, w, h, rot);
        } else if (mainLoading) {
          drawPlaceholderCard(ctx, slotCX - w / 2, slotCY - h / 2, w, h, rot);
        }
      }
    }
  } else {
    // ═══════════════════════════════════════
    // Square mode layout
    // ═══════════════════════════════════════

    const isHorizontal = state.shape === "horizontal";
    const cmdCX = S * 0.26;
    const headerRowY = 36;

    type CmdLayout = {
      dx: number;
      dy: number;
      w: number;
      h: number;
      rot: number;
      z: number;
    };

    const layouts: Record<number, CmdLayout[]> = {
      0: [{ dx: 0, dy: 0, w: 500, h: 700, rot: 0, z: 0 }],
      1: [
        { dx: 130, dy: 80, w: 390, h: 546, rot: 0.07, z: 1 },
        { dx: -90, dy: -80, w: 390, h: 546, rot: -0.07, z: 0 },
      ],
      2: [
        { dx: 0, dy: 160, w: 300, h: 420, rot: 0, z: 2 },
        { dx: -130, dy: -130, w: 300, h: 420, rot: -0.08, z: 0 },
        { dx: 130, dy: -130, w: 300, h: 420, rot: 0.08, z: 1 },
      ],
      3: [
        { dx: 130, dy: 160, w: 300, h: 420, rot: 0, z: 3 },
        { dx: -130, dy: -130, w: 300, h: 420, rot: 0, z: 0 },
        { dx: 130, dy: -130, w: 300, h: 420, rot: 0, z: 1 },
        { dx: -130, dy: 160, w: 300, h: 420, rot: 0, z: 2 },
      ],
    };

    const baseConfig = layouts[altCount] ?? layouts[2];
    // For horizontal with 2 commanders, pull the right (front) card slightly left
    const config =
      isHorizontal && altCount === 1
        ? baseConfig.map((c, i) => (i === 0 ? { ...c, dx: c.dx - 60 } : c))
        : baseConfig;
    const PEEK_RATIO = 65 / 700;

    const slotDims = (i: number) => {
      const hasPartner =
        !!state.partnerImgs[i] || (state.partnerImgLoadingStates[i] ?? false);
      const hasBg =
        !!state.backgroundImgs[i] ||
        (state.backgroundImgLoadingStates[i] ?? false);
      const baseW = hasPartner ? Math.round(config[i].w * 0.82) : config[i].w;
      const baseH = hasPartner ? Math.round((baseW * 161) / 115) : config[i].h;
      const peekH = hasBg ? Math.round(baseH * PEEK_RATIO) : 0;
      const w = hasBg ? Math.round(baseW * (1 - PEEK_RATIO)) : baseW;
      const h = hasBg ? Math.round(baseH * (1 - PEEK_RATIO)) : baseH;
      return { w, h, peekH };
    };

    const slotEffectiveTop = (i: number) => {
      const { h, peekH } = slotDims(i);
      return config[i].dy - peekH - h / 2;
    };

    const slotEffectiveBottom = (i: number) => {
      const { h } = slotDims(i);
      return config[i].dy + h / 2;
    };

    let cmdCY: number;
    if (isHorizontal) {
      const minEffTop = Math.min(...config.map((_, i) => slotEffectiveTop(i)));
      const maxEffBot = Math.max(...config.map((_, i) => slotEffectiveBottom(i)));
      const span = maxEffBot - minEffTop;
      const hPad = 36;
      cmdCY = hPad - minEffTop + (H - 2 * hPad - span) / 2;
    } else {
      cmdCY = headerRowY - Math.min(...config.map((_, i) => slotEffectiveTop(i)));
    }

    const drawOrder = Array.from({ length: config.length }, (_, i) => i).sort(
      (a, b) => config[a].z - config[b].z,
    );
    for (const i of drawOrder) {
      const mainImg = allImgs[i] ?? null;
      const mainLoading = allImgLoadingStates[i] ?? false;
      const bgImg = state.backgroundImgs[i] ?? null;
      const bgLoading = state.backgroundImgLoadingStates[i] ?? false;
      const partnerImg = state.partnerImgs[i] ?? null;
      const partnerLoading = state.partnerImgLoadingStates[i] ?? false;
      const { w, h, peekH } = slotDims(i);
      const { dx, dy, rot } = config[i];
      const slotCX = cmdCX + dx;
      const slotCY = cmdCY + dy;

      if (partnerImg || partnerLoading) {
        const SUB_ROT = 0.14;
        const ox = w * 0.14;
        const oy = h * 0.04;
        const shiftY = h * 0.12;

        if (bgImg) {
          drawCard(
            ctx,
            bgImg,
            slotCX + ox - w / 2 - w * 0.06,
            slotCY + shiftY + oy - peekH - h / 2,
            w,
            h,
            rot + SUB_ROT,
          );
        } else if (bgLoading) {
          drawPlaceholderCard(
            ctx,
            slotCX + ox - w / 2 - w * 0.06,
            slotCY + shiftY + oy - peekH - h / 2,
            w,
            h,
            rot + SUB_ROT,
          );
        }
        if (partnerImg) {
          drawCard(
            ctx,
            partnerImg,
            slotCX - ox - w / 2,
            slotCY + shiftY - oy - h / 2,
            w,
            h,
            rot - SUB_ROT,
          );
        } else if (partnerLoading) {
          drawPlaceholderCard(
            ctx,
            slotCX - ox - w / 2,
            slotCY + shiftY - oy - h / 2,
            w,
            h,
            rot - SUB_ROT,
          );
        }
        if (mainImg) {
          drawCard(
            ctx,
            mainImg,
            slotCX + ox - w / 2,
            slotCY + oy - h / 2,
            w,
            h,
            rot + SUB_ROT,
          );
        } else if (mainLoading) {
          drawPlaceholderCard(
            ctx,
            slotCX + ox - w / 2,
            slotCY + oy - h / 2,
            w,
            h,
            rot + SUB_ROT,
          );
        }
      } else {
        if (bgImg) {
          drawCard(
            ctx,
            bgImg,
            slotCX - w / 2 - w * 0.06,
            slotCY - peekH - h / 2,
            w,
            h,
            rot,
          );
        } else if (bgLoading) {
          drawPlaceholderCard(
            ctx,
            slotCX - w / 2 - w * 0.06,
            slotCY - peekH - h / 2,
            w,
            h,
            rot,
          );
        }
        if (mainImg) {
          drawCard(ctx, mainImg, slotCX - w / 2, slotCY - h / 2, w, h, rot);
        } else if (mainLoading) {
          drawPlaceholderCard(ctx, slotCX - w / 2, slotCY - h / 2, w, h, rot);
        }
      }
    }

    const rightX = isHorizontal ? S * 0.52 : S * 0.56;
    const rightW = S - rightX - 35;

    // Title — top of right column
    const titleSize = isHorizontal ? 68 : 84;
    let titleBottomY = 36;
    if (state.title) {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowOffsetY = 3;
      const titleCX = rightX + rightW / 2;
      const lines = state.title.split("\n").filter((l) => l.trim());
      ctx.font = `bold ${titleSize}px 'Cormorant Garamond', serif`;
      const minScale = Math.min(
        ...lines.map((line) => {
          const lw = ctx.measureText(line).width;
          return lw > rightW ? rightW / lw : 1;
        }),
      );
      const actualSize = Math.floor(titleSize * minScale);
      ctx.font = `bold ${actualSize}px 'Cormorant Garamond', serif`;
      lines.forEach((line, i) => {
        ctx.fillText(line, titleCX, 110 + i * (actualSize + 8));
      });
      titleBottomY = 110 + lines.length * (actualSize + 8);
      ctx.restore();
    }

    // Color icons + bracket badge
    const rowY = titleBottomY - 25;
    const iconSize = isHorizontal ? 34 : 42;
    const iconGap = 7;
    const activeColors = WUBRG.filter((c) => state.colorIdentity.includes(c));
    const iconsVisible = state.showColorIcons && activeColors.length > 0;
    const keyCardsTop = isHorizontal ? H * 0.64 : H * 0.67;

    if (isHorizontal) {
      // Left side of right column: colors + bracket.
      // Right side: tags. Description sits below both.
      const totalIconW = iconsVisible
        ? activeColors.length * iconSize + (activeColors.length - 1) * iconGap
        : 0;
      const bFontSize = 21;
      ctx.font = `bold ${bFontSize}px Philosopher, 'Segoe UI', Tahoma, serif`;
      const bTextW = state.bracket ? ctx.measureText(state.bracket).width + 30 : 0;
      const metaContentW = Math.max(totalIconW, bTextW);

      const bracketH = 34;
      const metaDescY = Math.max(titleBottomY - 20, 120);
      const hasTags = state.tags.length > 0;
      // With tags: colours/bracket centred in left half, tags start at column midpoint
      // Without tags: colours/bracket centred across the full column
      const colMid = rightX + rightW / 2;
      const metaOffsetX = hasTags
        ? rightX + (rightW / 2 - metaContentW) / 2
        : rightX + (rightW - metaContentW) / 2;

      if (iconsVisible) {
        let ix = metaOffsetX + (metaContentW - totalIconW) / 2;
        for (const color of activeColors) {
          const img = state.colorIcons[color];
          if (img) ctx.drawImage(img, ix, metaDescY, iconSize, iconSize);
          ix += iconSize + iconGap;
        }
      }

      let metaBlockH = iconsVisible ? iconSize : 0;
      if (state.bracket) {
        metaBlockH += (iconsVisible ? 8 : 0) + bracketH;
        const bw = bTextW;
        const br = bracketH / 2;
        const by = metaDescY + (iconsVisible ? iconSize + 8 : 0);
        const bx = metaOffsetX + (metaContentW - bw) / 2;
        ctx.save();
        ctx.font = `bold ${bFontSize}px Philosopher, 'Segoe UI', Tahoma, serif`;
        ctx.fillStyle = palette.accent + "cc";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + bw - br, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
        ctx.arcTo(bx + bw, by + bracketH, bx + bw - br, by + bracketH, br);
        ctx.lineTo(bx + br, by + bracketH);
        ctx.arcTo(bx, by + bracketH, bx, by + bracketH - br, br);
        ctx.arcTo(bx, by, bx + br, by, br);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(state.bracket, bx + 15, by + bracketH * 0.69);
        ctx.restore();
      }

      // Tags — right half, centred horizontally per row and vertically within metaBlockH
      let tagsBottomY = metaDescY;
      if (hasTags) {
        const tagAreaX = colMid;
        const tagAreaW = rightX + rightW - tagAreaX;
        const tagFontSize = 19;
        const tagH = 28;
        const tagPadX = 12;
        const tagGapX = 6;
        const tagGapY = 6;
        const tagR = tagH / 2;
        ctx.font = `${tagFontSize}px 'Segoe UI', Tahoma, sans-serif`;

        // Layout pass: build rows of {tag, tw}
        const rows: { tag: string; tw: number }[][] = [];
        let currentRow: { tag: string; tw: number }[] = [];
        let currentRowW = 0;
        for (const tag of state.tags) {
          const tw = ctx.measureText(tag).width + tagPadX * 2;
          const needed = currentRow.length > 0 ? tagGapX + tw : tw;
          if (currentRow.length > 0 && currentRowW + needed > tagAreaW) {
            rows.push(currentRow);
            currentRow = [{ tag, tw }];
            currentRowW = tw;
          } else {
            currentRow.push({ tag, tw });
            currentRowW += needed;
          }
        }
        if (currentRow.length > 0) rows.push(currentRow);

        const totalTagsH = rows.length * tagH + (rows.length - 1) * tagGapY;
        const tyStart = metaDescY + (metaBlockH - totalTagsH) / 2;

        for (let ri = 0; ri < rows.length; ri++) {
          const row = rows[ri];
          const rowW = row.reduce((s, r) => s + r.tw, 0) + (row.length - 1) * tagGapX;
          let tx = tagAreaX + (tagAreaW - rowW) / 2;
          const ty = tyStart + ri * (tagH + tagGapY);
          for (const { tag, tw } of row) {
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.12)";
            ctx.beginPath();
            ctx.moveTo(tx + tagR, ty);
            ctx.lineTo(tx + tw - tagR, ty);
            ctx.arcTo(tx + tw, ty, tx + tw, ty + tagR, tagR);
            ctx.arcTo(tx + tw, ty + tagH, tx + tw - tagR, ty + tagH, tagR);
            ctx.lineTo(tx + tagR, ty + tagH);
            ctx.arcTo(tx, ty + tagH, tx, ty + tagH - tagR, tagR);
            ctx.arcTo(tx, ty, tx + tagR, ty, tagR);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.75)";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.fillText(tag, tx + tagPadX, ty + tagH * 0.68);
            ctx.restore();
            tx += tw + tagGapX;
          }
        }
        tagsBottomY = tyStart + totalTagsH + 8;
      }

      // Description below both meta and tags
      const hHeaderBottomY = Math.max(metaDescY + metaBlockH, tagsBottomY);
      const hDescAreaTop = hHeaderBottomY + 28;

      if (state.description) {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        const maxDescSize = 30;
        const minDescSize = 14;
        let descSize = maxDescSize;
        let wrappedLines: string[] = [];
        while (descSize >= minDescSize) {
          ctx.font = `${descSize}px 'Segoe UI', Tahoma, sans-serif`;
          wrappedLines = state.description
            .split("\n")
            .flatMap((para) => (para === "" ? [""] : wrapText(ctx, para, rightW)));
          const lastLineBottom =
            hDescAreaTop + 2 * descSize + (wrappedLines.length - 1) * (descSize + 10);
          if (lastLineBottom <= keyCardsTop - 20) break;
          descSize--;
        }
        let y = hDescAreaTop + descSize;
        for (const line of wrappedLines) {
          ctx.fillText(line, rightX, y);
          y += descSize + 10;
        }
        ctx.restore();
      }
    } else {
      const sqHasTags = state.tags.length > 0;
      const sqTotalIconW = iconsVisible
        ? activeColors.length * iconSize + (activeColors.length - 1) * iconGap
        : 0;
      ctx.font = `bold 26px Philosopher, 'Segoe UI', Tahoma, serif`;
      const sqBTextW = state.bracket ? ctx.measureText(state.bracket).width + 30 : 0;
      const sqMetaContentW = Math.max(sqTotalIconW, sqBTextW);
      const sqColMid = rightX + rightW / 2;
      const sqMetaOffsetX = sqHasTags
        ? rightX + (rightW / 2 - sqMetaContentW) / 2
        : rightX + (rightW - sqMetaContentW) / 2;

      if (iconsVisible) {
        let ix = sqMetaOffsetX + (sqMetaContentW - sqTotalIconW) / 2;
        for (const color of activeColors) {
          const img = state.colorIcons[color];
          if (img) ctx.drawImage(img, ix, rowY, iconSize, iconSize);
          ix += iconSize + iconGap;
        }
      }

      const bracketRowY = iconsVisible ? rowY + iconSize + 8 : rowY;
      let bracketH = 0;
      if (state.bracket) {
        ctx.font = `bold 26px Philosopher, 'Segoe UI', Tahoma, serif`;
        const bw = sqBTextW;
        bracketH = 42;
        const br = bracketH / 2;
        const bx = sqMetaOffsetX + (sqMetaContentW - bw) / 2;
        const by = bracketRowY;
        ctx.save();
        ctx.fillStyle = palette.accent + "cc";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + bw - br, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
        ctx.arcTo(bx + bw, by + bracketH, bx + bw - br, by + bracketH, br);
        ctx.lineTo(bx + br, by + bracketH);
        ctx.arcTo(bx, by + bracketH, bx, by + bracketH - br, br);
        ctx.arcTo(bx, by, bx + br, by, br);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(state.bracket, bx + 15, by + bracketH * 0.69);
        ctx.restore();
      }

      const sqMetaBlockH =
        (iconsVisible ? iconSize + (state.bracket ? 8 : 0) : 0) +
        (state.bracket ? bracketH : 0);
      const sqMetaBottomY = rowY + sqMetaBlockH;

      // Tags — right half, centred horizontally per row and vertically within meta height
      let sqTagsBottomY = rowY;
      if (sqHasTags) {
        const tagAreaX = sqColMid;
        const tagAreaW = rightX + rightW - tagAreaX;
        const tagFontSize = 19;
        const tagH = 28;
        const tagPadX = 12;
        const tagGapX = 6;
        const tagGapY = 6;
        const tagR = tagH / 2;
        ctx.font = `${tagFontSize}px 'Segoe UI', Tahoma, sans-serif`;

        const rows: { tag: string; tw: number }[][] = [];
        let currentRow: { tag: string; tw: number }[] = [];
        let currentRowW = 0;
        for (const tag of state.tags) {
          const tw = ctx.measureText(tag).width + tagPadX * 2;
          const needed = currentRow.length > 0 ? tagGapX + tw : tw;
          if (currentRow.length > 0 && currentRowW + needed > tagAreaW) {
            rows.push(currentRow);
            currentRow = [{ tag, tw }];
            currentRowW = tw;
          } else {
            currentRow.push({ tag, tw });
            currentRowW += needed;
          }
        }
        if (currentRow.length > 0) rows.push(currentRow);

        const totalTagsH = rows.length * tagH + (rows.length - 1) * tagGapY;
        const tyStart = rowY + (sqMetaBlockH - totalTagsH) / 2;

        for (let ri = 0; ri < rows.length; ri++) {
          const row = rows[ri];
          const rowW = row.reduce((s, r) => s + r.tw, 0) + (row.length - 1) * tagGapX;
          let tx = tagAreaX + (tagAreaW - rowW) / 2;
          const ty = tyStart + ri * (tagH + tagGapY);
          for (const { tag, tw } of row) {
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.12)";
            ctx.beginPath();
            ctx.moveTo(tx + tagR, ty);
            ctx.lineTo(tx + tw - tagR, ty);
            ctx.arcTo(tx + tw, ty, tx + tw, ty + tagR, tagR);
            ctx.arcTo(tx + tw, ty + tagH, tx + tw - tagR, ty + tagH, tagR);
            ctx.lineTo(tx + tagR, ty + tagH);
            ctx.arcTo(tx, ty + tagH, tx, ty + tagH - tagR, tagR);
            ctx.arcTo(tx, ty, tx + tagR, ty, tagR);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.75)";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.fillText(tag, tx + tagPadX, ty + tagH * 0.68);
            ctx.restore();
            tx += tw + tagGapX;
          }
        }
        sqTagsBottomY = tyStart + totalTagsH + 8;
      }

      const headerBottomY = Math.max(sqMetaBottomY, sqTagsBottomY);
      const descAreaTop = Math.max(headerBottomY + 44, 120);

      if (state.description) {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        const maxDescSize = 38;
        const minDescSize = 14;
        let descSize = maxDescSize;
        let wrappedLines: string[] = [];
        while (descSize >= minDescSize) {
          ctx.font = `${descSize}px 'Segoe UI', Tahoma, sans-serif`;
          wrappedLines = state.description
            .split("\n")
            .flatMap((para) =>
              para === "" ? [""] : wrapText(ctx, para, rightW),
            );
          const lastLineBottom =
            descAreaTop +
            2 * descSize +
            (wrappedLines.length - 1) * (descSize + 10);
          if (lastLineBottom <= keyCardsTop + 8) break;
          descSize--;
        }
        let y = descAreaTop + descSize;
        for (const line of wrappedLines) {
          ctx.fillText(line, rightX, y);
          y += descSize + 10;
        }
        ctx.restore();
      }
    }

    // Key Cards — bottom (square and horizontal)
    if (state.shape === "square" || isHorizontal) {
      const keySlots = state.keyCardImgs
        .map((img, i) => ({
          img,
          loading: state.keyCardLoadingStates[i] ?? false,
        }))
        .filter((s) => s.img || s.loading);
      if (keySlots.length > 0) {
        const areaLeft = isHorizontal ? rightX : 0;
        const areaWidth = isHorizontal ? rightW : W;
        const labelSize = isHorizontal ? 36 : 48;
        const keyAreaH = H - 40 - keyCardsTop;
        let labelY: number;
        let keyH: number;
        let cardY: number;
        if (isHorizontal) {
          const labelCardGap = 26;
          keyH = Math.min((keyAreaH - labelSize - labelCardGap) * 0.98, 420);
          const blockTop = keyCardsTop;
          labelY = blockTop + labelSize;
          cardY = labelY + labelCardGap;
        } else {
          keyH = Math.min(keyAreaH * 0.88, 300);
          labelY = keyCardsTop + 20;
          cardY = keyCardsTop + 35 + (keyAreaH - keyH) / 2;
        }
        const keyW = keyH * (115 / 161);
        const totalKeysW = keySlots.length * keyW + (keySlots.length - 1) * 20;
        const startX = areaLeft + (areaWidth - totalKeysW) / 2;

        ctx.save();
        ctx.font = `bold ${labelSize}px 'Cormorant Garamond', serif`;
        ctx.fillStyle = palette.accent;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.textAlign = "center";
        ctx.fillText("Key Cards", areaLeft + areaWidth / 2, labelY);
        ctx.restore();

        for (let i = 0; i < keySlots.length; i++) {
          const { img, loading } = keySlots[i];
          if (img) {
            drawCard(ctx, img, startX + i * (keyW + 20), cardY, keyW, keyH);
          } else if (loading) {
            drawPlaceholderCard(ctx, startX + i * (keyW + 20), cardY, keyW, keyH);
          }
        }
      }
    }
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
    const qrX = 48;
    const qrY = H - 48 - qrSize;
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
