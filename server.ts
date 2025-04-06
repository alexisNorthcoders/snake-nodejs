import WebSocket, { Server as WebSocketServer } from 'ws';
import { newPlayerEvent, Player, Rooms } from './interfaces';
import { gameConfig, generateFoodCoordinates, startingPositions } from './gameConfig';
import * as url from 'url';
import { startGameLoop } from './gameLoop';
import { Direction, directionMap } from './contants';
import { verifyTokenWithAuthServer } from './auth';


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
        if (room.connections < 2 && !room.hasGameStarted) {
            roomName = name;
            break;
        }
    }

    if (!roomName) {
        roomName = generateRoomName();
        rooms[roomName] = {
            connections: 0,
            wsConnections: [],
            id: roomName,
            players: [],
            nextPositionIndex: 0,
            hasGameStarted: false,
            aliveCount: 0,
            foodCoordinates: generateFoodCoordinates(),
            backgroundNumber: Math.floor(Math.random() * 51)
        };
    }
    playersMap.set(playerId, roomName);
    rooms[roomName].connections++
    console.log(`Client added to room: ${roomName}`);

};

wss.on('connection', async (ws: WebSocket, req: any) => {

    const getParams = (req: WebSocket) => {

        const urlObj = url.parse(req.url!, true);

        const playerId = urlObj.query.player_id as string;
        const accessToken = urlObj.query.access_token as string;

        return { playerId, accessToken };
    };

    const { playerId, accessToken } = getParams(req);

    if (!playerId) {
        ws.close(4000, 'Player ID is missing in URL');
        return;
    }

    const data = await verifyTokenWithAuthServer(accessToken)

    if (!data) {
        console.log('error verifying')
        ws.close(4000, 'Error validating token.');
        return
    }
    
    ws.send(JSON.stringify({ event: 'verified' }));

    joinRoom(playerId);
    console.log(`Player ${playerId} connected.`);

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
                if ((snake?.speed.x != 0 && direction.x != 0) || (snake?.speed.y != 0 && direction.y != 0)) return

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
                        type: "player",
                        name: player.name,
                        colours: player.colours,
                        snake: {
                            x: 0,
                            y: 0,
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
                        newPlayer.snake.x = startingPositions[room.nextPositionIndex].x
                        newPlayer.snake.y = startingPositions[room.nextPositionIndex].y
                        room.nextPositionIndex++
                    }
                    room.wsConnections.push(ws)
                    room.aliveCount++
                    room.players.push(newPlayer)
                    room.wsConnections.forEach((conn) => conn.send(JSON.stringify({ event: "waitingRoomStatus", players: room.players })))
                    gameConfig.backgroundNumber = room.backgroundNumber
                    ws.send(JSON.stringify({ event: "config", food: room.foodCoordinates, config: gameConfig }))

                    return
                }
                if (parsedMessage.event === 'startGame') {
                    const roomName = playersMap.get(playerId);
                    const room = rooms[roomName]
                    room.hasGameStarted = true

                    room.wsConnections.forEach((conn) => conn.send(JSON.stringify({ event: "startGame" })))

                    startGameLoop(roomName)

                    return
                }
                if (parsedMessage.event === 'updatePlayer') {

                    const roomName = playersMap.get(playerId);
                    const room = rooms[roomName]

                    const player = room.players.find(player => player.id === playerId)
                    if (player) {
                        player.colours.body = parsedMessage.player.colours.body
                        player.colours.head = parsedMessage.player.colours.head
                        player.colours.eyes = parsedMessage.player.colours.eyes

                        room.wsConnections.forEach((conn) => conn.send(JSON.stringify({ event: "waitingRoomStatus", players: room.players })))
                        return
                    }
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
            if (!rooms[roomName].players[index].snake.isDead && rooms[roomName].hasGameStarted) {
                rooms[roomName].aliveCount--;
            }
            rooms[roomName].players.splice(index, 1);
        }


        playersMap.delete(playerId);
        console.log(`Player ${playerId} disconnected. Removed from ${roomName}.`);

    });
});

console.log('WebSocket server running on ws://localhost:4002/ws');
