import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"

/**
 * Small runtime builders for Honest Label: boxes, world-space text and
 * pinchable buttons. All sizes are in centimeters. Colors are light because
 * the SPECS display is additive (dark = transparent).
 */

export const COLORS = {
  text: new vec4(1, 1, 1, 1),
  textDim: new vec4(0.8, 0.85, 0.9, 1),
  accent: new vec4(0.6, 0.9, 1, 1),
  table: new vec4(0.22, 0.25, 0.28, 1),
  button: new vec4(0.2, 0.42, 0.55, 1),
  buttonHover: new vec4(0.35, 0.65, 0.85, 1),
  cube: new vec4(1, 1, 1, 1),
  good: new vec4(0.55, 1, 0.6, 1),
  dimCube: new vec4(0.45, 0.45, 0.45, 1),
}

export class SceneKit {
  private unitSize: vec3

  constructor(private boxMesh: RenderMesh, private baseMaterial: Material) {
    const size = boxMesh.aabbMax.sub(boxMesh.aabbMin)
    this.unitSize = new vec3(size.x || 1, size.y || 1, size.z || 1)
  }

  group(parent: SceneObject, name: string, pos: vec3): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent)
    o.getTransform().setLocalPosition(pos)
    return o
  }

  /** A box of the given size (cm), centred on pos. Returns the object; the visual's material is a private clone. */
  box(parent: SceneObject, name: string, sizeCm: vec3, pos: vec3, color: vec4): SceneObject {
    const o = this.group(parent, name, pos)
    o.getTransform().setLocalScale(
      new vec3(sizeCm.x / this.unitSize.x, sizeCm.y / this.unitSize.y, sizeCm.z / this.unitSize.z))
    const rmv = o.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = this.boxMesh
    const mat = this.baseMaterial.clone()
    mat.mainPass.baseColor = color
    rmv.clearMaterials()
    rmv.addMaterial(mat)
    return o
  }

  setColor(o: SceneObject, color: vec4): void {
    const rmv = o.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    if (rmv && rmv.mainMaterial) rmv.mainMaterial.mainPass.baseColor = color
  }

  /**
   * World-space text. heightCm is the em height (size = heightCm * 43.886).
   * widthCm > 0 wraps within that width.
   */
  text(parent: SceneObject, name: string, value: string, heightCm: number, pos: vec3,
       color: vec4 = COLORS.text, widthCm = 0, align: HorizontalAlignment = HorizontalAlignment.Center): Text {
    const o = this.group(parent, name, pos)
    const t = o.createComponent("Component.Text") as Text
    t.size = Math.min(800, Math.max(2, heightCm * 43.886))
    t.textFill.color = color
    t.horizontalAlignment = align
    t.verticalAlignment = VerticalAlignment.Center
    if (widthCm > 0) {
      const half = widthCm / 2
      t.layoutRect = Rect.create(-half, half, -50, 50)
      t.horizontalOverflow = HorizontalOverflow.Wrap
    }
    t.text = value
    return t
  }

  /** A big pinchable button: box + label + collider + SIK Interactable. Highlights on hover. */
  button(parent: SceneObject, name: string, label: string, sizeCm: vec3, pos: vec3, onPress: () => void,
         onLabel?: (t: Text) => void): SceneObject {
    const root = this.group(parent, name, pos)
    const body = this.box(root, name + "_Body", sizeCm, vec3.zero(), COLORS.button)
    const labelText = this.text(root, name + "_Label", label, sizeCm.y * 0.4, new vec3(0, 0, sizeCm.z / 2 + 0.2))
    if (onLabel) onLabel(labelText)

    const collider = root.createComponent("Physics.ColliderComponent") as ColliderComponent
    const shape = Shape.createBoxShape()
    shape.size = sizeCm
    collider.shape = shape

    const interactable = root.createComponent(Interactable.getTypeName()) as Interactable
    interactable.targetingMode = 3 // direct + indirect
    interactable.onTriggerStart.add(() => onPress())
    interactable.onHoverEnter.add(() => this.setColor(body, COLORS.buttonHover))
    interactable.onHoverExit.add(() => this.setColor(body, COLORS.button))
    return root
  }
}
