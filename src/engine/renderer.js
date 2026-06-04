import * as THREE from "three";
import { deformPolyline } from "./deform.js";
import { samplePlacements } from "./sampler.js";
import { instanceAngle, instanceScales, lerpAngle } from "./instance-modifiers.js";
import { getMaterialColor } from "./color-modes.js";
import { parseUnitSvg } from "./unit.js";

export class ViRenderer {
  /** @param {HTMLElement} host */
  constructor(host) {
    this.host = host;
    this.params = null;
    /** @type {import("./path.js").PathGroup[]} */
    this.pathGroups = [];
    /** @type {import("./unit.js").UnitShape | null} */
    this.unitShape = null;
    /** @type {import("./unit.js").UnitShape | null} */
    this.unitShapeB = null;
    this.time = 0;
    this.structureDirty = true;

    this.mouse = {
      active: false,
      world: new THREE.Vector3(),
      target: new THREE.Vector3(),
      direction: 0,
      directionValid: false,
    };
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(this.renderer.domElement);

    this.contentGroup = new THREE.Group();
    this.scene.add(this.contentGroup);
    /** @type {THREE.InstancedMesh[]} */
    this.instanceLayers = [];
    this.dummy = new THREE.Object3D();
  }

  setParams(params) {
    this.params = params;
    if (params) this.scene.background = new THREE.Color(params.bgColor);
  }

  setPaths(groups) {
    this.pathGroups = groups;
    this.structureDirty = true;
  }

  setUnit(unit) {
    if (this.unitShape?.geometry) this.unitShape.geometry.dispose();
    this.unitShape = unit;
    this.structureDirty = true;
  }

  setUnitB(unit) {
    if (this.unitShapeB?.geometry) this.unitShapeB.geometry.dispose();
    this.unitShapeB = unit;
    this.structureDirty = true;
  }

  clientToWorld(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    return new THREE.Vector3(
      THREE.MathUtils.lerp(this.camera.left, this.camera.right, nx),
      THREE.MathUtils.lerp(this.camera.top, this.camera.bottom, ny),
      0,
    );
  }

  getCameraBounds() {
    return {
      left: this.camera.left,
      right: this.camera.right,
      top: this.camera.top,
      bottom: this.camera.bottom,
    };
  }

  isReady() {
    return this.pathGroups.length > 0 && this.unitShape !== null;
  }

  collectPlacements(phase = 0) {
    const p = this.params;
    const spacing = Math.max(4, this.unitShape.unitLength * p.pitch * 80);
    const all = [];
    for (const group of this.pathGroups) {
      const poly = deformPolyline(group, this.time, p);
      all.push(...samplePlacements(poly, spacing, phase));
    }
    return all;
  }

