import {
    version,
    playerjoin_default,
    threatlock_default,
    threatlock_duration_default,
    allowedlist_dpKey,
    playerjoin_dpKey,
    threatlock_dpKey,
    threatlock_duration_dpKey
} from 'config.js';
import {
    world
} from '@minecraft/server';

const memory = {
    version: version,
    lastTime: 0,
    isDisabledByFunction: false,
    allowedSet: null
};

const dp = {
    get(key, parse, fallback) {
        const raw = world.getDynamicProperty(key);
        if (raw === undefined) return fallback;
        try {
            return parse(raw);
        } catch {
            return fallback;
        }
    },
    set(key, value, serialize = v => v) {
        world.setDynamicProperty(key, serialize(value));
    }
};

export const KEYS = Object.freeze({
    allowedlist: allowedlist_dpKey,
    playerjoin: playerjoin_dpKey,
    threatlock: threatlock_dpKey,
    threatlock_duration: threatlock_duration_dpKey
});

export const settings = Object.freeze({
    state: Object.freeze({
        get version() {
            return memory.version;
        },

        get lastTime() {
            return memory.lastTime;
        },
        set lastTime(value) {
            if (typeof value !== 'number') return;
            memory.lastTime = value;
        },

        get isDisabledByFunction() {
            return memory.isDisabledByFunction;
        },
        set isDisabledByFunction(value) {
            if (typeof value !== 'boolean') return;
            memory.isDisabledByFunction = value;
        },

        get playerjoin() {
            return dp.get(KEYS.playerjoin, Boolean, playerjoin_default);
        },
        set playerjoin(value) {
            if (typeof value !== 'boolean') return;
            dp.set(KEYS.playerjoin, value);
        },

        get threatlock() {
            return dp.get(KEYS.threatlock, Boolean, threatlock_default);
        },
        set threatlock(value) {
            if (typeof value !== 'boolean') return;
            dp.set(KEYS.threatlock, value);
        },

        get threatlock_duration() {
            return dp.get(KEYS.threatlock_duration, Number, threatlock_duration_default);
        },
        set threatlock_duration(value) {
            if (typeof value !== 'number') return;
            dp.set(KEYS.threatlock_duration, value);
        }
    }),

    allowedList: Object.freeze({
        load() {
            const arr = dp.get(KEYS.allowedlist, JSON.parse, []);
            memory.allowedSet = new Set(Array.isArray(arr) ? arr : []);
        },
        save() {
            dp.set(KEYS.allowedlist, [...memory.allowedSet], JSON.stringify);
        },
        has(name) {
            return memory.allowedSet.has(name);
        },
        add(name) {
            if (memory.allowedSet.has(name)) return false;
            memory.allowedSet.add(name);
            return true;
        },
        remove(name) {
            if (!memory.allowedSet.has(name)) return false;
            memory.allowedSet.delete(name);
            return true;
        },
        reset() {
            memory.allowedSet.clear();
        },
        toArray() {
            return [...memory.allowedSet];
        }
    })
});