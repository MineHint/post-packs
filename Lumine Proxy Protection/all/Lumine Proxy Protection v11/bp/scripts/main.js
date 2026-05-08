/*****
 * Lumine Proxy Protection v11
 * Made by Lukky7XD
 * Join our discord: https://minehint.kr/discord
 *****/

import {
    playerjoin_default,
    threatlock_default,
    threatlock_duration_default,
    sendLog
} from 'config.js';
import {
    world,
    system,
    CommandPermissionLevel,
    CustomCommandParamType,
    CustomCommandStatus
} from '@minecraft/server';
import * as admin from '@minecraft/server-admin';

const version = 11;
const allowedlist = 'allowedlist';
const playerjoin = 'playerjoin';
const threatlock = 'threatlock';
const threatlock_duration = 'threatlock_duration';
let lastTime = 0;
let isDisabledByFunction = false;

function sendLogToAdmin(message) {
    const hosts = world.getAllPlayers().filter(data => data && data.playerPermissionLevel === 2);
    hosts?.forEach(data => {
        data.sendMessage(message);
    });
}

function log(type, target) {
    if (!sendLog) return;

    switch (type) {
        case 'player_join_enabled':
            sendLogToAdmin({
                rawtext: [
                    {
                        translate: 'lpp.log.player_join_enabled'
                    }
                ]
            });
            break;
        case 'disallowjoin_active':
            sendLogToAdmin({
                rawtext: [
                    {
                        translate: 'lpp.log.disallowjoin_active',
                        with: [target, target.includes(' ') ? `"${target}"` : target]
                    }
                ]
            });
            break;
        case 'disallowjoin_active_warn':
            sendLogToAdmin({
                rawtext: [
                    {
                        translate: 'lpp.log.disallowjoin_active_warn',
                        with: [target, target.includes(' ') ? `"${target}"` : target]
                    }
                ]
            });
            break;
        case 'allowed_join':
            sendLogToAdmin({
                rawtext: [
                    {
                        translate: 'lpp.log.allowed_join',
                        with: [target]
                    }
                ]
            });
            break;
        case 'disconnected':
            sendLogToAdmin({
                rawtext: [
                    {
                        translate: 'lpp.log.disconnected',
                        with: [target]
                    }
                ]
            });
            break;
        case 'bot_threatlock':
            sendLogToAdmin({
                rawtext: [
                    {
                        translate: 'lpp.log.bot_threatlock',
                        with: [target, String(getThreatLockDurationValue())]
                    }
                ]
            });
            break;
        case 'bot':
            sendLogToAdmin({
                rawtext: [
                    {
                        translate: 'lpp.log.bot',
                        with: [target]
                    }
                ]
            });
            break;
        case 'chat_spam':
            sendLogToAdmin({
                rawtext: [
                    {
                        translate: 'lpp.log.chat_spam',
                        with: [target]
                    }
                ]
            });
            break;
    }
}

function getPlayerJoinState() {
    return Boolean(world.getDynamicProperty(playerjoin) ?? playerjoin_default);
}

function getThreatLockState() {
    return Boolean(world.getDynamicProperty(threatlock) ?? threatlock_default);
}

function getThreatLockDurationValue() {
    return Number(world.getDynamicProperty(threatlock_duration) ?? threatlock_duration_default);
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

function resetAllowedList() {
    world.setDynamicProperty(allowedlist, JSON.stringify([]));
}

function getAllowedListToArray() {
    const raw = world.getDynamicProperty(allowedlist);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            resetAllowedList();
        }
    }

    return [];
}

function addAllowedList(name) {
    const names = getAllowedListToArray();
    if (names.includes(name)) {
        return false;
    }

    try {
        names.push(name);
        world.setDynamicProperty(allowedlist, JSON.stringify(names));
        return true;
    } catch {
        return false;
    }

}

function removeAllowedList(name) {
    const names = getAllowedListToArray();
    const index = names.indexOf(name);
    if (index === -1) {
        return false;
    }

    try {
        names.splice(index, 1);
        world.setDynamicProperty(allowedlist, JSON.stringify(names));
        return true;
    } catch {
        return false;
    }
}

