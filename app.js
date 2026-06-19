const blessings = [
  ["愿", "愿你新的一岁，所有奔赴都有回响。"],
  ["光", "愿你眼里有光，心里有热爱。"],
  ["甜", "愿今天的蛋糕很甜，明天的日子更甜。"],
  ["笑", "愿你总能被温柔相待，也总能放声大笑。"],
  ["梦", "愿你的梦想不只闪闪发亮，也一步步成真。"],
  ["暖", "愿每一次疲惫之后，都有人和事给你暖意。"],
  ["喜", "愿惊喜常来，烦恼少来。"],
  ["顺", "愿你走的路顺，遇见的人真。"],
  ["星", "愿你像星星一样，自带方向也自带光芒。"],
  ["安", "愿你平安自在，睡得香，醒得有盼头。"],
  ["勇", "愿你有重新开始的勇气，也有慢慢来的从容。"],
  ["富", "愿快乐富足，银行卡和心情都很争气。"],
  ["花", "愿鲜花、掌声、好消息，都排队来找你。"],
  ["乐", "愿你生日快乐，不止生日。"],
  ["酷", "愿你保持可爱，也保持很酷。"],
  ["闪", "愿你站在哪里，哪里就闪闪发亮。"],
  ["福", "愿福气多到装不下，烦心事少到想不起。"],
  ["欢", "愿今天的欢呼声，成为新一岁的开场音乐。"],
  ["晴", "愿你心里的天气，常常是晴。"],
  ["糖", "愿生活偶尔冒泡，天天都有一点糖。"],
  ["家", "愿爱你的人都在身边，想见的人都能相见。"],
  ["旺", "愿你人气旺、运气旺、灵感也旺。"],
  ["彩", "愿普通日子也能长出彩虹。"],
  ["远", "愿你去很远的地方，也永远有人惦记。"],
  ["抱", "愿难过的时候，有一个刚刚好的拥抱。"],
  ["赢", "愿你赢得漂亮，也输得洒脱。"],
  ["新", "愿新的一岁，有新风景，也有老朋友。"],
  ["满", "愿愿望满格，快乐满杯。"],
  ["春", "愿你的世界四季有春，万物可亲。"],
  ["燃", "愿你继续热烈，继续发光，继续被爱。"]
];

const palette = ["#d9b56f", "#aeb9c7", "#c98c4a", "#758da4", "#d5c4a4", "#93a783", "#b97861", "#8693ad"];
const canvas = document.querySelector("#orbCanvas");
const ctx = canvas.getContext("2d");
const orbWrap = document.querySelector("#orbWrap");
const selectionCard = document.querySelector("#selectionCard");
const selectedGlyph = document.querySelector("#selectedGlyph");
const selectedMessage = document.querySelector("#selectedMessage");
const statusText = document.querySelector("#statusText");
const cameraButton = document.querySelector("#cameraButton");
const shuffleButton = document.querySelector("#shuffleButton");
const cameraFeed = document.querySelector("#cameraFeed");
const gestureCanvas = document.querySelector("#gestureCanvas");
const gestureLayer = document.querySelector("#gestureLayer");
const fingerDot = document.querySelector("#fingerDot");

