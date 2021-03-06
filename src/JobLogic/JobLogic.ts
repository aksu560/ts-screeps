interface JobLogicObject {
    [key: string]: (creep: Creep, otherCreeps: Creep[], jobs: Job[]) => void;
}

import {droneDeliverToSpawner} from './DroneDeliverToSpawner';
import {idle} from './Idle';
import {droneUpgradeController} from './DroneUpgrade';
import { GUARDIAN_DEFEND } from './GuardianDefend';

export const jobLogic: JobLogicObject = {
    'DRONE_SPAWNER_ENERGY_DELIVERY': (creep: Creep) => {
        droneDeliverToSpawner(creep);
    },
    'IDLE': (creep: Creep) => {
        idle(creep);
    },
    'DRONE_UPGRADING': (creep: Creep) => {
        droneUpgradeController(creep);
    },
    'GUARDIAN_DEFEND': (creep: Creep) => {
        GUARDIAN_DEFEND(creep);
    }
}

export function runJobLogic(room: Room) {
    const creeps = room.find(FIND_MY_CREEPS);
    for (const creep of creeps) {
        const job = creep.memory.job;
        // Keep rooms idle Creeps up to date.
        if (! job) {
            continue;
        }
        try {
            jobLogic[job](creep, creeps, room.memory.currentJobs);
        } catch (e) {
            console.log(creep.name, job, creep.memory.jobPhase, e);
            creep.memory.job = 'IDLE';
        }
        creep.room.memory.currentJobs.push(job);
    }
}
