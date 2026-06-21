import struct

path = r"D:\Desktop\Xedryk's_Report1\Manager Tools\library-reader\build\icon.ico"
with open(path, 'rb') as f:
    data = f.read()
print('File size:', len(data))
print('Hex:', data.hex())
