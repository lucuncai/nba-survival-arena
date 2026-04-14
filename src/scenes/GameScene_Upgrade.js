/* ================================================================
 *  GameScene_Upgrade.js — Level-up overlay and upgrade selection
 *
 *  Applied as a mixin to GameScene.prototype.
 * ================================================================ */

Object.assign(GameScene.prototype, {

  /** Show the level-up overlay with 3 random upgrade choices. */
  _showUpgrade() {
    this.isPaused = true;
    this.physics.pause();
    this.input.enabled = false;

    const overlay = document.getElementById('upgrade-overlay');
    overlay.style.display = 'flex';

    // Prevent touch events from leaking to Phaser canvas
    const stopProp = e => e.stopPropagation();
    overlay.addEventListener('touchstart', stopProp, { passive: false });
    overlay.addEventListener('touchmove',  stopProp, { passive: false });
    overlay.addEventListener('touchend',   stopProp, { passive: false });

    document.getElementById('upgrade-level').textContent = this.player.level;

    const cardsEl = document.getElementById('upgrade-cards');
    cardsEl.innerHTML = '';

    // Pick 3 random upgrades from the pool
    const pool = [...UPGRADES];
    const picks = [];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }

    const resumeGame = () => {
      overlay.style.display = 'none';
      setTimeout(() => {
        this.input.enabled = true;
        this.isPaused = false;
        this.physics.resume();
      }, 100);
    };

    picks.forEach(upg => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `<h3>${upg.name}</h3><p>${upg.desc}</p>`;
      card.addEventListener('click', () => {
        upg.fn(this.player, this);
        resumeGame();
      });
      card.addEventListener('touchend', e => {
        e.preventDefault();
        e.stopPropagation();
        upg.fn(this.player, this);
        resumeGame();
      }, { passive: false });
      cardsEl.appendChild(card);
    });
  },
});
