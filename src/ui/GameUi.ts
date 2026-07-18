import { eventBus } from "../core/EventBus";
import { saveStore } from "../core/SaveStore";
import { audio } from "../game/AudioSystem";
import { CHARACTERS, PERMANENT_UPGRADES, getCharacter, getPermanentUpgrade } from "../game/data";
import {
  nextPermanentCost,
  permanentLevel,
  purchasePermanent,
  unlockCharacter,
} from "../game/MetaSystem";
import type {
  ActionName,
  CharacterId,
  ChoiceOffer,
  CooldownSnapshot,
  HudSnapshot,
  LockerSnapshot,
  PermanentUpgradeId,
  RunResult,
  ScreenName,
} from "../game/types";

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing UI element #${id}`);
  return found as T;
}

export class GameUi {
  private readonly screens: Record<ScreenName, HTMLElement> = {
    loading: element("loading-screen"),
    menu: element("menu-screen"),
    tutorial: element("tutorial-screen"),
    upgrade: element("upgrade-screen"),
    pause: element("pause-screen"),
    results: element("results-screen"),
    locker: element("locker-screen"),
    select: element("select-screen"),
  };

  private readonly hud = element("hud");
  private readonly abilityButtons = new Map<ActionName, HTMLButtonElement>();
  private attackRepeat: number | undefined;
  private joystickPointer: number | undefined;

  constructor() {
    this.preventBrowserGestures();
    this.bindMenu();
    this.bindLocker();
    this.bindSelect();
    this.bindAbilities();
    this.bindJoystick();
    this.bindGameEvents();
    this.renderBestRun();
    this.renderSelectedLegend();
  }

