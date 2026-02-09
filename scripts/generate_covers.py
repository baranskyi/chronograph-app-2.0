"""
Generate Knowledge Base cover images for Chronograph.pro
Style: Futuristic pixel art with glassmorphism, dark theme, red accents
"""
import random
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH = 1200
HEIGHT = 675
BG_COLOR = (15, 20, 25)
RED = (239, 68, 68)
RED_DARK = (180, 40, 40)
RED_GLOW = (239, 68, 68, 60)
BLUE = (59, 130, 246)
GREEN = (34, 197, 94)
YELLOW = (234, 179, 8)
WHITE = (255, 255, 255)
GRAY = (107, 114, 128)
DARK_PANEL = (26, 31, 46)

OUTPUT_DIR = "/home/m0sthatedman/Personal-Super-Agent/Projects/chronograph-app/public/images/kb"

random.seed(42)


def draw_pixel_grid(draw, x, y, w, h, density=0.3, color=RED, pixel_size=4):
    """Draw a pixel art grid pattern"""
    for px in range(x, x + w, pixel_size + 1):
        for py in range(y, y + h, pixel_size + 1):
            if random.random() < density:
                alpha = random.randint(30, 120)
                c = (*color[:3], alpha) if len(color) == 3 else color
                draw.rectangle([px, py, px + pixel_size, py + pixel_size], fill=c)


def draw_glow_circle(img, cx, cy, radius, color, intensity=0.5):
    """Draw a soft glow circle"""
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for r in range(radius, 0, -2):
        alpha = int(intensity * 255 * (r / radius) ** 0.5 * (1 - r / radius))
        alpha = max(0, min(255, alpha))
        c = (*color[:3], alpha)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
    img.paste(Image.alpha_composite(Image.new('RGBA', img.size, (0, 0, 0, 0)), overlay), (0, 0), overlay)
    return img


def draw_glass_panel(draw, x, y, w, h, border_color=RED, fill_alpha=20):
    """Draw a glassmorphism panel"""
    # Panel fill
    draw.rounded_rectangle([x, y, x + w, y + h], radius=12,
                           fill=(*DARK_PANEL, fill_alpha + 40))
    # Border
    draw.rounded_rectangle([x, y, x + w, y + h], radius=12,
                           outline=(*border_color[:3], 80), width=1)
    # Top highlight
    draw.line([(x + 12, y), (x + w - 12, y)], fill=(*WHITE, 20), width=1)


