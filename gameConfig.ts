export const gameConfig = {
    side: 600,
    leftSectionSize: 200,
    fps: 8,
    foodStorage: 20,
    backgroundColour: 'black',
    backgroundNumber: Math.floor(Math.random() * 51),
    scaleFactor: 15,
    gridSize: 600 / 15,
    waitingRoom: {
        waitingRoomMessage: 'bla bla',
        backgroundColour: 'black'
    }
}

export const startingPositions = [{ x: 5, y: 5 }, { x: 15, y: 5 }, { x: 15, y: 5 }, { x: 15, y: 15 }]

const snakeConfig = {
    colours: {
        head: 'yellow',
        body: 'yellow',
        eyes: 'yellow'
    },
    name: 'Server'
}

export const generateFoodCoordinates = (): any[][] => {
    const coordinates: any[][] = [];
    const foodTypes = ['redApple', 'greenApple', 'yellowApple', 'banana', 'cherry', 'chili', 'strawberry']

    for (let i = 0; i < gameConfig.foodStorage; i++) {
        const x = Math.floor(Math.random() * gameConfig.scaleFactor);
        const y = Math.floor(Math.random() * gameConfig.scaleFactor);
        const type = foodTypes[Math.floor(Math.random() * 7)]
        coordinates.push([x, y, i, type]);
    }

    return coordinates;
};