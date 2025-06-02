# 💎 Diamond Line - Luxury Sales Dashboard

An immersive 3D sales dashboard experience featuring luxury jewelry-inspired gauges set in a stunning beach driving scene.

## 🌟 Features

### Luxury Gauge Design
- **Mother of Pearl Finish**: Iridescent gauge faces with subtle reflections
- **Rose Gold Accents**: Premium bezels with animated gradient borders
- **Diamond Particles**: Floating sparkle effects throughout the scene
- **Jeweled Needles**: Gradient needles with ruby/gold tips and glow effects
- **Interactive Gauges**: Click to animate with elastic spring physics

### Immersive Beach Environment
- **Sunset Ocean Scene**: Dynamic water with realistic wave animations
- **Luxury Car**: Hot pink metallic sports car on the beach
- **Palm Trees**: Tropical setting with shadow casting
- **Sky System**: Atmospheric sunset lighting with golden hour tones
- **Particle Effects**: Floating diamond dust particles

### UI Elements
- **Brand Mark**: Diamond icon with gradient text effect
- **Stats Panel**: Glass morphism panel with key metrics
- **Gauge Container**: Frosted glass effect with pink border glow
- **Typography**: Playfair Display serif font for luxury feel

## 🚀 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open browser to `http://localhost:5173`

## 🎨 Color Palette
- **Soft Blush**: #FFB6C1
- **Champagne Gold**: #FFD700
- **Hot Pink**: #FF1493
- **Onyx Black**: #0A0A0A
- **Pearl White**: #FFFFFF

## 🔊 Sound Effects
Add a chime.mp3 file to the `/sounds` directory for gauge click effects.

## 🛠 Tech Stack
- **Three.js**: 3D graphics and scene rendering
- **GSAP**: Smooth animations and transitions
- **Vite**: Fast development server and build tool
- **WebGL**: Hardware-accelerated graphics

## 💡 Customization

### Gauge Labels
Edit the gauge configuration in `main.js`:
```javascript
const gauges = [
    { label: 'Revenue', value: 75 },
    { label: 'Deals', value: 60 },
    { label: 'Clients', value: 85 }
];
```

### Scene Settings
Adjust camera position, lighting, and environment colors in `main.js`.

### Styling
Modify luxury styling in `style.css` including:
- Gradient colors
- Animation timing
- Glass morphism effects
- Particle animations

## 🌈 Special Features

### Crown Mode
When gauges hit maximum performance, they transform with glowing diamond effects.

### Red Lipline Zones
Danger thresholds shown in rich crimson gloss arcs instead of traditional redlines.

### Easter Egg
Triple-click the center of any gauge for a secret heart-shaped sunglasses filter effect (to be implemented).

## 📱 Responsive Design
The dashboard adapts to different screen sizes while maintaining the luxury aesthetic.