const blessings = [
  ["生", "愿生命里的每一次相逢，都给你带来温柔和力量。"],
  ["愿", "愿你新的一岁，所有奔赴都有回响。"],
  ["光", "愿你眼里有光，心里有热爱。"],
  ["甜", "愿今天的蛋糕很甜，明天的日子更甜。"],
  ["笑", "愿你总能被温柔相待，也总能放声大笑。"],
  ["梦", "愿你的梦想不只闪闪发亮，也一步步成真。"],
  ["日", "愿每一个普通日子，都藏着值得纪念的小星光。"],
  ["暖", "愿每一次疲惫之后，都有人和事给你暖意。"],
  ["喜", "愿惊喜常来，烦恼少来。"],
  ["顺", "愿你走的路顺，遇见的人真。"],
  ["星", "愿你像星星一样，自带方向也自带光芒。"],
  ["安", "愿你平安自在，睡得香，醒得有盼头。"],
  ["快", "愿快乐来得很快，烦恼走得更快。"],
  ["勇", "愿你有重新开始的勇气，也有慢慢来的从容。"],
  ["富", "愿快乐富足，银行卡和心情都很争气。"],
  ["花", "愿鲜花、掌声、好消息，都排队来找你。"],
  ["乐", "愿你生日快乐，不止生日。"],
  ["酷", "愿你保持可爱，也保持很酷。"],
  ["何", "愿何坤寰新的一岁，心中有山海，眼里有星河。"],
  ["闪", "愿你站在哪里，哪里就闪闪发亮。"],
  ["福", "愿福气多到装不下，烦心事少到想不起。"],
  ["欢", "愿今天的欢呼声，成为新一岁的开场音乐。"],
  ["晴", "愿你心里的天气，常常是晴。"],
  ["糖", "愿生活偶尔冒泡，天天都有一点糖。"],
  ["坤", "愿你脚踏厚土，心怀远方，稳稳走向更好的自己。"],
  ["家", "愿爱你的人都在身边，想见的人都能相见。"],
  ["旺", "愿你人气旺、运气旺、灵感也旺。"],
  ["彩", "愿普通日子也能长出彩虹。"],
  ["远", "愿你去很远的地方，也永远有人惦记。"],
  ["抱", "愿难过的时候，有一个刚刚好的拥抱。"],
  ["寰", "愿寰宇辽阔，万事可期，你所到之处皆有光。"],
  ["赢", "愿你赢得漂亮，也输得洒脱。"],
  ["新", "愿新的一岁，有新风景，也有老朋友。"],
  ["满", "愿愿望满格，快乐满杯。"],
  ["春", "愿你的世界四季有春，万物可亲。"],
  ["燃", "愿你继续热烈，继续发光，继续被爱。"]
];

const palette = ["#f6d58a", "#7bdff6", "#b88cff", "#ff9db5", "#8ee6c8", "#dff8ff", "#aeb8ff", "#f4b6ff"];
const stars = Array.from({ length: 140 }, (_, index) => {
  const seed = Math.sin(index * 127.1) * 10000;
  const seed2 = Math.sin(index * 311.7) * 10000;
  const seed3 = Math.sin(index * 71.3) * 10000;
  return {
    x: seed - Math.floor(seed),
    y: seed2 - Math.floor(seed2),
    size: 0.7 + (seed3 - Math.floor(seed3)) * 1.8,
    drift: 0.25 + ((seed + seed2) % 1) * 0.75,
    twinkle: index * 0.43
  };
});
const canvas = document.querySelector("#orbCanvas");
const ctx = canvas.getContext("2d");
const orbWrap = document.querySelector("#orbWrap");
const selectionCard = document.querySelector("#selectionCard");
const selectedGlyph = document.querySelector("#selectedGlyph");
const selectedMessage = document.querySelector("#selectedMessage");
const statusText = document.querySelector("#statusText");
const cameraButton = document.querySelector("#cameraButton");
const musicButton = document.querySelector("#musicButton");
const cameraFeed = document.querySelector("#cameraFeed");
const gestureCanvas = document.querySelector("#gestureCanvas");
const gestureLayer = document.querySelector("#gestureLayer");
const fingerDot = document.querySelector("#fingerDot");

