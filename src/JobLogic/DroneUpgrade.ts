import profiler from "screeps-profiler";
import { reserveMiningPosition, unReserveMiningPositions } from "utils/Room";
import { GET_ENERGY } from "./JobPhases/GetEnergy";
import { GIVE_ENERGY_TO_CONTROLLER } from "./JobPhases/GiveEnergyToController";

const INITIAL_PHASE = "GET_ENERGY"
const JOB_PHASES: JobPhases = {
    "GET_ENERGY": (creep: Creep) => {
        return GET_ENERGY(creep);
    },
    "GOT_ENERGY": (creep: Creep) => {
        return GIVE_ENERGY_TO_CONTROLLER(creep);
    },
    "GIVE_ENERGY_TO_CONTROLLER": (creep: Creep) => {
        return GIVE_ENERGY_TO_CONTROLLER(creep);
    }
}
export function droneUpgradeController(creep: Creep) {
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

