import { useEffect, useRef } from "react";
import type { ImmersiveThemeVariant } from "../domain/themes";

interface Point {
  x: number;
  y: number;
}

interface Particle extends Point {
  radius: number;
  speed: number;
  phase: number;
  alpha: number;
}

const TAU = Math.PI * 2;

function seededParticles(count: number, seed: number): Particle[] {
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    radius: 0.7 + random() * 2.1,
    speed: 0.18 + random() * 0.72,
    phase: random() * TAU,
    alpha: 0.08 + random() * 0.54
  }));
}

function fillGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  stops: Array<[number, string]>
) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  stops.forEach(([position, color]) => gradient.addColorStop(position, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function addVignette(context: CanvasRenderingContext2D, width: number, height: number, alpha = 0.45) {
  const radius = Math.max(width, height) * 0.76;
  const gradient = context.createRadialGradient(width / 2, height / 2, radius * 0.1, width / 2, height / 2, radius);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.max(0, Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2));
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.arcTo(x + width, y, x + width, y + safeRadius, safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.arcTo(x + width, y + height, x + width - safeRadius, y + height, safeRadius);
  context.lineTo(x + safeRadius, y + height);
  context.arcTo(x, y + height, x, y + height - safeRadius, safeRadius);
  context.lineTo(x, y + safeRadius);
  context.arcTo(x, y, x + safeRadius, y, safeRadius);
  context.closePath();
}

function drawVodka(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  motion: Point,
  stars: Particle[]
) {
  context.fillStyle = "#020205";
  context.fillRect(0, 0, width, height);

  const nebulas: Array<[number, number, number, string]> = [
    [0.2, 0.25, 0.82, "rgba(74,20,140,.48)"],
    [0.75, 0.65, 0.72, "rgba(13,71,161,.46)"],
    [0.45, 0.86, 0.64, "rgba(136,14,79,.42)"]
  ];
  nebulas.forEach(([x, y, radius, color], index) => {
    const cx = x * width + motion.x * (12 + index * 4);
    const cy = y * height + motion.y * (10 + index * 3);
    const r = radius * Math.max(width, height);
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });

  stars.forEach((star, index) => {
    const depth = 0.25 + (index % 9) / 11;
    const x = (star.x * width + motion.x * 24 * depth + width) % width;
    const y = (star.y * height + motion.y * 20 * depth + height) % height;
    const twinkle = 0.35 + Math.sin(time * (0.7 + star.speed) + star.phase) * 0.28;
    context.beginPath();
    context.arc(x, y, star.radius * (0.55 + depth * 0.45), 0, TAU);
    context.fillStyle = `rgba(244,244,255,${Math.max(0.12, star.alpha * twinkle)})`;
    context.fill();
  });
  addVignette(context, width, height, 0.52);
}

function drawBeer(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  motion: Point,
  bubbles: Particle[]
) {
  fillGradient(context, width, height, [[0, "#010201"], [0.38, "#07110d"], [0.72, "#0d1813"], [1, "#020302"]]);
  const inset = Math.max(5, width * 0.018);
  const bottle = new Path2D();
  bottle.moveTo(inset, height * 0.04);
  bottle.bezierCurveTo(width * 0.12, 0, width * 0.88, 0, width - inset, height * 0.04);
  bottle.lineTo(width - inset, height * 0.97);
  bottle.bezierCurveTo(width * 0.88, height, width * 0.12, height, inset, height * 0.97);
  bottle.closePath();

  context.save();
  context.clip(bottle);
  const glass = context.createLinearGradient(0, 0, width, 0);
  glass.addColorStop(0, "#06110b");
  glass.addColorStop(0.28, "#173524");
  glass.addColorStop(0.55, "#24452f");
  glass.addColorStop(1, "#07110b");
  context.fillStyle = glass;
  context.fillRect(0, 0, width, height);

  const surface = height * 0.49 + motion.y * height * 0.035;
  const slope = motion.x * height * 0.055;
  const waveY = (x: number) => surface + slope * (x / width - 0.5) + Math.sin(x / width * TAU * 2.2 + time * 1.35) * height * 0.004;
  const liquid = new Path2D();
  liquid.moveTo(0, waveY(0));
  for (let step = 1; step <= 32; step += 1) {
    const x = width * step / 32;
    liquid.lineTo(x, waveY(x));
  }
  liquid.lineTo(width, height);
  liquid.lineTo(0, height);
  liquid.closePath();
  const beer = context.createLinearGradient(0, surface, 0, height);
  beer.addColorStop(0, "rgba(181,138,43,.86)");
  beer.addColorStop(0.35, "rgba(110,95,30,.9)");
  beer.addColorStop(0.72, "rgba(33,66,38,.96)");
  beer.addColorStop(1, "#0f2717");
  context.fillStyle = beer;
  context.fill(liquid);

  const foam = new Path2D();
  const foamHeight = Math.max(18, height * 0.032);
  foam.moveTo(0, waveY(0) - foamHeight);
  for (let step = 1; step <= 32; step += 1) {
    const x = width * step / 32;
    const froth = Math.sin(step * 1.34 + time * 0.55) * foamHeight * 0.18 + Math.cos(step * 0.57) * foamHeight * 0.12;
    foam.lineTo(x, waveY(x) - foamHeight + froth);
  }
  for (let step = 32; step >= 0; step -= 1) {
    const x = width * step / 32;
    foam.lineTo(x, waveY(x) + 2);
  }
  foam.closePath();
  const foamGradient = context.createLinearGradient(0, surface - foamHeight, 0, surface + 3);
  foamGradient.addColorStop(0, "rgba(244,231,203,.95)");
  foamGradient.addColorStop(1, "rgba(209,185,154,.72)");
  context.fillStyle = foamGradient;
  context.fill(foam);

  bubbles.forEach((bubble) => {
    const x = width * (0.07 + bubble.x * 0.86) + Math.sin(time + bubble.phase) * width * 0.008;
    const cycle = (bubble.y - time * bubble.speed * 0.045 + 1) % 1;
    const y = surface + 14 + cycle * (height - surface - 28);
    if (y > waveY(x) + 6) {
      context.beginPath();
      context.arc(x, y, bubble.radius * 1.45, 0, TAU);
      context.fillStyle = `rgba(246,242,216,${bubble.alpha * 0.5})`;
      context.fill();
      context.beginPath();
      context.arc(x - bubble.radius * 0.35, y - bubble.radius * 0.35, bubble.radius * 0.4, 0, TAU);
      context.fillStyle = "rgba(255,255,255,.35)";
      context.fill();
    }
  });

  const shine = context.createLinearGradient(width * 0.14 + motion.x * 12, 0, width * 0.38 + motion.x * 18, height);
  shine.addColorStop(0, "rgba(255,255,255,0)");
  shine.addColorStop(0.48, "rgba(247,248,236,.22)");
  shine.addColorStop(0.7, "rgba(255,255,255,0)");
  context.fillStyle = shine;
  context.fillRect(0, 0, width, height);
  context.restore();

  context.strokeStyle = "rgba(70,116,79,.7)";
  context.lineWidth = Math.max(2, width * 0.008);
  context.stroke(bottle);
  addVignette(context, width, height, 0.52);
}

function shoreline(width: number, height: number, x: number) {
  const progress = Math.max(-0.1, Math.min(1.1, x / width));
  return height * (0.86 - progress * 0.36 - progress * progress * 0.06);
}

function drawCampingBeach(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  motion: Point,
  sparkles: Particle[]
) {
  fillGradient(context, width, height, [[0, "#249fda"], [0.42, "#79d8ec"], [0.72, "#c8f1f2"], [1, "#ffe7b2"]]);

  const sunX = width * 0.18 + motion.x * 5;
  const sunY = height * 0.16 + motion.y * 4;
  const sun = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, Math.min(width, height) * 0.34);
  sun.addColorStop(0, "#fffce4");
  sun.addColorStop(0.18, "rgba(255,243,164,.94)");
  sun.addColorStop(1, "rgba(255,240,162,0)");
  context.fillStyle = sun;
  context.fillRect(0, 0, width, height);

  const coast = new Path2D();
  const horizon = height * 0.405;
  coast.moveTo(-width * 0.15, horizon + height * 0.045);
  coast.bezierCurveTo(width * 0.08, horizon - height * 0.015, width * 0.22, horizon - height * 0.052, width * 0.38, horizon - height * 0.018);
  coast.bezierCurveTo(width * 0.52, horizon, width * 0.66, horizon - height * 0.034, width * 1.15, horizon + height * 0.022);
  coast.lineTo(width * 1.15, horizon + height * 0.1);
  coast.lineTo(-width * 0.15, horizon + height * 0.1);
  coast.closePath();
  const coastGradient = context.createLinearGradient(0, horizon - height * 0.06, 0, horizon + height * 0.08);
  coastGradient.addColorStop(0, "#4f8768");
  coastGradient.addColorStop(1, "#1e625a");
  context.fillStyle = coastGradient;
  context.fill(coast);

  const seaTop = height * 0.43;
  const sea = context.createLinearGradient(0, seaTop, 0, height);
  sea.addColorStop(0, "#18afc9");
  sea.addColorStop(0.42, "#16c7cf");
  sea.addColorStop(1, "#057f9c");
  context.fillStyle = sea;
  context.fillRect(0, seaTop, width, height - seaTop);

  const sand = new Path2D();
  sand.moveTo(width * 1.15, shoreline(width, height, width * 1.15));
  for (let step = 1; step <= 40; step += 1) {
    const x = width * (1.15 - step / 40 * 1.3);
    sand.lineTo(x, shoreline(width, height, x));
  }
  sand.lineTo(-width * 0.2, height * 1.12);
  sand.lineTo(width * 1.2, height * 1.12);
  sand.closePath();
  const sandGradient = context.createLinearGradient(width, height * 0.42, 0, height);
  sandGradient.addColorStop(0, "#fff0c4");
  sandGradient.addColorStop(0.5, "#f6d391");
  sandGradient.addColorStop(1, "#d79e59");
  context.fillStyle = sandGradient;
  context.fill(sand);

  for (let band = 0; band < 6; band += 1) {
    context.beginPath();
    for (let step = 0; step <= 34; step += 1) {
      const x = width * (-0.05 + step / 34 * (0.95 - band * 0.055));
      const y = shoreline(width, height, x) - height * (0.055 + band * 0.032) + Math.sin(step * 0.39 + time * (0.7 + band * 0.04) + band) * 2.4;
      if (step === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.strokeStyle = band % 2 ? "rgba(154,245,240,.28)" : "rgba(255,255,255,.25)";
    context.lineWidth = 1.2 + band * 0.08;
    context.stroke();
  }

  for (let band = 0; band < 3; band += 1) {
    context.beginPath();
    for (let step = 0; step <= 40; step += 1) {
      const x = width * (-0.03 + step / 40 * 1.09);
      const tide = (Math.sin(time * 0.76) * 0.5 + 0.5) * Math.min(width, height) * 0.018;
      const y = shoreline(width, height, x) + tide * (1 - band * 0.22) + Math.sin(step * 0.31 + time + band * 1.75) * 2.6 + band * 3;
      if (step === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.strokeStyle = `rgba(255,255,255,${0.74 - band * 0.16})`;
    context.lineWidth = 2.8 - band * 0.45;
    context.stroke();
  }

  const trees = [
    [0.69, 0.86, 0.82, 2.7], [0.76, 0.89, 1.02, 0.2], [0.84, 0.91, 1.24, 1.3],
    [0.93, 0.94, 1.45, 2.1], [1.02, 0.96, 1.28, 0.8], [1.1, 0.92, 1.02, 1.8]
  ];
  trees.forEach(([xPercent, ground, scale, phase]) => {
    const baseX = width * xPercent;
    const baseY = height * ground;
    const treeHeight = Math.min(width, height) * 0.24 * scale;
    const sway = Math.sin(time * 1.1 + phase) * Math.min(width, height) * 0.006 * scale;
    context.beginPath();
    context.moveTo(baseX - 3 * scale, baseY);
    context.bezierCurveTo(baseX - 2 * scale, baseY - treeHeight * 0.35, baseX + sway, baseY - treeHeight * 0.82, baseX + sway, baseY - treeHeight);
    context.lineTo(baseX + sway + 5 * scale, baseY - treeHeight * 0.92);
    context.bezierCurveTo(baseX + 2 * scale, baseY - treeHeight * 0.55, baseX + 4 * scale, baseY - treeHeight * 0.25, baseX + 6 * scale, baseY);
    context.fillStyle = "#7b4c2c";
    context.fill();
    const crownX = baseX + sway;
    const crownY = baseY - treeHeight;
    const crownW = Math.min(width, height) * 0.19 * scale;
    const crownH = Math.min(width, height) * 0.075 * scale;
    context.beginPath();
    context.ellipse(crownX, crownY, crownW * 0.58, crownH * 0.56, Math.sin(time + phase) * 0.02, 0, TAU);
    const canopy = context.createLinearGradient(0, crownY - crownH, 0, crownY + crownH);
    canopy.addColorStop(0, "#7cb342");
    canopy.addColorStop(1, "#1e6b45");
    context.fillStyle = canopy;
    context.fill();
  });

  sparkles.forEach((sparkle) => {
    const x = sparkle.x * width * 0.68;
    const y = height * (0.46 + sparkle.y * 0.24);
    const pulse = 0.5 + Math.sin(time * 1.45 + sparkle.phase) * 0.5;
    context.beginPath();
    context.arc(x, y, sparkle.radius * (0.55 + pulse), 0, TAU);
    context.fillStyle = `rgba(255,255,255,${0.08 + pulse * 0.4})`;
    context.fill();
  });
}

function drawDayAfter(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  motion: Point,
  dust: Particle[]
) {
  fillGradient(context, width, height, [[0, "#f2ebd9"], [0.58, "#ede6d3"], [1, "#d6cdba"]]);

  const bed = new Path2D();
  bed.moveTo(-100, height * 0.85);
  bed.quadraticCurveTo(width * 0.3, height * 0.82, width * 0.6, height * 0.95);
  bed.lineTo(width + 100, height * 0.9);
  bed.lineTo(width + 100, height + 100);
  bed.lineTo(-100, height + 100);
  bed.closePath();
  context.fillStyle = "rgba(112,107,99,.2)";
  context.fill(bed);

  const wx = width * 0.55 + motion.x * 12;
  const wy = height * 0.15 + motion.y * 8;
  const ww = width * 0.35;
  const wh = height * 0.45;

  context.save();
  context.translate(wx + ww / 2, wy + wh / 2);
  context.rotate(25 * Math.PI / 180);
  const beam = context.createLinearGradient(0, -wh / 2, 0, height * 1.7);
  beam.addColorStop(0, "rgba(255,250,175,.22)");
  beam.addColorStop(1, "rgba(255,250,175,0)");
  context.fillStyle = beam;
  context.beginPath();
  context.moveTo(-ww / 2, -wh / 2);
  context.lineTo(ww / 2, -wh / 2);
  context.lineTo(ww + 360, height * 1.7);
  context.lineTo(-ww - 240, height * 1.7);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = "rgba(165,184,194,.24)";
  context.fillRect(wx, wy, ww, wh);
  context.fillStyle = "#d6cdba";
  context.fillRect(wx + ww / 2 - 6, wy, 12, wh);
  context.fillRect(wx, wy + wh / 2 - 6, ww, 12);

  const glareX = wx + ww * 0.3;
  const glareY = wy + wh * 0.4;
  const glare = context.createRadialGradient(glareX, glareY, 0, glareX, glareY, Math.max(width, height) * 0.55);
  glare.addColorStop(0, "rgba(255,251,189,.88)");
  glare.addColorStop(0.16, "rgba(255,251,189,.36)");
  glare.addColorStop(1, "rgba(255,250,175,0)");
  context.fillStyle = glare;
  context.fillRect(0, 0, width, height);

  dust.forEach((particle) => {
    const y = ((particle.y + time * particle.speed * 0.018) % 1) * height;
    const x = particle.x * width + Math.sin(time * 0.65 + particle.phase) * 15;
    context.beginPath();
    context.arc(x, y, particle.radius, 0, TAU);
    context.fillStyle = `rgba(255,255,255,${particle.alpha * 0.26})`;
    context.fill();
  });
  addVignette(context, width, height, 0.2);
}

function drawClosedBar(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  motion: Point,
  drizzle: Particle[]
) {
  fillGradient(context, width, height, [[0, "#020307"], [0.35, "#07101b"], [0.74, "#11161c"], [1, "#090a0d"]]);
  const shiftX = motion.x * 9;
  const shiftY = motion.y * 6;
  const fx = width * 0.11 + shiftX;
  const fy = height * 0.15 + shiftY;
  const fw = width * 0.78;
  const fh = height * 0.6;

  context.fillStyle = "rgba(10,14,20,.9)";
  context.fillRect(0, fy + fh * 0.18, fx, fh * 0.72);
  context.fillRect(fx + fw, fy + fh * 0.12, width - fx - fw, fh * 0.78);

  const facade = context.createLinearGradient(0, fy, 0, fy + fh);
  facade.addColorStop(0, "#1a2027");
  facade.addColorStop(0.5, "#131820");
  facade.addColorStop(1, "#0c1016");
  context.fillStyle = facade;
  context.beginPath();
  roundedRect(context, fx, fy, fw, fh, 18);
  context.fill();

  const storefrontX = fx + fw * 0.05;
  const storefrontY = fy + fh * 0.18;
  const storefrontW = fw * 0.9;
  const storefrontH = fh * 0.56;
  context.fillStyle = "#0f1318";
  context.beginPath();
  roundedRect(context, storefrontX, storefrontY, storefrontW, storefrontH, 12);
  context.fill();

  const shutterX = storefrontX + storefrontW * 0.07;
  const shutterY = storefrontY + storefrontH * 0.04;
  const shutterW = storefrontW * 0.56;
  const shutterH = storefrontH * 0.82;
  const shutter = context.createLinearGradient(0, shutterY, 0, shutterY + shutterH);
  shutter.addColorStop(0, "#313a44");
  shutter.addColorStop(1, "#171d24");
  context.fillStyle = shutter;
  context.fillRect(shutterX, shutterY, shutterW, shutterH);
  for (let slat = 1; slat < 22; slat += 1) {
    const y = shutterY + shutterH * slat / 22;
    context.strokeStyle = "rgba(0,0,0,.52)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(shutterX, y);
    context.lineTo(shutterX + shutterW, y);
    context.stroke();
  }

  const doorX = shutterX + shutterW + storefrontW * 0.06;
  const doorY = shutterY + storefrontH * 0.03;
  const doorW = storefrontW * 0.2;
  const doorH = storefrontH * 0.8;
  context.fillStyle = "#0b0f14";
  context.beginPath();
  roundedRect(context, doorX, doorY, doorW, doorH, 9);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,.12)";
  context.beginPath();
  context.moveTo(doorX + doorW * 0.18, doorY + 12);
  context.lineTo(doorX + doorW * 0.36, doorY + doorH - 18);
  context.stroke();

  const glow = 0.28 + Math.sin(time * 0.22) * 0.05 - (Math.sin(time * 0.61 + 1.3) > 0.988 ? 0.14 : 0);
  const signX = fx + fw * 0.3;
  const signY = fy + fh * 0.09;
  const signW = fw * 0.4;
  const signH = fh * 0.115;
  context.save();
  context.shadowColor = `rgba(199,54,58,${Math.max(0.18, glow)})`;
  context.shadowBlur = 24;
  context.strokeStyle = `rgba(231,82,82,${0.72 + glow})`;
  context.lineWidth = 3;
  context.beginPath();
  roundedRect(context, signX, signY, signW, signH, 10);
  context.stroke();
  context.fillStyle = `rgba(239,104,104,${0.88 + glow * 0.1})`;
  context.font = `800 ${Math.max(16, signH * 0.47)}px Inter, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("Chiuso", signX + signW / 2, signY + signH / 2 + 1);
  context.restore();

  const pavement = height * 0.73;
  fillGradient(context, width, height, [[0, "rgba(0,0,0,0)"], [pavement / height, "rgba(0,0,0,0)"], [pavement / height + 0.002, "#1a1d22"], [1, "#090a0c"]]);
  const reflection = context.createLinearGradient(0, pavement, 0, height);
  reflection.addColorStop(0, `rgba(196,71,71,${Math.max(0.1, glow * 0.5)})`);
  reflection.addColorStop(1, "rgba(196,71,71,0)");
  context.fillStyle = reflection;
  context.beginPath();
  roundedRect(context, signX, pavement - 5, signW, height - pavement + 20, 20);
  context.fill();

  drizzle.forEach((drop) => {
    const y = ((drop.y + time * drop.speed * 0.08) % 1.12) * height - height * 0.08;
    const x = drop.x * width + Math.sin(time * 0.17 + drop.phase) * 8;
    context.strokeStyle = `rgba(205,223,236,${drop.alpha * 0.18})`;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - 4, y + Math.max(9, height * 0.018));
    context.stroke();
  });
  addVignette(context, width, height, 0.58);
}

function heartPath(centerX: number, centerY: number, size: number) {
  const path = new Path2D();
  path.moveTo(centerX, centerY - size * 0.56);
  path.bezierCurveTo(centerX - size * 0.18, centerY - size * 0.9, centerX - size * 0.84, centerY - size * 0.98, centerX - size * 0.92, centerY - size * 0.24);
  path.bezierCurveTo(centerX - size * 0.98, centerY + size * 0.2, centerX - size * 0.34, centerY + size * 0.7, centerX, centerY + size * 0.98);
  path.bezierCurveTo(centerX + size * 0.34, centerY + size * 0.7, centerX + size * 0.98, centerY + size * 0.2, centerX + size * 0.92, centerY - size * 0.24);
  path.bezierCurveTo(centerX + size * 0.84, centerY - size * 0.98, centerX + size * 0.18, centerY - size * 0.9, centerX, centerY - size * 0.56);
  path.closePath();
  return path;
}

function drawBrokenHeart(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  motion: Point,
  particles: Particle[]
) {
  fillGradient(context, width, height, [[0, "#060408"], [0.38, "#170913"], [0.72, "#250c17"], [1, "#09070b"]]);
  const beat = Math.min(1, Math.pow((Math.sin(time * 1.25) + 1) / 2, 2.4) + Math.pow((Math.sin(time * 2.5 + 0.9) + 1) / 2, 7) * 0.34);
  const cx = width * 0.5 + motion.x * 7;
  const cy = height * 0.52 + motion.y * 6;
  const size = Math.min(width * 0.27, height * 0.22) * (1 + beat * 0.028);

  const rearGlow = context.createRadialGradient(cx, cy, 0, cx, cy, size * 2.2);
  rearGlow.addColorStop(0, `rgba(177,79,92,${0.12 + beat * 0.16})`);
  rearGlow.addColorStop(0.45, "rgba(90,22,34,.2)");
  rearGlow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = rearGlow;
  context.fillRect(0, 0, width, height);

  const path = heartPath(cx, cy, size);
  const heart = context.createRadialGradient(cx - size * 0.1, cy - size * 0.18, 0, cx, cy, size * 1.55);
  heart.addColorStop(0, "#43202b");
  heart.addColorStop(0.55, "#281118");
  heart.addColorStop(1, "#120b13");
  context.fillStyle = heart;
  context.fill(path);
  context.strokeStyle = "rgba(90,51,64,.7)";
  context.lineWidth = size * 0.045;
  context.stroke(path);

  const crackSets: Point[][] = [
    [{ x: -0.04, y: -0.72 }, { x: -0.13, y: -0.46 }, { x: 0.02, y: -0.18 }, { x: -0.11, y: 0.08 }, { x: 0.03, y: 0.34 }, { x: -0.07, y: 0.74 }],
    [{ x: -0.12, y: -0.42 }, { x: -0.34, y: -0.31 }, { x: -0.43, y: -0.09 }],
    [{ x: 0.02, y: -0.18 }, { x: 0.2, y: -0.05 }, { x: 0.3, y: 0.16 }],
    [{ x: 0.01, y: 0.36 }, { x: -0.16, y: 0.52 }, { x: -0.24, y: 0.71 }]
  ];
  context.save();
  context.shadowColor = `rgba(154,70,86,${0.3 + beat * 0.35})`;
  context.shadowBlur = size * 0.1;
  crackSets.forEach((points, index) => {
    context.beginPath();
    points.forEach((point, pointIndex) => {
      const x = cx + point.x * size;
      const y = cy + point.y * size;
      if (pointIndex === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.strokeStyle = index === 0 ? `rgba(219,197,199,${0.38 + beat * 0.16})` : `rgba(219,197,199,${0.24 + beat * 0.12})`;
    context.lineWidth = size * (index === 0 ? 0.018 : 0.012);
    context.stroke();
  });
  context.restore();

  particles.forEach((particle) => {
    const y = height * ((particle.y - time * particle.speed * 0.01 + 1) % 1);
    const x = width * (0.22 + particle.x * 0.56) + Math.sin(time * 0.12 + particle.phase) * width * 0.012;
    const distance = Math.hypot(x - cx, y - cy);
    if (distance < size * 1.8) {
      context.beginPath();
      context.arc(x, y, particle.radius, 0, TAU);
      context.fillStyle = `rgba(229,213,216,${particle.alpha * 0.32})`;
      context.fill();
    }
  });
  addVignette(context, width, height, 0.55);
}

export function ImmersiveThemeBackground({ variant }: { variant: ImmersiveThemeVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const stars = seededParticles(460, 90421);
    const beerBubbles = seededParticles(34, 7717);
    const beachSparkles = seededParticles(38, 4382);
    const dayDust = seededParticles(25, 1986);
    const rain = seededParticles(28, 1107);
    const heartParticles = seededParticles(18, 6212);
    const motion = { x: 0, y: 0 };
    const targetMotion = { x: 0, y: 0 };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 1;
    let height = 1;
    let frame = 0;
    let disposed = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const updatePointer = (event: PointerEvent) => {
      targetMotion.x = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      targetMotion.y = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    const updateOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null) targetMotion.x = Math.max(-1, Math.min(1, event.gamma / 28));
      if (event.beta !== null) targetMotion.y = Math.max(-1, Math.min(1, (event.beta - 45) / 35));
    };

    const render = (now: number) => {
      if (disposed) return;
      motion.x += (targetMotion.x - motion.x) * 0.045;
      motion.y += (targetMotion.y - motion.y) * 0.045;
      const time = now / 1000;
      context.clearRect(0, 0, width, height);
      switch (variant) {
        case "vodka": drawVodka(context, width, height, time, motion, stars); break;
        case "beer_bottle": drawBeer(context, width, height, time, motion, beerBubbles); break;
        case "camping_beach": drawCampingBeach(context, width, height, time, motion, beachSparkles); break;
        case "tomorrow_aftermath": drawDayAfter(context, width, height, time, motion, dayDust); break;
        case "closed_bar": drawClosedBar(context, width, height, time, motion, rain); break;
        case "broken_heart": drawBrokenHeart(context, width, height, time, motion, heartParticles); break;
      }
      if (!reduceMotion) frame = window.requestAnimationFrame(render);
    };

    const handleResize = () => {
      resize();
      if (reduceMotion) render(0);
    };
    const observer = "ResizeObserver" in window ? new ResizeObserver(handleResize) : null;
    if (observer) observer.observe(canvas);
    else window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("deviceorientation", updateOrientation, { passive: true });
    resize();
    render(0);

    return () => {
      disposed = true;
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("deviceorientation", updateOrientation);
      window.cancelAnimationFrame(frame);
    };
  }, [variant]);

  return (
    <div className={`immersive-background immersive-background-${variant}`} aria-hidden="true">
      <canvas ref={canvasRef} className="immersive-theme-canvas" />
    </div>
  );
}
