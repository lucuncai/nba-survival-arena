/* ================================================================
 *  records.js — Local high-score persistence (localStorage)
 * ================================================================ */

const Records = {
  _key: 'nba_hoop_defense_records',

  /** Return the current saved records (or defaults). */
  get() {
    const defaults = { bestTime: 0, bestKills: 0, bestCombo: 0, bestLevel: 0, bestBlocks: 0, gamesPlayed: 0 };
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : { ...defaults };
    } catch {
      return { ...defaults };
    }
  },

  /**
   * Save a game's stats and return whether a new record was set.
   * @param {{ time: number, kills: number, combo: number, level: number, blocks: number }} stats
   * @returns {boolean}
   */
  save(stats) {
    try {
      const old = this.get();
      old.gamesPlayed++;
      let isNewRecord = false;
      if (stats.time   > old.bestTime)   { old.bestTime   = stats.time;   isNewRecord = true; }
      if (stats.kills  > old.bestKills)  { old.bestKills  = stats.kills;  isNewRecord = true; }
      if (stats.combo  > old.bestCombo)  { old.bestCombo  = stats.combo;  isNewRecord = true; }
      if (stats.level  > old.bestLevel)  { old.bestLevel  = stats.level;  isNewRecord = true; }
      if (stats.blocks > old.bestBlocks) { old.bestBlocks = stats.blocks; isNewRecord = true; }
      localStorage.setItem(this._key, JSON.stringify(old));
      return isNewRecord;
    } catch {
      return false;
    }
  },
};
