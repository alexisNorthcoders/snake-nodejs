import { WebSocket } from "ws";

export interface Player {
    colours?: {
        body: string;
        head: string;
        eyes: string;
    }
    id: string;
    name?: string;
    snake: Snake;
    ws: WebSocket;
    type: string;
}

export interface Connections {
    conn: WebSocket
    playerId: string
    roomId: string
}

export type Coordinates = {
    x: number
    y: number
}

export interface Snake {
    x: number;
    y: number;
    tail: Coordinates[];
    isDead: boolean;
    score: number;
    size: 0;
    speed: Coordinates
    type: string
    playerId: string
}

export interface Room {
    connections: number;
    id: string;
    players: Player[];
    nextPositionIndex: number;
    hasGameStarted: boolean;
    aliveCount: number;
    foodCoordinates: number[][];
}

export type Rooms = { [roomName: string]: Room };

export interface newPlayerEvent {
    event: "newPlayer";
    player: Pick<Player,'colours'|'name'|'id'>
}