function disallowJoinForTime(time) {
    lastTime = system.currentTick + time * 20;
    isDisabledByFunction = true;
    setPlayerJoinState(false);
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

system.run(() => {
    admin.beforeEvents.asyncPlayerJoin.subscribe(async (event) => {
        const { name, persistentId } = event;

        const isDisallowed = !getPlayerJoinState() && world.getAllPlayers().length > 0;
        const hasInvalidId = !persistentId || persistentId.length === 0;

        if (isDisallowed || hasInvalidId) {
            if (hasInvalidId) {
                if (event.isValid()) {
                    event.disallowJoin();
                }

                if (getThreatLockState() && (getPlayerJoinState() || isDisabledByFunction)) {
                    disallowJoinForTime(getThreatLockDurationValue());
                    log('bot_threatlock', name);
                } else if (getPlayerJoinState()) {
                    log('bot', name);
                }
            } else if (!getPlayerJoinState()) {
                if (!getAllowedListToArray().includes(name)) {
                    if (isDisabledByFunction) {
                        log('disallowjoin_active_warn', name);
                    } else {
                        log('disallowjoin_active', name);
                    }

                    do {
                        await new Promise(resolve => system.runTimeout(resolve, 20));
                    } while (event.isValid() && !getAllowedListToArray().includes(name));

                    if (event.isValid()) {
                        log('allowed_join', name);
                    } else {
                        log('disconnected', name);
                    }
                } else {
                    log('allowed_join', name);
                }
            }
            return;
        }
    });
});

world.beforeEvents.chatSend.subscribe((event) => {
    const { sender, message } = event;
    if (message.length > 512) {
        event.cancel = true;
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

    customCommandRegistry.registerEnum('lpp:action', ['add', 'remove', 'list', 'remove_all']);

    customCommandRegistry.registerCommand(
        {
            name: "lpp:allowlist",
            description: "lpp.command.allowlist.description",
            permissionLevel: CommandPermissionLevel.Admin,
            mandatoryParameters: [
                {
                    name: "lpp:action",
                    type: CustomCommandParamType.Enum
                }
            ],
            optionalParameters: [
                {
                    name: "playerName",
                    type: CustomCommandParamType.String
                }
            ]
        },
        (origin, data1, data2) => {
            if (!origin.sourceEntity) return;

            if (data2) {
                if (data1 === 'add') {
                    if (addAllowedList(data2)) {
                        origin.sourceEntity.sendMessage({
                            rawtext: [
                                {
                                    translate: 'lpp.command.allowlist.add.allowed',
                                    with: [data2]
                                }
                            ]
                        });
                        return;
                    } else {
                        origin.sourceEntity.sendMessage({
                            rawtext: [
                                {
                                    translate: 'lpp.command.allowlist.add.exist',
                                    with: [data2]
                                }
                            ]
                        });
                        return;
                    }
                } else if (data1 === 'remove') {
                    if (removeAllowedList(data2)) {
                        origin.sourceEntity.sendMessage({
                            rawtext: [
                                {
                                    translate: 'lpp.command.allowlist.remove.removed',
                                    with: [data2]
                                }
                            ]
                        });
                        return;
                    } else {
                        origin.sourceEntity.sendMessage({
                            rawtext: [
                                {
                                    translate: 'lpp.command.allowlist.remove.nothing',
                                    with: [data2]
                                }
                            ]
                        });
                        return;
                    }
                }
            } else {
                if (data1 === 'list') {
                    return {
                        status: CustomCommandStatus.Success,
                        message: `${allowedlist} = ${JSON.stringify(getAllowedListToArray())}`
                    };
                } else if (data1 === 'remove_all') {
                    resetAllowedList();
                    origin.sourceEntity.sendMessage({
                        rawtext: [
                            {
                                translate: 'lpp.command.allowlist.remove_all'
                            }
                        ]
                    });
                    return;
                }
            }

            return {
                status: CustomCommandStatus.Failure,
                message: '%lpp.command.allowlist.wrong'
            };
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