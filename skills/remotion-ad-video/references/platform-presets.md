# Platform Presets

Use simple presets for early user choice, then map them to exact Remotion dimensions.

## Core Presets

| User choice | Prop value | Size | Use for |
| --- | --- | --- | --- |
| Vertical | `vertical-9x16` | 1080 x 1920 | TikTok, Reels, Shorts, mobile UA |
| Square | `square-1x1` | 1080 x 1080 | Meta feed, Instagram feed, compact retargeting |
| Landscape | `landscape-16x9` | 1920 x 1080 | YouTube, website hero video, desktop placements |

## Draft Output Sizes

For skill tests and creative review, render half-size draft video by default:

| Preset | Draft size via `--scale 0.5` | Full-size final |
| --- | --- | --- |
| Vertical | 540 x 960 | 1080 x 1920 |
| Square | 540 x 540 | 1080 x 1080 |
| Landscape | 960 x 540 | 1920 x 1080 |

Use full-size final output only after the draft video is accepted or the user explicitly asks for production export.

## Platform Aliases

- `tiktok`, `instagram-reel`, and `youtube-shorts` map to vertical.
- `meta-square` maps to square.
- `youtube-landscape` maps to landscape.

## Rules

- Default to vertical for short-form ads when the user does not choose.
- Report both the preset and exact rendered dimensions in handoff, especially if using draft scale.
- Do not create all sizes unless the user asks for variants. Build one strong master first.