  private preventBrowserGestures(): void {
    const shell = element("game-shell");
    const prevent = (event: Event): void => event.preventDefault();
    ["gesturestart", "gesturechange", "gestureend", "dblclick"].forEach((eventName) => {
      shell.addEventListener(eventName, prevent, { passive: false });
    });
    shell.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length > 1) event.preventDefault();
      },
      { passive: false },
    );
  }

  private bindMenu(): void {
    element<HTMLButtonElement>("start-game").addEventListener("click", () => {
      audio.unlock();
      eventBus.emit("ui:start", { mode: "campaign" });
    });
    element<HTMLButtonElement>("start-endless").addEventListener("click", () => {
      audio.unlock();
      eventBus.emit("ui:start", { mode: "endless" });
    });
    element<HTMLButtonElement>("how-to-play").addEventListener("click", () => {
      eventBus.emit("ui:tutorial", undefined);
    });
    element<HTMLButtonElement>("close-tutorial").addEventListener("click", () => {
      saveStore.update({ tutorialSeen: true });
      eventBus.emit("ui:tutorial-close", undefined);
    });
    element<HTMLButtonElement>("resume-game").addEventListener("click", () => {
      eventBus.emit("ui:resume", undefined);
    });
    element<HTMLButtonElement>("quit-game").addEventListener("click", () => {
      eventBus.emit("ui:quit", undefined);
    });
    element<HTMLButtonElement>("play-again").addEventListener("click", () => {
      audio.unlock();
      eventBus.emit("ui:play-again", undefined);
    });
    element<HTMLButtonElement>("results-menu").addEventListener("click", () => {
      eventBus.emit("ui:menu", undefined);
    });
  }

  private bindLocker(): void {
    element<HTMLButtonElement>("open-locker").addEventListener("click", () => {
      this.renderLocker();
      this.screens.locker.classList.add("screen-visible");
    });
    element<HTMLButtonElement>("close-locker").addEventListener("click", () => {
      this.screens.locker.classList.remove("screen-visible");
      this.renderBestRun();
    });
  }

  private renderLocker(): void {
    const snapshot = this.buildLockerSnapshot();
    element("locker-cred").textContent = `STREET CRED: ${snapshot.streetCred.toLocaleString()}`;
    const container = element("locker-cards");
    container.replaceChildren();
    snapshot.entries.forEach((entry) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "upgrade-card locker-card";
      const icon = document.createElement("span");
      icon.className = "upgrade-icon";
      icon.textContent = entry.icon;
      const level = document.createElement("small");
      level.textContent = `LV ${entry.level} / ${entry.maxLevel}`;
      const title = document.createElement("h3");
      title.textContent = entry.name;
      const description = document.createElement("p");
      description.textContent = entry.description;
      const cost = document.createElement("span");
      cost.className = "upgrade-rank";
      cost.textContent = entry.cost === null ? "MAXED" : `${entry.cost.toLocaleString()} CRED`;
      card.append(icon, level, title, description, cost);
      if (entry.cost === null || !entry.affordable) {
        card.disabled = true;
      } else {
        card.addEventListener("click", () => this.buyPermanent(entry.id));
      }
      container.appendChild(card);
    });
  }

  private buildLockerSnapshot(): LockerSnapshot {
    const { profile } = saveStore.load();
    return {
      streetCred: profile.streetCred,
      entries: PERMANENT_UPGRADES.map((definition) => {
        const level = permanentLevel(profile, definition.id);
        const cost = nextPermanentCost(definition, level);
        return {
          id: definition.id,
          name: definition.name,
          description: definition.description,
          icon: definition.icon,
          level,
          maxLevel: definition.maxLevel,
          cost,
          affordable: cost !== null && profile.streetCred >= cost,
        };
      }),
    };
  }

  private buyPermanent(id: PermanentUpgradeId): void {
    const { profile } = saveStore.load();
    const result = purchasePermanent(profile, getPermanentUpgrade(id));
    if (result.purchased) {
      saveStore.updateProfile(result.profile);
      audio.skill();
    }
    this.renderLocker();
  }

  private bindSelect(): void {
    element<HTMLButtonElement>("open-select").addEventListener("click", () => {
      this.renderSelect();
      this.screens.select.classList.add("screen-visible");
    });
    element<HTMLButtonElement>("close-select").addEventListener("click", () => {
      this.screens.select.classList.remove("screen-visible");
      this.renderSelectedLegend();
    });
  }

  private renderSelect(): void {
    const { profile } = saveStore.load();
    element("select-cred").textContent = `STREET CRED: ${profile.streetCred.toLocaleString()}`;
    const container = element("select-cards");
    container.replaceChildren();
    Object.values(CHARACTERS).forEach((character) => {
      const unlocked = profile.unlockedCharacters.includes(character.id);
      const selected = profile.selectedCharacter === character.id;
      const card = document.createElement("div");
      card.className = `select-card${selected ? " selected" : ""}`;
      const img = document.createElement("img");
      img.src = `${import.meta.env.BASE_URL}assets/${character.textureKey}.png`;
      img.alt = character.name;
      const title = document.createElement("small");
      title.textContent = character.title;
      const name = document.createElement("h3");
      name.textContent = character.name;
      const description = document.createElement("p");
      description.textContent = character.description;
      const action = document.createElement("button");
      action.type = "button";
      action.className = "primary-button select-action";
      if (selected) {
        action.textContent = "SELECTED";
        action.disabled = true;
      } else if (unlocked) {
        action.textContent = "SELECT";
        action.addEventListener("click", () => this.selectCharacter(character.id));
      } else {
        action.textContent = `UNLOCK · ${character.unlockCost.toLocaleString()} CRED`;
        action.disabled = profile.streetCred < character.unlockCost;
        action.addEventListener("click", () => this.unlockAndSelect(character.id));
      }
      card.append(img, title, name, description, action);
      container.appendChild(card);
    });
  }

  private selectCharacter(id: CharacterId): void {
    saveStore.updateProfile({ selectedCharacter: id });
    audio.skill();
    this.renderSelect();
    this.renderSelectedLegend();
  }

  private unlockAndSelect(id: CharacterId): void {
    const { profile } = saveStore.load();
    const result = unlockCharacter(profile, getCharacter(id));
    if (result.purchased) {
      saveStore.updateProfile({
        streetCred: result.profile.streetCred,
        unlockedCharacters: result.profile.unlockedCharacters,
        selectedCharacter: id,
      });
      audio.ultimate();
    }
    this.renderSelect();
    this.renderSelectedLegend();
  }

  private renderSelectedLegend(): void {
    const character = getCharacter(saveStore.load().profile.selectedCharacter);
    const rate = (value: number): string => String(Math.max(40, Math.min(99, Math.round(value))));
    element("legend-number").textContent = character.jerseyNumber;
    element("legend-title").textContent = character.title;
    element("legend-name").textContent = character.name;
    element("legend-desc").textContent = character.description;
    element("legend-power").textContent = rate(character.stats.damage * 2.3);
    element("legend-defense").textContent = rate(character.stats.maxHp / 4);
    element("legend-speed").textContent = rate(character.stats.moveSpeed / 3.4);
    const portrait = document.getElementById("legend-portrait-img") as HTMLImageElement | null;
    if (portrait) portrait.src = `${import.meta.env.BASE_URL}assets/${character.textureKey}.png`;
  }

  private bindAbilities(): void {
    document.querySelectorAll<HTMLButtonElement>(".ability[data-action]").forEach((button) => {
      const action = button.dataset.action as ActionName;
      this.abilityButtons.set(action, button);

      const fire = (event: PointerEvent): void => {
        event.preventDefault();
        audio.unlock();
        button.classList.add("action-active");
        eventBus.emit("ui:action", action);
        if (action === "attack") {
          window.clearInterval(this.attackRepeat);
          this.attackRepeat = window.setInterval(() => eventBus.emit("ui:action", "attack"), 90);
        }
      };
      const release = (): void => {
        button.classList.remove("action-active");
        window.clearInterval(this.attackRepeat);
        this.attackRepeat = undefined;
      };

      button.addEventListener("pointerdown", fire);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });
  }

  private bindJoystick(): void {
    const zone = element("joystick-zone");
    const base = element("joystick-base");
    const thumb = element("joystick-thumb");

    const update = (event: PointerEvent): void => {
      if (this.joystickPointer !== event.pointerId) return;
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const maxDistance = rect.width * 0.34;
      const distance = Math.hypot(dx, dy);
      const scale = distance > maxDistance ? maxDistance / distance : 1;
      const x = dx * scale;
      const y = dy * scale;
      thumb.style.transform = `translate(${x}px, ${y}px)`;
      eventBus.emit("input:joystick", {
        x: x / maxDistance,
        y: y / maxDistance,
      });
    };

    const release = (event: PointerEvent): void => {
      if (this.joystickPointer !== event.pointerId) return;
      this.joystickPointer = undefined;
      thumb.style.transform = "translate(0, 0)";
      eventBus.emit("input:joystick", { x: 0, y: 0 });
    };

    zone.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.joystickPointer = event.pointerId;
      zone.setPointerCapture(event.pointerId);
      update(event);
    });
    zone.addEventListener("pointermove", update);
    zone.addEventListener("pointerup", release);
    zone.addEventListener("pointercancel", release);
  }

  private bindGameEvents(): void {
    eventBus.on("game:screen", ({ name, visible }) => {
      this.screens[name].classList.toggle("screen-visible", visible);
      if (name === "menu" && visible) {
        this.renderBestRun();
        this.renderSelectedLegend();
      }
    });
    eventBus.on("game:loadout", ({ character, abilities }) => {
      const nameEl = document.getElementById("hud-player-name");
      if (nameEl) nameEl.textContent = character;
      abilities.forEach(({ action, name, icon }) => {
        const button = this.abilityButtons.get(action);
        if (!button) return;
        const iconEl = button.querySelector("i");
        const labelEl = button.querySelector("b");
        if (iconEl) iconEl.textContent = icon;
        if (labelEl) labelEl.textContent = name;
      });
    });
    eventBus.on("game:hud-visible", (visible) => {
      this.hud.classList.toggle("hud-visible", visible);
    });
    eventBus.on("game:loading", ({ progress, copy }) => {
      element("loading-fill").style.width = `${Math.round(progress * 100)}%`;
      element("loading-copy").textContent = copy;
    });
    eventBus.on("game:hud", (snapshot) => this.renderHud(snapshot));
    eventBus.on("game:threat", ({ visible, copy }) => {
      element("threat-copy").textContent = copy ?? "SHOT INBOUND";
      element("threat-banner").classList.toggle("threat-visible", visible);
    });
    eventBus.on("game:upgrade-choice", (upgrades) => this.renderUpgradeChoices(upgrades));
    eventBus.on("game:results", (result) => this.renderResults(result));
  }

  private renderHud(snapshot: HudSnapshot): void {
    const playerRatio = Math.max(0, snapshot.playerHp / snapshot.playerMaxHp);
    const hoopRatio = Math.max(0, snapshot.hoopHp / snapshot.hoopMaxHp);
    element("player-health").style.width = `${playerRatio * 100}%`;
    element("hoop-health").style.width = `${hoopRatio * 100}%`;
    element("player-health-copy").textContent =
      `${Math.ceil(snapshot.playerHp)} / ${Math.ceil(snapshot.playerMaxHp)}`;
    element("hoop-health-copy").textContent =
      `${Math.ceil(snapshot.hoopHp)} / ${Math.ceil(snapshot.hoopMaxHp)}`;
    element("wave-label").textContent = snapshot.endless
      ? `WAVE ${snapshot.wave}`
      : `WAVE ${snapshot.wave} / ${snapshot.waveCount}`;
    element("timer-label").textContent = this.formatTime(snapshot.elapsedSeconds);
    element("score-label").textContent = `${snapshot.score.toLocaleString()} PTS`;
    element("level-label").textContent = `LV. ${snapshot.level}`;
    element("objective-label").textContent = snapshot.objective;
    element("hype-fill").style.height = `${snapshot.hype}%`;
    element("hype-copy").textContent = Math.floor(snapshot.hype).toString();

    this.renderCooldown("skill1", snapshot.cooldowns.skill1);
    this.renderCooldown("skill2", snapshot.cooldowns.skill2);
    this.renderCooldown("skill3", snapshot.cooldowns.skill3);
    this.renderCooldown("ultimate", snapshot.cooldowns.ultimate);
    this.abilityButtons.get("ultimate")?.classList.toggle("ultimate-ready", snapshot.hype >= 100);
  }

  private renderCooldown(action: Exclude<ActionName, "attack">, cooldown: CooldownSnapshot): void {
    const button = this.abilityButtons.get(action);
    const overlay = button?.querySelector<HTMLElement>("em");
    if (!overlay) return;
    if (cooldown.remaining <= 0) {
      overlay.style.transform = "translateY(100%)";
      overlay.textContent = "";
      return;
    }
    const ratio = Math.min(1, cooldown.remaining / Math.max(0.01, cooldown.total));
    overlay.style.transform = `translateY(${Math.round((1 - ratio) * 100)}%)`;
    overlay.textContent = Math.ceil(cooldown.remaining).toString();
  }

  private renderUpgradeChoices(offers: ChoiceOffer[]): void {
    const container = element("upgrade-cards");
    container.replaceChildren();
    offers.forEach((offer) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = `upgrade-card rarity-${offer.rarity}`;
      const icon = document.createElement("span");
      icon.className = "upgrade-icon";
      icon.textContent = offer.icon;
      const category = document.createElement("small");
      category.textContent =
        offer.kind === "evolution" ? "EVOLUTION" : `${offer.rarity.toUpperCase()} · ${offer.label}`;
      const title = document.createElement("h3");
      title.textContent = offer.name;
      const description = document.createElement("p");
      description.textContent = offer.description;
      const rank = document.createElement("span");
      rank.className = "upgrade-rank";
      rank.textContent =
        offer.kind === "evolution"
          ? "EVOLVE"
          : offer.rank >= offer.maxRank
            ? "MAX RANK"
            : `RANK ${offer.rank} / ${offer.maxRank}`;
      card.append(icon, category, title, description, rank);
      card.addEventListener("click", () => eventBus.emit("ui:upgrade-selected", offer.id), {
        once: true,
      });
      container.appendChild(card);
    });
    this.screens.upgrade.classList.add("screen-visible");
  }

  private renderResults(result: RunResult): void {
    element("results-eyebrow").textContent = result.victory ? "RUN COMPLETE" : "THE RIM FELL";
    const title = element("results-title");
    title.replaceChildren(
      document.createTextNode(result.victory ? "COURT" : "RUN"),
      document.createElement("br"),
    );
    const accent = document.createElement("span");
    accent.textContent = result.victory ? "HELD" : "OVER";
    title.appendChild(accent);

    const stats = element("results-stats");
    stats.replaceChildren();
    const resultRows: Array<readonly [string, string]> = [
      [result.score.toLocaleString(), "SCORE"],
      [this.formatTime(result.elapsedSeconds), "TIME"],
      [result.kills.toString(), "TAKEDOWNS"],
      [result.blocks.toString(), "BLOCKS"],
      [`${result.maxCombo}x`, "MAX COMBO"],
      [result.wave.toString(), "WAVE"],
      [`+${result.credEarned.toLocaleString()}`, "STREET CRED"],
    ];
    resultRows.forEach(([value, label]) => {
      const item = document.createElement("div");
      item.className = "result-stat";
      const valueNode = document.createElement("b");
      valueNode.textContent = value;
      const labelNode = document.createElement("span");
      labelNode.textContent = label;
      item.append(valueNode, labelNode);
      stats.appendChild(item);
    });
    this.renderBestRun();
  }

  private renderBestRun(): void {
    const save = saveStore.load();
    element("best-run").textContent =
      save.gamesPlayed > 0
        ? `BEST RUN  //  ${save.bestScore.toLocaleString()} PTS  //  WAVE ${save.bestWave}  //  ${save.bestBlocks} BLOCKS`
        : "NO RUNS ON RECORD — MAKE THE FIRST ONE COUNT";
    element("menu-cred").textContent = `STREET CRED  //  ${save.profile.streetCred.toLocaleString()}`;
  }

  private formatTime(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60)
      .toString()
      .padStart(2, "0")}`;
  }
}
