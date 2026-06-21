from PIL import Image

path = r"D:\Desktop\Xedryk's_Report1\Manager Tools\library-reader\build\icon.ico"
img = Image.open(path)
print('Frames:', getattr(img, 'n_frames', 1))
for i in range(getattr(img, 'n_frames', 1)):
    img.seek(i)
    print(f'  Frame {i}: {img.size}')
