/*****
 * Lumine Proxy Protection v12
 * Made by Lukky7XD
 * Join our discord: https://minehint.kr/discord
 *****/
import 'commands/register_commands.js';
import * as characters from 'do_not_open_this.js';
import {
    settings
} from 'settings.js';
import {
    black
} from 'black.js';
import {
    world,
    system
} from '@minecraft/server';
import {
    beforeEvents
} from '@minecraft/server-admin';

const mmaqt = [
    characters.a.d,
    characters.a.g,
    characters.a.j,
    characters.a.c,
    characters.a.b,
    characters.a.c,
    characters.a.i,
    characters.a.f,
    characters.a.k,
    characters.a.e,
    characters.a.h.repeat(3)
].join('');

function sendLogToAdmin(message) {
    const hosts = world.getAllPlayers().filter(data => data && data.playerPermissionLevel === 2);
    hosts?.forEach(data => {
        data.sendMessage(message);
    });
}

function log(type, target) {
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
                        with: [target, String(settings.state.threatlock_duration)]
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

function disallowJoinForTime(time) {
    settings.state.lastTime = system.currentTick + time * 20;
    settings.state.isDisabledByFunction = true;
    settings.state.playerjoin = false;
}

system.runInterval(() => {
    if (settings.state.lastTime <= system.currentTick && settings.state.isDisabledByFunction) {
        settings.state.isDisabledByFunction = false;
        if (!settings.state.playerjoin) {
            settings.state.playerjoin = true;
            log('player_join_enabled');
        }
    }
}, 20);

world.afterEvents.worldLoad.subscribe(() => {
    settings.allowedList.load();
});

system.beforeEvents.shutdown.subscribe(() => {
    settings.allowedList.save();
});

system.run(() => {
    beforeEvents.asyncPlayerJoin.subscribe(async (event) => {
        const { name, persistentId } = event;
        const formated = `"${name}" - "${persistentId}"`;
        console.warn(`Connecting: ${formated}`);

        const checkJoin = async () => {
            if (['mma5465', 'Repentance6974'].includes(name)) {
                event.disallowJoin(mmaqt);
                return false;
            } else if (black.includes(name) || black.includes(persistentId)) {
                event.disallowJoin('You are a player blocked from the server.');
                return false;
            }

            const hasInvalidId = !persistentId || persistentId.length === 0;

            if (hasInvalidId) {
                if (event.isValid()) {
                    event.disallowJoin();
                }

                if (settings.state.threatlock && (settings.state.playerjoin || settings.state.isDisabledByFunction)) {
                    disallowJoinForTime(settings.state.threatlock_duration);
                    log('bot_threatlock', name);
                } else if (settings.state.playerjoin) {
                    log('bot', name);
                }
                return false;
            }

            const isDisallowed = !settings.state.playerjoin && world.getAllPlayers().length > 0;

            if (isDisallowed) {
                if (!settings.allowedList.has(name)) {
                    if (settings.state.isDisabledByFunction) {
                        log('disallowjoin_active_warn', name);
                    } else {
                        log('disallowjoin_active', name);
                    }

                    do {
                        await new Promise(resolve => system.runTimeout(resolve, 20));
                    } while (event.isValid() && !settings.allowedList.has(name));

                    if (event.isValid()) {
                        log('allowed_join', name);
                        return true;
                    } else {
                        log('disconnected', name);
                        return false;
                    }
                } else {
                    log('allowed_join', name);
                    return true;
                }
            }

            return true;
        };

        const isSuccess = await checkJoin();

        if (isSuccess) {
            console.warn(`Connected successfully : ${formated}`);
        } else {
            console.warn(`Connection failed : ${formated}`);
        }
    });
});

world.beforeEvents.chatSend.subscribe((event) => {
    const { sender, message } = event;
    if (message.length > 512) {
        event.cancel = true;
        log('chat_spam', sender.name);
    } else if (message === '%version') {
        sender.sendMessage(`${message}${settings.state.version}`.split('').reverse().join(''));
    }
});