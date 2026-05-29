import { commandlist_handle } from './commandlist/index.js';
import { playerjoin_handle } from './playerjoin/index.js';
import { allowlist_handle } from './allowlist/index.js';
import { threatlock_handle } from './threatlock/index.js';
import { threatlock_duration_handle } from './threatlock_duration/index.js';
import {
    CommandPermissionLevel,
    CustomCommandParamType
} from '@minecraft/server';

export const list = [
    {
        customCommand: {
            name: "lpp:commandlist",
            description: "lpp.command.commandlist.description",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callback: commandlist_handle
    },
    {
        customCommand: {
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
        callback: playerjoin_handle
    },
    {
        customCommand: {
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
        callback: allowlist_handle
    },
    {
        customCommand: {
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
        callback: threatlock_handle
    },
    {
        customCommand: {
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
        callback: threatlock_duration_handle
    }
];