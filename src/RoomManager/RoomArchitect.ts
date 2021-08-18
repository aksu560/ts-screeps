import { distanceTransform, distanceTransformForCell, getAccessibleSpots, PathfindWithCostmatrix } from "utils/Room";

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
        showVisuals: 0,
        roomGrid: [],
        costMatrix: new PathFinder.CostMatrix().serialize(),
    }

    return {
        name: room.name,
        currentJobs: [],
        spawnqueue: [],
        spawns: [],
        drillPositions: drillPositions,
        minerPositions: minerPositions,
        occupiedPositions: [],
        visual: visualMemory,
        visualLevel: 1,
    } as RoomMemory
}

export function addStructureToPlan(structure: VisualStructure, pos: RoomPosition) {
    const grid = Game.rooms[pos.roomName].memory.visual.roomGrid;
    const x = pos.x;
    const y = pos.y;
    grid[x][y].structure = structure;
}

export function getStructureInPosFromPlan(pos: RoomPosition): StructureConstant | undefined {
    const grid = Game.rooms[pos.roomName].memory.visual.roomGrid;
    const x = pos.x;
    const y = pos.y;
    const structure = grid[x][y].structure;
    if (structure in [0, 1, 2]) {
        return;
    }
    return structure as StructureConstant;
}

function buildGrid(room: Room) {
    // First we build the walls.
    const terrain = new Room.Terrain(room.name);
    for (let x = 0; x < ROOM_WIDTH; x++) {
        for (let y = 0; y < ROOM_WIDTH; y++) {
            addStructureToPlan(terrain.get(x, y), new RoomPosition(x, y, room.name));
        }
    }
    for (const struct of room.find(FIND_STRUCTURES)) {
        addStructureToPlan(struct.structureType as VisualStructure, struct.pos);
    }
}

export function runArchitect (room: Room, targetLevel: number) {
    if (!room.memory.visual.roomGrid) {
        buildGrid(room);
    }
    const roomMemory = room.memory;
    if (roomMemory.visualLevel >= targetLevel) {
        return;
    }
}