const state = {
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  width: 0,
  height: 0,
  radius: 230,
  orientation: null,
  targetOrientation: null,
  dragStart: null,
  activeIndex: 0,
  pieces: [],
  projected: [],
  pointer: { x: 0, y: 0 },
  targetPointer: { x: 0, y: 0 },
  handLoop: null,
  handDetector: null,
  cameraStream: null,
  cameraOn: false,
  lastGesturePick: 0,
  lastFinger: null,
  detectingHands: false,
  audioContext: null,
  musicTimers: [],
  musicNodes: [],
  musicPlaying: false
};

function fibonacciSphere(count) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / (count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = goldenAngle * index;
    points.push({
      x: Math.cos(theta) * ring,
      y,
      z: Math.sin(theta) * ring
    });
  }

  return points;
}

function buildPieces(items = blessings) {
  state.pieces = fibonacciSphere(items.length).map((normal, index) => ({
    normal,
    glyph: items[index][0],
    message: items[index][1],
    lobes: 5 + (index % 4),
    color: palette[index % palette.length],
    phase: index * 0.71
  }));
  selectPiece(0, false);
}

function resize() {
  const rect = orbWrap.getBoundingClientRect();
  state.width = Math.max(320, rect.width);
  state.height = Math.max(360, rect.height);
  canvas.width = Math.round(state.width * state.dpr);
  canvas.height = Math.round(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  state.radius = Math.min(state.width, state.height) * 0.34;
}

function quatNormalize(q) {
  const length = Math.hypot(q.x, q.y, q.z, q.w) || 1;
  return { x: q.x / length, y: q.y / length, z: q.z / length, w: q.w / length };
}

function quatMultiply(a, b) {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
  };
}

function quatFromAxisAngle(axis, angle) {
  const half = angle / 2;
  const s = Math.sin(half);
  return quatNormalize({ x: axis.x * s, y: axis.y * s, z: axis.z * s, w: Math.cos(half) });
}

function quatFromUnitVectors(from, to) {
  const dot = from.x * to.x + from.y * to.y + from.z * to.z;
  if (dot < -0.999999) {
    const axis = Math.abs(from.x) > 0.1 ? { x: -from.y, y: from.x, z: 0 } : { x: 0, y: -from.z, z: from.y };
    return quatFromAxisAngle(quatNormalize({ ...axis, w: 0 }), Math.PI);
  }
  return quatNormalize({
    x: from.y * to.z - from.z * to.y,
    y: from.z * to.x - from.x * to.z,
    z: from.x * to.y - from.y * to.x,
    w: 1 + dot
  });
}

function quatSlerp(a, b, amount) {
  let cos = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  let target = b;
  if (cos < 0) {
    cos = -cos;
    target = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
  }
  if (cos > 0.9995) {
    return quatNormalize({
      x: a.x + (target.x - a.x) * amount,
      y: a.y + (target.y - a.y) * amount,
      z: a.z + (target.z - a.z) * amount,
      w: a.w + (target.w - a.w) * amount
    });
  }
  const theta = Math.acos(cos);
  const sinTheta = Math.sin(theta);
  const aScale = Math.sin((1 - amount) * theta) / sinTheta;
  const bScale = Math.sin(amount * theta) / sinTheta;
  return {
    x: a.x * aScale + target.x * bScale,
    y: a.y * aScale + target.y * bScale,
    z: a.z * aScale + target.z * bScale,
    w: a.w * aScale + target.w * bScale
  };
}

function applyQuat(point, q = state.orientation) {
  const x = point.x;
  const y = point.y;
  const z = point.z;
  const qx = q.x;
  const qy = q.y;
  const qz = q.z;
  const qw = q.w;
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;

  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx
  };
}

function trackballVector(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width - 0.5) * 2;
  const y = ((clientY - rect.top) / rect.height - 0.5) * 2;
  const length = x * x + y * y;
  const z = length > 1 ? 0 : Math.sqrt(1 - length);
  return quatNormalize({ x, y, z, w: 0 });
}

function rotate(point) {
  return applyQuat(point);
}

function centerPiece(index) {
  const piece = state.pieces[index];
  if (!piece) return;

  state.targetOrientation = quatFromUnitVectors(piece.normal, { x: 0, y: 0, z: 1 });
}

