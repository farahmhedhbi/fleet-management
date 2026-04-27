import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type TopicHandler<T = any> = (data: T) => void;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";

let client: Client | null = null;
let connected = false;
let connecting = false;

const subscriptions = new Map<string, StompSubscription>();
const handlers = new Map<string, TopicHandler>();
const pendingTopics = new Set<string>();

function createClient() {
  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: (str) => {
      console.log("WS:", str);
    },
  });

  client.onConnect = () => {
    connected = true;
    connecting = false;

    pendingTopics.forEach((topic) => {
      subscribeInternal(topic);
    });
  };

  client.onStompError = (frame) => {
    console.error("STOMP error:", frame.headers["message"]);
    console.error(frame.body);
  };

  client.onWebSocketClose = () => {
    connected = false;
    connecting = false;
    subscriptions.clear();
  };

  client.activate();
}

function ensureClient() {
  if (client?.active || connecting) return;

  connecting = true;
  createClient();
}

function subscribeInternal(topic: string) {
  if (!client || !connected) return;
  if (subscriptions.has(topic)) return;

  const subscription = client.subscribe(topic, (message: IMessage) => {
    try {
      const handler = handlers.get(topic);
      if (!handler) return;

      const data = JSON.parse(message.body);
      handler(data);
    } catch (error) {
      console.error("Invalid WebSocket message:", error);
    }
  });

  subscriptions.set(topic, subscription);
}

export function subscribeToTopic<T = any>(
  topic: string,
  handler: TopicHandler<T>
) {
  handlers.set(topic, handler as TopicHandler);
  pendingTopics.add(topic);

  ensureClient();

  if (connected) {
    subscribeInternal(topic);
  }
}

export function unsubscribeFromTopic(topic: string) {
  const subscription = subscriptions.get(topic);

  if (subscription) {
    subscription.unsubscribe();
    subscriptions.delete(topic);
  }

  handlers.delete(topic);
  pendingTopics.delete(topic);

  // Ne pas faire client.deactivate() ici.
  // En React dev/StrictMode, ça ferme la socket pendant la reconnexion.
}

/* ================= GPS LIVE ================= */

export function subscribeGpsLive<T = any>(handler: TopicHandler<T>) {
  subscribeToTopic("/topic/gps/live", handler);
}

export function unsubscribeGpsLive() {
  unsubscribeFromTopic("/topic/gps/live");
}

/* ================= EVENTS LIVE ================= */

export function subscribeEventsLive<T = any>(handler: TopicHandler<T>) {
  subscribeToTopic("/topic/events/live", handler);
}

export function unsubscribeEventsLive() {
  unsubscribeFromTopic("/topic/events/live");
}

/* ================= VEHICLE LIVE ================= */

export function subscribeVehicleLive<T = any>(
  vehicleId: number,
  handler: TopicHandler<T>
) {
  subscribeToTopic(`/topic/vehicles/${vehicleId}/live`, handler);
}

export function unsubscribeVehicleLive(vehicleId: number) {
  unsubscribeFromTopic(`/topic/vehicles/${vehicleId}/live`);
}

/* ================= VEHICLE EVENTS ================= */

export function subscribeVehicleEvents<T = any>(
  vehicleId: number,
  handler: TopicHandler<T>
) {
  subscribeToTopic(`/topic/vehicles/${vehicleId}/events`, handler);
}

export function unsubscribeVehicleEvents(vehicleId: number) {
  unsubscribeFromTopic(`/topic/vehicles/${vehicleId}/events`);
}

/* ================= MISSION LIVE ================= */

export function subscribeMissionLive<T = any>(
  missionId: number,
  handler: TopicHandler<T>
) {
  subscribeToTopic(`/topic/missions/${missionId}/live`, handler);
}

export function unsubscribeMissionLive(missionId: number) {
  unsubscribeFromTopic(`/topic/missions/${missionId}/live`);
}

/* ================= MISSION EVENTS ================= */

export function subscribeMissionEvents<T = any>(
  missionId: number,
  handler: TopicHandler<T>
) {
  subscribeToTopic(`/topic/missions/${missionId}/events`, handler);
}

export function unsubscribeMissionEvents(missionId: number) {
  unsubscribeFromTopic(`/topic/missions/${missionId}/events`);
}

/* ================= MANUAL DISCONNECT ================= */

export function disconnectWebSocket() {
  client?.deactivate();
  client = null;
  connected = false;
  connecting = false;
  subscriptions.clear();
  handlers.clear();
  pendingTopics.clear();
}