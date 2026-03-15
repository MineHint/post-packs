import { world, system } from '@minecraft/server';
import { beforeEvents } from "@minecraft/server-admin";

const dynamicPropertyName = `lumine_proxy_protection_token`;

function generateRandomToken() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'lumine_proxy_protection_';
    for (let i = 0; i < 50; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function banish() {
    const tag = world.getDynamicProperty(dynamicPropertyName);
    world.getDimension("overworld").runCommand(`tag @a remove ${tag}`);
    for (const player of world.getAllPlayers()) {
        if (player.isValid) {
            player.addTag(`${tag}`);
        }
    }
    world.getDimension("overworld").runCommand(`execute if entity @e[type=player,tag=!${tag}] run tellraw @a {"rawtext":[{"text":"§cLumine Proxy connection denied: §e"},{"selector":"@e[type=player,tag=!${tag}]"}]}`);
    world.getDimension("overworld").runCommand(`kick @e[type=player,tag=!${tag}]`);
    world.getDimension("overworld").runCommand(`tag @a remove ${tag}`);
}

function log(name = "Unknown", type = "default") {
    system.run(() => {
        if (type === "default") {
            world.sendMessage(`§cLumine Proxy connection denied: §e${name}`);
        } else if (type === "bot") {
            world.sendMessage(`§cLumine Proxy Bot connection denied: §e${name}`);
        } else {
            world.sendMessage(`§cLumine Proxy connection denied: §e${name}`);
        }
    });
}

world.afterEvents.playerSpawn.subscribe((event) => {
    const { player, initialSpawn } = event;
    if (initialSpawn) {
        banish();

        if (world.getAllPlayers().length == 1) {
            world.sendMessage(`§aLumine Proxy Protection v7 is now active.`)
            if (world.getDynamicProperty(dynamicPropertyName) === undefined ||
                world.getDynamicProperty(dynamicPropertyName).trim() === "" ||
                world.getDynamicProperty(dynamicPropertyName).trim().length === 0
            ) {
                const newToken = generateRandomToken();
                world.sendMessage(`§ayour server token is §e${newToken}\n§cDo not share this token.`);
                world.setDynamicProperty(dynamicPropertyName, newToken);
            }
        }
    }
});

system.run(() => {
    beforeEvents.asyncPlayerJoin.subscribe(async event => {
        const { name, persistentId } = event;
        if (world.getAllPlayers().length > 0) {
            if (persistentId === undefined || persistentId.trim() === "" || persistentId.trim().length === 0) {
                event.disallowJoin();
                log(name, "bot");
            }
        }
    });
});