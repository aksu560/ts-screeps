export function getAccessibleSpots(pos: RoomPosition): RoomPosition[] {
    const roomTerrain = new Room.Terrain(pos.roomName);
    const offsetList = [-1, 0, 1]
    const accessible: RoomPosition[] = []
    for (let offsetX of offsetList) {
        for (let offsetY of offsetList) {
            // Skip the pos itself.
            if(offsetX === 0 && offsetY === 0) {
                continue;
            }
            if (roomTerrain.get(pos.x + offsetX, pos.y + offsetY) !== TERRAIN_MASK_WALL) {
                accessible.push(new RoomPosition(pos.x + offsetX, pos.y + offsetY, pos.roomName));
            }
        }
    }
    return accessible;
}

export function getPositionAsString(pos: RoomPosition): string {
    return `${pos.roomName}-${pos.x},${pos.y}`
}

export function reserveMiningPosition(creep: Creep): RoomPosition | undefined {
    unReserveMiningPositions(creep);
    let takenPosArray: string[] = [];
    for (let takenPos of creep.room.memory.occupiedPositions) {
        if (takenPos.pos !== undefined){
            takenPosArray.push(getPositionAsString(takenPos.pos));
        }
    }
    const freePosArray : RoomPosition[] = _.filter(creep.room.memory.minerPositions, pos => !takenPosArray.includes(getPositionAsString(pos)));
    creep.room.memory.occupiedPositions.push({creep: creep, pos:freePosArray[0]} as OccupiedPosition);
    return freePosArray[0];
}

export function unReserveMiningPositions(creep: Creep) {
    creep.room.memory.occupiedPositions = _.filter(creep.room.memory.occupiedPositions, (ocpos) => ocpos.creep.id !== creep.id);
}

export function placeRoadIfNeeded(creep: Creep): void {
    if (!(creep.pos.findInRange(FIND_STRUCTURES, 0)[0] instanceof StructureRoad)) {
        creep.pos.createConstructionSite(STRUCTURE_ROAD);
    }
}

export function distanceTransform(room: Room): number[][] {

    let grid = room.memory.visual.roomGrid;

    // Find all walls.
    let walls = []
    for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[0].length; y++) {
            if (grid[x][y].structure !== 0) {
                walls.push([x, y]);
            }
        }
    }

    // Iterate over all cells and find the closest wall.
    let distances = [];
    for (let x = 0; x < grid.length; x++) {
        let row: number[] = [];
        for (let y = 0; y < grid[0].length; y++) {
            let closestWall = grid.length;
            for (let wall of walls) {
                const distance = new RoomPosition(wall[0], wall[1], room.name).getRangeTo(new RoomPosition(x, y, room.name));
                if (distance < closestWall) {
                    closestWall = distance;
                }
            }
            row.push(closestWall);
        }
        distances.push(row);
    }
    return distances;
}
export function distanceTransformForCell(pos: RoomPosition): number {

    let room = Game.rooms[pos.roomName];
    let grid = room.memory.visual.roomGrid;

    // Find all walls.
    let walls = []
    for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[0].length; y++) {
            if (grid[x][y].structure !== 0) {
                walls.push([x, y]);
            }
        }
    }

    let closestWall = grid.length;
    for (let wall of walls) {
        const distance = new RoomPosition(wall[0], wall[1], room.name).getRangeTo(pos);
        if (distance < closestWall) {
            closestWall = distance;
        }
    }
    return closestWall;
}

export function PathfindWithCostmatrix(start: RoomPosition, end: RoomPosition | RoomPosition[], range: number) {
    if (end instanceof Array) {
        return PathFinder.search(start, end, {
            roomCallback: function(roomName) {
                if (roomName !== start.roomName) {
                    return new PathFinder.CostMatrix();
                }
                return PathFinder.CostMatrix.deserialize(Game.rooms[roomName].memory.visual.costMatrix);
            }
        });
    } else {
        return PathFinder.search(start, {pos: end, range: range}, {
            roomCallback: function(roomName) {
                if (roomName !== start.roomName) {
                    return new PathFinder.CostMatrix();
                }
                return PathFinder.CostMatrix.deserialize(Game.rooms[roomName].memory.visual.costMatrix);
            }
        });
    }

}
