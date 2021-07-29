import { distanceTransform, distanceTransformForCell, getAccessibleSpots, getCellScoreForExtension, PathfindWithCostmatrix } from "utils/Room";

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
        visual: visualMemory
    } as RoomMemory
}

export function addBuildingToPlan(x: number, y: number, room: Room, structure: StructureConstant, cl: number) {
    // I dont know why this shit is sideways, but it breaks otherwise.
    room.memory.visual.roomGrid[y][x].structure = structure;
    room.memory.visual.roomGrid[y][x].cl = cl;
    let costmatrix = PathFinder.CostMatrix.deserialize(room.memory.visual.costMatrix)
    if (structure === STRUCTURE_ROAD) {

        costmatrix.set(x, y, 1);
        room.memory.visual.costMatrix = costmatrix.serialize();
        return;
    }
    if (structure === STRUCTURE_CONTAINER) {
        costmatrix.set(x, y, 2);
        room.memory.visual.costMatrix = costmatrix.serialize();
        return;
    }
    costmatrix.set(x, y, 255);
    room.memory.visual.costMatrix = costmatrix.serialize();
}

export function buildExtensions(room: Room) {
    const grid = room.memory.visual.roomGrid;
    const costMatrix = PathFinder.CostMatrix.deserialize(room.memory.visual.costMatrix);
    const offset = [-1, 0, 1]
    let builtExtensions = 0;
    const maxLevel = 8;


    // Iterate over all cells and find assign scores.
    for (const column of grid) {
        for (const cell of column) {
            // We ignore anything that isnt a road.
            if (costMatrix.get(cell.x, cell.y) !== 1) {
                continue;
            }
            for (const offsetX of offset) {
                for (const offsetY of offset) {
                    const truex = cell.x + offsetX;
                    const truey = cell.y + offsetY;
                    if (truex < 0 || truey < 0 || truex >= ROOM_WIDTH || truey >= ROOM_WIDTH) {
                        continue;
                    }
                    // We ignore anything that is already built on.
                    if (grid[cell.x + offsetX][cell.y + offsetY].structure !== 0) {
                        console.log("Already built on");
                        continue;
                    }
                   console.log(distanceTransformForCell(new RoomPosition(cell.x, cell.y, room.name)));

                }
            }
        }
    }
}

