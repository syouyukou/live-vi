import { defaultBezierAnchors, sampleBezierAnchors, resolveHandles } from "./bezier-path.js";

function anchorsToSvgD(anchors) {
  if (anchors.length < 2) return "";
  const parts = [`M ${anchors[0].x.toFixed(2)} ${(-anchors[0].y).toFixed(2)}`];
  for (let i = 0; i < anchors.length - 1; i++) {
    const { p1, p2, p3 } = resolveHandles(anchors, i);
    parts.push(
      `C ${p1.x.toFixed(2)} ${(-p1.y).toFixed(2)}, ${p2.x.toFixed(2)} ${(-p2.y).toFixed(2)}, ${p3.x.toFixed(2)} ${(-p3.y).toFixed(2)}`,
    );
  }
  return parts.join(" ");
}

export function createPathEditor({ overlay, getBounds, screenToWorld, onChange }) {
  let active = false;
  let anchors = defaultBezierAnchors();
  let selected = 0;
  let drag = null;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("path-editor-svg");
  const gCurve = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const gHandles = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const gPoints = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.append(gCurve, gHandles, gPoints);
  overlay.appendChild(svg);

  const push = () => onChange(sampleBezierAnchors(anchors, 56));

  function draw() {
    const { left, right, top, bottom } = getBounds();
    svg.setAttribute("viewBox", `${left} ${-top} ${right - left} ${top - bottom}`);
    gCurve.innerHTML = gHandles.innerHTML = gPoints.innerHTML = "";
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", anchorsToSvgD(anchors));
    path.setAttribute("class", "path-editor-curve");
    gCurve.appendChild(path);

    anchors.forEach((a, i) => {
      if (a.hOut && i < anchors.length - 1) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", a.x);
        line.setAttribute("y1", -a.y);
        line.setAttribute("x2", a.hOut.x);
        line.setAttribute("y2", -a.hOut.y);
        line.setAttribute("class", "path-editor-handle-line");
        gHandles.appendChild(line);
      }
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", a.x);
      dot.setAttribute("cy", -a.y);
      dot.setAttribute("r", i === selected ? 9 : 7);
      dot.setAttribute("class", "path-editor-anchor");
      dot.dataset.i = String(i);
      dot.dataset.kind = "anchor";
      gPoints.appendChild(dot);
    });
  }

  function pick(cx, cy) {
    let best = null;
    let bestD = 14;
    anchors.forEach((a, i) => {
      const rect = svg.getBoundingClientRect();
      const wx = a.x;
      const wy = -a.y;
      const sx = rect.left + ((wx - getBounds().left) / (getBounds().right - getBounds().left)) * rect.width;
      const sy = rect.top + ((wy - -getBounds().top) / (-getBounds().bottom - -getBounds().top)) * rect.height;
      const d = Math.hypot(sx - cx, sy - cy);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  overlay.addEventListener("pointerdown", (e) => {
    if (!active) return;
    e.stopPropagation();
    overlay.setPointerCapture(e.pointerId);
    const hit = pick(e.clientX, e.clientY);
    if (hit !== null) {
      selected = hit;
      drag = { i: hit };
    } else {
      const w = screenToWorld(e.clientX, e.clientY);
      anchors.push({ x: w.x, y: w.y, hOut: { x: w.x + 30, y: w.y } });
      selected = anchors.length - 1;
      drag = { i: selected };
    }
    draw();
    push();
  });

  overlay.addEventListener("pointermove", (e) => {
    if (!active || !drag) return;
    const w = screenToWorld(e.clientX, e.clientY);
    const a = anchors[drag.i];
    const dx = w.x - a.x;
    const dy = w.y - a.y;
    a.x = w.x;
    a.y = w.y;
    if (a.hIn) {
      a.hIn.x += dx;
      a.hIn.y += dy;
    }
    if (a.hOut) {
      a.hOut.x += dx;
      a.hOut.y += dy;
    }
    draw();
    push();
  });

  overlay.addEventListener("pointerup", () => {
    drag = null;
  });

  return {
    setActive(v) {
      active = v;
      overlay.hidden = !v;
      if (v) {
        draw();
        push();
      }
    },
    isActive: () => active,
    redraw: draw,
    reset: () => {
      anchors = defaultBezierAnchors();
      draw();
      push();
    },
    exportSvg: () => {
      const d = anchorsToSvgD(anchors);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-250 -150 500 300"><path fill="none" stroke="#000" d="${d}"/></svg>`;
    },
  };
}