def draw_timer_display(draw, x, y, time_str="12:34", color=RED, size=36):
    """Draw a digital timer display"""
    # Background panel
    draw.rounded_rectangle([x - 10, y - 8, x + len(time_str) * size * 0.6 + 10, y + size + 8],
                           radius=8, fill=(*BG_COLOR, 200))
    draw.rounded_rectangle([x - 10, y - 8, x + len(time_str) * size * 0.6 + 10, y + size + 8],
                           radius=8, outline=(*color[:3], 100), width=1)
    # Timer text (pixel style)
    for i, ch in enumerate(time_str):
        cx = x + i * int(size * 0.6)
        draw_pixel_char(draw, cx, y, ch, color, pixel_size=max(2, size // 12))


def draw_pixel_char(draw, x, y, char, color, pixel_size=3):
    """Draw a character in pixel art style"""
    # Simple pixel font for digits and colon
    patterns = {
        '0': ['111', '101', '101', '101', '111'],
        '1': ['010', '110', '010', '010', '111'],
        '2': ['111', '001', '111', '100', '111'],
        '3': ['111', '001', '111', '001', '111'],
        '4': ['101', '101', '111', '001', '001'],
        '5': ['111', '100', '111', '001', '111'],
        '6': ['111', '100', '111', '101', '111'],
        '7': ['111', '001', '001', '001', '001'],
        '8': ['111', '101', '111', '101', '111'],
        '9': ['111', '101', '111', '001', '111'],
        ':': ['0', '1', '0', '1', '0'],
    }
    pattern = patterns.get(char, ['000', '000', '000', '000', '000'])
    for row_idx, row in enumerate(pattern):
        for col_idx, pixel in enumerate(row):
            if pixel == '1':
                px = x + col_idx * (pixel_size + 1)
                py = y + row_idx * (pixel_size + 1)
                draw.rectangle([px, py, px + pixel_size, py + pixel_size], fill=color)


def draw_connection_line(draw, x1, y1, x2, y2, color=RED):
    """Draw a glowing connection line"""
    # Main line
    draw.line([(x1, y1), (x2, y2)], fill=(*color[:3], 80), width=2)
    # Glow
    draw.line([(x1, y1), (x2, y2)], fill=(*color[:3], 30), width=6)


def draw_dot_pattern(draw, x, y, w, h, spacing=20, color=RED):
    """Draw a dot grid pattern (ocean background style)"""
    for px in range(x, x + w, spacing):
        for py in range(y, y + h, spacing):
            alpha = random.randint(10, 50)
            draw.ellipse([px - 1, py - 1, px + 1, py + 1], fill=(*color[:3], alpha))


def create_base_image():
    """Create base image with background"""
    img = Image.new('RGBA', (WIDTH, HEIGHT), (*BG_COLOR, 255))
    draw = ImageDraw.Draw(img, 'RGBA')

    # Subtle dot grid (like ocean background)
    draw_dot_pattern(draw, 0, 0, WIDTH, HEIGHT, spacing=16, color=RED)

    # Subtle gradient overlay from bottom
    for y in range(HEIGHT // 2, HEIGHT):
        alpha = int(40 * ((y - HEIGHT // 2) / (HEIGHT // 2)))
        draw.line([(0, y), (WIDTH, y)], fill=(0, 0, 0, alpha))

    return img, draw


def generate_conference_cover():
    """Article 1: Multi-room conference time tracking"""
    img, draw = create_base_image()

    # Glow effects
    img = draw_glow_circle(img, 300, 340, 200, RED, 0.3)
    img = draw_glow_circle(img, 600, 340, 180, RED, 0.25)
    img = draw_glow_circle(img, 900, 340, 200, RED, 0.3)
    draw = ImageDraw.Draw(img, 'RGBA')

    # Three room panels
    rooms = [
        (80, 180, 300, 300, "HALL A", "23:45"),
        (430, 200, 340, 260, "HALL B", "14:20"),
        (820, 180, 300, 300, "HALL C", "07:15"),
    ]

    for rx, ry, rw, rh, name, timer in rooms:
        draw_glass_panel(draw, rx, ry, rw, rh, RED)
        # Room name
        draw.text((rx + 16, ry + 12), name, fill=(*WHITE, 200))
        # Timer display
        draw_timer_display(draw, rx + rw // 4, ry + rh // 3, timer, RED, 28)
        # Speaker silhouette (pixel)
        sx = rx + rw // 2
        sy = ry + rh - 60
        draw.rectangle([sx - 8, sy - 20, sx + 8, sy], fill=(*GRAY, 100))
        draw.ellipse([sx - 6, sy - 30, sx + 6, sy - 18], fill=(*GRAY, 100))
        # Pixel art elements
        draw_pixel_grid(draw, rx + 10, ry + rh - 40, rw - 20, 30, 0.15, RED, 3)

    # Connection lines between rooms
    draw_connection_line(draw, 380, 330, 430, 330, RED)
    draw_connection_line(draw, 770, 330, 820, 330, RED)

    # Dashboard panel at top
    draw_glass_panel(draw, 400, 60, 400, 80, RED, 30)
    draw.text((440, 75), "DASHBOARD", fill=(*RED[:3], 180))
    draw_connection_line(draw, 230, 180, 500, 140, RED)
    draw_connection_line(draw, 600, 140, 600, 200, RED)
    draw_connection_line(draw, 700, 140, 970, 180, RED)

    # Top pixel art border
    draw_pixel_grid(draw, 0, 0, WIDTH, 8, 0.4, RED, 4)

    # Bottom pixel art border
    draw_pixel_grid(draw, 0, HEIGHT - 8, WIDTH, 8, 0.4, RED, 4)

    return img.convert('RGB')


def generate_messaging_cover():
    """Article 2: Sending messages to speakers"""
    img, draw = create_base_image()

    # Glow
    img = draw_glow_circle(img, 600, 300, 250, RED, 0.35)
    img = draw_glow_circle(img, 400, 250, 150, BLUE, 0.15)
    draw = ImageDraw.Draw(img, 'RGBA')

    # Main viewer panel (speaker sees this)
    draw_glass_panel(draw, 300, 120, 600, 380, RED, 30)

    # Timer display
    draw_timer_display(draw, 450, 180, "08:32", RED, 40)

    # Message overlay (glassmorphism)
    draw.rounded_rectangle([360, 310, 840, 420], radius=16,
                           fill=(239, 68, 68, 40))
    draw.rounded_rectangle([360, 310, 840, 420], radius=16,
                           outline=(*RED[:3], 120), width=2)
    # Message text representation
    draw.text((400, 335), "5 min left — please wrap up", fill=(*WHITE, 220))
    # Message icon
    draw.rounded_rectangle([380, 330, 395, 345], radius=4, fill=(*RED[:3], 180))

    # Speaker silhouette at podium
    px, py = 160, 380
    # Podium
    draw.rectangle([px - 30, py, px + 30, py + 80], fill=(*DARK_PANEL, 150))
    draw.rectangle([px - 35, py, px + 35, py + 5], fill=(*GRAY, 100))
    # Person
    draw.rectangle([px - 10, py - 35, px + 10, py], fill=(*GRAY, 120))
    draw.ellipse([px - 8, py - 50, px + 8, py - 34], fill=(*GRAY, 120))

    # Arrow from dashboard to viewer
    draw_connection_line(draw, 100, 200, 300, 350, RED)

    # Small dashboard panel (organizer side)
    draw_glass_panel(draw, 30, 130, 200, 120, BLUE, 25)
    draw.text((55, 150), "ORGANIZER", fill=(*BLUE[:3], 150))
    draw_pixel_grid(draw, 45, 180, 170, 50, 0.2, BLUE, 3)

    # Pixel decorations
    draw_pixel_grid(draw, 0, 0, WIDTH, 10, 0.3, RED, 4)
    draw_pixel_grid(draw, 0, HEIGHT - 10, WIDTH, 10, 0.3, RED, 4)

    # Right side: message bubble pixels
    for i in range(5):
        y = 160 + i * 70
        w = random.randint(80, 140)
        draw_glass_panel(draw, 950, y, w, 35, RED if i % 2 == 0 else GRAY, 15)

    return img.convert('RGB')


def generate_obs_cover():
    """Article 3: OBS Studio streaming"""
    img, draw = create_base_image()

    # Glows
    img = draw_glow_circle(img, 500, 350, 200, RED, 0.3)
    img = draw_glow_circle(img, 900, 200, 150, BLUE, 0.2)
    draw = ImageDraw.Draw(img, 'RGBA')

    # OBS interface outline
    draw_glass_panel(draw, 60, 80, 700, 480, GRAY, 20)

    # OBS toolbar
    draw.rectangle([60, 80, 760, 115], fill=(*DARK_PANEL, 180))
    draw.text((80, 88), "OBS Studio", fill=(*WHITE, 150))
    # Toolbar buttons
    for i in range(5):
        draw.rounded_rectangle([200 + i * 40, 88, 230 + i * 40, 108], radius=4,
                              fill=(*DARK_PANEL, 200))

    # Scene preview area
    draw.rectangle([80, 130, 560, 400], fill=(8, 8, 12, 255))

    # Camera feed (abstract)
    draw_pixel_grid(draw, 80, 130, 480, 270, 0.08, GRAY, 5)

    # Timer overlay on the scene
    draw.rounded_rectangle([280, 330, 520, 390], radius=10,
                           fill=(*BG_COLOR, 220))
    draw.rounded_rectangle([280, 330, 520, 390], radius=10,
                           outline=(*RED[:3], 150), width=2)
    draw_timer_display(draw, 310, 345, "15:42", RED, 24)

    # Sources panel
    draw.rectangle([80, 410, 560, 540], fill=(*DARK_PANEL, 150))
    draw.text((95, 415), "Sources", fill=(*GRAY, 150))
    sources = ["Camera", "Timer (Browser)", "Slides"]
    for i, src in enumerate(sources):
        y = 435 + i * 30
        draw.rounded_rectangle([95, y, 540, y + 25], radius=4,
                              fill=(*BG_COLOR, 100))
        draw.text((110, y + 3), src, fill=(*WHITE, 120))

    # Controls panel
    draw.rectangle([570, 130, 745, 540], fill=(*DARK_PANEL, 100))
    btns = ["Start Stream", "Start Rec", "Virtual Cam"]
    for i, btn in enumerate(btns):
        y = 150 + i * 50
        color = GREEN if i == 0 else GRAY
        draw.rounded_rectangle([585, y, 730, y + 35], radius=6,
                              fill=(*color[:3], 60))
        draw.text((600, y + 8), btn, fill=(*color[:3], 180))

    # Streaming targets (right side)
    platforms = [
        (830, 120, "YouTube", RED),
        (830, 250, "Twitch", (145, 70, 255)),
        (830, 380, "Zoom", BLUE),
    ]
    for px, py, name, color in platforms:
        draw_glass_panel(draw, px, py, 300, 90, color, 20)
        draw.text((px + 20, py + 15), name, fill=(*color[:3], 200))
        # Connection line from OBS
        draw_connection_line(draw, 760, 300, px, py + 45, color)
        # Signal dots
        for j in range(3):
            draw.ellipse([px + 200 + j * 20, py + 40, px + 208 + j * 20, py + 48],
                        fill=(*GREEN[:3], 150))

    # Pixel borders
    draw_pixel_grid(draw, 0, 0, WIDTH, 8, 0.4, RED, 4)
    draw_pixel_grid(draw, 0, HEIGHT - 8, WIDTH, 8, 0.4, RED, 4)

    return img.convert('RGB')


def generate_church_education_cover():
    """Article 4: Churches and education"""
    img, draw = create_base_image()

    # Divider line
    draw.line([(600, 40), (600, HEIGHT - 40)], fill=(*RED[:3], 40), width=2)

    # LEFT SIDE: Church
    img = draw_glow_circle(img, 300, 340, 180, RED, 0.25)
    draw = ImageDraw.Draw(img, 'RGBA')

    # Church building outline (pixel art)
    # Steeple
    points = [(280, 100), (300, 60), (320, 100)]
    draw.polygon(points, fill=(*DARK_PANEL, 150))
    # Cross
    draw.rectangle([296, 45, 304, 65], fill=(*RED[:3], 150))
    draw.rectangle([290, 50, 310, 56], fill=(*RED[:3], 150))
    # Building body
    draw.rectangle([220, 100, 380, 280], fill=(*DARK_PANEL, 120))
    draw.rectangle([220, 100, 380, 280], outline=(*GRAY, 60), width=1)
    # Window (arched)
    draw.rectangle([270, 130, 330, 200], fill=(*BG_COLOR, 200))
    draw.arc([270, 110, 330, 160], 180, 0, fill=(*GRAY, 80), width=1)
    # Door
    draw.rectangle([280, 220, 320, 280], fill=(*BG_COLOR, 200))

    # Confidence monitor at pulpit
    draw_glass_panel(draw, 100, 340, 200, 120, RED, 30)
    draw_timer_display(draw, 130, 370, "28:15", GREEN, 20)
    draw.text((115, 405), "Sermon Timer", fill=(*GRAY, 120))

    # Pews (pixel rows)
    for i in range(4):
        y = 500 + i * 25
        draw.rectangle([80, y, 220, y + 12], fill=(*DARK_PANEL, 80))
        draw.rectangle([240, y, 380, y + 12], fill=(*DARK_PANEL, 80))

    # Label
    draw.text((200, 640), "CHURCH", fill=(*RED[:3], 100))

    # RIGHT SIDE: Education
    img = draw_glow_circle(img, 900, 340, 180, BLUE, 0.25)
    draw = ImageDraw.Draw(img, 'RGBA')

    # Classroom - projector screen
    draw_glass_panel(draw, 700, 100, 400, 220, BLUE, 25)
    # Timer on screen
    draw_timer_display(draw, 820, 170, "04:30", YELLOW, 30)
    draw.text((760, 230), "Student Presentation", fill=(*GRAY, 120))

    # Desks (pixel art)
    desk_positions = [
        (700, 400), (800, 400), (900, 400), (1000, 400),
        (700, 470), (800, 470), (900, 470), (1000, 470),
        (700, 540), (800, 540), (900, 540), (1000, 540),
    ]
    for dx, dy in desk_positions:
        draw.rectangle([dx, dy, dx + 60, dy + 35], fill=(*DARK_PANEL, 100))
        draw.rectangle([dx, dy, dx + 60, dy + 35], outline=(*GRAY, 40), width=1)
        # Student head
        draw.ellipse([dx + 24, dy - 12, dx + 36, dy], fill=(*GRAY, 80))

    # Teacher podium
    draw.rectangle([850, 340, 920, 380], fill=(*DARK_PANEL, 150))
    draw.ellipse([875, 315, 895, 335], fill=(*GRAY, 120))

    # Label
    draw.text((830, 640), "EDUCATION", fill=(*BLUE[:3], 100))

    # Pixel borders
    draw_pixel_grid(draw, 0, 0, WIDTH, 8, 0.35, RED, 4)
    draw_pixel_grid(draw, 0, HEIGHT - 8, WIDTH, 8, 0.35, RED, 4)

    return img.convert('RGB')


def generate_sports_cover():
    """Article 5: Sports competition timing"""
    img, draw = create_base_image()

    # Glows
    img = draw_glow_circle(img, 600, 300, 250, RED, 0.35)
    img = draw_glow_circle(img, 200, 200, 120, GREEN, 0.15)
    img = draw_glow_circle(img, 1000, 200, 120, YELLOW, 0.15)
    draw = ImageDraw.Draw(img, 'RGBA')

    # Main arena timer display (center, large)
    draw_glass_panel(draw, 320, 60, 560, 160, RED, 35)
    draw_timer_display(draw, 420, 90, "03:27", RED, 48)
    # Color zone bar
    bar_y = 180
    draw.rectangle([340, bar_y, 540, bar_y + 12], fill=(*GREEN[:3], 150))
    draw.rectangle([540, bar_y, 700, bar_y + 12], fill=(*YELLOW[:3], 150))
    draw.rectangle([700, bar_y, 860, bar_y + 12], fill=(*RED[:3], 150))
    # Current position indicator
    draw.polygon([(780, bar_y - 5), (790, bar_y - 5), (785, bar_y)], fill=(*WHITE, 200))

    # Competition floor
    draw.rectangle([100, 260, 1100, 580], fill=(*DARK_PANEL, 40))
    draw.rectangle([100, 260, 1100, 580], outline=(*RED[:3], 30), width=1)

    # Mat/Ring areas
    mats = [
        (150, 290, 280, 250, "MAT 1", "2:15", GREEN),
        (460, 290, 280, 250, "MAT 2", "0:45", RED),
        (770, 290, 280, 250, "MAT 3", "4:58", GREEN),
    ]
    for mx, my, mw, mh, name, timer, color in mats:
        # Mat outline
        draw.rectangle([mx, my, mx + mw, my + mh], fill=(*DARK_PANEL, 60))
        draw.rectangle([mx, my, mx + mw, my + mh], outline=(*color[:3], 60), width=1)
        # Mat name
        draw.text((mx + 10, my + 5), name, fill=(*GRAY, 120))
        # Athletes (pixel art figures)
        # Figure 1
        cx1 = mx + mw // 3
        cy1 = my + mh // 2
        draw.rectangle([cx1 - 6, cy1 - 15, cx1 + 6, cy1 + 5], fill=(*RED[:3], 120))
        draw.ellipse([cx1 - 5, cy1 - 22, cx1 + 5, cy1 - 13], fill=(*RED[:3], 120))
        # Figure 2
        cx2 = mx + 2 * mw // 3
        draw.rectangle([cx2 - 6, cy1 - 15, cx2 + 6, cy1 + 5], fill=(*BLUE[:3], 120))
        draw.ellipse([cx2 - 5, cy1 - 22, cx2 + 5, cy1 - 13], fill=(*BLUE[:3], 120))
        # Small timer
        draw_glass_panel(draw, mx + mw // 2 - 50, my + mh - 50, 100, 35, color, 25)
        draw_timer_display(draw, mx + mw // 2 - 30, my + mh - 42, timer, color, 14)

    # Judge tablets on sides
    for jx, jy in [(30, 340), (30, 440), (1110, 340), (1110, 440)]:
        draw_glass_panel(draw, jx, jy, 55, 75, GRAY, 20)
        draw_pixel_grid(draw, jx + 5, jy + 5, 45, 65, 0.3, RED, 2)

    # QR code representation
    draw_glass_panel(draw, 50, 590, 100, 60, RED, 20)
    draw_pixel_grid(draw, 60, 600, 80, 40, 0.5, WHITE, 3)
    draw.text((65, 600), "QR", fill=(*RED[:3], 120))

    # Spectator area (pixel dots)
    for i in range(50):
        sx = random.randint(120, 1080)
        sy = random.randint(595, 650)
        draw.ellipse([sx - 3, sy - 3, sx + 3, sy + 3], fill=(*GRAY, 40 + random.randint(0, 40)))

    # Pixel borders
    draw_pixel_grid(draw, 0, 0, WIDTH, 10, 0.45, RED, 4)
    draw_pixel_grid(draw, 0, HEIGHT - 10, WIDTH, 10, 0.45, RED, 4)

    return img.convert('RGB')


def main():
    covers = [
        ("cover-conference", generate_conference_cover),
        ("cover-messaging", generate_messaging_cover),
        ("cover-obs", generate_obs_cover),
        ("cover-church-education", generate_church_education_cover),
        ("cover-sports", generate_sports_cover),
    ]

    for name, generator in covers:
        img = generator()
        path = f"{OUTPUT_DIR}/{name}.webp"
        img.save(path, 'WEBP', quality=90)
        print(f"Generated: {path}")


if __name__ == "__main__":
    main()
