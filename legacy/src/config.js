/* ================================================================
 *  config.js — Global constants, layout, and hoop configuration
 * ================================================================ */

/** Viewport dimensions (logical resolution) */
const GW = 1920;
const GH = 1080;

/** World dimensions (physics bounds) */
const WORLD_W = 3840;
const WORLD_H = 2160;

/** Hoop position — dead center of the world */
const COURT_CX = WORLD_W / 2;
const COURT_CY = WORLD_H / 2;

/** Hoop (basket) configuration */
const HOOP_CFG = {
  maxHp:      300,
  radius:     60,   // visual ring radius (px)
  bodyRadius: 40,   // physics body radius — smaller so enemies can approach
};
