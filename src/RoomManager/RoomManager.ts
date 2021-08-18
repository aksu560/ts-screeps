import { jobLogic, runJobLogic } from "JobLogic/JobLogic";
import profiler from "screeps-profiler";
import { getStructureInPosFromPlan, runArchitect } from "./RoomArchitect";

export const visualizeRoom = profiler.registerFN((room: Room) => {
    const grid = room.memory.visual.roomGrid;
    if (!grid) {
        return;
    }
    for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[x].length; y++) {
            if (grid[x][y].cl <= room.memory.visual.showVisuals) {
                const struct = getStructureInPosFromPlan(new RoomPosition(x, y, room.name));
                if (struct) {
                    room.visual.structure(x, y, struct);
                }
            }
        }
    }
}, "RoomManager.visualizeRoom");

export const runRoomManager = profiler.registerFN(() => {
    const roomCPU = Game.cpu.getUsed();
    for (const room of Object.values(Game.rooms)) {
        // Room is under my control.
        if (room.controller && room.controller.my) {
            // Initialize room memory if necessary.

            if (!room.memory.name) {
                const preArchCPU = Game.cpu.getUsed();
                runArchitect(room, 1);
                console.log(`Room ${room.name} Architect CPU: ${Game.cpu.getUsed()-preArchCPU}`)
            }

            if (room.memory.visualLevel < 8) {
                const preArchCPU = Game.cpu.getUsed();
                runArchitect(room, room.memory.visualLevel + 1);
                console.log(`Room ${room.name} Architect CPU: ${Game.cpu.getUsed()-preArchCPU}`)
            }

            // Create object tracking all the idle creeps.
            let idleCreepsObject: IdleCreepsObject = {};
            for (const idleCreep of room.find(FIND_MY_CREEPS, { filter: (c) => c.memory.job === "IDLE"})) {
                if (idleCreepsObject[idleCreep.memory.type] === undefined) {
                    idleCreepsObject[idleCreep.memory.type] = [idleCreep];
                    continue;
                }
                idleCreepsObject[idleCreep.memory.type] = idleCreepsObject[idleCreep.memory.type].concat(idleCreep);
            }

            // Create object tracking all the current jobs.
            let currentJobsObject: CurrentJobsObject = {};
            for (const job in jobLogic) {
                currentJobsObject[job] = 0;
            }
            for (const currentJob of room.memory.currentJobs) {
                currentJobsObject[currentJob] += 1;
            }
            // Empty the array of current jobs. It will be populated by creeps in runJobLogic().
            room.memory.currentJobs = [];


            const all_creeps = room.find(FIND_MY_CREEPS);

            // RCL 1 is a special case, and when room is in it, we just want to upgrade ASAP.
            if (room.controller.level === 1) {
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
                console.log(enemy_creeps.length, "HOSTILE CREEPS IN ROOM", room.name);
                let guardianCount = 0
                let guardians: Creep[] = [];
                for (let creep of all_creeps) {
                    if (creep.memory.type === "GUARDIAN") {
                        creep.memory.job = "GUARDIAN_DEFEND";
                        guardians.push(creep);
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
            if (room.memory.visual.showVisuals > 0) {
                visualizeRoom(room);
            }
            const preJobCPU = Game.cpu.getUsed();
            runJobLogic(room);
            console.log(`Room ${room.name} Job CPU: ${Game.cpu.getUsed() - preJobCPU}`);
            console.log(`${room.name} CPU: ${Game.cpu.getUsed() - roomCPU}`);
        }
    }
}, 'runRoomManager');