function project(point, lift = 0) {
  const camera = 3.25;
  const depth = camera - point.z;
  const scale = camera / depth;
  const centerX = state.width / 2 + state.pointer.x * 0.12;
  const centerY = state.height / 2 + state.pointer.y * 0.08;
  return {
    x: centerX + point.x * (state.radius + lift) * scale,
    y: centerY + point.y * (state.radius + lift) * scale,
    scale,
    depth: point.z
  };
}

function lighten(hex, amount) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (n & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function petalPoints(cx, cy, radius, lobes, angle, phase) {
  const total = lobes * 2;
  return Array.from({ length: total }, (_, index) => {
    const theta = angle + (Math.PI * 2 * index) / total;
    const wave = index % 2 === 0 ? 1.08 : 0.72;
    const organic = 1 + Math.sin(index * 1.7 + phase) * 0.07;
    const rx = radius * wave * organic;
    const ry = radius * (0.86 + Math.cos(phase) * 0.06) * wave;
    return [cx + Math.cos(theta) * rx, cy + Math.sin(theta) * ry];
  });
}

function drawSoftShape(points) {
  ctx.beginPath();
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const midX = (point[0] + next[0]) / 2;
    const midY = (point[1] + next[1]) / 2;
    if (index === 0) ctx.moveTo(midX, midY);
    ctx.quadraticCurveTo(next[0], next[1], (next[0] + points[(index + 2) % points.length][0]) / 2, (next[1] + points[(index + 2) % points.length][1]) / 2);
  });
  ctx.closePath();
}

