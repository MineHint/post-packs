import {
    settings,
    KEYS
} from 'settings.js';
import {
    CustomCommandStatus
} from '@minecraft/server';

export const allowlist_handle = (origin, data1, data2) => {
    if (!origin.sourceEntity) return;

    if (data2) {
        if (data1 === 'add') {
            if (!settings.allowedList.has(data2)) {
                settings.allowedList.add(data2);
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
            if (settings.allowedList.has(data2)) {
                settings.allowedList.remove(data2);
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
                message: `${KEYS.allowedlist} = ${JSON.stringify(settings.allowedList.toArray())}`
            };
        } else if (data1 === 'remove_all') {
            settings.allowedList.reset();
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