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
const GnomeSession = imports.misc.gnomeSession;
const LoginManager = imports.misc.loginManager

const guuid = 'SystemMenu'
const Gettext = imports.gettext.domain(guuid);
const _ = Gettext.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;


let settingsJSON,settings,settingsID;

let extension;
let list = [
{ type: "command",	  text: _("About This Computer"), action: ['gnome-control-center', 'info-overview']},
{ type: "desktop",	  text: _("Software Update"), action: 'update-manager.desktop'},
{ type: "desktop",	  text: _("Software Center"), action: 'org.gnome.Software.desktop'},
{ type: "separator"},
{ type: "command",	   text: _("System Preferences"), action: ['gnome-control-center', '']},
{ type: "desktop",	   text: _("Gnome Tweak Tool"), action: 'org.gnome.tweaks.desktop'},
{ type: "separator"},
{ type: "desktop",	   text: _("System Monitor"), action: 'gnome-system-monitor.desktop'},
{ type: "forceQuit",   text: _("Force Quit"), action: ''},
{ type: "separator" },
{ type: "powerOff",	   text: _("Reboot"), action: ''},
{ type: "logOut",      text: _("Log Out"), action: ''},
{ type: "separator" },
{ type: "suspend",     text: _("Suspend"), action: ''},
{ type: "lockScreen",  text: _("Lock"), action: ''},
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
					let session = new GnomeSession.SessionManager();
					session.ShutdownRemote();
				} ));
				this.menu.addMenuItem(item);
			};

			if (list[x].type=="logOut") {
				item = new PopupMenu.PopupMenuItem(_(list[x].text));
				item.connect('activate', Lang.bind(this, function() {
					let session = new GnomeSession.SessionManager();
					session.LogoutRemote(0);

				} ));
				this.menu.addMenuItem(item);
			};

			if (list[x].type=="suspend") {
				item = new PopupMenu.PopupMenuItem(_(list[x].text));
				item.connect('activate', Lang.bind(this, function() {
					let login = new LoginManager.getLoginManager();
					login.suspend();
				} ));
				this.menu.addMenuItem(item);
			};

			if (list[x].type=="lockScreen") {
				item = new PopupMenu.PopupMenuItem(_(list[x].text));
				item.connect('activate', Lang.bind(this, function() {
					Main.screenShield.lock(true);
				} ));
				this.menu.addMenuItem(item);
			};

		};

		this.actor.connect('button-press-event', Lang.bind(this, this._updateForceQuit));
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
