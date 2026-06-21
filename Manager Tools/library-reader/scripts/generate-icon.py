from PIL import Image, ImageDraw

def make_icon(path):
    sizes = [16, 32, 48, 64, 128, 256]
    images = []

    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        s = size / 256

        # book cover edges (dark navy)
        cover_color = (26, 26, 46, 255)
        page_color = (245, 240, 232, 255)
        page_shadow = (220, 215, 207, 255)
        bookmark_color = (212, 168, 67, 255)
        spine_color = (18, 18, 36, 255)
        gold_light = (232, 188, 87, 255)

        # Left page
        lp_x0 = int(28 * s)
        lp_y0 = int(32 * s)
        lp_x1 = int(124 * s)
        lp_y1 = int(220 * s)
        draw.rounded_rectangle([lp_x0, lp_y0, lp_x1, lp_y1], radius=int(6*s), fill=page_color)

        # Right page
        rp_x0 = int(132 * s)
        rp_y0 = int(32 * s)
        rp_x1 = int(228 * s)
        rp_y1 = int(220 * s)
        draw.rounded_rectangle([rp_x0, rp_y0, rp_x1, rp_y1], radius=int(6*s), fill=page_color)

        # Page shadow/gutter at center
        draw.rounded_rectangle([int(120*s), int(32*s), int(136*s), int(220*s)], radius=int(4*s), fill=page_shadow)

        # Cover bottom edge (slightly visible below pages)
        draw.rounded_rectangle([int(20*s), int(216*s), int(236*s), int(228*s)], radius=int(4*s), fill=cover_color)

        # Cover left edge
        draw.rounded_rectangle([int(20*s), int(28*s), int(28*s), int(228*s)], radius=int(4*s), fill=cover_color)

        # Cover right edge
        draw.rounded_rectangle([int(228*s), int(28*s), int(236*s), int(228*s)], radius=int(4*s), fill=cover_color)

        # Cover top edge
        draw.rounded_rectangle([int(20*s), int(24*s), int(236*s), int(32*s)], radius=int(4*s), fill=cover_color)

        # Spine in the middle
        draw.rounded_rectangle([int(124*s), int(24*s), int(132*s), int(228*s)], radius=int(3*s), fill=spine_color)

        # Bookmark from spine
        bm_x0 = int(126*s)
        bm_y0 = int(24*s)
        bm_x1 = int(138*s)
        bm_y1 = int(178*s)
        draw.polygon([
            (bm_x0, bm_y0),
            (bm_x1, bm_y0),
            (bm_x1, bm_y1),
            (int(132*s), int(168*s)),
            (bm_x0, bm_y1)
        ], fill=bookmark_color)

        # Gold bookmark detail line
        draw.line([(int(132*s), int(24*s)), (int(132*s), int(168*s))], fill=gold_light, width=max(1, int(2*s)))

        # Text lines on left page (subtle horizontal lines)
        if size >= 32:
            for i, y_frac in enumerate([0.3, 0.4, 0.5, 0.55, 0.65, 0.75, 0.8]):
                y = int(lp_y0 + (lp_y1 - lp_y0) * y_frac)
                x0 = int(lp_x0 + 12 * s)
                x1 = int(lp_x1 - 10 * s)
                if i == 4 or i == 6:
                    x1 = int(x0 + (x1 - x0) * 0.6)
                draw.line([(x0, y), (x1, y)], fill=(200, 195, 187, 180), width=max(1, int(2*s)))

            # Text lines on right page
            for i, y_frac in enumerate([0.35, 0.45, 0.55, 0.6, 0.7, 0.8, 0.85]):
                y = int(rp_y0 + (rp_y1 - rp_y0) * y_frac)
                x0 = int(rp_x0 + 12 * s)
                x1 = int(rp_x1 - 10 * s)
                if i == 3 or i == 5:
                    x1 = int(x0 + (x1 - x0) * 0.6)
                draw.line([(x0, y), (x1, y)], fill=(200, 195, 187, 180), width=max(1, int(2*s)))

        # Gold accent line on cover top
        if size >= 64:
            draw.line([(int(24*s), int(26*s)), (int(232*s), int(26*s))], fill=gold_light, width=max(1, int(1*s)))

        images.append(img)

    images[-1].save(path, format='ICO', sizes=[(s, s) for s in sizes])
    print(f'Icon saved to {path}')


if __name__ == '__main__':
    make_icon(r"D:\Desktop\Xedryk's_Report1\Manager Tools\library-reader\build\icon.ico")
