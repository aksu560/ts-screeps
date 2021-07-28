import { CreepBlueprint } from "CreepBlueprints/CreepBlueprint";
import { runRoomManager } from "RoomManager/RoomManager";
import { runSpawnManager } from "SpawnManager/SpawnManager";
import { ErrorMapper } from "utils/ErrorMapper";
import './utils/RoomVisual';

declare global {

    interface RoomVisual {
        structure(x: number, y: number, structureType: StructureConstant): RoomVisual
        speech(text: string, x: number, y: number): RoomVisual
        animatedPosition(x: number, y: number): RoomVisual
        resource(type: ResourceConstant, x: number, y: number): RoomVisual
        connectRoads(): RoomVisual
    }

    type Job =
    "DRONE_SPAWNER_ENERGY_DELIVERY" |
    "DRILLING" |
    "DRONE_UPGRADING" |
    "GUARDIAN_DEFEND" |
    "IDLE"

    interface JobPhases {
        [job: string]: (creep: Creep) => string;
    }

    type CreepType =
    "DRONE" |
    "DRILL" |
    "GUARDIAN"

    interface Memory {
        uuid: number;
        log: any;
    }

    interface CreepMemory {
        type: string;
        room: Room | undefined;
        job: Job;
        jobPhase: string;
        jobTarget: AnyStructure | AnyCreep | Source | undefined;
        jobPos: RoomPosition | undefined;
        lastAction: string;
        lastActionStatus: number;
    }

    interface OccupiedPosition {
        pos: RoomPosition;
        creep: Creep
    }

    interface VisualGridCell {
        x: number;
        y: number;
        // TODO: Ei näin
        structure: StructureConstant | undefined | FIND_EXIT | TERRAIN_MASK_WALL | TERRAIN_MASK_SWAMP | TERRAIN_MASK_LAVA | 0;
        cl: number;
    }

    interface VisualGridCellStructure extends VisualGridCell {
        structure: StructureConstant
    }

    interface VisualMemory {
        room: Room;
        showVisuals: boolean;
        roomGrid: VisualGridCell[][];
    }


    interface RoomMemory {
        name: string;
        currentJobs: Job[];
        spawns: StructureSpawn[];
        spawnqueue: CreepType[];
        drillPositions: RoomPosition[];
        minerPositions: RoomPosition[];
        occupiedPositions: OccupiedPosition[];
        visual: VisualMemory;
    }

    interface IdleCreepsObject {
        [id: string]: Creep[]
    }

    interface CurrentJobsObject {
        [id: string]: number
    }

    interface SpawnMemory {
        name: string;
        id: string;
        currentlySpawning: CreepType | null;
        ticksUntilSpawn: number;
        ticksUntilDoneWithQueue: number;
    }

    interface CreepStringMap {
        [id: string]: CreepBlueprint;
    }

    // Syntax for adding proprties to `global` (ex "global.log")
    namespace NodeJS {
        interface Global {
            toggleRoomVisuals: (roomName: string) => boolean;
            spawnCreep: (bp: CreepType, roomName: string) => void;
        log: any;
        }
    }
}

global.toggleRoomVisuals = (roomName: string) => {
    const room = Game.rooms[roomName];
    room.memory.visual.showVisuals = !room.memory.visual.showVisuals;
    return room.memory.visual.showVisuals;
}

global.spawnCreep = (bp: CreepType, roomName: string) => {
    const room = Game.rooms[roomName];
    room.memory.spawnqueue.unshift(bp)
}

export const loop = ErrorMapper.wrapLoop(() => {
    const preLoopCPU = Game.cpu.getUsed();
    // Automatically delete memory of missing creeps
    if (Game.time % 2000 === 0){
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
        }
    }
    const prespawnCPU = Game.cpu.getUsed();
    runSpawnManager();
    console.log(`SpawnManager CPU: ${Game.cpu.getUsed() - prespawnCPU}`);
    const preRoomManagerCPU = Game.cpu.getUsed();
    runRoomManager();
    console.log(`RoomManager CPU: ${Game.cpu.getUsed() - preRoomManagerCPU}`);
    console.log(`TICK USED TOTAL OF ${Game.cpu.getUsed()-preLoopCPU} CPU.`)
});
