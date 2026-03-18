# 🍄 Mushee Run

An exciting endless runner game featuring Mushee, a brave mushroom character navigating through 10 unique themed worlds!

![Mushee Run](https://img.shields.io/badge/version-1.0.0-brightgreen) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)

## 🎮 Game Features

### Core Gameplay
- **Endless Runner** - Run as far as you can and beat your high score!
- **10 Themed Levels** - Beautiful worlds that change every 2000 points
- **3 Difficulty Levels** - Easy, Medium, and Hard modes
- **Flying & Ground Obstacles** - Dynamic challenges from above and below
- **Power-ups** - Collect special items for temporary boosts
- **Progressive Difficulty** - Game gets harder as you advance through levels

### 🎯 Difficulty Modes

#### 🌱 Easy Mode
- 💚 **5 Hearts** - More forgiving
- 🐌 **85% Speed** - Slower gameplay
- 🎯 **65% Smaller Obstacles** - Easier to dodge
- 🍓 **More Collectibles** - Frequent spawns
- 🛡️ **Fewer Obstacles** - More breathing room

#### ⚡ Medium Mode (Default)
- 💛 **3 Hearts** - Standard challenge
- 🏃 **100% Speed** - Normal pace
- 📏 **Normal Obstacles** - Balanced size
- 🍇 **Balanced Collectibles** - Standard spawn rate
- ⚖️ **Fair Difficulty** - Original game balance

#### 🔥 Hard Mode
- ❤️ **2 Hearts** - High stakes
- 🚀 **140% Speed** - Lightning fast
- 📏 **Normal Obstacles** - Full size challenges
- 🍒 **Rare Collectibles** - Hard to find
- 💀 **More Obstacles** - Intense challenge

## 🌍 10 Themed Worlds

1. **🌿 Sunny Forest** - Lush green starting area
2. **🍄 Mushee Cave** - Mystical purple cavern
3. **✨ Glow World** - Bioluminescent realm
4. **🍭 Candy Land** - Sweet pink paradise
5. **🌅 Desert Dusk** - Golden sands at sunset
6. **❄️ Ice World** - Frozen tundra
7. **🌋 Volcano** - Fiery lava lands
8. **🌊 Ocean Depths** - Deep blue waters
9. **🏰 Sky Castle** - Floating fortress
10. **🌌 Cosmic Void** - Outer space finale

## 🎪 Obstacles

### Ground Obstacles
- 🍄 **Poison Mushroom** - Toxic red mushroom
- 🪨 **Rock** - Solid stone barrier
- 🌵 **Cactus** - Spiky desert plant
- 🐛 **Bug Enemy** - Crawling threat
- 🐌 **Slug Enemy** - Slow moving danger

### Flying Obstacles (NEW!)
- 🦅 **Eagle** - Brown wings, medium flap speed
- 🦇 **Bat** - Purple wings, fast flapping
- 🐝 **Bee** - Transparent buzzing wings
- 🦋 **Butterfly** - Colorful gradient wings, graceful motion

Each flying obstacle has **unique wing animations**:
- Real flapping wings that rotate
- Different speeds per creature
- Vertical bobbing motion
- Three height levels: Low, Mid, High

## 🎁 Collectibles

### Points
- 🪙 **Coin** - 10 points
- 🍓 **Berry** - 5 points
- ⭐ **Star** - 25 points
- 🌟 **Big Star** - 50 points

### Power-ups
- 🏅 **Golden Mushee** - Invincibility for 5 seconds
- 🍃 **Speed Leaf** - Speed boost for 4 seconds
- 💖 **Heart** - Restore 1 health (or +20 points if full)

## 🎮 Controls

### Keyboard
- **Space** or **↑ Arrow** - Jump
- **Escape** - Pause game

### Touch/Mobile
- **Tap Screen** - Jump

### Double Jump
- Press jump again while in air for a second jump!

## 🎵 Audio Features

- **Background Music** - Procedurally generated retro chiptune
- **Sound Effects** - Custom Web Audio API sounds for:
  - Jump & Double Jump
  - Collecting items
  - Power-ups
  - Taking damage
  - Level up
  - Game over

## 📊 Game Mechanics

### Scoring System
- **Distance Score** - Earn 1 point per frame
- **Collectibles** - Bonus points for items
- **Level Progression** - Every 2000 points = new level (max level 10)

### Health System
- Hearts decrease when hit by obstacles
- Invincibility cooldown after taking damage
- Game over when all hearts are lost
- Power-ups can restore health

### High Scores
- **Separate high scores** per difficulty level
- Saved in browser localStorage
- Persistent across sessions
- New record badge on game over

## 🎨 Visual Features

- **Smooth Animations** - 60 FPS canvas rendering
- **Parallax Backgrounds** - Moving clouds and trees
- **Dynamic Themes** - Color palettes change per level
- **Particle Effects** - Explosions on collision
- **Invincibility Shield** - Glowing aura effect
- **Camera Shake** - Impact feedback

## 📱 Responsive Design

- **Desktop** - Full HD support
- **Mobile** - Touch-optimized controls
- **Tablet** - Adaptive layout
- **Auto-resize** - Canvas scales to window

## 🛠️ Technical Stack

- **Pure JavaScript (ES6)** - No frameworks
- **HTML5 Canvas** - Hardware-accelerated rendering
- **Web Audio API** - Procedural sound generation
- **CSS3** - Modern styling and animations
- **LocalStorage** - Save high scores

## 📦 Installation

1. **Download** all files:
   - `index.html`
   - `script.js`
   - `style.css`
   - `mushee.ico`

2. **Open** `index.html` in a modern web browser

3. **Play!** No server or build process needed

## 🚀 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

**Requirements:**
- JavaScript enabled
- HTML5 Canvas support
- Web Audio API support

## 🎮 How to Play

1. **Select Difficulty** - Choose Easy, Medium, or Hard from dropdown
2. **Click Start Game** - Begin running!
3. **Jump** - Avoid obstacles and collect items
4. **Survive** - Keep going to increase your score
5. **Beat Records** - Try to beat your high score!

### Tips for Success
- 🎯 **Watch ahead** - Look for upcoming obstacles
- 💚 **Collect hearts** - When you see them, grab them!
- ⭐ **Go for stars** - High point value
- 🏅 **Use power-ups wisely** - Golden Mushee makes you invincible
- 🦅 **Flying obstacles** - Time your jumps for different heights
- 📈 **Practice** - Start on Easy to learn patterns

## 🐛 Bug Fixes (v1.0.0)

### Fixed Issues:
✅ Pine tree trunk now connects properly with leaves
✅ Flying obstacles have proper visible wings with animation
✅ Obstacle sizes adjusted for balance
✅ Flying heights optimized for playability
✅ Pause screen now has Restart and Menu buttons
✅ Difficulty-based high scores working correctly
✅ Heart display shows correct amount per difficulty
✅ Background music stops/resumes properly
✅ Power-up notifications clear correctly

## 📋 Game Structure

```
MusheeRun/
│
├── index.html          # Main HTML file
├── style.css           # All game styling
├── script.js           # Game engine (2100+ lines)
├── mushee.ico          # Favicon
└── README.md           # This file
```

## 🎨 Customization

### Modify Difficulty
Edit `DIFFICULTY_CONFIG` in `script.js`:
```javascript
const DIFFICULTY_CONFIG = {
  easy: {
    maxHealth: 5,
    speedMultiplier: 0.85,
    obstacleSizeMod: 0.65,
    // ... more settings
  }
}
```

### Add New Themes
Add to `THEMES` array in `script.js`:
```javascript
{
  sky: ["#color1", "#color2"],
  ground: "#color3",
  grass: "#color4",
  // ... more theme properties
  name: "🎨 Your Theme"
}
```

### Adjust Obstacle Spawn Rates
Modify in `update()` function:
```javascript
const obstacleInterval = Math.max(80 - level * 5, 30);
const collectInterval = Math.max(60 - level * 3, 25);
```

## 🏆 Achievements to Try

- 🥉 **Bronze Runner** - Reach level 3
- 🥈 **Silver Dasher** - Reach level 6
- 🥇 **Gold Sprinter** - Reach level 10
- 💎 **Diamond Master** - Score 20,000+ points
- 🔥 **Hardcore Hero** - Beat Hard mode
- 💯 **Perfectionist** - Collect 100 items in one run

## 🤝 Credits

- **Game Design & Development** - Mushee Run Team
- **Artwork** - Canvas 2D Graphics
- **Sound** - Web Audio API Synthesis
- **Testing** - Community Playtesters

## 📄 License

MIT License - Feel free to modify and distribute!

## 🔮 Future Updates (Planned)

- 🎯 More obstacle types
- 🏪 Shop system for cosmetics
- 👥 Multiplayer mode
- 📱 Mobile app version
- 🎵 More music tracks
- 🏅 Achievement system
- 💾 Cloud save support

## 📞 Support

Found a bug? Have suggestions?
- Create an issue on GitHub
- Contact the development team
- Join our community

---

**Enjoy playing Mushee Run! 🍄🏃‍♂️**

*Made with ❤️ and JavaScript*
