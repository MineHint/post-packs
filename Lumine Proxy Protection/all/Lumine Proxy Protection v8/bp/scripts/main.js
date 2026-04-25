import { world, system } from '@minecraft/server';
import { beforeEvents } from "@minecraft/server-admin";

const LPP_VERIFY_TOKEN = `lpp_verify_token`;
const LPP_BANISH_TOKEN = `lpp_banish_token`;
const LPP_TOKEN_STARTSWITH = `lpp_`;

function verifyDynamicPropertyValue(property) {
	return (
		world.getDynamicProperty(property) === undefined ||
		world.getDynamicProperty(property).trim() === "" ||
		world.getDynamicProperty(property).trim().length === 0
	);
}

function generateRandomToken() {
	const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = LPP_TOKEN_STARTSWITH;
	for (let i = 0; i < 50; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

function banishGhostPlayer() {
	system.run(() => {
		const v_tag = world.getDynamicProperty(LPP_VERIFY_TOKEN);
		world.getDimension("overworld").runCommand(`tag @a remove ${v_tag}`);
		for (const player of world.getAllPlayers()) {
			if (player.isValid) {
				player.addTag(`${v_tag}`);
			}
		}
		const entities = world.getDimension("overworld").getEntities({
			type: "player",
			excludeTags: [`${v_tag}`]
		});
		for (const entity of entities) {
			log(entity.name, "ghost");
		}
		world.getDimension("overworld").runCommand(`kick @e[type=player,tag=!${v_tag}]`);
		world.getDimension("overworld").runCommand(`tag @a remove ${v_tag}`);
	});
}

function banish(p) {
	system.run(() => {
		const b_tag = world.getDynamicProperty(LPP_BANISH_TOKEN);
		if (p.isValid) {
			p.addTag(`${b_tag}`);
		} else {
			kickGhostPlayer();
		}
		world.getDimension("overworld").runCommand(`kick @a[tag=${b_tag}]`);
	});
}

function crash(p) {
	system.run(() => {
		const text = new Array(32768).fill('§l§c§k쀏').join("");
		p.sendMessage(`${text}`);
		const form = new ActionFormData()
			.title(`${text}`)
			.body(`${text}`);
			
		form.show(p).catch(() => {});
	});
}

function log(name = "Unknown", type = "default") {
	switch (type) {
		case "default": 
			world.sendMessage({
				rawtext: [{
					translate: "lpp.log.default",
					with: [`${name}`]
				}]
			});
			break;
			
		case "ghost": 
			world.sendMessage({
				rawtext: [{
					translate: "lpp.log.ghost",
					with: [`${name}`]
				}]
			});
			break;
			
		case "forceop": 
			world.sendMessage({
				rawtext: [{
					translate: "lpp.log.forceop",
					with: [`${name}`]
				}]
			});
			break;
			
		case "bot": 
			world.sendMessage({
				rawtext: [{
					translate: "lpp.log.bot",
					with: [`${name}`]
				}]
			});
			break;
			
		case "chat_spam": 
			world.sendMessage({
				rawtext: [{
					translate: "lpp.log.chat_spam",
					with: [`${name}`]
				}]
			});
			break;
			
		default: 
			world.sendMessage({
				rawtext: [{
					translate: "lpp.log.default",
					with: [`${name}`]
				}]
			});
			break;
			
	}
}

world.afterEvents.playerSpawn.subscribe((event) => {
	const { player, initialSpawn } = event;
	if (initialSpawn) {
		banishGhostPlayer();
		
		if (world.getAllPlayers().length === 1) {
			system.runTimeout(() => {
				world.sendMessage({
					rawtext: [{
						translate: "lpp.loaded.message"
					}]
				});
				if (verifyDynamicPropertyValue(LPP_VERIFY_TOKEN)) {
					const newVerifyToken = generateRandomToken();
					world.setDynamicProperty(LPP_VERIFY_TOKEN, newVerifyToken);
					world.sendMessage({
						rawtext: [{
							translate: "lpp.loaded.token.verify",
							with: [`${newVerifyToken}`]
						}]
					});
				}
				if (verifyDynamicPropertyValue(LPP_BANISH_TOKEN)) {
					const newBanishToken = generateRandomToken();
					world.setDynamicProperty(LPP_BANISH_TOKEN, newBanishToken);
					world.sendMessage({
						rawtext: [{
							translate: "lpp.loaded.token.banish",
							with: [`${newBanishToken}`]
						}]
					});
				}
			}, 20);
		}
	}
});

// bot joining, force op block
world.afterEvents.worldLoad.subscribe((event) => {
	beforeEvents.asyncPlayerJoin.subscribe(async event => {
		const { name, persistentId } = event;
		if (world.getAllPlayers().length > 0) {
			if (persistentId === undefined || persistentId.trim() === "" || persistentId.trim().length === 0) {
				const host = world.getAllPlayers().find(player => player.isValid && player.commandPermissionLevel === 3);
				if (host?.name.trim() === name.trim()) {
					event.disallowJoin();
					log(name, "forceop");
				} else {
					event.disallowJoin();
					log(name, "bot");
				}
			}
		}
	});
});

// chat spam freezing block
world.beforeEvents.chatSend.subscribe((event) => {
	const { sender, message } = event;
	if (message.length > 512) {
		event.cancel = true;
		crash(sender);
		log(sender.name, "chat_spam");
	}
});

// shulker nesting block
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	const { block, player } = event;
	if (block.typeId.includes("shulker_box")) {
		system.run(() => {
			const inventoryComponent = block.getComponent("minecraft:inventory");
			if (inventoryComponent) {
				const container = inventoryComponent.container;
				for (let i = 0; i < container.size; i++) {
					const item = container.getItem(i);
					if (item && item.typeId.includes("shulker_box")) {
						container.setItem(i, item);
					}
				}
			}
		});
	}
});