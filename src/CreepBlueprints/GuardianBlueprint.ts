import { CreepBlueprint } from "./CreepBlueprint";

// Melee defensive unit. Will keep AI units in check, but probably falls to player attacks.
export class GuardianBlueprint extends CreepBlueprint {
    type = 'GUARDIAN'
    scaleMinion = (energy: number) => {
        if (energy < 190) {
            return [];
        }

        const level = Math.floor(energy/190);
        // This is the repeated part, we add TOUGH bodyparts to the front.
        const template = [ATTACK, MOVE, MOVE];
        let body: BodyPartConstant[] = [];
        for (let i = 0; i < level; i++) {
            body = body.concat(template);
            body.unshift(TOUGH);
        }
        console.log(body);
        return body;
    }
    getPrice = (budget: number) => {
        if (budget < 150) {
            return 0;
        }
        return Math.floor(budget/190) * 190;
    }
}
