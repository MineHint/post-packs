import {
    settings,
    KEYS
} from 'settings.js';
import {
    CustomCommandStatus
} from '@minecraft/server';

export const threatlock_duration_handle = (origin, data) => {
    if (!origin.sourceEntity) return;

    if (data === undefined) {
        return {
            status: CustomCommandStatus.Success,
            message: `${KEYS.threatlock_duration} = ${settings.state.threatlock_duration}`
        };
    } else {
        settings.state.threatlock_duration = data;
        origin.sourceEntity.sendMessage({
            rawtext: [
                {
                    translate: 'lpp.command.threatlock_duration.changed',
                    with: [String(data)]
                }
            ]
        });

        return { status: CustomCommandStatus.Success };
    }
}