  createMaterial(opacity, depthWrite, instanceIndex, outline = false, unitShape = null) {
    const p = this.params;
    const unit = unitShape ?? this.unitShape;
    let color;
    if (unit?.useSvgColors) {
      const hex = outline
        ? unit.outlineColor ?? unit.fillColor ?? "#111111"
        : unit.fillColor ?? "#111111";
      color = new THREE.Color(hex);
    } else {
      color = outline
        ? new THREE.Color(p.outlineColor ?? "#ffd700")
        : p.fillColor
          ? new THREE.Color(p.fillColor)
          : getMaterialColor(p.colorModeIndex, p.strokeColor, instanceIndex, p.seed);
    }
    return new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite,
      side: THREE.DoubleSide,
    });
  }

  clearLayers() {
    for (const mesh of this.instanceLayers) {
      this.contentGroup.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.instanceLayers = [];
  }

  applyPlacementsToMesh(mesh, placements, unitShape, opacity, phaseOffset, scaleMul = 1) {
    const p = this.params;

    for (let i = 0; i < placements.length; i++) {
      const pt = placements[i];
      const { scaleX, scaleY } = instanceScales(pt, p, this.mouse);
      const lineBoost = 1 + (p.elementLineWidth - 1) * 0.08;
      const rotZ = instanceAngle(pt.angle, pt, p, this.mouse);

      this.dummy.position.set(pt.x, pt.y, pt.z);
      this.dummy.rotation.set(0, 0, rotZ);
      this.dummy.scale.set(scaleX * lineBoost * scaleMul, scaleY * lineBoost * scaleMul, 1);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(i, this.dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  rebuildStructure() {
    this.clearLayers();
    if (!this.isReady()) return;

    const p = this.params;
    const placementsA = this.collectPlacements(0);
    const totalA = placementsA.length;
    if (totalA === 0) return;

    const outlineBoost = p.outlineScale ?? 1.06;
    const skipOutline = this.unitShape.useSvgColors && !this.unitShape.outlineColor;
    if (!skipOutline) {
      const outlineA = new THREE.InstancedMesh(
        this.unitShape.geometry,
        this.createMaterial(1, true, 0, true, this.unitShape),
        totalA,
      );
      outlineA.renderOrder = 0;
      this.contentGroup.add(outlineA);
      this.instanceLayers.push(outlineA);
      this.applyPlacementsToMesh(outlineA, placementsA, this.unitShape, 1, 0, outlineBoost);
    }

    const mainA = new THREE.InstancedMesh(
      this.unitShape.geometry,
      this.createMaterial(1, true, 0, false, this.unitShape),
      totalA,
    );
    mainA.renderOrder = 1;
    this.contentGroup.add(mainA);
    this.instanceLayers.push(mainA);
    this.applyPlacementsToMesh(mainA, placementsA, this.unitShape, 1, 0);

    if (p.enableSecondLayer && this.unitShapeB) {
      const placementsB = this.collectPlacements(p.secondLayerPhase);
      const totalB = placementsB.length;
      if (totalB > 0) {
        const mainB = new THREE.InstancedMesh(
          this.unitShapeB.geometry,
          this.createMaterial(p.secondLayerOpacity, false, 1),
          totalB,
        );
        mainB.renderOrder = 2;
        this.contentGroup.add(mainB);
        this.instanceLayers.push(mainB);
        this.applyPlacementsToMesh(mainB, placementsB, this.unitShapeB, p.secondLayerOpacity, p.secondLayerPhase);
      }
    }

    for (let e = 0; e < p.echoLayers; e++) {
      const fade = 1 - (e + 1) / (p.echoLayers + 1);
      const echo = new THREE.InstancedMesh(
        this.unitShape.geometry,
        this.createMaterial(fade * p.echoOpacity, false, e + 2),
        totalA,
      );
      echo.renderOrder = e;
      this.contentGroup.add(echo);
      this.instanceLayers.push(echo);
    }

    this.fitCamera();
    this.structureDirty = false;
  }

  update() {
    if (!this.isReady()) return;
    const p = this.params;
    this.contentGroup.scale.setScalar(p.cameraZoomValue);
    this.contentGroup.position.set(0, 0, 0);

    if (this.structureDirty) this.rebuildStructure();
    else {
      const placementsA = this.collectPlacements(0);
      const outlineBoost = p.outlineScale ?? 1.06;
      if (this.instanceLayers[0]) {
        this.applyPlacementsToMesh(this.instanceLayers[0], placementsA, this.unitShape, 1, 0, outlineBoost);
      }
      if (this.instanceLayers[1]) {
        this.applyPlacementsToMesh(this.instanceLayers[1], placementsA, this.unitShape, 1, 0);
      }
      let idx = 2;
      if (p.enableSecondLayer && this.unitShapeB && this.instanceLayers[idx]) {
        const placementsB = this.collectPlacements(p.secondLayerPhase);
        this.applyPlacementsToMesh(this.instanceLayers[idx], placementsB, this.unitShapeB, p.secondLayerOpacity, p.secondLayerPhase);
        idx++;
      }
      for (let e = 0; e < p.echoLayers; e++) {
        const mesh = this.instanceLayers[idx + e];
        if (mesh) this.applyPlacementsToMesh(mesh, placementsA, this.unitShape, p.echoOpacity, 0);
      }
    }
  }

  updateColors() {
    this.scene.background = new THREE.Color(this.params.bgColor);
    this.markStructureDirty();
  }

  markStructureDirty() {
    this.structureDirty = true;
  }

  fitCamera() {
    const box = new THREE.Box3().setFromObject(this.contentGroup);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, 1);
    const aspect = this.host.clientWidth / this.host.clientHeight;
    const padding = 1.3;
    let halfW;
    let halfH;
    if (aspect > size.x / Math.max(size.y, 1)) {
      halfH = (maxDim * padding) / 2;
      halfW = halfH * aspect;
    } else {
      halfW = (maxDim * padding) / 2;
      halfH = halfW / aspect;
    }
    this.camera.left = center.x - halfW;
    this.camera.right = center.x + halfW;
    this.camera.top = center.y + halfH;
    this.camera.bottom = center.y - halfH;
    this.camera.updateProjectionMatrix();
  }

  resize() {
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight);
    if (this.isReady()) this.fitCamera();
    this.markStructureDirty();
  }

  tick(dt) {
    if (this.params.playing) this.time += dt * this.params.speed;
    if (this.params.mouseEnabled && this.mouse.active) {
      const prevX = this.mouse.world.x;
      const prevY = this.mouse.world.y;
      this.mouse.world.lerp(this.mouse.target, 0.15);
      const dx = this.mouse.world.x - prevX;
      const dy = this.mouse.world.y - prevY;
      const speed = Math.hypot(dx, dy);
      if (speed > 0.08) {
        const targetDir = Math.atan2(dy, dx);
        if (!this.mouse.directionValid) {
          this.mouse.direction = targetDir;
          this.mouse.directionValid = true;
        } else {
          this.mouse.direction = lerpAngle(
            this.mouse.direction,
            targetDir,
            Math.min(1, speed * 5),
          );
        }
      }
    }
    if (this.params.handEnabled && this.params.handFollowPointer && this.mouse.active) {
      this.params.handPosX = this.mouse.world.x;
      this.params.handPosY = this.mouse.world.y;
    }
  }

  render() {
    this.update();
    this.renderer.render(this.scene, this.camera);
  }

  getCanvas() {
    return this.renderer.domElement;
  }

  exportPng() {
    this.update();
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL("image/png");
  }

  exportSvg() {
    if (!this.isReady()) return null;
    const placements = this.collectPlacements(0);
    const p = this.params;
    const box = new THREE.Box3().setFromObject(this.contentGroup);
    const pad = 24;
    const minX = box.min.x - pad;
    const minY = -(box.max.y + pad);
    const w = box.max.x - box.min.x + pad * 2;
    const h = box.max.y - box.min.y + pad * 2;
    const pos = this.unitShape.geometry.attributes.position.array;

    const paths = placements
      .map((pt, idx) => {
        const { scaleX, scaleY } = instanceScales({ ...pt, index: idx }, p, this.mouse);
        const rot = instanceAngle(pt.angle, pt, p, this.mouse);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        const pts = [];
        for (let i = 0; i < pos.length; i += 3) {
          const ux = pos[i] * scaleX;
          const uy = pos[i + 1] * scaleY;
          const x = pt.x + ux * cos - uy * sin;
          const y = -(pt.y + ux * sin + uy * cos);
          pts.push(`${pts.length ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`);
        }
        if (pts.length) pts.push("Z");
        return `<path d="${pts.join(" ")}" fill="${p.strokeColor}"/>`;
      })
      .join("\n  ");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(2)} ${minY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}">
  <rect width="100%" height="100%" fill="${p.bgColor}"/>
  ${paths}
</svg>`;
  }
}

export { parseUnitSvg };
