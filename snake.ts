import { gameConfig } from "./gameConfig";
import { Room, Snake } from "./interfaces";
import { serverSnakeCollision } from "./server";

export function updateSnake(snake: Snake, room: Room) {
    if (snake.isDead) {
        return;
    }

    for (let i = 0; i < room.foodCoordinates.length; i++) {
        const food = room.foodCoordinates[i];
        if (snake.x === food[0] && snake.y === food[1]) {
            snake.size++;
            snake.tail.push({ x: snake.x, y: snake.y });
            snake.score += 50;

            const newCoord =
                [
                    Math.floor(Math.random() * gameConfig.scaleFactor),
                    Math.floor(Math.random() * gameConfig.scaleFactor),
                    i,
                    ['redApple', 'greenApple', 'yellowApple'][Math.floor(Math.random() * 3)]
                ];
            room.foodCoordinates[i] = newCoord;

            const foodMessage = {
                event: "updateFood",
                food: [newCoord],
            };

            room.players.forEach((player) => player.ws.send(JSON.stringify(foodMessage)))

            break;
        }
    }

    if (snake.size === snake.tail.length) {
        for (let i = 0; i < snake.tail.length - 1; i++) {
            snake.tail[i] = snake.tail[i + 1];
        }
    }

    if (snake.size > 0) {
        snake.tail[snake.size - 1] = { x: snake.x, y: snake.y };
    }

    snake.x += snake.speed.x;
    snake.y += snake.speed.y;

    if (snake.x >= gameConfig.scaleFactor) {
        snake.x = 0;
    } else if (snake.x < 0) {
        snake.x = gameConfig.scaleFactor;
    }

    if (snake.y >= gameConfig.scaleFactor) {
        snake.y = 0;
    } else if (snake.y < 0) {
        snake.y = gameConfig.scaleFactor;
    }

    for (const segment of snake.tail) {
        if (snake.x === segment.x && snake.y === segment.y) {
            snake.isDead = true;
            room.aliveCount--
            return;
        }
    }

    for (const player of room.players) {
        const otherSnake = player.snake
        if (
            (otherSnake.playerId === snake.playerId) ||
            otherSnake.isDead ||
            (otherSnake.type === "server" && !serverSnakeCollision)
        ) {
            continue;
        }

        for (const segment of otherSnake.tail) {
            if (snake.type === "server" && !serverSnakeCollision) {
                return;
            }
            if (snake.x === segment.x && snake.y === segment.y) {
                snake.isDead = true;
                room.aliveCount--
                return;
            }
        }
    }
}