"""
Split a grid image into individual cells based on visual analysis.
The image is 2048x1536 with a grid layout of Chinese character cards.
"""
from PIL import Image
import os

image_path = None
for candidate in ["split_input.png", "input.png", "image.png"]:
    if os.path.exists(candidate):
        image_path = candidate
        break

if not image_path:
    import glob
    pngs = glob.glob("*.png")
    if pngs:
        pngs.sort(key=os.path.getmtime, reverse=True)
        image_path = pngs[0]

if not image_path:
    print("No image found. Please place the image in the working directory as 'split_input.png'.")
    exit(1)

print(f"Processing: {image_path}")
img = Image.open(image_path)
w, h = img.size
print(f"Image size: {w} x {h}")

# Analyze the image to find grid structure
gray = img.convert("L")

# Sample pixel values along rows to find horizontal lines
# A grid line row will have low variance (mostly same color)
import statistics

def row_variance(y):
    """Get variance of pixel values in a row."""
    row = [gray.getpixel((x, y)) for x in range(0, w, 4)]  # sample every 4th pixel
    return statistics.variance(row) if len(row) > 1 else 0

def col_variance(x):
    """Get variance of pixel values in a column."""
    col = [gray.getpixel((x, y)) for y in range(0, h, 4)]  # sample every 4th pixel
    return statistics.variance(col) if len(col) > 1 else 0

# Scan rows to find horizontal grid lines (low variance = uniform color = grid line)
print("Scanning for horizontal grid lines...")
row_vars = []
for y in range(0, h, 2):  # sample every 2nd row for speed
    var = row_variance(y)
    row_vars.append((y, var))

# Find rows with very low variance (grid lines)
avg_var = statistics.mean(v for _, v in row_vars)
print(f"Average row variance: {avg_var:.1f}")

# Grid lines have variance significantly below average
threshold = avg_var * 0.05  # 5% of average variance
grid_rows = [y for y, v in row_vars if v < threshold]
print(f"Potential grid rows (var < {threshold:.1f}): {len(grid_rows)}")

# Group consecutive rows into line segments
def group_consecutive(values, gap=10):
    if not values:
        return []
    groups = [[values[0]]]
    for v in values[1:]:
        if v - groups[-1][-1] <= gap:
            groups[-1].append(v)
        else:
            groups.append([v])
    return [int(statistics.mean(g)) for g in groups]

h_lines = group_consecutive(grid_rows, gap=10)
print(f"Horizontal grid lines: {h_lines}")

# Scan columns for vertical grid lines
print("Scanning for vertical grid lines...")
col_vars = []
for x in range(0, w, 2):
    var = col_variance(x)
    col_vars.append((x, var))

avg_var_col = statistics.mean(v for _, v in col_vars)
threshold_col = avg_var_col * 0.05
grid_cols = [x for x, v in col_vars if v < threshold_col]
print(f"Potential grid cols (var < {threshold_col:.1f}): {len(grid_cols)}")

v_lines = group_consecutive(grid_cols, gap=10)
print(f"Vertical grid lines: {v_lines}")

# Calculate cell boundaries
def get_cells(lines, total):
    """Get cell regions between grid lines."""
    points = [0] + lines + [total]
    cells = []
    for i in range(len(points) - 1):
        cells.append((points[i], points[i+1]))
    return cells

h_cells = get_cells(h_lines, h)
v_cells = get_cells(v_lines, w)

print(f"Grid: {len(h_cells)} rows x {len(v_cells)} cols = {len(h_cells) * len(v_cells)} cells")

# Create output directory
output_dir = "split_output"
os.makedirs(output_dir, exist_ok=True)

# Crop and save each cell with a small margin to remove grid line remnants
margin = 5
count = 0
for row_idx, (y1, y2) in enumerate(h_cells):
    for col_idx, (x1, x2) in enumerate(v_cells):
        cx1 = min(x1 + margin, x2)
        cy1 = min(y1 + margin, y2)
        cx2 = max(x2 - margin, x1)
        cy2 = max(y2 - margin, y1)

        cell = img.crop((cx1, cy1, cx2, cy2))
        cw, ch = cell.size
        if cw < 20 or ch < 20:  # skip tiny cells
            continue

        filename = f"cell_{row_idx:02d}_{col_idx:02d}.png"
        cell.save(os.path.join(output_dir, filename))
        count += 1
        print(f"Saved: {filename} ({cw}x{ch})")

print(f"\nDone! Saved {count} cells to '{output_dir}/'")
