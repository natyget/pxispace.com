from PIL import Image
import sys

def to_ascii(path):
    img = Image.open(path).convert('L')
    img = img.resize((40, 40))
    pixels = img.load()
    chars = " .:-=+*#%@"
    for y in range(40):
        line = ""
        for x in range(40):
            line += chars[int(pixels[x,y] / 28)]
        print(line)
    print("\n")

for p in sys.argv[1:]:
    print(p)
    to_ascii(p)
