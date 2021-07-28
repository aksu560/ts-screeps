export abstract class CreepBlueprint {
    abstract type: string
    build = (memory: Object, energy: number) => {
        return {
            body: this.scaleMinion(energy),
            name: `${this.type}${Game.time}`
        }
    }
    abstract scaleMinion(energy: number): BodyPartConstant[]
    abstract getPrice(budget: number): number;
}
