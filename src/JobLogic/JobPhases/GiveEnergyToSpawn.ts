import { placeRoadIfNeeded } from "utils/Room";

export function GIVE_ENERY_TO_SPAWN(creep: Creep) {
    // Find spawns to deliver energy to.
    if (creep.memory.jobTarget === undefined) {
        const spawns = creep.room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) {
            console.log("How the fuck? Room: ", creep.room.name);
            return "GIVE_ENERGY_TO_SPAWN"
        }
        creep.memory.jobTarget = spawns[0];
    }
    // If not in range, move towards it.
    if (creep.pos.getRangeTo(Game.getObjectById(creep.memory.jobTarget.id) as StructureSpawn) > 1) {
        creep.memory.lastActionStatus = creep.moveTo(new RoomPosition(creep.memory.jobTarget.pos.x, creep.memory.jobTarget.pos.y, creep.memory.jobTarget.pos.roomName));
        return "GIVE_ENERGY_TO_SPAWN";
    }
    // Give energy to the spawn.
    const target = Game.getObjectById(creep.memory.jobTarget.id) as AnyStoreStructure;
    const status = creep.transfer(target, RESOURCE_ENERGY);
    if (status === OK) {
        return "DONE";
    }
    return "GIVE_ENERGY_TO_SPAWN";
}
