# Asset provenance

## Folded-paper ink duelist

- Generator: Tripo Studio, normal Chrome UI, dedicated `🖋 Equal & Opposite` tab.
- Date: 24 October 2026.
- Task ID: `1d825aae-70dc-4351-8345-627ec69ef99f`.
- Task: https://studio.tripo3d.ai/workspace/generate/1d825aae-70dc-4351-8345-627ec69ef99f
- Mode: HD Model, H3.1 – Best Quality, Geometry & Texture. Normal text generation, no paid add-ons, rigging or animation.
- Displayed task cost at submission: **45 credits**. One generation submitted; no purchase or upgrade.
- Source prompt:

> A single original folded-paper ink duelist guardian for a turn-based mathematical card duel. Elegant tabletop miniature, full body standing on a small irregular folded paper base. Tall origami hooded sage silhouette, angular triangular folded ivory parchment cloak, charcoal ink face with no features, one slim vermilion red sash, broad articulated paper sleeves holding a folded paper fan, geometric creases and crisp planar surfaces, handmade paper grain, dramatic graphic silhouette. Warm ivory, charcoal black and tiny vermilion accent only. Refined Japanese paper craft atmosphere, friendly mysterious presence, no weapon, no text, no symbols, no letters, no numbers, no cards around the feet, no background, game-ready low complexity sculpt with compact readable forms, one connected model.

Export: normal GLB download, 1k textures, filename `equal-opposite-ink-duelist-original.glb` (source retained in the operator Downloads directory, not committed). The delivered browser asset is `public/models/ink-duelist.glb`.

| File | Bytes | Triangles | SHA-256 |
| --- | ---: | ---: | --- |
| Original UI export | 31,196,768 | 976,584 | `a1e337ed02a65b298f2d4b6a7e9d806ce9aafbd13ef5b78b0a01800ebde27c34` |
| Browser asset | 5,243,292 | 111,866 | `28ce706c96302ca12d31c07565cf9354e802f7875042b0e147e39ecff156fea5` |

Processing: `@gltf-transform/cli` 4.5.1 / meshoptimizer, command `gltf-transform simplify equal-opposite-ink-duelist-original.glb ink-duelist.glb --ratio 0.06 --error 0.01`. No remote reads or provider endpoints were used. This reduced triangles about 88.5%; one material and three embedded 1k images remain. No glTF extensions or decoder downloads are needed. A Blender decimation attempt was stopped after meshoptimizer succeeded and contributed nothing to the delivered file. Mesh is static and is animated only as a whole decorative figure. Runtime normalizes the source height to 9.8 tabletop units, widens the decorative silhouette by 1.35 and lowers it 3 units behind the table so the upper body frames the duel; roughness is at least 0.7 and metallic is zero. The exported mesh is decorative. Exact equation values, card faces and mathematical geometry are procedural and do not derive from generated geometry. No rig is assumed.

## Procedural assets

The tabletop, folded rune forms, signed mathematical inscriptions, cards, floor, ink lines, seals and lighting are original Three.js geometry and locally rendered canvas textures. No external runtime fonts, models or services are fetched. Decorative piece volume does not indicate mathematical magnitude.

## Terms and release note

[Tripo Terms of User Agreement](https://www.tripo3d.ai/terms), last updated 11 July 2025, were inspected on 24 October 2026. Section 5.2 distinguishes Free User outputs (rights retained by Tripo) from Paid User outputs (users generally have output rights subject to the agreement). The account menu was read in a fresh dedicated asset-review Chrome tab after the original tab connection became stale: it displayed **Pro** during this same build session. No purchase, upgrade, plan change, API credential access or billing action was made. This paid-tier observation supports the applicable Paid User output terms. No separate permissive software license is assigned to the generated model, and this note does not relicense Tripo’s service or background technology. Credit: original prompt by this project, generated using Tripo Studio; local mesh processing by the project.

## Reference matching

The first normal Tripo task was already submitted and exported before the later instruction to produce an imagegen gameplay target arrived. Once `docs/visual-targets/gameplay-v1.png` became available (subsequently corrected to selected `gameplay-v2.png`), the crew inspected it and reused the compatible ivory/charcoal/vermilion folded-paper duelist. No second model was generated and no image was falsely claimed as the first task input. The model has a hood instead of the target's wide paper hat. The scene was then revised toward the target: oblique wood-and-paper tabletop, taller x folds, separate signed unit ink discs, larger opposing figure, red-edged selected card, physical finite stacks and warm paper lanterns. The actual five-card hand retains mathematically required drawn cards even where the illustrative target omitted one.
