import { reserveMiningPosition, unReserveMiningPositions } from "utils/Room";

export function GET_ENERGY(creep: Creep) {
    // If full, go to spawn.
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        unReserveMiningPositions(creep);
        return "GOT_ENERGY";
    }
    if (creep.memory.jobPos === undefined) {
        creep.memory.jobPos = reserveMiningPosition(creep);
    }
    if (creep.memory.jobPos === undefined) {
        return "GET_ENERGY";
    }
    // If in a miner position, harvest. TODO: Fix this position check shite
    if (_.filter(creep.room.memory.minerPositions, (pos: RoomPosition) => pos.x === creep.pos.x && pos.y === creep.pos.y).length > 0) {
        creep.harvest(creep.pos.findInRange(FIND_SOURCES, 1)[0]);
        return "GET_ENERGY"
    }
    // If not in a miner position, go to miner position.
    creep.memory.lastActionStatus = creep.moveTo(new RoomPosition(creep.memory.jobPos.x, creep.memory.jobPos.y, creep.memory.jobPos.roomName));
    return "GET_ENERGY";
}
