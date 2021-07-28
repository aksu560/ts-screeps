import { getAccessibleSpots } from "utils/Room";

const ROOM_WIDTH = 50;

export function getInitialRoomMemory(room: Room): RoomMemory{
    const sources = room.find(FIND_SOURCES);
    let minerPositions: RoomPosition[] = [];
    let drillPositions: RoomPosition[] = [];

    for (const source of sources) {
        const positions = getAccessibleSpots(source.pos)
        minerPositions = minerPositions.concat(positions);
        // TODO: Calculate closest position to spawn/middle of room.
        // Right now the position is the first available one in reading order.
        drillPositions = drillPositions.concat(positions[0]);
    }
    const visualMemory: VisualMemory = {
        room: room,
        showVisuals: false,
        roomGrid: []
    }

    return {
        name: room.name,
        currentJobs: [],
        spawnqueue: [],
        spawns: [],
        drillPositions: drillPositions,
        minerPositions: minerPositions,
        occupiedPositions: [],
        visual: visualMemory
    } as RoomMemory
}

export function addBuildingToPlan(x: number, y: number, room: Room, structure: StructureConstant) {
    room.memory.visual.roomGrid[x][y].structure = structure;
}

export function runArchitect(room: Room) {

    if (!room.memory.name) {
        room.memory = getInitialRoomMemory(room);
    }

    // Iterate over each cell in the room. recording the walls.
    const terrain = new Room.Terrain(room.name);
    let grid: VisualGridCell[][] = [];
    for (let y = 0; y < ROOM_WIDTH; y++) {
        let row: VisualGridCell[] = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            // Outside walls are a special case.
            if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_WIDTH - 1) {
                if (terrain.get(y,x) === 1) {
                    row.push({
                        x: x,
                        y: y,
                        structure: TERRAIN_MASK_WALL,
                        cl: 0
                    });
                }
                else {
                    row.push({
                        x: x,
                        y: y,
                        structure: FIND_EXIT,
                        cl: 0
                    });
                }
                continue
            }
            // Check for walls.
            row.push({
                x: x,
                y: y,
                structure: terrain.get(x,y) as TERRAIN_MASK_WALL | TERRAIN_MASK_SWAMP | TERRAIN_MASK_LAVA,
                cl: 0
            });
        }
        grid.push(row);
    }
    console.log("Made grid")
    room.memory.visual.roomGrid = grid;

    // Place containers to drillpositions.
    for (const drillPosition of room.memory.drillPositions) {
        addBuildingToPlan(drillPosition.x, drillPosition.y, room, STRUCTURE_CONTAINER);
    }


    for (let spawn of room.find(FIND_MY_SPAWNS)) {
        // Create roads around each spawn.
        const offset = [-1, 0, 1];
        for (const xOffset of offset) {
            for (const yOffset of offset) {
                // Skip the spawn itself.
                if (xOffset === 0 && yOffset === 0) {
                    continue;
                }
                addBuildingToPlan(spawn.pos.x + xOffset, spawn.pos.y + yOffset, room, STRUCTURE_ROAD);
            }
        }

        // Create roads from spawn to each container.
        for (const drillPosition of room.memory.drillPositions) {
            const drillPos = new RoomPosition(drillPosition.x, drillPosition.y, room.name);
            for (const cell of PathFinder.search(spawn.pos, {pos: drillPos, range: 1}).path) {
                addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD);
            }
        }

        // Create roads from each spawn to controller.
        for (const cell of PathFinder.search(spawn.pos, {pos: (room.controller as StructureController).pos, range: 1}).path) {
            addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD);
        }
    }
}
