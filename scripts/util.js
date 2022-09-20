import * as Minecraft from "mojang-minecraft";
import config from "./data/config.js";
import data from "./data/data.js";

const World = Minecraft.world;

/**
 * @name flag
 * @param {Player} player - The player object
 * @param {string} check - What check ran the function.
 * @param {string} checkType - What sub-check ran the function (ex. a, b ,c).
 * @param {string} hackType - What the hack is considered as (ex. movement, combat, exploit).
 * @param {string} debugName - Name for the debug value.
 * @param {string} debug - Debug info.
 * @param {boolean} shouldTP - Whever to tp the player to itself.
 * @param {Message} message - The message object, used to cancel the message.
 * @param {number} slot - Slot to clear an item out.
 * @example flag(player, "Spammer", "B", "Combat", false, false, false, msg, false);
 * @remarks Alerts staff if a player is hacking.
 */
export function flag(player, check, checkType, hackType, debugName, debug, shouldTP = false, message, slot) {
    // validate that required params are defined
    if(typeof player !== "object") return console.warn(`${new Date()} | ` + `Error: player is type of ${typeof player}. Expected "object' (./util.js:23)`);
    if(typeof check !== "string") return console.warn(`${new Date()} | ` + `Error: check is type of ${typeof check}. Expected "string' (./util.js:24)`);
    if(typeof checkType !== "string") return console.warn(`${new Date()} | ` + `Error: checkType is type of ${typeof checkType}. Expected "string' (./util.js:25)`);
    if(typeof hackType !== "string") return console.warn(`${new Date()} | ` + `Error: hackType is type of ${typeof hackType}. Expected "string' (./util.js:26)`);
    if(typeof shouldTP !== "boolean") return console.warn(`${new Date()} | ` + `Error: shouldTP is type of ${typeof shouldTP}. Expected "boolean' (./util.js:28)`);

    if(typeof debug === "string") {
        // remove characters that may break commands
        debug = debug.replace(/"|\\/gm, "");

        // malicous users may try make the debug field ridiclously large to lag any clients that may try to view the alert
        // (anybody with the 'notify' tag)
        if(debug.length > 256) {
            let extraLength = debug.length - 256;
            debug = debug.slice(0, -extraLength) + ` (+${extraLength} additional characters)`;
        }
    }

    // If debug is enabled, then we log everything we know about the player.
    if(config.debug === true) console.warn(`{"timestamp":${Date.now()},"time":"${Date()}","check":"${check}/${checkType}","hackType":"${hackType}","debug":"${debugName}=${debug}§r","shouldTP":${shouldTP},"slot":"${slot}","playerData":{"playerName":"${player.name}","playerNameTag":"${player.nameTag}","lastPlayerName":"${player.oldName}","location":{"x":${player.location.x},"y":${player.location.y},"z":${player.location.z}},"headLocation":{"x":${player.headLocation.x},"y":${player.headLocation.y},"z":${player.headLocation.z}},"velocity":{"x":${player.velocity.x},"y":${player.velocity.y},"z":${player.velocity.z}},"rotation":{"x":${player.rotation.x},"y":${player.rotation.y}},"playerTags":"${String(player.getTags()).replace(/[\r\n"]/gm, "")}","currentItem":"${player.getComponent("inventory").container.getItem(player.selectedSlot)?.id || "minecraft:air"}:${player.getComponent("inventory").container.getItem(player.selectedSlot)?.data || 0}","selectedSlot":${player.selectedSlot},"dimension":"${player.dimension.id}","playerDataExtra":{"blocksBroken":${player.blocksBroken || -1},"entitiesHitCurrentTick":"${player.entitiesHit}","entitiesHitCurrentTickSize":${player.entitiesHit.length || -1},"badpackets5Ticks":${player.badpackets5Ticks || -1},"playerCPS":${player.cps || -1},"firstAttack":${player.firstAttack || -1},"lastSelectedSlot":${player.lastSelectedSlot || -1},"startBreakTime":${player.startBreakTime || -1}}}}`);

    // cancel the message
    if(typeof message === "object") message.cancel = true;

    if(shouldTP === true && check !== "Crasher") player.runCommand("tp @s @s");
        else if(shouldTP === true && check === "Crasher") player.runCommand("tp @s 30000000 30000000 30000000");

    if(check !== "CommandBlockExploit") {
        player.runCommandAsync(`scoreboard objectives add ${check.toLowerCase()}vl dummy`);
    } 

    if(check !== "CommandBlockExploit") player.runCommand(`scoreboard players add @s ${check.toLowerCase()}vl 1`);
        else player.runCommand("scoreboard players add @s cbevl 1");

    if(debug && check !== "CommandBlockExploit") player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §1has failed §7(${hackType}) §4${check}/${checkType.toUpperCase()} §7(${debugName}=${debug}§r§7)§4. VL= "},{"score":{"name":"@s","objective":"${check.toLowerCase()}vl"}}]}`);
        else if(debugName && debug) player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §1has failed §7(${hackType}) §4${check}/${checkType.toUpperCase()} §7(${debugName}=${debug}§r§7)§4. VL= "},{"score":{"name":"@s","objective":"cbevl"}}]}`);
        else player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" §1has failed §7(${hackType}) §4${check}/${checkType.toUpperCase()}. VL= "},{"score":{"name":"@s","objective":"${check.toLowerCase()}vl"}}]}`);

    if(typeof slot === "number") {
		let container = player.getComponent("inventory").container;
		try {
			container.setItem(slot, new Minecraft.ItemStack(Minecraft.MinecraftItemTypes.dirt, 0, 0));
		} catch {}
	}

    let checkData = config.modules[check.toLowerCase() + checkType.toUpperCase()];
    if(typeof checkData !== "object") return console.warn(`${new Date()} | ` + `Error: No valid check data found for ${check}/${checkType}. (./util.js:62)`);

    if(checkData.enabled === false) console.warn(`${new Date()} | ` + `Error: ${check}/${checkType} was flagged but the module was disabled. (./util.js:64)`);

    // punishment stuff
    let punishment = checkData.punishment.toLowerCase();
    if(punishment === "none" || punishment === "") return;
    if(typeof punishment !== "string") return console.warn(`${new Date()} | ` + `Error: punishment is type of ${typeof punishment}. Expected "string' (./util.js:78)`);

    let currentVL = World.scoreboard.getObjective(`${check.toLowerCase()}vl`)?.getScore(player.scoreboard);
    let punishmentLength = checkData.punishmentLength?.toLowerCase();

    if(punishment === "kick" && currentVL >= checkData.minVlbeforePunishment) {
        try {
            player.runCommand(`kick "${player.name}" §r§6[§aScythe§6]§r You have been kicked for hacking. Check: ${check}\\${checkType}`);
            player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has been automatically kicked by Scythe Anticheat for Unfair Advantage. Check: ${check}/${checkType}"}]}`);
        } catch {
            // if we cant /kick them then we despawn them
            player.triggerEvent("scythe:kick");
        }
    }
    if(punishment === "ban" && currentVL >= checkData.minVlbeforePunishment) {
        if(World.scoreboard.getObjective("autoban")?.getScore(player.scoreboard) >= 1) {
            player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has been banned by Scythe Anticheat for Unfair Advantage. Check: ${check}/${checkType}"}]}`);
                
            // this removes old ban stuff
            player.getTags().forEach(t => {
                t = t.replace(/"/g, "");
                if(t.startsWith("reason:")) player.removeTag(t);
                    else if(t.startsWith("by:")) player.removeTag(t);
                    else if(t.startsWith("time:")) player.removeTag(t);
            });

            let banLength;

            if(typeof punishmentLength !== "undefined" && isNaN(punishmentLength) && punishment !== "") {
                banLength = parseTime(punishmentLength);
            }

            player.addTag("by:Scythe Anticheat");
            player.addTag(`reason:Scythe Anticheat detected Unfair Advantage! Check: ${check}/${checkType}`);
            if(typeof punishmentLength !== "undefined") player.addTag(`time:${Date.now() + banLength}`);
            player.addTag("isBanned");
        }
    }
    if(punishment === "mute" && currentVL >= checkData.minVlbeforePunishment) {
        player.addTag("isMuted");
        player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"text":"You have been muted by Scythe Anticheat for Unfair Advantage. Check: ${check}/${checkType}"}]}`);
    
        // remove chat ability
        player.runCommandAsync("ability @s mute true");

        player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has been automatically muted by Scythe Anticheat for Unfair Advantage. Check: ${check}/${checkType}"}]}`);
    }
}

