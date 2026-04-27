import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type TopicHandler<T = any> = (data: T) => void;

const WS_URL = "http://localhost:8080/ws";

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
    debug: () => {},
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

export function subscribeToTopic<T = any>(topic: string, handler: TopicHandler<T>) {
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

  if (subscriptions.size === 0 && pendingTopics.size === 0 && client) {
    client.deactivate();
    client = null;
    connected = false;
    connecting = false;
  }
}

export function subscribeGpsLive(handler: TopicHandler) {
  subscribeToTopic("/topic/gps/live", handler);
}

export function unsubscribeGpsLive() {
  unsubscribeFromTopic("/topic/gps/live");
}

export function subscribeGpsVehicle(vehicleId: number, handler: TopicHandler) {
  subscribeToTopic(`/topic/gps/vehicle/${vehicleId}`, handler);
}

export function unsubscribeGpsVehicle(vehicleId: number) {
  unsubscribeFromTopic(`/topic/gps/vehicle/${vehicleId}`);
}

export function subscribeGpsMission(missionId: number, handler: TopicHandler) {
  subscribeToTopic(`/topic/gps/mission/${missionId}`, handler);
}

export function unsubscribeGpsMission(missionId: number) {
  unsubscribeFromTopic(`/topic/gps/mission/${missionId}`);
}