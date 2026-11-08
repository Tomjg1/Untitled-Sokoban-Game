"""
Build a grid world in Blender from a text map.

Every kind of cell is described by one entry in TILE_TYPES below. To add a new
type, add one TileType(...) line; the build code never needs to change.

The top-left corner of the first cell (row 0, col 0) sits at world (0, 0).
Columns go along +X, rows go down along -Y.

Usage:
  - In Blender: open the Scripting tab, open this file, set MAP_PATH below, press Run.
  - From a terminal:
        blender --python build_grid_world.py -- path/to/map.txt
Re-running the script replaces the previously generated world.
"""
import sys
from dataclasses import dataclass
from typing import Optional

import bpy

# ---------------- file ----------------
MAP_PATH = "//Level_1_Map.txt"   # "//" = folder of the saved .blend file; or use an absolute path

# ---------------- map reading ----------------
COMMENT_PREFIX = "//"        # lines starting with this are ignored (leading spaces allowed)
CASE_SENSITIVE = False       # False: 'b' and 'B' mean the same thing
IGNORE_WHITESPACE = True     # True: "# # ." is read the same as "##."
                             # (set to False only if you use a space as one of the characters below)

# ---------------- world settings ----------------
TILE_SIZE = 1.0           # width/depth of one cell
TILE_GAP = 0.04           # small gap between tiles so the grid is visible (0 = none)
TILE_HEIGHT = 0.2         # floor tile thickness (top surface sits at z = 0)
COLLECTION_NAME = "GridWorld"

# ---------------- colours ----------------
GREY   = (0.55, 0.55, 0.60, 1.0)
RED    = (0.90, 0.05, 0.05, 1.0)
YELLOW = (1.00, 0.85, 0.05, 1.0)
CYAN   = (0.05, 1.00, 0.85, 1.0)


# ---------------- TILE TYPES (edit / add here) ----------------
@dataclass
class TileType:
    char: str                          # symbol used in the map file
    name: str                          # used for object and material names
    floor: bool = True                 # draw a floor tile under this cell
    floor_color: tuple = GREY
    block_height: float = 0.0          # > 0: draw a full-cell block (bottom at z = 0), e.g. walls
    block_color: tuple = GREY
    marker_color: Optional[tuple] = None   # not None: draw a small cube on the tile
    marker_scale: float = 0.75         # marker size as a fraction of TILE_SIZE
    expected: Optional[int] = None     # warn if the map doesn't contain exactly this many


TILE_TYPES = [
    TileType(".", "Empty",  floor=False),
    TileType("#", "Floor"),
    TileType("~", "Wall",   floor=False, block_height=1.0),
    TileType("S", "Player", marker_color=RED,    expected=1),
    TileType("G", "Goal",   marker_color=CYAN,   expected=1),
    TileType("B", "Box",    marker_color=YELLOW),
    # Examples of new types (uncomment / copy):
    # TileType("T", "Tall",  floor=False, block_height=2.0, block_color=(0.3, 0.3, 0.8, 1.0)),
    # TileType("L", "Lava",  floor_color=(0.9, 0.3, 0.0, 1.0)),
    # TileType("K", "Key",   marker_color=(0.9, 0.9, 0.2, 1.0), marker_scale=0.4),
]
# -----------------------------------------------------------------


def norm(ch):
    return ch if CASE_SENSITIVE else ch.lower()


def get_material(name, rgba):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
    mat.diffuse_color = rgba  # colour in solid viewport mode
    return mat


def fresh_collection(name):
    old = bpy.data.collections.get(name)
    if old:
        for obj in list(old.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(old)
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def add_box(col, name, center, size, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    obj.data.materials.append(mat)
    # move from the default collection into ours
    for c in obj.users_collection:
        c.objects.unlink(obj)
    col.objects.link(obj)
    return obj


def read_map(path):
    rows = []
    with open(bpy.path.abspath(path)) as f:
        for line in f:
            line = line.rstrip("\r\n")
            if line.lstrip().startswith(COMMENT_PREFIX):
                continue  # comment line: not part of the map, doesn't count as a row
            if IGNORE_WHITESPACE:
                line = "".join(line.split())
            if line.strip() or not IGNORE_WHITESPACE:
                rows.append(line)
    return rows


def build_lookup():
    """Map normalised character -> TileType, and check for duplicate symbols."""
    lookup = {}
    for t in TILE_TYPES:
        key = norm(t.char)
        if key in lookup:
            raise ValueError(f"Symbol {t.char!r} is used by both {lookup[key].name} and {t.name}")
        lookup[key] = t
    return lookup


def build_cell(col, t, r, c, materials):
    """Create every object a single cell of type `t` needs."""
    # The top-left corner of cell (0, 0) is at world (0, 0). Cubes are placed
    # by their centre, so shift by half a cell.
    x = (c + 0.5) * TILE_SIZE
    y = -(r + 0.5) * TILE_SIZE
    tile_dim = TILE_SIZE - TILE_GAP
    # Types that appear exactly once get a clean name ("Player"); others get coordinates.
    suffix = "" if t.expected == 1 else f"_{r}_{c}"

    if t.floor:
        add_box(col, f"Tile_{r}_{c}", (x, y, -TILE_HEIGHT / 2),
                (tile_dim, tile_dim, TILE_HEIGHT), materials[(t.name, "floor")])

    if t.block_height > 0:
        add_box(col, f"{t.name}{suffix}" if suffix else t.name,
                (x, y, t.block_height / 2),
                (tile_dim, tile_dim, t.block_height), materials[(t.name, "block")])

    if t.marker_color is not None:
        size = TILE_SIZE * t.marker_scale
        add_box(col, f"{t.name}{suffix}", (x, y, size / 2),
                (size, size, size), materials[(t.name, "marker")])


def build(path):
    rows = read_map(path)
    lookup = build_lookup()
    col = fresh_collection(COLLECTION_NAME)

    # One material per (type, part), created up front.
    materials = {}
    for t in TILE_TYPES:
        if t.floor:
            materials[(t.name, "floor")] = get_material(f"GW_{t.name}_Floor", t.floor_color)
        if t.block_height > 0:
            materials[(t.name, "block")] = get_material(f"GW_{t.name}", t.block_color)
        if t.marker_color is not None:
            materials[(t.name, "marker")] = get_material(f"GW_{t.name}", t.marker_color)

    counts = {t.name: 0 for t in TILE_TYPES}
    unknown = 0

    for r, line in enumerate(rows):
        for c, raw in enumerate(line):
            t = lookup.get(norm(raw))
            if t is None:
                unknown += 1
                print(f"Warning: unknown character {raw!r} at row {r}, col {c} (treated as empty)")
                continue
            counts[t.name] += 1
            build_cell(col, t, r, c, materials)

    for t in TILE_TYPES:
        if t.expected is not None and counts[t.name] != t.expected:
            print(f"Warning: expected {t.expected} {t.name} ('{t.char}'), found {counts[t.name]}")

    summary = ", ".join(f"{n} {name}" for name, n in counts.items() if n)
    print(f"Built grid from {path}: {summary}" + (f" ({unknown} unknown)" if unknown else ""))


if __name__ == "__main__":
    path = MAP_PATH
    if "--" in sys.argv:
        extra = sys.argv[sys.argv.index("--") + 1:]
        if extra:
            path = extra[0]
    build(path)
