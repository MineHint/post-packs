import {
    settings,
    KEYS
} from 'settings.js';
import {
    CustomCommandStatus
} from '@minecraft/server';

export const playerjoin_handle = (origin, data) => {
    if (!origin.sourceEntity) return;

    if (data === undefined) {
        return {
            status: CustomCommandStatus.Success,
            message: `${KEYS.playerjoin} = ${settings.state.playerjoin}`
        };
    } else {
        settings.state.isDisabledByFunction = false;
        settings.state.playerjoin = data;
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