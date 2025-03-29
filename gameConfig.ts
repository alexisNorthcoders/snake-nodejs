export const gameConfig = {
    side: 600,
    leftSectionSize: 200,
    fps: 8,
    foodStorage: 20,
    backgroundColour: 'black',
    backgroundNumber: 51,
    scaleFactor: 20,
    gridSize: 600 / 20,
    waitingRoom: {
        waitingRoomMessage: 'bla bla',
        backgroundColour: 'black'
    }
}

export const startingPositions = [ {x:5, y:5}, {x:15, y:5}, {x:15, y:5}, {x:15,y: 15} ]

const snakeConfig = {
    colours: {
        head: 'yellow',
        body: 'yellow',
        eyes: 'yellow'
    },
    name: 'Server'
}

export const generateFoodCoordinates = (): number[][] => {
    const coordinates: number[][] = [];

    for (let i = 0; i < gameConfig.foodStorage; i++) {
        const x = Math.floor(Math.random() * gameConfig.scaleFactor) * gameConfig.gridSize + gameConfig.leftSectionSize;
        const y = Math.floor(Math.random() * gameConfig.scaleFactor) * gameConfig.gridSize;
        coordinates.push([x, y, i]);
    }

    return coordinates;
};