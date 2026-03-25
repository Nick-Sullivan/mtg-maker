import {
  DrawState,
  WUBRG,
  drawCard,
  drawPlaceholderCard,
  wrapText,
} from "./drawHelpers";
import { getPalette } from "./palette";

type Palette = ReturnType<typeof getPalette>;

export function drawVerticalLayout(
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
  const cardActiveColors = WUBRG.filter((c) => state.colorIdentity.includes(c));
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
  const cmdAreaBot = H - 48;
  const cmdCardTop =
    descEndY +
    (altCount === 0 ? 36 : altCount === 1 ? 80 : altCount === 2 ? 40 : 36);
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
}
