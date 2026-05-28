#!/usr/bin/env python3
"""Convert a chroma-key animation strip into normalized transparent frames."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path
from typing import Iterable

from PIL import Image


def parse_size(value: str) -> tuple[int, int]:
    width, height = value.lower().split("x", 1)
    return int(width), int(height)


def parse_color(value: str) -> tuple[int, int, int]:
    value = value.strip().lstrip("#")
    if len(value) != 6:
        raise argparse.ArgumentTypeError("color must be in #rrggbb format")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def remove_key(image: Image.Image, key: tuple[int, int, int], threshold: int) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            distance = abs(r - key[0]) + abs(g - key[1]) + abs(b - key[2])
            if distance <= threshold:
                pixels[x, y] = (0, 0, 0, 0)
            elif a > 0:
                pixels[x, y] = (r, g, b, 255)
    return rgba


def remove_magenta_fringe(image: Image.Image) -> Image.Image:
    rgba = image.copy()
    pixels = rgba.load()
    to_clear: list[tuple[int, int]] = []

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a == 0 or not (r > 120 and b > 120 and g < 100):
                continue
            touches_transparency = False
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < rgba.width and 0 <= ny < rgba.height and pixels[nx, ny][3] == 0:
                    touches_transparency = True
                    break
            if touches_transparency:
                to_clear.append((x, y))

    for x, y in to_clear:
        pixels[x, y] = (0, 0, 0, 0)

    return rgba


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def largest_component_mask(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    source = alpha.load()
    width, height = image.size
    seen: set[tuple[int, int]] = set()
    best: list[tuple[int, int]] = []

    for y in range(height):
        for x in range(width):
            if source[x, y] == 0 or (x, y) in seen:
                continue
            component: list[tuple[int, int]] = []
            queue: deque[tuple[int, int]] = deque([(x, y)])
            seen.add((x, y))
            while queue:
                cx, cy = queue.popleft()
                component.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in seen and source[nx, ny] > 0:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if len(component) > len(best):
                best = component

    mask = Image.new("L", image.size, 0)
    out = mask.load()
    for x, y in best:
        out[x, y] = source[x, y]
    return mask


def iter_cells(strip: Image.Image, count: int) -> Iterable[Image.Image]:
    cell_width = strip.width // count
    for index in range(count):
        yield strip.crop((index * cell_width, 0, (index + 1) * cell_width, strip.height))


def normalize_frames(
    frames: list[Image.Image],
    canvas_size: tuple[int, int],
    baseline: int,
    target_height: int | None,
    keep_largest: bool,
) -> list[Image.Image]:
    processed: list[Image.Image] = []
    bboxes: list[tuple[int, int, int, int] | None] = []

    for frame in frames:
        if keep_largest:
            alpha = largest_component_mask(frame)
            frame = frame.copy()
            frame.putalpha(alpha)
        bbox = alpha_bbox(frame)
        processed.append(frame)
        bboxes.append(bbox)

    non_empty = [bbox for bbox in bboxes if bbox is not None]
    if not non_empty:
        return [Image.new("RGBA", canvas_size, (0, 0, 0, 0)) for _ in frames]

    reference_height = max(bbox[3] - bbox[1] for bbox in non_empty)
    scale = 1.0 if target_height is None else target_height / reference_height
    out_frames: list[Image.Image] = []
    canvas_width, canvas_height = canvas_size

    for frame, bbox in zip(processed, bboxes):
        output = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        if bbox is None:
            out_frames.append(output)
            continue

        cropped = frame.crop(bbox)
        new_width = max(1, round(cropped.width * scale))
        new_height = max(1, round(cropped.height * scale))
        resized = cropped.resize((new_width, new_height), Image.Resampling.NEAREST)
        x = round((canvas_width - new_width) / 2)
        y = round(baseline - new_height)
        output.alpha_composite(resized, (x, y))
        out_frames.append(output)

    return out_frames


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--count", type=int, default=4)
    parser.add_argument("--canvas", required=True, type=parse_size, help="Output canvas, for example 96x112")
    parser.add_argument("--baseline", required=True, type=int, help="Output y coordinate for the shared foot baseline")
    parser.add_argument("--target-height", type=int, default=None, help="Normalize the tallest frame body to this pixel height")
    parser.add_argument("--key", type=parse_color, default=(255, 0, 255), help="Chroma key color, default #ff00ff")
    parser.add_argument("--key-threshold", type=int, default=72)
    parser.add_argument("--keep-components", choices=("largest", "all"), default="largest")
    parser.add_argument("--keep-magenta-fringe", action="store_true")
    args = parser.parse_args()

    strip = Image.open(args.input)
    frames = [remove_key(cell, args.key, args.key_threshold) for cell in iter_cells(strip, args.count)]
    if not args.keep_magenta_fringe:
        frames = [remove_magenta_fringe(frame) for frame in frames]
    normalized = normalize_frames(
        frames,
        args.canvas,
        args.baseline,
        args.target_height,
        keep_largest=args.keep_components == "largest",
    )

    args.out_dir.mkdir(parents=True, exist_ok=True)
    for index, frame in enumerate(normalized):
        frame.save(args.out_dir / f"{args.prefix}_{index:02d}.png")


if __name__ == "__main__":
    main()
