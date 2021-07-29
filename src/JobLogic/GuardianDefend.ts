export function GUARDIAN_DEFEND(creep: Creep) {
    let target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (!target) {
        return;
    }
    const healCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {
        filter: (c) => c.getActiveBodyparts(HEAL) > 0
    });
    if (healCreeps.length > 0) {
        target = healCreeps[0];
    }
    if (target && creep.pos.getRangeTo(target.pos) === 1) {
        creep.memory.lastActionStatus = creep.attack(target);
        creep.memory.lastAction = "ATTACK_TARGET";
        return;
    }
    // @ts-ignore: Object is possibly 'null'.
    creep.memory.lastActionStatus = creep.moveTo(target.pos);
    creep.memory.lastAction = "MOVE_TO_TARGET";
    return;
}
