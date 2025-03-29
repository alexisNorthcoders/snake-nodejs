import WebSocket, { Server as WebSocketServer } from 'ws';
import { newPlayerEvent, Player, Rooms } from './interfaces';
import { gameConfig, generateFoodCoordinates, startingPositions } from './gameConfig';
import * as url from 'url';
import { startGameLoop } from './gameLoop';
import { Direction, directionMap } from './contants';


const wss = new WebSocketServer({ port: 4002, path: "/ws" });

export const rooms: Rooms = {};

const playersMap = new Map();

export const serverSnakeCollision = false

const generateRoomName = (): string => {
    const roomCount = Object.keys(rooms).length + 1;
    return `room_${roomCount}`;
};

const joinRoom = (playerId: string): void => {
    let roomName: string | undefined;

    for (const [name, room] of Object.entries(rooms)) {
        if (room.players.length < 2 && !room.hasGameStarted) {
            roomName = name;
            break;
        }
    }

    if (!roomName) {
        roomName = generateRoomName();
        rooms[roomName] = {
            id: roomName,
            players: [],
            nextPositionIndex: 0,
            hasGameStarted: false,
            aliveCount: 0,
            foodCoordinates: generateFoodCoordinates(),
        };
    }
    playersMap.set(playerId, roomName);
    console.log(`Client added to room: ${roomName}`);

};

wss.on('connection', (ws: WebSocket, req: any) => {

    const getPlayerIdFromUrl = (req: WebSocket) => {
        const urlObj = url.parse(req.url!, true);
        return urlObj.query.playerId as string;
    };

    const playerId = getPlayerIdFromUrl(req);
    console.log(`Player ${playerId} connected.`);
    if (!playerId) {
        ws.close(4000, 'Player ID is missing in URL');
        return;
    }

    joinRoom(playerId);

    ws.on('message', (message: WebSocket.Data) => {
        try {

            const messageStr = message instanceof Buffer ? message.toString() : String(message);

            if (messageStr === 'p') {
                ws.send('p');
                return
            }
            if (messageStr.startsWith("m:")) {
                const parts = messageStr.split(":")
                const playerId = parts[1]
                const key = parts[2] as Direction

                const roomName = playersMap.get(playerId);
                const room = rooms[roomName]

                const direction = directionMap[key]

                const snake = room.players.find(player => player.id === playerId)?.snake

                if (snake) snake.speed = direction

                return
            }
            else {
                console.log('Received message:', messageStr);
                const parsedMessage = JSON.parse(messageStr);

                if (parsedMessage.event === 'newPlayer') {
                    const { player } = parsedMessage as newPlayerEvent
                    const roomName = playersMap.get(playerId);
                    const room = rooms[roomName]

                    const newPlayer: Player = {
                        id: player.id,
                        ws,
                        type: "player",
                        name: player.name,
                        colours: player.colours,
                        snake: {
                            x: 400,
                            y: 200,
                            tail: [],
                            speed: { x: 1, y: 0 },
                            isDead: false,
                            score: 0,
                            size: 0,
                            type: "player",
                            playerId
                        }
                    };
                    // set starting position
                    if (room.nextPositionIndex < startingPositions.length) {
                        newPlayer.snake.x = startingPositions[room.nextPositionIndex].x * gameConfig.gridSize + gameConfig.leftSectionSize
                        newPlayer.snake.y = startingPositions[room.nextPositionIndex].y * gameConfig.gridSize
                        room.nextPositionIndex++
                    }
                    room.aliveCount++
                    room.players.push(newPlayer)
                    room.players.forEach((player) => player.ws.send(JSON.stringify({ event: "waitingRoomStatus", players: room.players })))
                    ws.send(JSON.stringify({ event: "config", food: room.foodCoordinates, config: gameConfig }))

                    return
                }
                if (parsedMessage.event === 'startGame') {
                    const roomName = playersMap.get(playerId);
                    const room = rooms[roomName]
                    room.hasGameStarted = true

                    room.players.forEach((player) => player.ws.send(JSON.stringify({ event: "startGame" })))

                    startGameLoop(roomName)

                    return
                }
                else {
                    ws.send('Unknown action');
                    return
                }
            }

        } catch (error) {
            console.error('Error parsing message', error);
            ws.send('Error processing message');
        }
    });

    ws.on('close', () => {

        const roomName = playersMap.get(playerId);

        const index = rooms[roomName].players.findIndex(player => player.id === playerId);
        if (index !== -1) {
            rooms[roomName].players.splice(index, 1);
        }
        if (rooms[roomName].hasGameStarted) {
            rooms[roomName].aliveCount--;
        }

        playersMap.delete(playerId);
        console.log(`Player ${playerId} disconnected. Removed from ${roomName}.`);

    });
});

console.log('WebSocket server running on ws://localhost:4002/ws');
