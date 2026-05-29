import {
    settings,
    KEYS
} from 'settings.js';
import {
    CustomCommandStatus
} from '@minecraft/server';

export const threatlock_handle = (origin, data) => {
    if (!origin.sourceEntity) return;

    if (data === undefined) {
        return {
            status: CustomCommandStatus.Success,
            message: `${KEYS.threatlock} = ${settings.state.threatlock}`
        };
    } else {
        settings.state.threatlock = data;
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