/**
 * @name banMessage
 * @param {Player} player - The player object
 * @example banMessage(player);
 * @remarks Bans the player from the game.
 */
export function banMessage(player) {
    // validate that required params are defined
    if(typeof player !== "object") return console.warn(`${new Date()} | ` + `Error: player is type of ${typeof player}. Expected "object' (./util.js:96)`);
    
    if(config.flagWhitelist.includes(player.name) && player.hasTag("op") && typeof player.oldName === "undefined") return;
    if(data.unbanQueue.includes(player.name.toLowerCase().split(" ")[0])) {
        player.removeTag("isBanned");

        player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" has been found in the unban queue and has been unbanned."}]}`);

        player.getTags().forEach(t => {
            t = t.replace(/"/g, "");
            if(t.startsWith("reason:")) player.removeTag(t);
                else if(t.startsWith("by:")) player.removeTag(t);
                else if(t.startsWith("time:")) player.removeTag(t);
        });

        // remove the player from the unban queue
        for (let i = -1; i < data.unbanQueue.length; i++) {
            if(data.unbanQueue[i] == player.name.toLowerCase().split(" ")[0]) data.unbanQueue.splice(i, 1);
        }
        return;
    }

    let reason;
    let by;
    let time;

    player.getTags().forEach(t => {
        t = t.replace(/"/g, "");
        if(t.startsWith("by:")) by = t.slice(3);
            else if(t.startsWith("reason:")) reason = t.slice(7);
            else if(t.startsWith("time:")) time = t.slice(5);
    });


    if(typeof time !== "undefined") {
        if(time < Date.now()) {
            player.runCommandAsync(`tellraw @a[tag=notify] {"rawtext":[{"text":"§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":"'s ban has expired and has now been unbanned."}]}`);

            // ban expired, woo
            player.removeTag("isBanned");
            player.getTags().forEach(t => {
                t = t.replace(/"/g, "");
                if(t.startsWith("reason:")) player.removeTag(t);
                    else if(t.startsWith("by:")) player.removeTag(t);
                    else if(t.startsWith("time:")) player.removeTag(t);
            });
            return;
        }

        time = msToTime(Number(time));
        time = `${time.w} weeks, ${time.d} days, ${time.h} hours, ${time.m} minutes, ${time.s} seconds`;
    }

    try {
        player.runCommand(`kick "${player.name}" §r\n§l§cYOU ARE BANNED!\n§r\n§eBanned By:§r ${by || "N/A"}\n§bReason:§r ${reason || "N/A"}\n§aBan Length:§r ${time || "Permenant"}`);
        player.runCommandAsync('tellraw @a[tag=op] {"rawtext":[{"text":"§߈§r§6[§aScythe§6]§r "},{"selector":"@s"},{"text":" was kicked for: You are banned!"}]}');
    } catch {
        player.triggerEvent("scythe:kick");
    }
}

/**
 * @name getClosestPlayer
 * @param {Entity} entity - The entity to check
 * @example getClosestPlayer(entity);
 * @remarks Gets the nearest player to an entity.
 * @returns {Player} player - The player that was found
 */
 export function getClosestPlayer(entity) {
    // validate that required params are defined
    if(typeof entity !== "object") return console.warn(`${new Date()} | ` + `Error: entity is type of ${typeof entity}. Expected "object' (./util.js:166)`);

    // thx https://discord.com/channels/523663022053392405/854033525546942464/948349809746669629

    const query = new Minecraft.EntityQueryOptions();
    query.closest = 1;

    let closestPlayer;

    for (let player of World.getPlayers()) {
        query.location = player.location;
    
        const nearestPlayer = [...player.dimension.getPlayers(query)][0];
    
        if(!nearestPlayer) continue;

        closestPlayer = player;
    }

    return closestPlayer;
}

