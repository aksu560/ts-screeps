import profiler from "screeps-profiler";
import { unReserveMiningPositions } from "utils/Room";
import { GET_ENERGY } from "./JobPhases/GetEnergy";
import { GIVE_ENERY_TO_SPAWN } from "./JobPhases/GiveEnergyToSpawn";

const INITIAL_PHASE = "GET_ENERGY"
const JOB_PHASES: JobPhases = {
    "GET_ENERGY": (creep: Creep) => {
        return GET_ENERGY(creep);
    },
    "GOT_ENERGY": (creep: Creep) => {
        unReserveMiningPositions(creep);
        return GIVE_ENERY_TO_SPAWN(creep);
    },
    "GIVE_ENERGY_TO_SPAWN": (creep: Creep) => {
        return GIVE_ENERY_TO_SPAWN(creep);
    }
}
export function droneDeliverToSpawner(creep: Creep) {
    if (!Object.keys(JOB_PHASES).includes(creep.memory.jobPhase)) {
        creep.memory.jobPhase = INITIAL_PHASE;
        creep.memory.jobTarget = undefined;
    }
    creep.memory.lastAction = JOB_PHASES[creep.memory.jobPhase](creep);
    if (creep.memory.lastAction === "DONE") {
        unReserveMiningPositions(creep);
        creep.memory.job = "IDLE";
        creep.memory.jobPos = undefined;
        creep.memory.jobTarget = undefined;
        creep.memory.jobPhase = "VIBING";
    }
    creep.memory.jobPhase = creep.memory.lastAction;
    return;
}
