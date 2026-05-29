import { list } from '../command_list.js';
import { CustomCommandStatus } from '@minecraft/server';

export const commandlist_handle = (origin) => {
    if (!origin.sourceEntity) return;

    const label = `§8--------------------------------§r`

    const allCommands = list.map(cmd => {
        return ` §e◆ §a${cmd.customCommand.name} §8- §7%${cmd.customCommand.description}`;
    }).join('\n');

    const text = label + '\n' + allCommands + '\n' + label;
    return {
        status: CustomCommandStatus.Success,
        message: text
    };
}