export function getStructuresInAreasCircumferenceFromPlan(pos1: RoomPosition, pos2: RoomPosition, structure: any): RoomPosition[] {
    const room = Game.rooms[pos1.roomName];
    const top = Math.min(pos1.y, pos2.y);
    const left = Math.min(pos1.x, pos2.x);
    const right = Math.max(pos1.x, pos2.x);
    const bottom = Math.max(pos1.y, pos2.y);

    let roads = new Set()
    for (let row = top; row <= bottom; row++) {
        if (room.memory.visual.roomGrid[left][row].structure === structure) {
            roads.add(new RoomPosition(left, row, pos1.roomName));
        }
        if (room.memory.visual.roomGrid[right][row].structure === structure) {
            roads.add(new RoomPosition(right, row, pos1.roomName));
        }
    }
    for (let col = left; col <= right; col++) {
        if (room.memory.visual.roomGrid[col][top].structure === structure) {
            roads.add(new RoomPosition(col, top, pos1.roomName));
        }
        if (room.memory.visual.roomGrid[col][bottom].structure === structure) {
            roads.add(new RoomPosition(col, bottom, pos1.roomName));
        }
    }
    return Array.from(roads) as RoomPosition[];
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
                continue;
            }
            // Check for walls.
            const cell = {
                x: x,
                y: y,
                structure: terrain.get(x,y) as TERRAIN_MASK_WALL | TERRAIN_MASK_SWAMP | TERRAIN_MASK_LAVA,
                cl: 0
            }
            row.push(cell);
        }
        grid.push(row);
    }
    room.memory.visual.roomGrid = grid;

    // add roads at all mining positions,
    for (const miningPosition of room.memory.minerPositions) {
        addBuildingToPlan(miningPosition.x, miningPosition.y, room, STRUCTURE_ROAD, 1);
    }

    // Place containers to drillpositions, and draw roads to the controller
    for (const drillPosition of room.memory.drillPositions) {
        addBuildingToPlan(drillPosition.x, drillPosition.y, room, STRUCTURE_CONTAINER, 2);
        if (room.controller) {
            for (const cell of PathFinder.search(drillPosition, {
                pos: room.controller.pos,
                range: 1
            }).path) {
                addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD, 1);
            }
        }
    }

    // Place extra spawns.
    const max_rad = room.memory.visual.roomGrid.length;
    let spawns = room.find(FIND_MY_SPAWNS);
    let spawncount = spawns.length;
    // Get maximum number of spawns.
    const max_spawns = CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][8];
    // Iterate for each spawn yet to be placed.
    for (let i = 0; i < max_spawns - spawns.length; i++) {
        for (let rad = 1; rad <= max_rad; rad++) {
            // Determine the bounds of search.
            const top_left = new RoomPosition(spawns[0].pos.x - rad, spawns[0].pos.y - rad, room.name);
            const bottom_right = new RoomPosition(spawns[0].pos.x + rad, spawns[0].pos.y + rad, room.name);
            const valid_space = _.filter(getStructuresInAreasCircumferenceFromPlan(top_left, bottom_right, TERRAIN_MASK_WALL), (pos) => {
                // Offset for looking at direct neighbours.
                const offset = [-1, 0, 1];
                for (const xOffset of offset) {
                    if (pos.x + xOffset < 0 || pos.x + xOffset >= ROOM_WIDTH) {
                        break; // out of bounds
                    }
                    for (const yOffset of offset) {
                        if (pos.y + yOffset < 0 || pos.y + yOffset >= ROOM_WIDTH) {
                            break; // out of bounds
                        }
                        if (grid[pos.x + xOffset][pos.y + yOffset].structure !== TERRAIN_MASK_WALL) {
                            return false;
                        }
                    }
                }
                return true;
            });

            console.log(valid_space);
            if (valid_space.length > 0) {
                const random_pos = valid_space[Math.floor(Math.random() * valid_space.length)];
                // Find the CL at which we can place the structure.
                spawncount++;
                const cl = Object.keys(CONTROLLER_STRUCTURES[STRUCTURE_SPAWN]).find(key => CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][(key as any)] >= spawncount);
                addBuildingToPlan(random_pos.x, random_pos.y, room, STRUCTURE_SPAWN, (cl as any));
                console.log(spawncount, "spawns at cl", cl);
                break;
            }
        }
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
                addBuildingToPlan(spawn.pos.x + xOffset, spawn.pos.y + yOffset, room, STRUCTURE_ROAD, 1);
            }
        }

        // Create roads from spawn to each container.
        for (const drillPosition of room.memory.drillPositions) {
            const drillPos = new RoomPosition(drillPosition.x, drillPosition.y, room.name);
            for (const cell of PathfindWithCostmatrix(spawn.pos, drillPos, 1).path) {
                addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD, 1);
            }
        }

        // Create road sfrom spawn to each deposit.
        for (const deposit of room.find(FIND_DEPOSITS)) {
            const depositPos = new RoomPosition(deposit.pos.x, deposit.pos.y, room.name);
            for (const cell of PathfindWithCostmatrix(spawn.pos, depositPos, 1).path) {
                addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD, 1);
            }
        }

        // Create roads from each spawn to controller.
        for (const cell of PathfindWithCostmatrix(spawn.pos,(room.controller as StructureController).pos, 1).path) {
            addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD, 1);
        }

        // Create roads from each spawn to each exit.
        // Left
        for (const cell of PathfindWithCostmatrix(spawn.pos, room.find(FIND_EXIT_LEFT), 0).path) {
            addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD, 1);
        }
        // Top
        for (const cell of PathfindWithCostmatrix(spawn.pos, room.find(FIND_EXIT_TOP), 0).path) {
            addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD, 1);
        }
        // Right
        for (const cell of PathfindWithCostmatrix(spawn.pos, room.find(FIND_EXIT_RIGHT), 0).path) {
            addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD, 1);
        }
        // Bottom
        for (const cell of PathfindWithCostmatrix(spawn.pos, room.find(FIND_EXIT_BOTTOM), 0).path) {
            addBuildingToPlan(cell.x, cell.y, room, STRUCTURE_ROAD, 1);
        }
    }
}
