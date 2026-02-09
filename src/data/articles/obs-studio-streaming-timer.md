## How to Stream Speaker Time to Online Audiences with OBS Studio

Managing time during a live presentation is critical. When your event has both in-person and remote attendees, the online audience often misses the visual cues that keep things on track in the room. A visible countdown timer in the stream solves this problem immediately. Chronograph.pro provides a dedicated fullscreen viewer page designed specifically for this purpose — it can be captured by OBS Studio as a browser source and layered into any stream layout.

This guide walks through the complete setup, from grabbing the viewer URL to fine-tuning the timer overlay for a polished broadcast.

---

## Why Online Viewers Need to See the Timer

Hybrid and virtual events present a unique challenge: speakers tend to address the room they are physically in, while remote participants watch through a flat video feed. Without a visible timer, online viewers have no sense of how much time remains in a talk, when a break is coming, or whether the schedule is running behind.

Displaying the Chronograph.pro timer directly in the stream gives remote attendees the same time awareness that in-room participants get from a physical display. It also helps remote moderators coordinate Q&A sessions and manage transitions without relying on chat messages or verbal cues.

---

## What You Need

Before starting, make sure you have the following ready:

- **A Chronograph.pro account** with at least one room and timer configured
- **OBS Studio** installed on your streaming computer (version 28 or later recommended; download from [obsproject.com](https://obsproject.com))
- **A streaming destination** — YouTube Live, Twitch, Zoom, or any platform that accepts an RTMP stream or screen share
- **A stable internet connection** on the machine running OBS, so the browser source can maintain a live connection to Chronograph.pro

---

## Step 1: Get the Viewer URL from Chronograph.pro

Every timer in Chronograph.pro has a dedicated fullscreen viewer page. This page shows only the timer display — no controls, no navigation, no distractions — making it ideal for capture.

1. Log in to your Chronograph.pro dashboard.
2. Open the room that contains the timer you want to stream.
3. Click the **Viewer** button (or the fullscreen/external display icon) on the timer you want to broadcast.
4. The viewer page will open in a new tab. The URL follows this pattern:

```
https://chronograph.pro/viewer/ROOM_ID/TIMER_ID
```

5. Copy this URL from your browser's address bar. You will paste it into OBS in the next step.

**Tip:** You can open this URL on any device to verify it is showing the correct timer before adding it to OBS.

---

## Step 2: Add a Browser Source in OBS Studio

1. Open OBS Studio and select the **Scene** where you want the timer to appear (or create a new scene).
2. In the **Sources** panel, click the **+** button at the bottom.
3. Select **Browser** from the source type list.
4. Give it a descriptive name, such as "Speaker Timer" or "Chronograph Timer", and click **OK**.

---

## Step 3: Configure the Browser Source

In the browser source properties dialog, apply the following settings:

| Setting | Recommended Value |
|---|---|
| **URL** | Paste the viewer URL you copied in Step 1 |
| **Width** | 1920 |
| **Height** | 1080 |
| **Control audio via OBS** | Unchecked (the timer page has no audio) |
| **Refresh browser when scene becomes active** | Checked |
| **Shutdown source when not visible** | Unchecked — keep this off so the timer maintains its WebSocket connection even when you switch scenes |

Click **OK** to create the source. The timer should appear in your OBS preview within a few seconds.

---

## Step 4: Set Custom CSS for a Transparent Background

If you want to overlay the timer on top of camera footage or slides rather than showing it as a full-frame display, you need to remove the background. Add the following in the **Custom CSS** field of the browser source properties:

```css
body {
  background-color: transparent !important;
  overflow: hidden;
}

#app {
  background-color: transparent !important;
}
```

This strips the default background and lets the timer digits float over whatever is behind them in the OBS scene. If the Chronograph.pro viewer page uses a specific container class for its background, you may also need:

```css
.viewer-container,
.fullscreen-viewer,
.timer-display-wrapper {
  background-color: transparent !important;
}
```

After applying custom CSS, right-click the browser source in OBS and select **Interact** to verify the page loaded correctly, then close the interaction window.

---

## Step 5: Position and Resize the Timer in Your Scene

With the browser source added, you can now position it within your OBS scene:

- **Click and drag** the source in the preview to move it.
- **Drag the corner handles** to resize it. Hold **Alt** while dragging an edge to crop rather than scale.
- For precise placement, right-click the source, go to **Transform** > **Edit Transform**, and enter exact pixel values for position, size, and crop.

Common placements:

| Layout | Position | Typical Size |
|---|---|---|
| Lower-third overlay | Bottom-left or bottom-center | 400 x 120 px |
| Corner badge | Top-right corner | 300 x 100 px |
| Full-frame timer scene | Centered, full canvas | 1920 x 1080 px |
| Side panel alongside slides | Right side, vertical strip | 480 x 1080 px |

---

## Using the Timer as an Overlay vs. a Full Scene

### Full Scene

Create a dedicated scene named something like "Timer Only". Add the browser source at full size (1920x1080). Switch to this scene when you want the stream to show nothing but the countdown — useful during breaks, between sessions, or as a holding screen before the event starts.

### Overlay

Add the browser source to your main presentation scene and scale it down. Position it in a corner or along the bottom edge. This keeps the timer visible while the speaker's camera and slides remain the primary content. Use the transparent background CSS from Step 4 so the timer blends seamlessly into the layout.

### Scene Transitions

You can use OBS **Studio Mode** to preview a scene before switching to it live. This is especially useful when you want to verify the timer is displaying the correct value before cutting to a full-frame timer scene.

---

## Making the Timer Look Good in Streams

### Match Your Brand Colors

If your event has a color scheme, you can tint the timer overlay using an OBS **Color Correction** filter:

1. Right-click the timer source and select **Filters**.
2. Under **Effect Filters**, click **+** and add **Color Correction**.
3. Adjust hue, saturation, and brightness to align with your branding.

Alternatively, if Chronograph.pro offers theme or color settings for the viewer page, configure those first so the source already matches your brand before any OBS adjustments.

### Add a Background Panel

If the transparent timer is hard to read over busy video, place a semi-transparent rectangle behind it:

1. Add a **Color Source** to your scene.
2. Set it to black with an opacity of around 60–70%.
3. Resize it to sit just behind the timer.
4. Move it below the timer source in the source order so it appears behind the digits.

This creates a clean, readable "pill" or "badge" effect behind the countdown.

### Font Readability at Small Sizes

If you scale the timer down significantly for a corner overlay, ensure the digits remain legible. The Chronograph.pro viewer page is designed with high-contrast text, but at very small sizes (below 250 px wide), consider adding a slight outline or drop shadow using an OBS filter, or simply increase the source size slightly.

---

## Chroma Key and Transparent Background Techniques

If the custom CSS approach does not produce a fully transparent background (for example, if the page renders a solid color behind the timer), you can use chroma key as a fallback:

1. In Chronograph.pro, if the viewer page background is a solid, uniform color (such as solid black or green), note that color.
2. Right-click the browser source in OBS and select **Filters**.
3. Under **Effect Filters**, add a **Chroma Key** filter.
4. Set the **Key Color Type** to match the background (green, blue, or use **Custom Color** and pick the exact hex value).
5. Adjust **Similarity** and **Smoothness** until the background disappears cleanly without eating into the timer digits.

**Important:** Chroma key works best when the background is a single, saturated color that does not appear anywhere in the timer display itself. If the timer uses green digits on a green background, chroma key will not work — use the CSS transparency method instead.

---

## Integration with Streaming and Meeting Platforms

### YouTube Live and Twitch

OBS connects to YouTube Live and Twitch via RTMP. The timer overlay will appear in the stream exactly as you see it in the OBS preview. No additional configuration is needed beyond the standard stream key setup.

1. In OBS, go to **Settings** > **Stream**.
2. Select your service (YouTube or Twitch) and enter your stream key.
3. Start streaming. The timer is embedded in the video output automatically.

### Zoom

Zoom does not accept RTMP input natively, but you can share the timer in two ways:

- **Virtual Camera:** In OBS, click **Start Virtual Camera**. In Zoom, select **OBS Virtual Camera** as your video source. Your entire OBS scene — including the timer overlay — becomes your Zoom video feed.
- **Screen Share:** Share the OBS preview window or the browser tab showing the Chronograph.pro viewer page directly in Zoom.

### Microsoft Teams and Google Meet

Use the same **OBS Virtual Camera** technique described for Zoom. Both Teams and Meet allow selecting alternative camera sources, and the OBS Virtual Camera will appear as an available device.

### Streamyard, Restream, and Cloud-Based Platforms

If you use a browser-based streaming studio, you may not need OBS at all. Many cloud platforms support adding a **Custom URL overlay** or **Web Source**. Paste the Chronograph.pro viewer URL directly into the platform's overlay or custom source input. Check your platform's documentation for the exact feature name.

---

## Troubleshooting Common Issues

### Timer Is Not Updating in OBS

**Cause:** The browser source may have lost its WebSocket connection to Chronograph.pro.

**Fix:**
1. Right-click the browser source and select **Properties**.
2. Click **Refresh cache of current page**.
3. If that does not work, toggle the source visibility off and on, or delete and re-add it.
4. Make sure **Shutdown source when not visible** is unchecked so the connection persists across scene switches.

### Timer Appears But Shows a Blank or White Page

**Cause:** The URL may be incorrect, the room or timer may have been deleted, or there is a network issue.

**Fix:**
1. Open the viewer URL in a regular browser tab to confirm it loads correctly.
2. Verify the room and timer still exist in your Chronograph.pro dashboard.
3. Check that the OBS machine has internet access and is not behind a firewall that blocks WebSocket connections.

### Timer Is the Wrong Size or Appears Cropped

**Cause:** The browser source dimensions do not match the viewer page layout.

**Fix:**
1. Open the browser source properties and set width to 1920 and height to 1080.
2. If you need a non-standard aspect ratio, adjust accordingly, but always start with 1920x1080.
3. Use **Edit Transform** (right-click > Transform > Edit Transform) to crop rather than scale if you only need a portion of the timer display.

### Timer Has a Black Background Instead of Transparent

**Cause:** The custom CSS was not applied, or the page structure does not match the CSS selectors.

**Fix:**
1. Double-check that the custom CSS is entered in the browser source properties, not in a separate file.
2. Right-click the source, select **Interact**, and inspect whether the page loaded correctly.
3. Try adding broader selectors to the custom CSS.
4. Fall back to the chroma key method described above if CSS transparency is not achievable.

### Timer Lags Behind the Actual Countdown

**Cause:** Network latency between OBS and the Chronograph.pro server, or the browser source refresh rate is too low.

**Fix:**
1. Ensure a stable, low-latency internet connection on the OBS machine.
2. In the browser source properties, check that **FPS** is set to at least 30.
3. Chronograph.pro uses real-time WebSocket updates, so under normal network conditions the delay should be minimal (under one second).

### OBS Performance Issues with Browser Source

**Cause:** Browser sources consume CPU and memory. Multiple browser sources or a very complex page can impact encoding performance.

**Fix:**
1. Close unnecessary browser sources in your scene.
2. Enable **Hardware (GPU) acceleration** in the browser source properties if available in your OBS version.
3. Monitor OBS's **Stats** panel (View > Stats) to check CPU and memory usage.
4. If performance is critical, consider using a dedicated machine for OBS encoding.

---

## Summary

Chronograph.pro's fullscreen viewer page is purpose-built for external display and stream capture. By adding it as a browser source in OBS Studio, you give online audiences the same time visibility that in-room attendees enjoy. The setup takes under five minutes: copy the viewer URL, add a browser source, apply transparent background CSS if needed, and position the timer in your scene. From there, it works with any streaming destination — YouTube, Twitch, Zoom, Teams, or custom RTMP endpoints — with no plugins or additional software required.
