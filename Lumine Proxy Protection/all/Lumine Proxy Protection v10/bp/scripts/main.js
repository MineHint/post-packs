import {
    world,
    system,
    CommandPermissionLevel,
    CustomCommandParamType,
    CustomCommandStatus
} from '@minecraft/server';
import * as admin from '@minecraft/server-admin';

const version = 10;
const allowedName = new Set();
const playerjoin = 'playerjoin';
const threatlock = 'threatlock';
const threatlock_duration = 'threatlock_duration';
let lastTime = 0;
let isDisabledByFunction = false;

function log(type, target = 'Unknown') {
    const hosts = world.getAllPlayers().filter(data => data && data.commandPermissionLevel >= 2);
    switch (type) {
        case 'player_join_enabled':
            hosts?.forEach(data => {
                data.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.log.player_join_enabled'
                        }
                    ]
                });
            });
            break;
        case 'disallowjoin_active':
            hosts?.forEach(data => {
                data.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.log.disallowjoin_active',
                            with: [target]
                        }
                    ]
                });
            });
            break;
        case 'disallowjoin_active_warn':
            hosts?.forEach(data => {
                data.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.log.disallowjoin_active_warn',
                            with: [target]
                        }
                    ]
                });
            });
            break;
        case 'joined':
            hosts?.forEach(data => {
                data.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.log.joined',
                            with: [target]
                        }
                    ]
                });
            });
            break;
        case 'disconnected':
            hosts?.forEach(data => {
                data.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.log.disconnected',
                            with: [target]
                        }
                    ]
                });
            });
            break;
        case 'bot_threatlock':
            hosts?.forEach(data => {
                data.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.log.bot_threatlock',
                            with: [target, String(getThreatLockDurationValue())]
                        }
                    ]
                });
            });
            break;
        case 'bot':
            hosts?.forEach(data => {
                data.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.log.bot',
                            with: [target]
                        }
                    ]
                });
            });
            break;
        case 'chat_spam':
            hosts?.forEach(data => {
                data.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.log.chat_spam',
                            with: [target]
                        }
                    ]
                });
            });
            break;
    }
}

system.runInterval(() => {
    if (lastTime <= system.currentTick && isDisabledByFunction) {
        isDisabledByFunction = false;
        if (!getPlayerJoinState()) {
            setPlayerJoinState(true);
            log('player_join_enabled');
        }
    }
}, 20);

function disallowJoinForTime(time) {
    lastTime = system.currentTick + time * 20;
    isDisabledByFunction = true;
    setPlayerJoinState(false);
}

function getPlayerJoinState() {
    return Boolean(world.getDynamicProperty(playerjoin) ?? true);
}

function getThreatLockState() {
    return Boolean(world.getDynamicProperty(threatlock) ?? true);
}

function getThreatLockDurationValue() {
    return Number(world.getDynamicProperty(threatlock_duration) ?? 30);
}

function setPlayerJoinState(state) {
    world.setDynamicProperty(playerjoin, Boolean(state));
}

function setThreatLockState(state) {
    world.setDynamicProperty(threatlock, Boolean(state));
}

function setThreatLockDurationValue(value) {
    world.setDynamicProperty(threatlock_duration, Number(value));
}

world.afterEvents.worldLoad.subscribe(() => {
    admin.beforeEvents.asyncPlayerJoin.subscribe(async (event) => {
        const { name, persistentId } = event;
        const formated = `"${name}" - "${persistentId}"`;

        console.warn(`Connecting: ${formated}`);

        const isDisallowed = !getPlayerJoinState() && world.getAllPlayers().length > 0;
        const hasInvalidId = !persistentId || persistentId.trim().length === 0;

        if (isDisallowed || hasInvalidId) {
            if (getPlayerJoinState() && hasInvalidId) {
                if (event.isValid()) {
                    event.disallowJoin();
                }

                if (getThreatLockState()) {
                    disallowJoinForTime(getThreatLockDurationValue());
                    log('bot_threatlock', name);
                } else {
                    log('bot', name);
                }
            } else if (!getPlayerJoinState()) {
                if (!hasInvalidId && allowedName.has(name)) {
                    return;
                } else if (isDisabledByFunction) {
                    log('disallowjoin_active_warn', name);
                } else {
                    log('disallowjoin_active', name);
                }

                do {
                    await new Promise(resolve => system.runTimeout(resolve, 20));
                } while (event.isValid() && (hasInvalidId || !allowedName.has(name)));

                if (event.isValid()) {
                    log('joined', name);
                } else {
                    log('disconnected', name);
                }
            }
        }

        if (event.isValid()) {
            console.warn(`Connection successful: ${formated}`);
            event.allowJoin();
        } else {
            console.warn(`Connection failed: ${formated}`);
        }
    });
});

