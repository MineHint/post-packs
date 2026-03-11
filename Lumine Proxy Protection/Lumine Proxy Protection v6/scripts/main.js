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

function banish(p) {
	const tag = world.getDynamicProperty(dynamicPropertyName);
	if (p.isValid) {
		p.addTag(`${tag}`);
	}
	world.getDimension("overworld").runCommand(`kick @a[tag=${tag}]`);
}

function log(name) {
	system.run(() => {
		world.sendMessage(`§cLumine Proxy connection denied: §e${name}`);
	});
}

world.afterEvents.playerSpawn.subscribe((event) => {
	const { player, initialSpawn } = event;
	if (initialSpawn) {
		if (player.isValid) {
			if (player.clientSystemInfo.maxRenderDistance <= 0 ||
				player.clientSystemInfo.platformType === "Desktop" && player.clientSystemInfo.memoryTier === 0 ||
				player.clientSystemInfo.platformType === "Console" && player.clientSystemInfo.memoryTier <= 1
			) {
				banish(player);
				log(player.name);
			} else {
				const tag = world.getDynamicProperty(dynamicPropertyName);
				player.removeTag(`${tag}`);
			}
		} else {
			banish(player);
		}
		
		if (world.getAllPlayers().length == 1) {
            world.sendMessage(`§aLumine Proxy Protection v6 is now active.`)
            if (typeof world.getDynamicProperty(dynamicPropertyName) == "undefined") {
                const newToken = generateRandomToken();
                world.sendMessage(`§ayour server token is §e${newToken}\n§cDo not share this token.`)
                world.setDynamicProperty(dynamicPropertyName, newToken)
                return;
            }
        }
	}
});

system.run(() => {
    beforeEvents.asyncPlayerJoin.subscribe(async event => {
        const { name, persistentId } = event;
        if (name.includes(".") ||
            name.includes("/") ||
            name.includes("discord.gg") ||
            name == `Steve` ||
            (world.getAllPlayers().length > 0 && persistentId.length == 0) ||
            typeof name == "undefined" ||
            name.trim() == ""
        ) {
            event.disconnect();
            log(name);
        }
    });
});