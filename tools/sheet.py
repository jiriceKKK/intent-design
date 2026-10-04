"""Contact sheet: lays renders side by side (scaled) for quick review."""
import sys
from PIL import Image
out, scale, files = sys.argv[1], float(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in files]
w = int(ims[0].width * scale); h = int(ims[0].height * scale); gap = 16
sheet = Image.new('RGB', (len(ims) * (w + gap) + gap, h + 2 * gap), (120, 120, 120))
for i, im in enumerate(ims):
    sheet.paste(im.resize((w, int(im.height * scale)), Image.LANCZOS), (gap + i * (w + gap), gap))
sheet.save(out)