/**
 * @name parseTime
 * @param {string} str - The time value to convert to milliseconds
 * @example parseTime("24d"); // returns 2073600000
 * @remarks Parses a time string into milliseconds.
 * @returns {string} str - The converted string
 */
export function parseTime(str) {
    // validate that required params are defined
    if(typeof str !== "string") return console.warn(`${new Date()} | ` + `Error: str is type of ${typeof str}. Expected "string' (./util.js:197)`);

    // parse time values like 12h, 1d, 10m into milliseconds
    // code from github co-pilot, thanks ai!
    const time = str.match(/^(\d+)([smhdwy])$/);
    if(time) {
        const [, num, unit] = time;
        const ms = {
            s: 1000,
            m: 60000,
            h: 3600000,
            d: 86400000,
            w: 604800000,
            y: 31536000000
        }[unit];
        return ms * num;
    }
    return time;
}

/**
 * @name msToTime
 * @param {string} ms - The string to convert
 * @example str(88200000); // Returns { d: 1, h: 0, m: 30, s: 0 }
 * @remarks Convert miliseconds to seconds, minutes, hours, days and weeks
 * @returns {string} str - The converted string
 */
export function msToTime(ms) {
    // validate that required params are defined
    if(typeof ms !== "number") return console.warn(`${new Date()} | ` + `Error: ms is type of ${typeof ms}. Expected "number' (./util.js:227)`);

    if(ms > Date.now()) ms = ms - Date.now();

    // turn miliseconds into days, minutes, seconds, etc
    const w = Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
    const d = Math.floor((ms % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return {
        w: w,
        d: d,
        h: h,
        m: m,
        s: s
    };
}
