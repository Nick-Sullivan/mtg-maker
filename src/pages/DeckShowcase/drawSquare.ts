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

export function drawSquareLayout(
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
  const headerRowY = 36;
  const config = LAYOUTS[altCount] ?? LAYOUTS[2];

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

  const cmdCY =
    headerRowY - Math.min(...config.map((_, i) => slotEffectiveTop(i)));

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

  const rightX = W * 0.56;
  const rightW = W - rightX - 35;

  // Title — top of right column
  const titleSize = 84;
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
  const iconSize = 42;
  const iconGap = 7;
  const activeColors = WUBRG.filter((c) => state.colorIdentity.includes(c));
  const iconsVisible = state.showColorIcons && activeColors.length > 0;
  const keyCardsTop = H * 0.67;

  const sqHasTags = state.tags.length > 0;
  const sqTotalIconW = iconsVisible
    ? activeColors.length * iconSize + (activeColors.length - 1) * iconGap
    : 0;
  ctx.font = `bold 26px Philosopher, 'Segoe UI', Tahoma, serif`;
  const sqBTextW = state.bracket
    ? ctx.measureText(state.bracket).width + 30
    : 0;
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
        .flatMap((para) => (para === "" ? [""] : wrapText(ctx, para, rightW)));
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

  // Key Cards — bottom, full width
  const keySlots = state.keyCardImgs
    .map((img, i) => ({
      img,
      loading: state.keyCardLoadingStates[i] ?? false,
    }))
    .filter((s) => s.img || s.loading);
  if (keySlots.length > 0) {
    const labelSize = 48;
    const keyAreaH = H - 40 - keyCardsTop;
    const keyH = Math.min(keyAreaH * 0.88, 300);
    const labelY = keyCardsTop + 20;
    const cardY = keyCardsTop + 35 + (keyAreaH - keyH) / 2;
    const keyW = keyH * (115 / 161);
    const totalKeysW = keySlots.length * keyW + (keySlots.length - 1) * 20;
    const startX = (W - totalKeysW) / 2;

    ctx.save();
    ctx.font = `bold ${labelSize}px 'Cormorant Garamond', serif`;
    ctx.fillStyle = palette.accent;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.textAlign = "center";
    ctx.fillText("Key Cards", W / 2, labelY);
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
