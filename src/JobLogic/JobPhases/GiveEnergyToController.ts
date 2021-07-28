import { placeRoadIfNeeded } from "utils/Room";

export function GIVE_ENERGY_TO_CONTROLLER(creep: Creep) {
    // Find controller to deliver energy to.
    if (creep.memory.jobTarget === undefined) {
        const controller = creep.room.controller;
        if (!controller) {
            console.log("How the fuck? Room: ", creep.room.name);
            return "GIVE_ENERGY_TO_CONTROLLER"
        }
        creep.memory.jobTarget = controller;
    }
    // If not in range, move towards it.
    const target = Game.getObjectById(creep.memory.jobTarget.id) as StructureSpawn
    if (creep.pos.getRangeTo(target) > 3) {
        creep.memory.lastActionStatus = creep.moveTo(target);
        return "GIVE_ENERGY_TO_CONTROLLER";
    }
    // Give energy to the controller.
    const status = creep.upgradeController((creep.pos.findClosestByRange<StructureController>(FIND_MY_STRUCTURES) as StructureController));
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        return "DONE";
    }
    return "GIVE_ENERGY_TO_CONTROLLER";
}
