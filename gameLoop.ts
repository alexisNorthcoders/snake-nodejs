import { gameConfig } from "./gameConfig";
import { rooms } from "./server";
import { updateSnake } from "./snake";

export function startGameLoop(roomId: string) {

    const room = rooms[roomId];

    if (!room) {
        console.log(`Room ${roomId} not found`);
        return;
    }

    const gameInterval = setInterval(() => {
      
        for (const player of room.players) {
            const snake = player.snake
            if (snake.isDead) {
                continue;
            }

            updateSnake(snake, room)

        }

        const message = {
            event: "snake_update_v2",
            snakes: room.players.map((player)=> player.snake)
        };
        room.players.forEach((player) => player.ws.send(JSON.stringify(message)))

        if (room.aliveCount <= 0 || room.players.length === 0) {
            room.hasGameStarted = false
            room.aliveCount = 0
            console.log(`Room ${roomId} game is over.`);
            room.players.forEach((player) => player.ws.send(JSON.stringify({ event: "gameover" })))
            clearInterval(gameInterval);
            return;
        }

    }, 1000/gameConfig.fps);
}