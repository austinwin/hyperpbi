# Interactive 3D scenes

Use `scene3d` for equipment layouts, facilities, or objects with a physical relationship. The component runs in the Playground and in both HyperPBI Power BI package profiles. [Pump Station Monitoring live example](https://hyperpbi.com/examples/pump-station-monitoring)

## Build a scene in the Visual Inspector

1. Open **Visual Inspector**, add **3D scene** from **Advanced components**, and select it in the component tree.
2. In **Scene editor**, choose a shape or equipment assembly and select **Add object**. Use **Import model** for a local GLB or glTF file.
3. Select the object under **Edit object**. Set its label, position, size, rotation, base color, and material finish. Duplicate a configured object to build repeated equipment. Preview changes in Studio.
4. Under **Data**, choose an **Object key field**. Give each bound object a matching key in **Object behavior**. Choose the value type used by the dataset. Pick a **Status field**, then enter its value-to-color rules in **Status colors**.
5. Under **Connect components**, choose the receiving charts or tables and the Power BI behavior. For Power BI cross-visual selection, choose **Selection by identity** and bind real fields to **Values**.

The stage uses X and Z for the floor and Y for height. Primitives and imported models are centered on their position. Pump and tank assemblies sit on their base. Size gives the dimensions of a primitive or a normalized model, and scales an assembly on each axis. Pipes are cylinders whose local length is along Y. Rotation uses degrees in XYZ order.

Click an object to select it. Hold the pointer down and drag to orbit, shift-drag or right-drag to pan, and scroll or pinch to zoom. Choose **Top view**, **Isometric**, or **Reset view** to reframe the scene. Select through the canvas, projected labels, or keyboard-accessible equipment list. The equipment list continues to work when graphics are unavailable. Leave it enabled if viewers need keyboard selection or a fallback.

The Groundwater Supply & Distribution example uses teal pipes for raw water and blue pipes for treated water. Switch to **Remote well offline** to see how reduced source flow affects residential delivery. [Groundwater Supply & Distribution](https://hyperpbi.com/examples/groundwater-supply-distribution)

## Bind objects to data

Match keys by exact type and value. A string such as `"101"` is distinct from the number `101`. Static objects may omit `dataKey`; set `selectable: true` to let viewers mark them locally.

The first available matching row determines status, tooltip values, and data-driven visibility. Set the logical dataset's sort order when several readings share a key. A valid six-digit hex value from `colorField` overrides the status palette, which overrides the base material color. A Boolean false in `visibleField` hides the object. By default, bound objects with no matching rows appear muted and are marked **No data**. Use `hideUnmatched: true` to hide them. Each `tooltipFields` entry can be a field name or an object with `field` and an optional `label`.

All currently available rows with the same key contribute to selection. For a grouped logical dataset, HyperPBI translates the matching rows to their original Power BI row identities. Linked components can filter or highlight through the same `interaction` configuration used by tables and charts. For outbound Power BI model-column filtering, choose a real Power BI column with source metadata. [Interaction guide](interactions.md)

```json
{
  "version": "2.0",
  "components": [
    {
      "type": "scene3d",
      "id": "equipment",
      "title": "Booster station",
      "height": 420,
      "objectIdField": "equipmentid",
      "statusField": "status",
      "statusColors": [
        { "value": "Running", "color": "#29b99a" },
        { "value": "Warning", "color": "#efaa49" }
      ],
      "tooltipFields": ["pressurepsi"],
      "objects": [
        { "id": "pump_01", "kind": "pump", "label": "P-101", "dataKey": "P-101", "position": [-1.1, 0, 0] },
        { "id": "pump_02", "kind": "pump", "label": "P-102", "dataKey": "P-102", "position": [1.1, 0, 0] },
        { "id": "header", "kind": "pipe", "position": [0, 1.4, -1], "size": [0.25, 4.8, 0.25], "rotation": [0, 0, 90] }
      ],
      "interaction": {
        "internalMode": "filter",
        "targets": ["equipment_records"],
        "externalMode": "selection",
        "clearOnSecondClick": true
      }
    },
    {
      "type": "table",
      "id": "equipment_records",
      "columns": ["equipmentid", "status", "pressurepsi"]
    }
  ]
}
```

## Import models

The Inspector embeds the file bytes in `model: { "format": "glb", "data": "<base64 bytes>" }`. For a self-contained JSON glTF file, use `"format": "gltf"`. In either case, the model travels with the specification. Export a single static glTF 2.0 scene with triangle meshes and embedded buffers. PNG and JPEG textures may be embedded. The component accepts core glTF plus unlit materials and texture transforms. Model normalization fits the imported geometry to the specified dimensions, so set all three axes to preserve the proportions you want.

Each dashboard supports up to eight scenes. A scene accepts up to 80 objects and four model files. Each file is limited to 768 KiB, 96 primitive draw calls, 80,000 triangles, and textures up to 1,024 × 1,024 pixels with at most two megapixels total. External URIs, Draco and other compressed formats, animations, skins, cameras, and scripts are rejected. Three.js and its loaders ship locally. Scenes use WebGL 2 and pause rendering when idle or offscreen. For a dense dashboard, use fewer objects, keep textures small, and turn off shadows where they add little. [Security boundaries](security.md)

## Verify Power BI behavior

Import the example CSV as one table, add its columns to **Values**, and set numeric fields to **Don't summarize**. Keep `readingid` in Values to preserve the reading grain. Paste the included specification and Runtime Configuration into Studio. Add a second visual that uses the same model data, enable filtering in **Edit interactions**, then select a pump and verify that the other visual filters to its contributing readings. Apply a slicer to verify that incoming filters update object status and visibility. Use the [example setup files](../examples/dashboards/pump-station-monitoring/README.md).