const state = {
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  width: 0,
  height: 0,
  radius: 230,
  rotationX: -0.24,
  rotationY: 0.4,
  targetX: -0.24,
  targetY: 0.4,
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
  lastGesturePick: 0
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
    sides: index % 5 === 0 ? 5 : 6,
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

function rotate(point) {
  const cosY = Math.cos(state.rotationY);
  const sinY = Math.sin(state.rotationY);
  const cosX = Math.cos(state.rotationX);
  const sinX = Math.sin(state.rotationX);
  const x1 = point.x * cosY - point.z * sinY;
  const z1 = point.x * sinY + point.z * cosY;
  const y1 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;
  return { x: x1, y: y1, z: z2 };
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

function polygonPoints(cx, cy, radius, sides, angle) {
  return Array.from({ length: sides }, (_, index) => {
    const theta = angle + (Math.PI * 2 * index) / sides;
    return [cx + Math.cos(theta) * radius, cy + Math.sin(theta) * radius];
  });
}

function drawPolygon(points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawBackground(time) {
  ctx.clearRect(0, 0, state.width, state.height);

  const cx = state.width / 2 + state.pointer.x * 0.15;
  const cy = state.height / 2 + state.pointer.y * 0.12;
  const glow = ctx.createRadialGradient(cx, cy, state.radius * 0.18, cx, cy, state.radius * 1.22);
  glow.addColorStop(0, "rgba(217,181,111,0.16)");
  glow.addColorStop(0.48, "rgba(95,116,142,0.08)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.00008);
  ctx.strokeStyle = "rgba(217,181,111,0.13)";
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
  gradient.addColorStop(0, "rgba(255,255,255,0.18)");
  gradient.addColorStop(0.38, "rgba(217,181,111,0.08)");
  gradient.addColorStop(0.7, "rgba(83,98,117,0.06)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, state.radius * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(246,225,181,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, state.radius * 0.98, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPiece(piece, view, index, time) {
  const active = index === state.activeIndex;
  const lift = active ? 42 : 8;
  const projected = project(view, lift);
  const light = Math.max(0, view.x * -0.25 + view.y * -0.34 + view.z * 0.92);
  const shade = -42 + light * 88;
  const alpha = Math.max(0, Math.min(1, (view.z + 0.86) / 1.86));
  const size = state.radius * (active ? 0.18 : 0.128) * projected.scale;
  const angle = piece.phase + state.rotationY * 0.5 + time * 0.00018;
  const points = polygonPoints(projected.x, projected.y, size, piece.sides, angle);
  const thickness = Math.max(5, size * 0.18) * projected.scale;
  const sidePoints = polygonPoints(projected.x + thickness, projected.y + thickness, size, piece.sides, angle);

  ctx.globalAlpha = alpha;

  drawPolygon(sidePoints);
  ctx.fillStyle = "rgba(10,12,16,0.56)";
  ctx.fill();

  drawPolygon(points);
  const face = ctx.createLinearGradient(projected.x - size, projected.y - size, projected.x + size, projected.y + size);
  face.addColorStop(0, lighten(piece.color, Math.round(shade + 50)));
  face.addColorStop(0.48, lighten(piece.color, Math.round(shade)));
  face.addColorStop(1, lighten(piece.color, Math.round(shade - 34)));
  ctx.fillStyle = face;
  ctx.fill();

  ctx.strokeStyle = active ? "rgba(255,232,181,0.92)" : "rgba(255,244,218,0.32)";
  ctx.lineWidth = active ? 2.2 : 1;
  ctx.stroke();

  if (active) {
    ctx.save();
    drawPolygon(points);
    ctx.shadowColor = "rgba(217,181,111,0.72)";
    ctx.shadowBlur = 26;
    ctx.strokeStyle = "rgba(255,232,181,0.84)";
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = "rgba(24,17,11,0.92)";
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
  state.rotationX += (state.targetX - state.rotationX) * 0.12;
  state.rotationY += (state.targetY - state.rotationY) * 0.12;
  state.pointer.x += (state.targetPointer.x - state.pointer.x) * 0.08;
  state.pointer.y += (state.targetPointer.y - state.pointer.y) * 0.08;

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

function selectPiece(index, pop = true) {
  const piece = state.pieces[index];
  if (!piece) return;
  state.activeIndex = index;
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
    rotationX: state.targetX,
    rotationY: state.targetY
  };
  updatePointer(event.clientX, event.clientY);
  canvas.setPointerCapture(event.pointerId);
  orbWrap.classList.add("dragging");
  const pick = nearestPiece(point.x, point.y, 70);
  if (pick >= 0) selectPiece(pick);
});

canvas.addEventListener("pointermove", (event) => {
  updatePointer(event.clientX, event.clientY);
  const point = localPoint(event);
  if (state.dragStart) {
    const dx = event.clientX - state.dragStart.clientX;
    const dy = event.clientY - state.dragStart.clientY;
    state.targetY = state.dragStart.rotationY + dx * 0.009;
    state.targetX = Math.max(-1.22, Math.min(1.22, state.dragStart.rotationX - dy * 0.009));
    return;
  }
  const pick = nearestPiece(point.x, point.y, 54);
  if (pick >= 0) selectPiece(pick, false);
});

canvas.addEventListener("pointerup", (event) => {
  state.dragStart = null;
  orbWrap.classList.remove("dragging");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointercancel", () => {
  state.dragStart = null;
  orbWrap.classList.remove("dragging");
});

shuffleButton.addEventListener("click", () => {
  buildPieces([...blessings].sort(() => Math.random() - 0.5));
  statusText.textContent = "祝福已经重新排布。";
});

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
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false
    });
    cameraFeed.srcObject = state.cameraStream;
    await cameraFeed.play();
    state.cameraOn = true;
    cameraButton.classList.add("is-on");
    gestureLayer.classList.add("is-on");
    fingerDot.classList.add("is-on");
    statusText.textContent = "手势已开启：用食指靠近某个祝福片。";
    detectHands();
  } catch (error) {
    statusText.textContent = "摄像头或手势模型暂时不可用，可以继续用鼠标/触控选择。";
    stopCameraGesture();
  }
}

function stopCameraGesture() {
  state.cameraOn = false;
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
  const context = gestureCanvas.getContext("2d");
  gestureCanvas.width = cameraFeed.videoWidth || 640;
  gestureCanvas.height = cameraFeed.videoHeight || 480;

  try {
    const predictions = await state.handDetector.estimateHands(cameraFeed);
    context.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
    if (predictions[0]?.landmarks?.[8]) {
      const [rawX, rawY] = predictions[0].landmarks[8];
      const mirroredX = gestureCanvas.width - rawX;
      const stageRect = canvas.getBoundingClientRect();
      const normalizedX = mirroredX / gestureCanvas.width;
      const normalizedY = rawY / gestureCanvas.height;
      const screenX = stageRect.left + normalizedX * stageRect.width;
      const screenY = stageRect.top + normalizedY * stageRect.height;
      const localX = normalizedX * state.width;
      const localY = normalizedY * state.height;

      fingerDot.style.left = `${screenX}px`;
      fingerDot.style.top = `${screenY}px`;
      updatePointer(screenX, screenY);

      context.fillStyle = "#d9b56f";
      context.beginPath();
      context.arc(mirroredX, rawY, 10, 0, Math.PI * 2);
      context.fill();

      const pick = nearestPiece(localX, localY, 82);
      if (pick >= 0 && performance.now() - state.lastGesturePick > 170) {
        selectPiece(pick);
        state.lastGesturePick = performance.now();
      }
    }
  } catch (error) {
    statusText.textContent = "手势识别中断了，鼠标/触控仍然可用。";
  }
  state.handLoop = requestAnimationFrame(detectHands);
}

cameraButton.addEventListener("click", startCameraGesture);
window.addEventListener("resize", resize);

resize();
buildPieces();
requestAnimationFrame(render);
