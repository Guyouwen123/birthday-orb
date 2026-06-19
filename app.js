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

const colors = ["#ff6f91", "#ffd166", "#70e1b5", "#55d5f6", "#f4a261", "#a7c957", "#f78c6b", "#b8f2e6"];

const orb = document.querySelector("#orb");
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
  rotationX: -0.28,
  rotationY: 0.35,
  velocityX: 0,
  velocityY: 0.006,
  radius: 230,
  activeIndex: 0,
  dragging: false,
  lastPointer: { x: 0, y: 0 },
  tiles: [],
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
    const radius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * index;
    points.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius
    });
  }

  return points;
}

function buildOrb(items = blessings) {
  orb.innerHTML = "";
  const points = fibonacciSphere(items.length);
  state.tiles = points.map((point, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `tile ${index % 5 === 0 ? "pent" : "hex"}`;
    tile.textContent = items[index][0];
    tile.dataset.message = items[index][1];
    tile.dataset.glyph = items[index][0];
    tile.style.setProperty("--tile-color", colors[index % colors.length]);
    tile.addEventListener("click", () => selectTile(index, true));
    tile.addEventListener("pointerenter", () => selectTile(index, false));
    orb.append(tile);
    return { element: tile, point, screenX: 0, screenY: 0, visible: true };
  });
  selectTile(0, false);
}

function rotatePoint(point) {
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

function renderOrb() {
  const rect = orb.getBoundingClientRect();
  state.radius = Math.min(rect.width, rect.height) * 0.42;

  state.tiles.forEach((tile, index) => {
    const rotated = rotatePoint(tile.point);
    const perspective = 1 / (1.72 - rotated.z * 0.58);
    const size = Math.max(42, Math.min(74, rect.width * 0.118));
    const x = rotated.x * state.radius * perspective;
    const y = rotated.y * state.radius * perspective;
    const depthScale = 0.62 + perspective * 0.58;
    const visible = rotated.z > -0.78;

    tile.screenX = rect.left + rect.width / 2 + x;
    tile.screenY = rect.top + rect.height / 2 + y;
    tile.visible = visible;
    tile.element.style.setProperty("--x", x - size / 2);
    tile.element.style.setProperty("--y", y - size / 2);
    tile.element.style.setProperty("--scale", depthScale);
    tile.element.style.setProperty("--tile-size", `${size}px`);
    tile.element.style.setProperty("--z", Math.round((rotated.z + 1) * 200));
    tile.element.classList.toggle("is-hidden", !visible);
    tile.element.classList.toggle("is-active", index === state.activeIndex);
    tile.element.classList.toggle("is-dim", index !== state.activeIndex && rotated.z < -0.12);
    tile.element.style.opacity = visible ? String(0.42 + perspective * 0.42) : "0";
  });
}

function animate() {
  if (!state.dragging) {
    state.rotationX += state.velocityX;
    state.rotationY += state.velocityY;
    state.velocityX *= 0.96;
    state.velocityY = state.velocityY * 0.96 + 0.006 * 0.04;
  }
  renderOrb();
  requestAnimationFrame(animate);
}

function selectTile(index, settleVelocity) {
  const tile = state.tiles[index];
  if (!tile || !tile.visible) return;

  state.activeIndex = index;
  selectedGlyph.textContent = tile.element.dataset.glyph;
  selectedMessage.textContent = tile.element.dataset.message;
  selectionCard.classList.add("is-visible");

  if (settleVelocity) {
    state.velocityX *= 0.4;
    state.velocityY *= 0.4;
  }
}

function findNearestTile(x, y, maxDistance = 72) {
  let nearestIndex = -1;
  let nearestDistance = Infinity;

  state.tiles.forEach((tile, index) => {
    if (!tile.visible) return;
    const distance = Math.hypot(tile.screenX - x, tile.screenY - y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestDistance <= maxDistance ? nearestIndex : -1;
}

function onPointerDown(event) {
  state.dragging = true;
  state.lastPointer.x = event.clientX;
  state.lastPointer.y = event.clientY;
  state.velocityX = 0;
  state.velocityY = 0;
  orbWrap.classList.add("dragging");
  orbWrap.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!state.dragging) {
    const nearest = findNearestTile(event.clientX, event.clientY, 54);
    if (nearest >= 0) selectTile(nearest, false);
    return;
  }

  const dx = event.clientX - state.lastPointer.x;
  const dy = event.clientY - state.lastPointer.y;
  state.rotationY += dx * 0.008;
  state.rotationX -= dy * 0.008;
  state.rotationX = Math.max(-1.35, Math.min(1.35, state.rotationX));
  state.velocityY = dx * 0.0008;
  state.velocityX = -dy * 0.0008;
  state.lastPointer.x = event.clientX;
  state.lastPointer.y = event.clientY;
}

function onPointerUp(event) {
  state.dragging = false;
  orbWrap.classList.remove("dragging");
  if (orbWrap.hasPointerCapture(event.pointerId)) {
    orbWrap.releasePointerCapture(event.pointerId);
  }
}

function shuffleBlessings() {
  const mixed = [...blessings].sort(() => Math.random() - 0.5);
  buildOrb(mixed);
  statusText.textContent = "祝福已经重新排布。";
  state.velocityY = 0.016;
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
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach((track) => track.stop());
  }
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
      const cameraRect = gestureLayer.getBoundingClientRect();
      const stageRect = orbWrap.getBoundingClientRect();
      const normalizedX = mirroredX / gestureCanvas.width;
      const normalizedY = rawY / gestureCanvas.height;
      const screenX = stageRect.left + normalizedX * stageRect.width;
      const screenY = stageRect.top + normalizedY * stageRect.height;

      fingerDot.style.left = `${screenX}px`;
      fingerDot.style.top = `${screenY}px`;
      context.fillStyle = "#ffd166";
      context.beginPath();
      context.arc(mirroredX, rawY, 10, 0, Math.PI * 2);
      context.fill();

      const nearest = findNearestTile(screenX, screenY, 86);
      if (nearest >= 0 && performance.now() - state.lastGesturePick > 180) {
        selectTile(nearest, true);
        state.lastGesturePick = performance.now();
      }

      const centerOffset = (normalizedX - 0.5) * 0.012;
      state.velocityY = state.velocityY * 0.82 + centerOffset;
      void cameraRect;
    }
  } catch (error) {
    statusText.textContent = "手势识别中断了，鼠标/触控仍然可用。";
  }

  state.handLoop = requestAnimationFrame(detectHands);
}

orbWrap.addEventListener("pointerdown", onPointerDown);
orbWrap.addEventListener("pointermove", onPointerMove);
orbWrap.addEventListener("pointerup", onPointerUp);
orbWrap.addEventListener("pointercancel", onPointerUp);
shuffleButton.addEventListener("click", shuffleBlessings);
cameraButton.addEventListener("click", startCameraGesture);
window.addEventListener("resize", renderOrb);

buildOrb();
animate();
