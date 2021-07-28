import { CreepBlueprint } from "./CreepBlueprint";

// Drones are early game generalist creeps. They are pretty shit, but they are cheap.
export class DroneBlueprint extends CreepBlueprint {
    type = 'DRONE'
    scaleMinion = (energy: number) => {
        if (energy < 300) {
            return [];
        }
        return [WORK, CARRY, MOVE, CARRY, MOVE];
    }
    getPrice = (budget: number) => {
        if (budget < 300) {
            return 0;
        }
        return 300;
    }
}
