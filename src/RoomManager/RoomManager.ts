import { jobLogic, runJobLogic } from "JobLogic/JobLogic";
import { runArchitect } from "./RoomArchitect";

function visualizeRoomPlan(room: Room) {
    if (room.memory.visual.showVisuals === false) {
        return;
    }
    const grid = room.memory.visual.roomGrid;
    for (let column of grid) {
        for (let cell of column) {
            // TODO: Make less liima.
            const lmao = [FIND_EXIT, TERRAIN_MASK_WALL, TERRAIN_MASK_SWAMP, TERRAIN_MASK_LAVA, 0]
            if (!lmao.includes(cell.structure as any)) {
                room.visual.structure(cell.x, cell.y, cell.structure as any);
            }
        }
    }
}

export function runRoomManager() {
    for (const room of Object.values(Game.rooms)) {
        // Room is under my control.
        if (room.controller && room.controller.my) {
            // Initialize room memory if necessary.

            if (!room.memory.name) {
                const preArchCPU = Game.cpu.getUsed();
                console.log("prearch", preArchCPU)
                runArchitect(room);
                console.log(`Room ${room.name} Architect CPU: ${Game.cpu.getUsed()-preArchCPU}`)
            }

            // Create object tracking all the idle creeps.
            let idleCreepsObject: IdleCreepsObject = {};
            for (const idleCreep of room.find(FIND_MY_CREEPS, { filter: (c) => c.memory.job === "IDLE"})) {
                if (idleCreepsObject[idleCreep.memory.type] === undefined) {
                    idleCreepsObject[idleCreep.memory.type] = [idleCreep];
                    continue;
                }
                idleCreepsObject[idleCreep.memory.type].concat(idleCreep);
            }

            // Create object tracking all the current jobs.
            let currentJobsObject: CurrentJobsObject = {};
            for (const job in jobLogic) {
                currentJobsObject[job] = 0;
            }
            for (const currentJob of room.memory.currentJobs) {
                currentJobsObject[currentJob] += 1;
            }

            const all_creeps = room.find(FIND_MY_CREEPS);

            // RCL 1 is a special case, and when room is in it, we just want to upgrade ASAP.
            if (room.controller.level !== 0) {
                // We should maintain two drones for each mining position.
                const targetDroneCount = room.memory.minerPositions.length * 2;
                // Add the missing number of drones to the queue.
                let drones: Creep[] = [];
                for (let creep of all_creeps) {
                    if (creep.memory.type === "DRONE") {
                        drones.push(creep)
                    }
                }
                const droneCount = targetDroneCount - drones.length - room.memory.spawnqueue.length;
                for (let i = 0; i < droneCount; i++) {
                    room.memory.spawnqueue.push("DRONE");
                }
            }

            // DRONE LOGIC. This only controls the early game creeps that might be present even after RCL 1.
            // Make sure at least 3 drones are always delivering energy to spawns.
            if (!currentJobsObject["DRONE_SPAWNER_ENERGY_DELIVERY"] || currentJobsObject["DRONE_SPAWNER_ENERGY_DELIVERY"] < room.find(FIND_SOURCES).length) {
                if(idleCreepsObject["DRONE"]) {
                    const numberOfAssignments = Math.min(3 - currentJobsObject["DRONE_SPAWNER_ENERGY_DELIVERY"], idleCreepsObject["DRONE"].length);
                    for (let i = 0; i < numberOfAssignments; i++) {
                        // @ts-ignore: Object is possibly 'null'.
                        idleCreepsObject["DRONE"].shift().memory.job = "DRONE_SPAWNER_ENERGY_DELIVERY";
                    }
                }
            }

            // Rest of the drones should be upgrading the controller.
            if (idleCreepsObject['DRONE']) {
                idleCreepsObject['DRONE'].forEach(drone => {
                    drone.memory.job = "DRONE_UPGRADING";
                });
            }

            const enemy_creeps = room.find(FIND_HOSTILE_CREEPS);

            // If hostile creeps are present
            if (enemy_creeps.length > 0) {
                let guardianCount = 0
                for (let creep of all_creeps) {
                    if (creep.memory.type === "GUARDIAN") {
                        guardianCount++
                    }
                }
                for (let creep of room.memory.spawnqueue) {
                    if (creep === "GUARDIAN") {
                        guardianCount++
                    }
                }

                const guardiansToBeSpawned = enemy_creeps.length * 2 - guardianCount;
                for (let i = 0; i < guardiansToBeSpawned; i++) {
                    room.memory.spawnqueue.push("GUARDIAN");
                }
            }

            room.memory.currentJobs = [];

            const roomCPU = Game.cpu.getUsed();
            const preVisualCPU = Game.cpu.getUsed();
            visualizeRoomPlan(room);
            console.log(`Room ${room.name} Visualization CPU: ${Game.cpu.getUsed()-preVisualCPU}`);
            const preJobCPU = Game.cpu.getUsed();
            runJobLogic(room);
            console.log(`Room ${room.name} Job CPU: ${Game.cpu.getUsed() - preJobCPU}`);
            console.log(`${room.name} CPU: ${Game.cpu.getUsed() - roomCPU}`);
            return;
        }
    }
}
