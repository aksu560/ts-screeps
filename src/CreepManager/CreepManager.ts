function getDefaultCreepmemory(type: string) {
    return {
        type: type,
        lastAction: "",
        lastActionStatus: 0,
        room: undefined,
        job: "IDLE",
        jobPhase: "VIBING",
        jobTarget: undefined,
        jobPos: undefined,
    } as CreepMemory;
}
