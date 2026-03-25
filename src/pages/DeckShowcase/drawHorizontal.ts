import {
  DrawState,
  WUBRG,
  drawCard,
  drawPlaceholderCard,
  wrapText,
} from "./drawHelpers";
import { getPalette } from "./palette";

type Palette = ReturnType<typeof getPalette>;

type CmdLayout = {
  dx: number;
  dy: number;
  w: number;
  h: number;
  rot: number;
  z: number;
};

const LAYOUTS: Record<number, CmdLayout[]> = {
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

const PEEK_RATIO = 65 / 700;

export function drawHorizontalLayout(
  ctx: CanvasRenderingContext2D,
  state: DrawState,
  W: number,
  H: number,
  palette: Palette,
) {
  const altCount = state.altImgs.reduce(
    (n, img, i) => n + (img || state.altImgLoadingStates[i] ? 1 : 0),
    0,
  );
  const allImgs = [state.commanderImg, ...state.altImgs];
  const allImgLoadingStates = [
    state.commanderImgLoading,
    ...state.altImgLoadingStates,
  ];

  const cmdCX = W * 0.26;
  const baseConfig = LAYOUTS[altCount] ?? LAYOUTS[2];
  // Pull the front card slightly left when there are 2 commanders
  const config =
    altCount === 1
      ? baseConfig.map((c, i) => (i === 0 ? { ...c, dx: c.dx - 60 } : c))
      : baseConfig;

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

  const minEffTop = Math.min(...config.map((_, i) => slotEffectiveTop(i)));
  const maxEffBot = Math.max(...config.map((_, i) => slotEffectiveBottom(i)));
  const span = maxEffBot - minEffTop;
  const hPad = 36;
  const cmdCY = hPad - minEffTop + (H - 2 * hPad - span) / 2;

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

  const rightX = W * 0.52;
  const rightW = W - rightX - 35;

  // Title — top of right column
  const titleSize = 68;
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

  // Color icons + bracket + tags
  const iconSize = 34;
  const iconGap = 7;
  const activeColors = WUBRG.filter((c) => state.colorIdentity.includes(c));
  const iconsVisible = state.showColorIcons && activeColors.length > 0;
  const keyCardsTop = H * 0.64;

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
      const rowW =
        row.reduce((s, r) => s + r.tw, 0) + (row.length - 1) * tagGapX;
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

  // Description — below both meta and tags
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
        hDescAreaTop +
        2 * descSize +
        (wrappedLines.length - 1) * (descSize + 10);
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

  // Key Cards — bottom of right column
  const keySlots = state.keyCardImgs
    .map((img, i) => ({
      img,
      loading: state.keyCardLoadingStates[i] ?? false,
    }))
    .filter((s) => s.img || s.loading);
  if (keySlots.length > 0) {
    const labelSize = 36;
    const labelCardGap = 26;
    const keyH = Math.min(H - 20 - keyCardsTop - labelSize - labelCardGap, 470);
    const labelY = keyCardsTop + labelSize;
    const cardY = labelY + labelCardGap;
    const keyW = keyH * (115 / 161);
    const totalKeysW = keySlots.length * keyW + (keySlots.length - 1) * 20;
    const startX = rightX + (rightW - totalKeysW) / 2;

    ctx.save();
    ctx.font = `bold ${labelSize}px 'Cormorant Garamond', serif`;
    ctx.fillStyle = palette.accent;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("Key Cards", rightX + rightW / 2, labelY);
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
