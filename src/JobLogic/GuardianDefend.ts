export function GUARDIAN_DEFEND(creep: Creep) {
    let enemy_creeps = creep.room.find(FIND_HOSTILE_CREEPS);
    let target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (enemy_creeps.length > 0) {
        creep.memory.job = "IDLE";
        return;
    }
    const healCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {
        filter: (c) => c.getActiveBodyparts(HEAL) > 0
    });
    if (healCreeps.length > 0) {
        target = healCreeps[0];
    }
    if (target && creep.pos.getRangeTo(target.pos) === 1) {
        creep.attack(target);
        return;
    }
    // @ts-ignore: Object is possibly 'null'.
    creep.moveTo(target.pos);
    return;
}
