import {
    settings
} from 'settings.js';
import {
    list
} from './command_list';
import {
    system
} from '@minecraft/server';

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    customCommandRegistry.registerEnum('lpp:action', ['add', 'remove', 'list', 'remove_all']);

    list.forEach(cmd => {
        customCommandRegistry.registerCommand(
            cmd.customCommand,
            cmd.callback
        );
    });
});