#!/usr/bin/env python3
"""
Assemble index.html from modular source files.

Build order (dependency-safe):
  1. html_head_v2.txt          — DOM shell + CSS
  2. Phaser engine             — extracted from existing index.html
  3. SPRITE_DATA               — extracted from existing index.html
  4. src/ modules               — concatenated in dependency order
  5. closing tags
"""
import re, pathlib

ROOT = pathlib.Path(__file__).parent

# ── Extract Phaser engine and SPRITE_DATA from existing bundle ──
with open(ROOT / 'index.html', 'r') as f:
    orig = f.read()

phaser_match = re.search(r'(<script>/\* Phaser.*?</script>)', orig, re.DOTALL)
assert phaser_match, "Could not find Phaser engine block"
phaser_block = phaser_match.group(1)
print(f"[build] Phaser engine: {len(phaser_block):,} chars")

sprite_match = re.search(r'(<script id="sprite-data">.*?</script>)', orig, re.DOTALL)
assert sprite_match, "Could not find SPRITE_DATA block"
sprite_block = sprite_match.group(1)
print(f"[build] SPRITE_DATA:   {len(sprite_block):,} chars")

# ── Source modules in dependency order ──
SRC_FILES = [
    'src/config.js',
    'src/sfx.js',
    'src/records.js',
    'src/enemies.js',
    'src/characters.js',
    'src/upgrades.js',
    'src/drops.js',
    'src/sprites.js',
    'src/particle_textures.js',
    'src/arena_background.js',
    'src/post_processing.js',
    'src/scenes/BootScene.js',
    'src/scenes/MenuScene.js',
    'src/scenes/GameScene.js',
    'src/scenes/GameScene_Combat.js',
    'src/scenes/GameScene_EnemyAI.js',
    'src/scenes/GameScene_Spawning.js',
    'src/scenes/GameScene_Skills.js',
    'src/scenes/GameScene_Upgrade.js',
    'src/main.js',
]

game_code_parts = []
for rel in SRC_FILES:
    path = ROOT / rel
    assert path.exists(), f"Missing source file: {rel}"
    game_code_parts.append(f'// ── {rel} {"─" * (60 - len(rel))}')
    game_code_parts.append(path.read_text())
    print(f"[build] {rel:50s} ({len(path.read_text()):>6,} chars)")

game_code = '\n\n'.join(game_code_parts)

# ── Read HTML shell ──
head = (ROOT / 'html_head_v2.txt').read_text()

# ── Assemble ──
out = ROOT / 'index_v2.html'
with open(out, 'w') as f:
    f.write(head)
    f.write('\n')
    f.write(phaser_block)
    f.write('\n')
    f.write(sprite_block)
    f.write('\n<script>\n')
    f.write(game_code)
    f.write('\n</script>\n')
    f.write('</body>\n</html>\n')

print(f"\n[build] Assembled {out.name} ({out.stat().st_size:,} bytes)")

# ── Verify ──
content = out.read_text()
opens  = len(re.findall(r'<script[^>]*>', content))
closes = content.count('</script>')
print(f"[verify] <script> tags: {opens} open, {closes} close")
assert opens == closes, "Mismatched script tags!"
assert 'Phaser' in content, "Phaser missing!"
assert 'SPRITE_DATA' in content, "SPRITE_DATA missing!"
assert 'GameScene' in content, "GameScene missing!"
assert 'BootScene' in content, "BootScene missing!"
assert 'MenuScene' in content, "MenuScene missing!"
assert 'CHARACTERS' in content, "CHARACTERS missing!"
assert 'ENEMY_TYPES' in content, "ENEMY_TYPES missing!"
print("[verify] All checks passed!")
