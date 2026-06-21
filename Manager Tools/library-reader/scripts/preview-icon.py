from PIL import Image

path = r"D:\Desktop\Xedryk's_Report1\Manager Tools\library-reader\build\icon.ico"
img = Image.open(path)
# Save a 256x256 preview as PNG
img.save(r"D:\Desktop\Xedryk's_Report1\Manager Tools\library-reader\build\icon-preview.png")
print("Preview saved as icon-preview.png")