function drawBackground(time) {
  ctx.clearRect(0, 0, state.width, state.height);

  const cx = state.width / 2 + state.pointer.x * 0.15;
  const cy = state.height / 2 + state.pointer.y * 0.12;
  const glow = ctx.createRadialGradient(cx, cy, state.radius * 0.18, cx, cy, state.radius * 1.22);
  glow.addColorStop(0, "rgba(123,223,246,0.22)");
  glow.addColorStop(0.42, "rgba(184,140,255,0.14)");
  glow.addColorStop(0.72, "rgba(246,213,138,0.08)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  stars.forEach((star) => {
    const x = (star.x * state.width + time * 0.006 * star.drift + state.pointer.x * 0.22) % state.width;
    const y = (star.y * state.height + time * 0.003 * star.drift + state.pointer.y * 0.18) % state.height;
    const alpha = 0.28 + Math.sin(time * 0.002 + star.twinkle) * 0.18;
    ctx.fillStyle = `rgba(235, 247, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.00008);
  ctx.strokeStyle = "rgba(123,223,246,0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, state.radius * (1.02 + i * 0.09), state.radius * (0.26 + i * 0.04), i * 0.44, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCore(time) {
  const cx = state.width / 2 + state.pointer.x * 0.12;
  const cy = state.height / 2 + state.pointer.y * 0.08;
  const pulse = 1 + Math.sin(time * 0.0017) * 0.02;
  const gradient = ctx.createRadialGradient(cx - state.radius * 0.25, cy - state.radius * 0.3, state.radius * 0.1, cx, cy, state.radius * 1.02);
  gradient.addColorStop(0, "rgba(255,255,255,0.2)");
  gradient.addColorStop(0.35, "rgba(123,223,246,0.12)");
  gradient.addColorStop(0.62, "rgba(184,140,255,0.1)");
  gradient.addColorStop(0.82, "rgba(246,213,138,0.06)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, state.radius * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(191,239,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, state.radius * 0.98, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPiece(piece, view, index, time) {
  const active = index === state.activeIndex;
  const lift = active ? 48 : 10 + Math.sin(time * 0.0018 + piece.phase) * 4;
  const projected = project(view, lift);
  const light = Math.max(0, view.x * -0.18 + view.y * -0.32 + view.z * 0.92);
  const shade = -18 + light * 72;
  const alpha = Math.max(0, Math.min(1, (view.z + 0.86) / 1.86));
  const size = state.radius * (active ? 0.17 : 0.118) * projected.scale * (1 + Math.sin(time * 0.002 + piece.phase) * 0.04);
  const angle = piece.phase + Math.atan2(view.x, view.z) * 0.42 + Math.sin(time * 0.0012 + piece.phase) * 0.18;
  const points = petalPoints(projected.x, projected.y, size, piece.lobes, angle, piece.phase);
  const thickness = Math.max(4, size * 0.14) * projected.scale;
  const sidePoints = petalPoints(projected.x + thickness, projected.y + thickness * 0.72, size * 0.98, piece.lobes, angle, piece.phase);

  ctx.globalAlpha = alpha;

  drawSoftShape(sidePoints);
  ctx.fillStyle = "rgba(74,35,38,0.3)";
  ctx.fill();

  drawSoftShape(points);
  const face = ctx.createRadialGradient(projected.x - size * 0.35, projected.y - size * 0.42, size * 0.12, projected.x, projected.y, size * 1.15);
  face.addColorStop(0, lighten(piece.color, Math.round(shade + 70)));
  face.addColorStop(0.42, lighten(piece.color, Math.round(shade + 14)));
  face.addColorStop(1, lighten(piece.color, Math.round(shade - 24)));
  ctx.fillStyle = face;
  ctx.fill();

  ctx.strokeStyle = active ? "rgba(223,248,255,0.95)" : "rgba(191,239,255,0.34)";
  ctx.lineWidth = active ? 2 : 0.9;
  ctx.stroke();

  ctx.save();
  drawSoftShape(points);
  ctx.clip();
  const shine = ctx.createLinearGradient(projected.x - size, projected.y - size, projected.x + size, projected.y);
  shine.addColorStop(0, "rgba(255,255,255,0)");
  shine.addColorStop(0.48, `rgba(255,255,255,${active ? 0.36 : 0.18})`);
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(projected.x - size, projected.y - size, size * 2, size * 2);
  ctx.restore();

  if (active) {
    ctx.save();
    drawSoftShape(points);
    ctx.shadowColor = "rgba(123,223,246,0.7)";
    ctx.shadowBlur = 30;
    ctx.strokeStyle = "rgba(223,248,255,0.88)";
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = "rgba(8,17,31,0.9)";
  ctx.font = `${Math.max(18, size * 0.66)}px Microsoft YaHei, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(piece.glyph, projected.x, projected.y + 1);
  ctx.globalAlpha = 1;

  state.projected[index] = {
    x: projected.x,
    y: projected.y,
    z: view.z,
    radius: size * 1.05,
    visible: view.z > -0.72
  };
}

function render(time = 0) {
  const orientationEase = state.cameraOn ? 0.34 : 0.13;
  const pointerEase = state.cameraOn ? 0.28 : 0.08;
  state.orientation = quatSlerp(state.orientation, state.targetOrientation, orientationEase);
  state.pointer.x += (state.targetPointer.x - state.pointer.x) * pointerEase;
  state.pointer.y += (state.targetPointer.y - state.pointer.y) * pointerEase;

  drawBackground(time);
  drawCore(time);

  const views = state.pieces
    .map((piece, index) => ({ piece, index, view: rotate(piece.normal) }))
    .sort((a, b) => a.view.z - b.view.z);

  state.projected = [];
  views.forEach(({ piece, index, view }) => {
    if (view.z > -0.84 || index === state.activeIndex) {
      drawPiece(piece, view, index, time);
    }
  });

  requestAnimationFrame(render);
}

function selectPiece(index, pop = true, center = false) {
  const piece = state.pieces[index];
  if (!piece) return;
  state.activeIndex = index;
  if (center) centerPiece(index);
  selectedGlyph.textContent = piece.glyph;
  selectedMessage.textContent = piece.message;
  selectionCard.classList.add("is-visible");
  if (pop) {
    selectionCard.classList.remove("is-popping");
    requestAnimationFrame(() => {
      selectionCard.classList.add("is-popping");
      window.setTimeout(() => selectionCard.classList.remove("is-popping"), 180);
    });
  }
}

function nearestPiece(x, y, maxDistance = 58) {
  let nearest = -1;
  let nearestDistance = Infinity;
  state.projected.forEach((point, index) => {
    if (!point?.visible) return;
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < nearestDistance && distance < Math.max(maxDistance, point.radius)) {
      nearest = index;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function localPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function updatePointer(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  state.targetPointer.x = ((clientX - rect.left) / rect.width - 0.5) * 56;
  state.targetPointer.y = ((clientY - rect.top) / rect.height - 0.5) * 56;
}

canvas.addEventListener("pointerdown", (event) => {
  const point = localPoint(event);
  state.dragStart = {
    clientX: event.clientX,
    clientY: event.clientY,
    localX: point.x,
    localY: point.y,
    moved: false,
    vector: trackballVector(event.clientX, event.clientY),
    orientation: state.targetOrientation
  };
  updatePointer(event.clientX, event.clientY);
  canvas.setPointerCapture(event.pointerId);
  orbWrap.classList.add("dragging");
});

canvas.addEventListener("pointermove", (event) => {
  updatePointer(event.clientX, event.clientY);
  const point = localPoint(event);
  if (state.dragStart) {
    const dx = event.clientX - state.dragStart.clientX;
    const dy = event.clientY - state.dragStart.clientY;
    if (Math.hypot(dx, dy) > 6) state.dragStart.moved = true;
    const currentVector = trackballVector(event.clientX, event.clientY);
    const delta = quatFromUnitVectors(state.dragStart.vector, currentVector);
    state.targetOrientation = quatMultiply(delta, state.dragStart.orientation);
    return;
  }
  const pick = nearestPiece(point.x, point.y, 54);
  if (pick >= 0) selectPiece(pick, false);
});

canvas.addEventListener("pointerup", (event) => {
  if (state.dragStart && !state.dragStart.moved) {
    const pick = nearestPiece(state.dragStart.localX, state.dragStart.localY, 76);
    if (pick >= 0) selectPiece(pick, true, true);
  }
  state.dragStart = null;
  orbWrap.classList.remove("dragging");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointercancel", () => {
  state.dragStart = null;
  orbWrap.classList.remove("dragging");
});

function stopBirthdaySong() {
  state.musicTimers.forEach((timer) => window.clearTimeout(timer));
  state.musicTimers = [];
  if (state.audioContext) {
    const now = state.audioContext.currentTime;
    state.musicNodes.forEach(({ oscillator, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value || 0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        oscillator.stop(now + 0.05);
      } catch (error) {
        // Already stopped nodes can be ignored.
      }
    });
  }
  state.musicNodes = [];
  state.musicPlaying = false;
  musicButton.classList.remove("is-on");
  musicButton.setAttribute("aria-label", "播放生日快乐歌");
  musicButton.setAttribute("title", "播放生日快乐歌");
}

function playTone(frequency, startTime, duration) {
  const context = state.audioContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
  state.musicNodes.push({ oscillator, gain });
  oscillator.addEventListener("ended", () => {
    state.musicNodes = state.musicNodes.filter((node) => node.oscillator !== oscillator);
  });
}

function playBirthdaySong() {
  if (state.musicPlaying) {
    stopBirthdaySong();
    statusText.textContent = "音乐已暂停。";
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    statusText.textContent = "这个浏览器暂不支持播放音乐。";
    return;
  }

  state.audioContext ||= new AudioContext();
  state.audioContext.resume();
  stopBirthdaySong();
  state.musicPlaying = true;
  musicButton.classList.add("is-on");
  musicButton.setAttribute("aria-label", "暂停生日快乐歌");
  musicButton.setAttribute("title", "暂停生日快乐歌");
  statusText.textContent = "生日快乐歌播放中。";

  const notes = [
    ["G4", 0.32], ["G4", 0.32], ["A4", 0.64], ["G4", 0.64], ["C5", 0.64], ["B4", 1.2],
    ["G4", 0.32], ["G4", 0.32], ["A4", 0.64], ["G4", 0.64], ["D5", 0.64], ["C5", 1.2],
    ["G4", 0.32], ["G4", 0.32], ["G5", 0.64], ["E5", 0.64], ["C5", 0.64], ["B4", 0.64], ["A4", 1.2],
    ["F5", 0.32], ["F5", 0.32], ["E5", 0.64], ["C5", 0.64], ["D5", 0.64], ["C5", 1.4]
  ];
  const frequencies = {
    G4: 392,
    A4: 440,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99
  };

  let cursor = state.audioContext.currentTime + 0.04;
  notes.forEach(([note, duration]) => {
    playTone(frequencies[note], cursor, duration * 0.86);
    cursor += duration;
  });

  const totalMs = Math.max(0, (cursor - state.audioContext.currentTime) * 1000);
  state.musicTimers.push(window.setTimeout(() => {
    stopBirthdaySong();
    playBirthdaySong();
  }, totalMs + 260));
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

async function ensureHandpose() {
  if (window.handpose) return;
  await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.22.0/dist/tf-core.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.22.0/dist/tf-converter.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.22.0/dist/tf-backend-webgl.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose@0.0.7/dist/handpose.min.js");
}

async function startCameraGesture() {
  if (state.cameraOn) {
    stopCameraGesture();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    statusText.textContent = "这个浏览器不支持摄像头手势，仍可用鼠标或触控选择。";
    return;
  }

  try {
    statusText.textContent = "正在加载手势识别...";
    await ensureHandpose();
    state.handDetector = await window.handpose.load();
    state.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 320, max: 480 },
        height: { ideal: 240, max: 360 },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: false
    });
    cameraFeed.srcObject = state.cameraStream;
    await cameraFeed.play();
    state.cameraOn = true;
    cameraButton.classList.add("is-on");
    gestureLayer.classList.add("is-on");
    fingerDot.classList.add("is-on");
    state.lastFinger = null;
    statusText.textContent = "手势已开启：移动食指旋转星体，靠近祝福片即可选中。";
    detectHands();
  } catch (error) {
    statusText.textContent = "摄像头或手势模型暂时不可用，可以继续用鼠标/触控选择。";
    stopCameraGesture();
  }
}

function stopCameraGesture() {
  state.cameraOn = false;
  state.lastFinger = null;
  state.detectingHands = false;
  cameraButton.classList.remove("is-on");
  gestureLayer.classList.remove("is-on");
  fingerDot.classList.remove("is-on");
  if (state.handLoop) cancelAnimationFrame(state.handLoop);
  state.handLoop = null;
  if (state.cameraStream) state.cameraStream.getTracks().forEach((track) => track.stop());
  state.cameraStream = null;
  cameraFeed.srcObject = null;
  statusText.textContent = "手势已关闭，拖拽或点击继续互动。";
}

async function detectHands() {
  if (!state.cameraOn || !state.handDetector) return;
  if (state.detectingHands) {
    state.handLoop = requestAnimationFrame(detectHands);
    return;
  }
  state.detectingHands = true;
  const videoWidth = cameraFeed.videoWidth || 320;
  const videoHeight = cameraFeed.videoHeight || 240;

  try {
    const predictions = await state.handDetector.estimateHands(cameraFeed);
    if (predictions[0]?.landmarks?.[8]) {
      const [rawX, rawY] = predictions[0].landmarks[8];
      const mirroredX = videoWidth - rawX;
      const stageRect = canvas.getBoundingClientRect();
      const normalizedX = mirroredX / videoWidth;
      const normalizedY = rawY / videoHeight;
      const screenX = stageRect.left + normalizedX * stageRect.width;
      const screenY = stageRect.top + normalizedY * stageRect.height;
      const localX = normalizedX * state.width;
      const localY = normalizedY * state.height;

      fingerDot.style.left = `${screenX}px`;
      fingerDot.style.top = `${screenY}px`;
      updatePointer(screenX, screenY);

      if (state.lastFinger) {
        const dx = normalizedX - state.lastFinger.x;
        const dy = normalizedY - state.lastFinger.y;
        if (Math.abs(dx) + Math.abs(dy) < 0.22) {
          const xTurn = quatFromAxisAngle({ x: 0, y: 1, z: 0 }, -dx * 2.7);
          const yTurn = quatFromAxisAngle({ x: 1, y: 0, z: 0 }, -dy * 2.7);
          state.targetOrientation = quatMultiply(yTurn, quatMultiply(xTurn, state.targetOrientation));
        }
      }
      state.lastFinger = { x: normalizedX, y: normalizedY };

      const pick = nearestPiece(localX, localY, 82);
      if (pick >= 0 && performance.now() - state.lastGesturePick > 260) {
        selectPiece(pick, true, true);
        state.lastGesturePick = performance.now();
      }
    } else {
      state.lastFinger = null;
    }
  } catch (error) {
    statusText.textContent = "手势识别中断了，鼠标/触控仍然可用。";
  } finally {
    state.detectingHands = false;
  }
  state.handLoop = requestAnimationFrame(detectHands);
}

cameraButton.addEventListener("click", startCameraGesture);
musicButton.addEventListener("click", playBirthdaySong);
window.addEventListener("resize", resize);

resize();
state.orientation = quatMultiply(
  quatFromAxisAngle({ x: 0, y: 1, z: 0 }, 0.4),
  quatFromAxisAngle({ x: 1, y: 0, z: 0 }, -0.24)
);
state.targetOrientation = state.orientation;
buildPieces();
requestAnimationFrame(render);
