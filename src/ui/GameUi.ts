import { eventBus } from "../core/EventBus";
import { saveStore } from "../core/SaveStore";
import { audio } from "../game/AudioSystem";
import type {
  ActionName,
  CooldownSnapshot,
  HudSnapshot,
  RunResult,
  ScreenName,
  UpgradeDefinition,
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
  };

  private readonly hud = element("hud");
  private readonly abilityButtons = new Map<ActionName, HTMLButtonElement>();
  private attackRepeat: number | undefined;
  private joystickPointer: number | undefined;

  constructor() {
    this.bindMenu();
    this.bindAbilities();
    this.bindJoystick();
    this.bindGameEvents();
    this.renderBestRun();
  }

  private bindMenu(): void {
    element<HTMLButtonElement>("start-game").addEventListener("click", () => {
      audio.unlock();
      eventBus.emit("ui:start", undefined);
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
      if (name === "menu" && visible) this.renderBestRun();
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
    element("wave-label").textContent = `WAVE ${snapshot.wave} / ${snapshot.waveCount}`;
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

  private renderUpgradeChoices(upgrades: UpgradeDefinition[]): void {
    const container = element("upgrade-cards");
    container.replaceChildren();
    upgrades.forEach((upgrade) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "upgrade-card";
      const icon = document.createElement("span");
      icon.className = "upgrade-icon";
      icon.textContent = upgrade.icon;
      const category = document.createElement("small");
      category.textContent = upgrade.category;
      const title = document.createElement("h3");
      title.textContent = upgrade.name;
      const description = document.createElement("p");
      description.textContent = upgrade.description;
      card.append(icon, category, title, description);
      card.addEventListener("click", () => eventBus.emit("ui:upgrade-selected", upgrade.id), { once: true });
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
    [
      [result.score.toLocaleString(), "SCORE"],
      [this.formatTime(result.elapsedSeconds), "TIME"],
      [result.kills.toString(), "TAKEDOWNS"],
      [result.blocks.toString(), "BLOCKS"],
      [`${result.maxCombo}x`, "MAX COMBO"],
      [result.wave.toString(), "WAVE"],
    ].forEach(([value, label]) => {
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
  }

  private formatTime(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60)
      .toString()
      .padStart(2, "0")}`;
  }
}