world.beforeEvents.chatSend.subscribe((event) => {
    const { sender, message } = event;
    if (message.length > 512) {
        event.cancel = true;
        system.run(() => {
            sender.runCommand('kick @s');
        });
        log('chat_spam', sender.name);
    } else if (message === '%version') {
        sender.sendMessage(String(message + version).split('').reverse().join(''));
    }
});

world.afterEvents.playerSpawn.subscribe((event) => {
    if (world.getAllPlayers().length === 1) {
        world.sendMessage(`§aLumine Proxy Protection v${version} is now active.`);
        world.sendMessage(`§eJoin our §9discord §r: https://post.minehint.kr/discord`);
    }
});

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    customCommandRegistry.registerCommand(
        {
            name: "lpp:playerjoin",
            description: "lpp.command.playerjoin.description",
            permissionLevel: CommandPermissionLevel.Host,
            optionalParameters: [
                {
                    name: "value",
                    type: CustomCommandParamType.Boolean
                }
            ]
        },
        (origin, data) => {
            if (!origin.sourceEntity) return;

            if (data === undefined) {
                return {
                    status: CustomCommandStatus.Success,
                    message: `${playerjoin} = ${getPlayerJoinState()}`
                };
            } else {
                isDisabledByFunction = false;
                setPlayerJoinState(data);
                origin.sourceEntity.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.command.playerjoin.changed',
                            with: {
                                rawtext: [
                                    { translate: data ? 'lpp.common.enabled' : 'lpp.common.disabled' }
                                ]
                            }
                        }
                    ]
                });

                return { status: CustomCommandStatus.Success };
            }
        }
    );

    customCommandRegistry.registerCommand(
        {
            name: "lpp:allowjoin",
            description: "lpp.command.allowjoin.description",
            permissionLevel: CommandPermissionLevel.Admin,
            mandatoryParameters: [
                {
                    name: "-?playerName",
                    type: CustomCommandParamType.String
                }
            ]
        },
        (origin, data) => {
            if (!origin.sourceEntity) return;

            if (data.startsWith('-')) {
                const name = data.slice(1);
                if (allowedName.has(name)) {
                    allowedName.delete(name);
                    origin.sourceEntity.sendMessage({
                        rawtext: [
                            {
                                translate: 'lpp.command.allowjoin.remove.removed',
                                with: [name]
                            }
                        ]
                    });
                } else {
                    origin.sourceEntity.sendMessage({
                        rawtext: [
                            {
                                translate: 'lpp.command.allowjoin.remove.nothing',
                                with: [name]
                            }
                        ]
                    });
                }
            } else {
                if (allowedName.has(data)) {
                    origin.sourceEntity.sendMessage({
                        rawtext: [
                            {
                                translate: 'lpp.command.allowjoin.add.exist',
                                with: [data]
                            }
                        ]
                    });
                } else {
                    allowedName.add(data);
                    origin.sourceEntity.sendMessage({
                        rawtext: [
                            {
                                translate: 'lpp.command.allowjoin.add.allowed',
                                with: [data]
                            }
                        ]
                    });
                }
            }

            return { status: CustomCommandStatus.Success };
        }
    );

    customCommandRegistry.registerCommand(
        {
            name: "lpp:threatlock",
            description: "lpp.command.threatlock.description",
            permissionLevel: CommandPermissionLevel.Host,
            optionalParameters: [
                {
                    name: "value",
                    type: CustomCommandParamType.Boolean
                }
            ]
        },
        (origin, data) => {
            if (!origin.sourceEntity) return;

            if (data === undefined) {
                return {
                    status: CustomCommandStatus.Success,
                    message: `${threatlock} = ${getThreatLockState()}`
                };
            } else {
                setThreatLockState(data);
                origin.sourceEntity.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.command.threatlock.changed',
                            with: {
                                rawtext: [
                                    { translate: data ? 'lpp.common.enabled' : 'lpp.common.disabled' }
                                ]
                            }
                        }
                    ]
                });

                return { status: CustomCommandStatus.Success };
            }
        }
    );

    customCommandRegistry.registerCommand(
        {
            name: "lpp:threatlock_duration",
            description: "lpp.command.threatlock_duration.description",
            permissionLevel: CommandPermissionLevel.Host,
            optionalParameters: [
                {
                    name: "value",
                    type: CustomCommandParamType.Integer
                }
            ]
        },
        (origin, data) => {
            if (!origin.sourceEntity) return;

            if (data === undefined) {
                return {
                    status: CustomCommandStatus.Success,
                    message: `${threatlock_duration} = ${getThreatLockDurationValue()}`
                };
            } else {
                setThreatLockDurationValue(data);
                origin.sourceEntity.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.command.threatlock_duration.changed',
                            with: [String(getThreatLockDurationValue())]
                        }
                    ]
                });

                return { status: CustomCommandStatus.Success };
            }
        }
    );
});