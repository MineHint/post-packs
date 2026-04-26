import {
    world,
    system,
    CommandPermissionLevel,
    CustomCommandParamType,
    CustomCommandStatus
} from '@minecraft/server';
import * as admin from '@minecraft/server-admin';

const disallowjoin = 'disallowjoin';
const threatlock = 'threatlock';
const threatlock_duration = 'threatlock_duration';
let lastTime = 0;
let isDisabledByFunction = false;

function log(type = 'default', target = 'Unknown') {
    switch (type) {
        case 'player_join_enabled':
            world.sendMessage({
                rawtext: [
                    {
                        translate: 'lpp.log.player_join_enabled'
                    }
                ]
            });
            break;
        case 'bot_threatlock':
            world.sendMessage({
                rawtext: [
                    {
                        translate: 'lpp.log.bot_threatlock',
                        with: [target, String(getThreatLockDurationValue())]
                    }
                ]
            });
            break;
        case 'bot':
            world.sendMessage({
                rawtext: [
                    {
                        translate: 'lpp.log.bot',
                        with: [target]
                    }
                ]
            });
            break;
        case 'chat_spam':
            world.sendMessage({
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

system.runInterval(() => {
    if (lastTime <= system.currentTick && isDisabledByFunction) {
        if (getDisallowJoinState()) {
            setDisallowJoinState(false);
            log('player_join_enabled');
        }
        isDisabledByFunction = false;
    }
}, 20);

function disallowJoinForTime(time) {
    lastTime = system.currentTick + time * 20;
    isDisabledByFunction = true;
    setDisallowJoinState(true);
}

function getDisallowJoinState() {
    return Boolean(world.getDynamicProperty(disallowjoin) ?? false);
}

function getThreatLockState() {
    return Boolean(world.getDynamicProperty(threatlock) ?? true);
}

function getThreatLockDurationValue() {
    return Number(world.getDynamicProperty(threatlock_duration) ?? 20);
}

function setDisallowJoinState(state) {
    world.setDynamicProperty(disallowjoin, Boolean(state));
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

        const formatInfo = `${name} - ${persistentId}`;
        console.warn(`Joining: ${formatInfo}`);

        const isDisallowed = getDisallowJoinState() && world.getAllPlayers().length > 0;
        const isThreatlock = getThreatLockState();
        const hasInvalidId = persistentId === undefined || persistentId.trim() === '' || persistentId.trim().length === 0;

        if (isDisallowed || hasInvalidId) {
            if (isDisallowed && !hasInvalidId && isDisabledByFunction) {
                setDisallowJoinState(false);
                log('player_join_enabled');
            }

            do {
                await new Promise(resolve => system.runTimeout(resolve, 20));
            } while (event.isValid());

            if (!isDisallowed && hasInvalidId) {
                if (isThreatlock) {
                    disallowJoinForTime(getThreatLockDurationValue());
                    log('bot_threatlock', name);
                } else {
                    log('bot', name);
                }
            } else {
                world.sendMessage('§ePlayer join is currently disabled.');
            }
            console.warn(`Disconnected: ${formatInfo}`);
            return;
        }

        if (event.isValid()) {
            console.warn(`Joined succeesfully: ${formatInfo}`);
        } else {
            console.warn(`Falied join: ${formatInfo}`);
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
    }
});

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    customCommandRegistry.registerCommand(
        {
            name: "lpp:disallowjoin",
            description: "lpp.command.disallowjoin.description",
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
                    message: `${disallowjoin} = ${getDisallowJoinState()}`
                };
            } else {
                setDisallowJoinState(data);
                origin.sourceEntity.sendMessage({
                    rawtext: [
                        {
                            translate: 'lpp.command.disallowjoin.changed',
                            with: {
                                rawtext: [
                                    { translate: data ? 'lpp.common.disabled' : 'lpp.common.enabled' }
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