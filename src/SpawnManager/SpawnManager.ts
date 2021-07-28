function getDefaultCreepmemory(type: string, spawn: StructureSpawn): CreepMemory {
    return {
        type: type,
        lastAction: "",
        lastActionStatus: 0,
        room: spawn.room,
        job: "IDLE",
        jobPhase: "VIBING",
        jobTarget: undefined,
        jobPos: undefined,
    } as CreepMemory;
}

import { DroneBlueprint } from "CreepBlueprints/DroneBlueprint";
import { GuardianBlueprint } from "CreepBlueprints/GuardianBlueprint";

const creepStringMap: CreepStringMap = {
    "DRONE": new DroneBlueprint,
    "GUARDIAN": new GuardianBlueprint
}

function getDefaultSpawnMemory(spawn: StructureSpawn): SpawnMemory {
    return {
        name: spawn.room.name,
        currentlySpawning: null,
        ticksUntilSpawn: 0,
        ticksUntilDoneWithQueue: 0,
        id: spawn.id
    }
}

export function runSpawnManager() {
    for (const spawn of Object.values(Game.spawns)) {

        // If the room the spawn is in has not been initialized, skip.
        if (!spawn.room.memory.name) {
            continue;
        }

        // Initialize spawn memory if not present.
        if (spawn.memory.name !== spawn.room.name) {
            spawn.memory = getDefaultSpawnMemory(spawn);
            spawn.room.memory.spawns.push(spawn);
        }
        // Skip spawn if nothing to spawn.
        if (spawn.room.memory.spawnqueue.length === 0) {
            continue;
        }

        // If spawn is busy, deduct 1 from ticksUntlSpawn and ticksUntilDoneWithQueue.
        if (spawn.spawning) {
            let ticksTillDone = 0;
            // Calcuate ticks till done with entire queue.
            for (const creepBlueprintString of spawn.room.memory.spawnqueue) {
                const creepBlueprint = creepStringMap[creepBlueprintString];
                for (const part in creepBlueprint.scaleMinion(spawn.store.getCapacity(RESOURCE_ENERGY))) {
                    // Each body part of the creep will add 3 ticks to ticksUntilDoneWithQueue.
                    ticksTillDone += CREEP_SPAWN_TIME
                }
            }
            // Update memory.
            spawn.memory.ticksUntilSpawn = spawn.spawning.remainingTime;
            // Listen, its an estimate.
            spawn.memory.ticksUntilDoneWithQueue = ticksTillDone/spawn.room.find(FIND_MY_SPAWNS).length;
            continue;
        }
        // If we make it this far, we spawn the next creep in the queue.
        const creepBlueprint = creepStringMap[spawn.room.memory.spawnqueue.shift() as CreepType];
        const newCreep = creepBlueprint.build({}, spawn.store.getCapacity(RESOURCE_ENERGY));
        spawn.spawnCreep(newCreep.body, newCreep.name, {memory: getDefaultCreepmemory(creepBlueprint.type, spawn)});
    }
}
