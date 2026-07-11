import type { GameEvents } from "../game/types";

type EventName = keyof GameEvents;
type Handler<T> = (payload: T) => void;

class TypedEventBus {
  private readonly listeners = new Map<EventName, Set<Handler<unknown>>>();

  on<K extends EventName>(event: K, handler: Handler<GameEvents[K]>): () => void {
    const handlers = this.listeners.get(event) ?? new Set<Handler<unknown>>();
    handlers.add(handler as Handler<unknown>);
    this.listeners.set(event, handlers);

    return () => {
      handlers.delete(handler as Handler<unknown>);
      if (handlers.size === 0) this.listeners.delete(event);
    };
  }

  emit<K extends EventName>(event: K, payload: GameEvents[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    [...handlers].forEach((handler) => handler(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new TypedEventBus();
