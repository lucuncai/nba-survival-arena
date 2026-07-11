/* ================================================================
 *  MenuScene.js — Character selection and game start
 * ================================================================ */

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const cx = GW / 2;
    const cy = GH / 2;
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // ── Title ──
    this.add.text(cx, 50, 'NBA Survival Arena', {
      fontSize: '52px', fontFamily: 'system-ui', color: '#f1c40f',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 105, 'HOOP DEFENSE', {
      fontSize: '22px', fontFamily: 'system-ui', color: '#e74c3c',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(cx, 140, 'Defend the hoop. Block every shot.', {
      fontSize: '16px', fontFamily: 'system-ui', color: '#95a5a6',
    }).setOrigin(0.5);

    // ── Best records ──
    const rec = Records.get();
    if (rec.gamesPlayed > 0) {
      this.add.text(cx, GH - 30,
        `Best: ${rec.bestTime}s | ${rec.bestKills} kills | ${rec.bestBlocks} blocks | Lv.${rec.bestLevel} | ${rec.gamesPlayed} games`, {
        fontSize: '14px', fontFamily: 'system-ui', color: '#7f8c8d',
      }).setOrigin(0.5);
    }

    // ── Character cards ──
    this.selectedChar = 0;
    this.cards = [];

    CHARACTERS.forEach((ch, i) => {
      const x = cx + (i - 1) * 340;
      const y = cy + 10;

      const card = this.add.rectangle(x, y, 290, 460, 0x2c3e50)
        .setStrokeStyle(3, i === 0 ? 0xf1c40f : 0x555555)
        .setInteractive({ useHandCursor: true });

      // Sprite preview
      const sprKey = `${ch.id}_idle`;
      if (this.textures.exists(sprKey)) {
        const spr = this.add.sprite(x, y - 110, sprKey, 0).setScale(0.55);
        if (this.anims.exists(sprKey)) spr.play(sprKey);
      } else {
        this.add.circle(x, y - 110, 45, ch.projCol);
        this.add.text(x, y - 110, ch.id[0].toUpperCase(), {
          fontSize: '36px', color: '#fff', fontFamily: 'system-ui',
        }).setOrigin(0.5);
      }

      // Name & role
      this.add.text(x, y + 10, ch.name, {
        fontSize: '20px', color: '#fff', fontFamily: 'system-ui', fontStyle: 'bold',
      }).setOrigin(0.5);

      const roleColors = {
        'Paint Guardian':      '#e74c3c',
        'Perimeter Assassin':  '#9b59b6',
        'Zone Controller':     '#3498db',
      };
      this.add.text(x, y + 35, `[ ${ch.role} ]`, {
        fontSize: '13px', color: roleColors[ch.role] || '#fff', fontFamily: 'system-ui',
      }).setOrigin(0.5);

      // Stats
      this.add.text(x, y + 58, `HP:${ch.hp}  ATK:${ch.atk}  SPD:${ch.spd}`, {
        fontSize: '12px', color: '#95a5a6', fontFamily: 'system-ui',
      }).setOrigin(0.5);

      // Skills list
      const skills = [ch.skill1, ch.skill2, ch.skill3, ch.ult];
      this.add.text(x, y + 100,
        skills.map((s, si) => `${si < 3 ? `Q${si + 1}` : 'R'}: ${s.name}`).join('\n'), {
        fontSize: '12px', color: '#f1c40f', fontFamily: 'system-ui', lineSpacing: 4, align: 'center',
      }).setOrigin(0.5);

      // Skill descriptions
      this.add.text(x, y + 175, skills.map(s => s.desc).join('\n'), {
        fontSize: '10px', color: '#bdc3c7', fontFamily: 'system-ui',
        lineSpacing: 3, align: 'center', wordWrap: { width: 260 },
      }).setOrigin(0.5);

      card.on('pointerdown', () => {
        this.selectedChar = i;
        this.cards.forEach((c, j) => c.setStrokeStyle(3, j === i ? 0xf1c40f : 0x555555));
      });
      this.cards.push(card);
    });

    // ── Start button ──
    const btn = this.add.rectangle(cx, cy + 310, 280, 60, 0xe74c3c)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 310, 'START GAME', {
      fontSize: '28px', color: '#fff', fontFamily: 'system-ui',
    }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('Game', { charIndex: this.selectedChar }));
  }
}
