import struct

path = r"D:\Desktop\Xedryk's_Report1\Manager Tools\library-reader\build\icon.ico"
with open(path, 'rb') as f:
    data = f.read()

# ICO header
reserved, icon_type, count = struct.unpack_from('<HHH', data, 0)
print(f'Reserved: {reserved}, Type: {icon_type}, Count: {count}')

for i in range(count):
    offset = 6 + i * 16
    w, h, colors, reserved2, planes, bpp, size, data_offset = struct.unpack_from('<BBBBHHII', data, offset)
    w = w if w != 0 else 256
    h = h if h != 0 else 256
    print(f'  Entry {i}: {w}x{h}, bpp={bpp}, size={size} bytes')
