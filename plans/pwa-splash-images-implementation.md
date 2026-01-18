# PWA Splash Images Implementation Plan

## Overview

Generate iOS splash screen images from the new `souschefy.png` logo and update the application to use them.

## Required Splash Screen Images

Based on the PWA implementation plan, the following iOS splash screens are needed:

| Filename          | Dimensions | Device               |
| ----------------- | ---------- | -------------------- |
| ios-640x1136.png  | 640x1136   | iPhone 5/SE          |
| ios-750x1334.png  | 750x1334   | iPhone 6/7/8         |
| ios-1242x2208.png | 1242x2208  | iPhone 6+/7+/8+      |
| ios-1125x2436.png | 1125x2436  | iPhone X/XS          |
| ios-1242x2688.png | 1242x2688  | iPhone XS Max        |
| ios-828x1792.png  | 828x1792   | iPhone XR            |
| ios-1284x2778.png | 1284x2778  | iPhone 12/13 Pro Max |

## Splash Screen Design Specifications

### Background Color

- **Primary**: `#ffffff` (white) - matches the app's theme color
- **Alternative**: Light gray or subtle gradient if desired

### Logo Placement

- **Position**: Centered both horizontally and vertically
- **Size**: 200-300px width (proportional to screen size)
- **Padding**: Minimum 40px from edges

### Design Guidelines

1. **Clean and Minimal**: Use the logo centered on a solid background
2. **Consistent Branding**: Match the app's visual identity
3. **High Quality**: Use the original `souschefy.png` at full resolution
4. **No Text**: Splash screens should only show the logo, no additional text

## Implementation Steps

### Step 1: Generate Splash Screen Images

Use ImageMagick or a similar tool to generate splash screens from `souschefy.png`:

```bash
# Navigate to public directory
cd public

# Generate splash screens using ImageMagick
# iPhone 5/SE (640x1136)
convert -size 640x1136 xc:#ffffff -gravity center souschefy.png -resize 200x200 -compose over -composite splash/ios-640x1136.png

# iPhone 6/7/8 (750x1334)
convert -size 750x1334 xc:#ffffff -gravity center souschefy.png -resize 220x220 -compose over -composite splash/ios-750x1334.png

# iPhone 6+/7+/8+ (1242x2208)
convert -size 1242x2208 xc:#ffffff -gravity center souschefy.png -resize 280x280 -compose over -composite splash/ios-1242x2208.png

# iPhone X/XS (1125x2436)
convert -size 1125x2436 xc:#ffffff -gravity center souschefy.png -resize 250x250 -compose over -composite splash/ios-1125x2436.png

# iPhone XS Max (1242x2688)
convert -size 1242x2688 xc:#ffffff -gravity center souschefy.png -resize 280x280 -compose over -composite splash/ios-1242x2688.png

# iPhone XR (828x1792)
convert -size 828x1792 xc:#ffffff -gravity center souschefy.png -resize 240x240 -compose over -composite splash/ios-828x1792.png

# iPhone 12/13 Pro Max (1284x2778)
convert -size 1284x2778 xc:#ffffff -gravity center souschefy.png -resize 300x300 -compose over -composite splash/ios-1284x2778.png
```

**Alternative**: Use an online tool like [AppIconGenerator](https://appicon.co/) or [MakeAppIcon](https://makeappicon.com/) to generate all splash screens at once.

### Step 2: Update index.html with iOS Splash Screen Meta Tags

Add the following meta tags to the `<head>` section of `index.html`:

```html
<!-- iOS Splash Screen Meta Tags -->
<link
  rel="apple-touch-startup-image"
  href="/splash/ios-640x1136.png"
  media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
/>
<link
  rel="apple-touch-startup-image"
  href="/splash/ios-750x1334.png"
  media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
/>
<link
  rel="apple-touch-startup-image"
  href="/splash/ios-1242x2208.png"
  media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
/>
<link
  rel="apple-touch-startup-image"
  href="/splash/ios-1125x2436.png"
  media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
/>
<link
  rel="apple-touch-startup-image"
  href="/splash/ios-1242x2688.png"
  media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
/>
<link
  rel="apple-touch-startup-image"
  href="/splash/ios-828x1792.png"
  media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
/>
<link
  rel="apple-touch-startup-image"
  href="/splash/ios-1284x2778.png"
  media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
/>
```

### Step 3: Verify File Structure

Ensure the following file structure exists:

```
public/
├── souschefy.png
├── splash/
│   ├── ios-640x1136.png
│   ├── ios-750x1334.png
│   ├── ios-1242x2208.png
│   ├── ios-1125x2436.png
│   ├── ios-1242x2688.png
│   ├── ios-828x1792.png
│   └── ios-1284x2778.png
└── manifest.json
```

## Testing Checklist

- [ ] Test splash screen on iPhone 5/SE
- [ ] Test splash screen on iPhone 6/7/8
- [ ] Test splash screen on iPhone 6+/7+/8+
- [ ] Test splash screen on iPhone X/XS
- [ ] Test splash screen on iPhone XS Max
- [ ] Test splash screen on iPhone XR
- [ ] Test splash screen on iPhone 12/13 Pro Max
- [ ] Verify logo is centered on all devices
- [ ] Verify background color matches app theme
- [ ] Check that splash screen displays quickly (< 2 seconds)

## Notes

- Splash screens are only supported on iOS devices
- Android uses a different splash screen mechanism (defined in manifest.json)
- The splash screen will display when the app is launched from the home screen
- Ensure images are optimized for fast loading (keep file sizes reasonable)
- Consider adding a subtle gradient or pattern to the background if the white background is too plain

## Additional Considerations

1. **Landscape Orientation**: Currently only portrait splash screens are included. Add landscape versions if needed.
2. **iPad Support**: Consider adding iPad splash screens if the app is used on tablets.
3. **Dark Mode**: Consider creating dark mode splash screens if the app supports dark mode.
4. **Loading Animation**: Consider adding a subtle loading animation to the splash screen for a more polished experience.
