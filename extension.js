/*
 This file has been developed by Albert Palacios. 
 This software may be used and distributed
 according to the terms of the GNU General Public License version 2.

 This program is distributed in the hope that it will be useful, but WITHOUT
 ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
 details.

 Copyright Albert Palacios
*/

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Util = imports.misc.util;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const Tweener = imports.ui.tweener;
const GnomeSession = imports.misc.gnomeSession;

const guuid = 'System-Menu'
const Gettext = imports.gettext.domain(guuid);
const _ = Gettext.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;


let settingsJSON,settings,settingsID;

let extension;
let list = [
{ type: "command",	text: _("About This Computer"),	action: ['gnome-control-center','info']		},
{ type: "desktop",	text: _("Software Update"),	action: 'update-manager.desktop'		},
{ type: "desktop",	text: _("Software Center"),	action: 'ubuntu-software-center.desktop'	},
{ type: "separator" },
{ type: "desktop",	text: _("System Preferences"),	action: 'gnome-control-center.desktop'		},
{ type: "desktop",	text: _("Gnome Tweak Tool"),	action: 'gnome-tweak-tool.desktop'		},
{ type: "separator" },
{ type: "desktop",	text: _("System Monitor"),		action: 'gnome-system-monitor.desktop'		},
{ type: "forceQuit",	text: _("Force Quit"),		action: ''					},
{ type: "separator" },
{ type: "powerOff",	text: _("Power Off"),		action: ''					},
{ type: "command",	text: _("Log Out"),		action: ['gnome-session-quit']			},
{ type: "command",	text: _("Lock"),			action: ['gnome-screensaver-command','-l']	},
{}
];

const extensionObject = new Lang.Class({
    Name: guuid+"."+guuid,
    Extends: PanelMenu.Button,

    _init: function() {

		this.forceQuitPtr = null;
		this.forceQuitPids = null;

		let icon = new St.Icon({ icon_name: 'emblem-default-symbolic', 
					 style_class: 'system-status-icon' });
		let label = new St.Label({ text: "" });
		this.parent(0.0, label.text);
		this.actor.add_actor(icon);

		let item = null;
		for (x in list) {

			if (list[x].type=="command") {
				item = new PopupMenu.PopupMenuItem(_(list[x].text));
				item.connect('activate', Lang.bind(this,
					(function() {
						var currentAction = list[x].action;
						/* Save context variable for binding */
						return function() {
							Util.spawn(currentAction);
						}
					})()
				));
				this.menu.addMenuItem(item);
			};

			if (list[x].type=="desktop") {
				var action = list[x].action;
				if (list[x].text=="Software Center") {
					if (settings.software!="") {
						action = settings.software;
					}
				}

				item = new PopupMenu.PopupMenuItem(_(list[x].text));
				item.connect('activate', Lang.bind(this,
					(function() {
						var currentAction = action;
						/* Save context variable for binding */
						return function() {
							let def = Shell.AppSystem.get_default();
							let app = def.lookup_app(currentAction);
							app.activate();
						}
					})()
				));
				this.menu.addMenuItem(item);
			};

			if (list[x].type=="separator") {
				this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
			};

			if (list[x].type=="forceQuit") {
				this.forceQuitPtr = new PopupMenu.PopupMenuItem(_(list[x].text)+" ...");
				this.forceQuitPtr.connect('activate', Lang.bind(this, function() {
				if (this.forceQuitPids!=null) {
					for (pid in this.forceQuitPids) {
						if (this.forceQuitPids[pid]!=0) {
						Util.spawn(['kill','-9',''+this.forceQuitPids[pid]]);
						};
					};
				};
				} ));
				this.menu.addMenuItem(this.forceQuitPtr);
			};

			if (list[x].type=="powerOff") {

				item = new PopupMenu.PopupMenuItem(_(list[x].text));
				item.connect('activate', Lang.bind(this, function() {
					let _Session = new GnomeSession.SessionManager();
					_Session.ShutdownRemote();
				} ));
				this.menu.addMenuItem(item);
			};
		};
		
		this.actor.connect('button-press-event', Lang.bind(this, this._updateForceQuit));

		// Remove or show "status/user" menu items 
		let statusMenuItems = Main.panel.statusArea.userMenu.menu._getMenuItems();

		for (var x=(statusMenuItems.length-1); x>=0;x--) {

			if (statusMenuItems[x].label!=undefined) {

				var excludes = ["System Settings","Lock","Log Out","Suspend","Switch User","Power Off","Install Updates"];
				var label = statusMenuItems[x].label.get_text();

				if (excludes.indexOf(label)>-1) {

					if (settings.remove=="yes") {

						if (label=="Power Off"||label=="Log Out") {

							statusMenuItems[x].destroy();
							// actor.hide() does not work! What can I do instead of 'destroy()'?

						} else {

							statusMenuItems[x].actor.hide();
						}
					} else {

						statusMenuItems[x].actor.show();
					}
				}
			}
		}
	},

	destroy: function() {
		this.parent();
	},

	_updateForceQuit: function() {

		let appSys = Shell.AppSystem.get_default();
		let allApps = appSys.get_running();
		if ( allApps.length != 0 && this.forceQuitPtr!=null) {
			this.forceQuitPids= allApps[0].get_pids();
			this.forceQuitPtr.label.text = _("Force Quit")+" "+allApps[0].get_name();
			this.forceQuitPtr.actor.visible = true;
		} else {
			this.forceQuitPids= null;
			this.forceQuitPtr.label.text = _("Force Quit")+" ...";
			this.forceQuitPtr.actor.visible = false;
		}
	}
});

function onSettingsChanged() {

	settingsJSON = Convenience.getSettings();
	settings = JSON.parse(settingsJSON.get_string("settings-json"));

	extension.destroy();
	extension = new extensionObject();
	Main.panel.addToStatusArea(guuid, extension, settings.position, settings.area);
}

function init(metadata) {
	Convenience.initTranslations(guuid);
	settingsJSON = Convenience.getSettings();
}

function enable() {

	settings = JSON.parse(settingsJSON.get_string("settings-json"));
	settingsID = settingsJSON.connect("changed::settings-json", Lang.bind(this,onSettingsChanged)); 

	extension = new extensionObject();
	Main.panel.addToStatusArea(guuid, extension, settings.position, settings.area);
}

function disable() {
	settingsJSON.disconnect(settingsID);
	extension.destroy();
}
