const DIRECTION_ARRAY = [
    TOP,
    TOP_RIGHT,
    RIGHT,
    BOTTOM_RIGHT,
    BOTTOM,
    BOTTOM_LEFT,
    LEFT,
    TOP_LEFT
];

const DODGE_TARGETS = [
    FIND_CREEPS,
    FIND_SOURCES,
    FIND_STRUCTURES,
    FIND_CONSTRUCTION_SITES,
    FIND_DROPPED_RESOURCES
];

export function idle(creep: Creep) {
    for (let targetType of DODGE_TARGETS) {
        const found = creep.pos.findInRange(targetType, 1);
        if (found.length > 0 && found[0].id !== creep.id) {
            const randomDir = DIRECTION_ARRAY[Math.floor(Math.random() * DIRECTION_ARRAY.length)];
            creep.move(randomDir);
        }
    }
    return;
}
