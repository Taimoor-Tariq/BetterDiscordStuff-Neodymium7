/**
 * @name VoiceActivity
 * @author Neodymium
 * @version 1.0
 * @description Shows icons on the member list and info in User Popouts when somemone is in a voice channel.
 * @source https://github.com/Neodymium7/BetterDiscordStuff/blob/main/VoiceActivity/VoiceActivity.plugin.js
 * @updateUrl https://raw.githubusercontent.com/Neodymium7/BetterDiscordStuff/main/VoiceActivity/VoiceActivity.plugin.js
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {
        "info": {
            "name": "VoiceActivity",
            "authors": [
                {
                    "name": "Neodymium"
                }
            ],
            "version": "1.0",
            "description": "Shows icons on the member list and info in User Popouts when somemone is in a voice channel.",
            "github": "https://github.com/Neodymium7/BetterDiscordStuff/blob/main/VoiceActivity/VoiceActivity.plugin.js",
            "github_raw": "https://raw.githubusercontent.com/Neodymium7/BetterDiscordStuff/main/VoiceActivity/VoiceActivity.plugin.js"
        },
        "main": "index.js"
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() { this._config = config; }
        getName() { return config.info.name; }
        getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
        getDescription() { return config.info.description; }
        getVersion() { return config.info.version; }
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() { }
        stop() { }
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {

            const { DiscordModules, DiscordSelectors, ContextMenu, ReactComponents, Settings } = Library;
            const { ChannelStore, ChannelActions, GuildStore, GuildActions, NavigationUtils, UserStore, React } = DiscordModules;
            const { SettingPanel, Switch } = Settings;
            const VoiceStateStore = BdApi.findModuleByProps("getVoiceStateForUser");
            const Dispatcher = BdApi.findModuleByProps("dirtyDispatch");

            const TooltipContainer = BdApi.findModuleByProps("TooltipContainer").TooltipContainer;
            const PartyAvatars = BdApi.findModuleByDisplayName("PartyAvatars");
            const Speaker = BdApi.findModuleByDisplayName("Speaker");
            const People = BdApi.findModuleByDisplayName("People");
            const CallJoin = BdApi.findModuleByDisplayName("CallJoin");

            const defaultGroupIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAABgmlDQ1BJQ0MgUHJvZmlsZQAAKM+VkTtIw1AYhb9WxQcVBzuIOGSoThZERRyliiIolFrB12CS2io0sSQtLo6Cq+DgY7Hq4OKsq4OrIAg+QBydnBRdROJ/U6FFqOCFcD/OzTnce34IFrOm5db2gGXnncRYTJuZndPqn6mlBmikTzfd3OTUaJKq6+OWgNpvoiqL/63m1JJrQkATHjJzTl54UXhgLZ9TvCscNpf1lPCpcLcjFxS+V7pR4hfFGZ+DKjPsJBPDwmFhLVPBRgWby44l3C8cSVm25AdnSpxSvK7YyhbMn3uqF4aW7OkppcvXwRjjTBJHw6DAClnyRGW3RXFJyHmsir/d98fFZYhrBVMcI6xioft+1Ax+d+um+3pLSaEY1D153lsn1G/D15bnfR563tcR1DzChV32rxZh8F30rbIWOYCWDTi7LGvGDpxvQttDTnd0X1LzD6bT8HoiY5qF1mtomi/19nPO8R0kpauJK9jbh66MZC9UeXdDZW9//uP3R+wbNjlyjzeozyoAAABgUExURVhl8oGK9LW7+erq/f///97i+7/F+mx38qGo92Ft8mFv8ujs/IuW9PP2/Wx384GM9Kux+MDF+urs/d/i+7S9+Jae9uDj/Jad9srO+tXY+4yU9aqy+MDE+qGn9/T1/neC9Liz/RcAAAAJcEhZcwAACxMAAAsTAQCanBgAAATqaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pg0KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNC40LjAtRXhpdjIiPg0KICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPg0KICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOkdJTVA9Imh0dHA6Ly93d3cuZ2ltcC5vcmcveG1wLyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOmIzMjk5M2JmLTliZTUtNGJmMy04ZWEwLWY3ZDkzNTMyMTY2YiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowNjhkOWE3MS1lYWU3LTRmZjAtYmMxZS04MGUwYmMxMTFkZDUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplZjU1ZGE0YS0wZTBhLTRjNTctODdmOC1lMmFmMGUyZGEzOGUiIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIiBHSU1QOkFQST0iMi4wIiBHSU1QOlBsYXRmb3JtPSJXaW5kb3dzIiBHSU1QOlRpbWVTdGFtcD0iMTY0ODk0NDg1NjM4ODc5MSIgR0lNUDpWZXJzaW9uPSIyLjEwLjI0IiB0aWZmOk9yaWVudGF0aW9uPSIxIiB4bXA6Q3JlYXRvclRvb2w9IkdJTVAgMi4xMCI+DQogICAgICA8eG1wTU06SGlzdG9yeT4NCiAgICAgICAgPHJkZjpTZXE+DQogICAgICAgICAgPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDpjaGFuZ2VkPSIvIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjQ3NmFhOGE3LTVhNGEtNDcyNS05YTBjLWU1NzVmMzE1MzFmOCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iR2ltcCAyLjEwIChXaW5kb3dzKSIgc3RFdnQ6d2hlbj0iMjAyMi0wNC0wMlQxNzoxNDoxNiIgLz4NCiAgICAgICAgPC9yZGY6U2VxPg0KICAgICAgPC94bXBNTTpIaXN0b3J5Pg0KICAgIDwvcmRmOkRlc2NyaXB0aW9uPg0KICA8L3JkZjpSREY+DQo8L3g6eG1wbWV0YT4NCjw/eHBhY2tldCBlbmQ9InIiPz6JoorbAAABV0lEQVRoQ+3W23KDIBAGYIOYBk20prWNPb7/W3Z3WQ9lGmeKe/l/N/+IzAYDggUAAAAAAMB/HVzpfXV8kIuTpp3gvHJ8WTcx7VRanlSBrs+aVubxMxn7RdNGq6VVR02Pmjb6WHjCQ+80baxmgDXUxA/FaSPWXUxtctOCVF2Z2uSmhauUnT1RU61p49cq9b6npoOmDV4yK7xN8G8abhfPsXIkq7MxfdGKOt0qBuOtoqjnZ3BcN9BmZ1qftP2L91cXt4ezJszCq7uVtENfytEN1ocZLZlRJ1iNQ2zvNHd6oyWfamLpd809wofWTBxllY6a+UJyFCzkPWsve9+35N9fG/k+nZySufjkveuTOvCuzZmp/WN+F1/859AjSuahLW0LD/2kmWdjBtiNunxr5kmOyhR/VfAk5H9dxDr3TX2kcw6psmHqI51zSJUNUx/pDAAAAAAAsKkofgB06RBbh+d86AAAAABJRU5ErkJggg==";

            function groupDMName(members) {
                if (members.length === 1) {
                    return UserStore.getUser(members[0]).username;
                }
                else if (members.length > 1) {
                    let name = "";
                    for (let i = 0; i < members.length; i++) {
                        if (i === members.length - 1) name += UserStore.getUser(members[i]).username;
                        else name += UserStore.getUser(members[i]).username + ", ";
                    }
                    return name;
                }
                return "Unnamed";
            }

            function VoiceIcon(props) {
                const [, forceUpdate] = React.useReducer(n => !n, true);
                React.useEffect(() => {
                    const listener = () => void forceUpdate();
                    Dispatcher.subscribe("UPDATE_VOICE_ICON", listener);
                    return () => Dispatcher.unsubscribe("UPDATE_VOICE_ICON", listener);
                }, []);

                const voiceState = VoiceStateStore.getVoiceStateForUser(props.userId);
                if (!voiceState) return null;
                const channel = ChannelStore.getChannel(voiceState.channelId);
                if (!channel) return null;
                const guild = GuildStore.getGuild(channel.guild_id);

                let text, subtext, icon, channelPath;
                const className = channel.id === VoiceStateStore.getVoiceStateForUser(UserStore.getCurrentUser().id)?.channelId && props.currentChannelColor ? "voiceActivityIcon voiceActivityIcon-currentCall" : "voiceActivityIcon";

                switch (channel.type) {
                    case 1:
                        text = UserStore.getUser(channel.recipients[0]).username;
                        subtext = "Private Call";
                        icon = CallJoin;
                        channelPath = `/channels/@me/${channel.id}`;
                        break;
                    case 2:
                        text = guild.name;
                        subtext = channel.name;
                        icon = Speaker;
                        channelPath = `/channels/${guild.id}/${channel.id}`;
                        break;
                    case 3:
                        text = channel.name ? channel.name : groupDMName(channel.recipients);
                        subtext = "Group Call";
                        icon = People;
                        channelPath = `/channels/@me/${channel.id}`;
                }
                
                return React.createElement("div", 
                    {
                        "class": className, 
                        onClick: (e) => {
                            e.stopPropagation();
                            if (channelPath) NavigationUtils.transitionTo(channelPath); 
                        }
                    }, 
                    React.createElement(TooltipContainer, 
                        {
                            text: React.createElement("div", {"class": "voiceActivityTooltip"},
                                React.createElement("div", {"class": "voiceActivityTooltipHeader", style: {"font-weight": "600"}}, text), 
                                React.createElement("div", {"class": "voiceActivityTooltipSubtext"},
                                    React.createElement(icon, {"class": "voiceActivityTooltipIcon", width: 16, height: 16}), 
                                    React.createElement("div", {style: {"font-weight": "400"}}, subtext)
                                )
                            ), 
                            position: "top"
                        }, 
                        React.createElement(Speaker, {width: 14, height: 14})
                    )
                );
            }

            function VoiceActivitySection(props) {
                const [, forceUpdate] = React.useReducer(n => !n, true);
                React.useEffect(() => {
                    const listener = () => void forceUpdate();
                    Dispatcher.subscribe("UPDATE_VOICE_ACTIVITY_SECTION", listener);
                    return () => Dispatcher.unsubscribe("UPDATE_VOICE_ACTIVITY_SECTION", listener);
                }, []);

                const voiceState = VoiceStateStore.getVoiceStateForUser(props.userId);
                if (!voiceState) return null;
                const channel = ChannelStore.getChannel(voiceState.channelId);
                if (!channel) return null;
                const guild = GuildStore.getGuild(channel.guild_id);

                let headerText, text, viewButton, joinButton, icon, channelPath, image;
                const members = Object.keys(VoiceStateStore.getVoiceStatesForChannel(channel.id)).map(id => UserStore.getUser(id));
                const inCurrentChannel = channel.id === VoiceStateStore.getVoiceStateForUser(UserStore.getCurrentUser().id)?.channelId;
                const isCurrentUser = props.userId === UserStore.getCurrentUser().id;

                switch (channel.type) {
                    case 1:
                        headerText = "In A Private Call";
                        viewButton = "View Call";
                        joinButton = inCurrentChannel ? "Already in Call" : "Join Call";
                        icon = CallJoin;
                        channelPath = `/channels/@me/${channel.id}`;
                        break;
                    case 2:
                        headerText = "In A Voice Channel";
                        text = [React.createElement("div", {style: {"font-weight": "600"}}, guild.name), React.createElement("div", {style: {"font-weight": "400"}}, channel.name)];
                        viewButton = "View Channel";
                        joinButton = inCurrentChannel ? "Already in Channel" : "Join Channel"
                        icon = Speaker;
                        channelPath = `/channels/${guild.id}/${channel.id}`;
                        image = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=96`;
                        break;
                    case 3:
                        headerText = "In A Group Call";
                        text = React.createElement("div", {style: {"font-weight": "600"}}, channel.name ? channel.name : groupDMName(channel.recipients));
                        viewButton = "View Call";
                        joinButton = inCurrentChannel ? "Already in Call" : "Join Call"
                        icon = CallJoin;
                        channelPath = `/channels/@me/${channel.id}`;
                        image = channel.icon ? `https://cdn.discordapp.com/channel-icons/${channel.id}/${channel.icon}.webp?size=32` : defaultGroupIcon;
                }

                return React.createElement("div", {"class": "voiceActivitySection"}, 
                    React.createElement("h3", {"class": "voiceActivityHeader"}, headerText),
                    !(channel.type === 1) && React.createElement("div", {"class": "voiceActivityBody"}, 
                        React.createElement("img", 
                            {
                                "class": "voiceActivityGuildIcon", 
                                src: image, 
                                width: 48, 
                                height: 48, 
                                style: {"border-radius": "16px", "cursor": "pointer"},
                                onClick: () => {
                                    if (channel.type === 2) GuildActions.transitionToGuildSync(guild.id);
                                    else if (channelPath) NavigationUtils.transitionTo(channelPath);
                                }
                            }
                        ),
                        React.createElement("div", {"class": channel.type === 2 ? "voiceActivityText" : "voiceActivityText voiceActivityTextPrivate"}, text),
                        (channel.type === 2) && React.createElement(PartyAvatars, {guildId: guild.id, members: members, partySize: {knownSize: members.length, totalSize: members.length, unknownSize: 0}}), (channel.type === 3) && React.createElement(PartyAvatars, {members: members, partySize: {knownSize: members.length, totalSize: members.length, unknownSize: 0}})
                    ),
                    React.createElement("div", {"class": "voiceActivityButtonWrapper"},
                        React.createElement("button", 
                            {
                                "class": "voiceActivityButton voiceActivityViewButton",
                                onClick: () => {
                                    if (channelPath) NavigationUtils.transitionTo(channelPath);
                                }
                            }, 
                            viewButton
                        ),
                        !isCurrentUser && React.createElement(TooltipContainer, {text: joinButton, position: "top"},
                            React.createElement("div", {"class": inCurrentChannel ? "voiceActivityJoinWrapper voiceActivityJoinWrapperDisabled" : "voiceActivityJoinWrapper"},
                                React.createElement("button", 
                                    {
                                        disabled: inCurrentChannel,
                                        "class": "voiceActivityButton voiceActivityJoinButton",
                                        onClick: () => {
                                            if (channel.id) ChannelActions.selectVoiceChannel(channel.id);
                                        },
                                        onContextMenu: (e) => {
                                            ContextMenu.openContextMenu(e, ContextMenu.buildMenu([{
                                                    label: "Join With Video",
                                                    id: "voice-activity-join-with-video",
                                                    action: () => {
                                                        if (channel.id) ChannelActions.selectVoiceChannel(channel.id, true);
                                                    }
                                            }]));
                                        }
                                    }, 
                                    React.createElement(icon, {width: 18, height: 18})
                                )
                            )
                        ),
                    )
                );
            }

            return class VoiceActivity extends Plugin {
                constructor() {
                    super();
                    this.defaultSettings = {
                        showMemberListIcons: true,
                        currentChannelColor: true
                    };
                }

                onStart() {
                    BdApi.injectCSS("VoiceActivity", `
                        .voiceActivityIcon {
                            height: 20px;
                            width: 20px;
                            min-width: 20px;
                            border-radius: 50%;
                            background-color: var(--background-floating);
                            cursor: pointer;
                        }
                        .voiceActivityIcon:hover {
                            background-color: var(--background-tertiary);
                        }
                        .voiceActivityIcon svg {
                            padding: 3px;
                            color: var(--interactive-normal);
                        }
                        .voiceActivityIcon-currentCall {
                            background-color: var(--button-outline-positive-background-hover);
                        }
                        .voiceActivityIcon-currentCall:hover {
                            background-color: var(--status-positive);
                        }
                        .voiceActivityIcon-currentCall svg {
                            color: #fff;
                        }

                        .voiceActivityTooltipHeader {
                            display: block;
                            overflow: hidden;
                            white-space: nowrap;
                            text-overflow: ellipsis;
                        }
                        .voiceActivityTooltipSubtext {
                            display: flex;
                            flex-direction: row;
                            margin-top: 3px;
                        }
                        .voiceActivityTooltipSubtext > div {
                            overflow: hidden;
                            white-space: nowrap;
                            text-overflow: ellipsis;
                        }
                        .voiceActivityTooltipIcon {
                            min-width: 16px;
                            margin-right: 3px;
                            color: var(--interactive-normal);
                        }

                        .voiceActivitySection {
                            margin-bottom: 16px;
                        }
                        .voiceActivityHeader {
                            margin-bottom: 8px;
                            color: var(--header-secondary);
                            font-size: 12px;
                            line-height: 16px;
                            font-family: var(--font-display);
                            font-weight: 700;
                            text-transform: uppercase;
                        }
                        .voiceActivityBody {
                            display: flex;
                            flex-direction: row;
                        }
                        .voiceActivityText {
                            padding-top: 8px;
                            margin: 0 10px;
                            color: var(--text-normal);
                            font-size: 16px;
                            font-family: var(--font-primary);
                            overflow: hidden;
                        }
                        .voiceActivityText > div {
                            overflow: hidden;
                            white-space: nowrap;
                            text-overflow: ellipsis;
                        }
                        .voiceActivityTextPrivate {
                            padding-top: 16px;
                        }
                        .voiceActivityBody > :last-child {
                            padding: 12px 0;
                            margin-left: auto;
                        }
                        .voiceActivityBody .partyMemberOverflow-3G1oZz {
                            background-color: var(--background-tertiary)
                        }
                        .voiceActivityButtonWrapper {
                            display: flex;
                            flex: 0 1 auto;
                            flex-direction: row;
                            flex-wrap: nowrap;
                            justify-content: flex-start;
                            align-items: stretch;
                            margin-top: 12px;

                        }
                        .voiceActivityButton {
                            height: 32px;
                            min-height: 32px;
                            width: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 2px 16px;
                            border-radius: 3px;
                            background-color: var(--button-secondary-background);
                            transition: background-color .17s ease,color .17s ease;
                            color: #fff;
                            font-size: 14px;
                            line-height: 16px;
                            font-weight: 500;
                            user-select: none;
                        }
                        .voiceActivityButton:hover {
                            background-color: var(--button-secondary-background-hover);
                        }
                        .voiceActivityButton:active {
                            background-color: var(--button-secondary-background-active);
                        }
                        .voiceActivityButton:disabled {
                            background-color: var(--button-secondary-background-disabled);
                            opacity: 0.5;
                            pointer-events: none;
                        }
                        .voiceActivityButtonWrapper > div[aria-label] {
                            width: 32px;
                            margin-left: 8px;
                        }
                        .voiceActivityJoinButton {
                            min-width: 32px;
                            max-width: 32px;
                            padding: 0;
                        }
                        .voiceActivityJoinWrapperDisabled {
                            cursor: not-allowed;
                        }
                    `);
                    if (this.settings.showMemberListIcons) this.patchMemberListItem();
                    this.patchUserPopoutBody();
                    VoiceStateStore.addChangeListener(this.updateItems);
                }

                async patchMemberListItem() {
                    const MemberListItem = await ReactComponents.getComponentByName("MemberListItem", `${DiscordSelectors.MemberList.members} > div > div:not(:first-child)`);
                    BdApi.Patcher.after("VoiceActivityIcons", MemberListItem.component.prototype, "render", (thisObject, _, ret) => {
                        ret.props.children = React.createElement(VoiceIcon, {userId: thisObject.props.user.id, currentChannelColor: this.settings.currentChannelColor});
                    });
                }

                patchUserPopoutBody() {
                    const UserPopoutBody = BdApi.findModule(m => m.default.displayName === "UserPopoutBody");
                    BdApi.Patcher.after("VoiceActivity", UserPopoutBody, "default", (_, [props], ret) => {
                        ret?.props.children.unshift(React.createElement(VoiceActivitySection, {userId: props.user.id}));
                    });
                }

                updateItems() {
                    Dispatcher.dirtyDispatch({type: "UPDATE_VOICE_ICON"});
                    Dispatcher.dirtyDispatch({type: "UPDATE_VOICE_ACTIVITY_SECTION"});
                }

                onStop() {
                    BdApi.Patcher.unpatchAll("VoiceActivity");
                    BdApi.Patcher.unpatchAll("VoiceActivityIcons");
                    VoiceStateStore.removeChangeListener(this.updateItems);
                }

                getSettingsPanel() {
                    return SettingPanel.build(() => {
                        this.saveSettings();
                        if (!this.settings.showMemberListIcons) BdApi.Patcher.unpatchAll("VoiceActivityIcons");
                        else {
                            BdApi.Patcher.unpatchAll("VoiceActivityIcons");
                            this.patchMemberListItem();
                        }
                    },
                        new Switch("Member List Icons", "Shows icons on the member list when someone is in a voice channel", this.settings.showMemberListIcons, (i) => { this.settings.showMemberListIcons = i; }),
                        new Switch("Current Channel Icon Color", "Makes the Member List icons green when the person is in your current voice channel", this.settings.currentChannelColor, (i) => { this.settings.currentChannelColor = i; })
                    );
                }

            };

        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/