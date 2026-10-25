/* Ported from PersonalPortfolio (branch adv-rebrand) src/components/redesign/scene/panelGeometry.js.
 * Changes for adv-website are marked "ADV:". */

import * as THREE from 'three';

/* Thin, portrait card with a generously rounded face.
 *
 * Not RoundedBoxGeometry. That clamps its corner radius to half the smallest
 * dimension, so the thinner the card gets the squarer its corners must become —
 * exactly backwards from what a thin card should look like. A 0.05-deep panel
 * would be limited to a 0.025 radius, which is visually square.
 *
 * Extruding a rounded-rectangle Shape decouples the two: the face radius is set
 * in the shape, the thickness in the extrusion, and a small bevel keeps the edge
 * from reading as a razor.
 */
export function createPanelGeometry({ width = 1.4, height = 1.95, depth = 0.05, radius = 0.14, bevel = 0.012 } = {}) {
  const w = width / 2 - bevel;
  const h = height / 2 - bevel;
  const r = Math.min(radius, w, h);

  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(depth - bevel * 2, 0.001),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 16,
  });

  geometry.center();

  /* Planar UVs, computed here.
   *
   * ExtrudeGeometry's default UV generator maps from world coordinates, which
   * puts the card's artwork somewhere unpredictable and stretched. A flat panel
   * wants a straight planar projection: x across, y up, normalised to the card.
   * The side walls inherit degenerate UVs, which is fine — they are 0.05 units
   * thick and never show enough surface to read. */
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + width / 2) / width;
    uv[i * 2 + 1] = (pos.getY(i) + height / 2) / height;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

  // Normals from ExtrudeGeometry are deliberately left alone. Recomputing them
  // smooths the face-to-bevel junction, which is what gives the edge its
  // definition under the fresnel rim.
  return geometry;
}
