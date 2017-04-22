const Lang = imports.lang;
const Gtk = imports.gi.Gtk;

const Local = imports.misc.extensionUtils.getCurrentExtension();

const Convenience = Local.imports.convenience;
const Settings = Local.imports.settings;

const guuid = 'SystemMenu'
const Gettext = imports.gettext.domain(guuid);
const _ = Gettext.gettext;

// global local variables
let main_frame = null;

// area token
let area_token_box = null;
let area_token_label = null;
let area_token_input = null;

// position
let position_box = null;
let position_label = null;
let position_input = null;

// software token
let software_token_box = null;
let software_token_label = null;
let software_token_input = null;

// remove token
let remove_token_box = null;
let remove_token_label = null;
let remove_token_input = null;

// save settings box
let save_settings_box = null;
let save_settings_button = null;
let save_settings_spacer = null;

// settings
let settings = null;
let settings_data = null;
let area = 'left';
let remove = true;

// dummy one
function init(){
	Convenience.initTranslations(guuid);
}

function onComboChangedArea() {

	let activeItem = area_token_input.get_active();
	if (activeItem >= 0) {
		if (activeItem==0) area = 'left';
		if (activeItem==1) area = 'center';
		if (activeItem==2) area = 'right';
	}
}

function onSwitchChangedRemove() {
	remove = remove_token_input.active;
}

function widget_initliaze()
{
    // initilize main frame
    main_frame = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });

    // area
    area_token_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
    area_token_label = new Gtk.Label({label: _("Area"), xalign: 0, margin_right: 30 });
    area_token_input = new Gtk.ComboBoxText();
    let areas = [_("Left"), _("Center"), _("Right")];
    for (let i = 0; i < areas.length; i++)
    	area_token_input.append_text(areas[i]);
    area_token_input.set_active (0);
    area_token_input.connect ('changed', Lang.bind (this, onComboChangedArea));

    // position
    position_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_top: 15});
    position_label = new Gtk.Label({label: _("Position"), xalign: 0});
    position_input = Gtk.HScale.new_with_range(0, 25, 1);

    // software center
    software_token_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_top: 15});
    software_token_label = new Gtk.Label({label: _("Software center"), xalign: 0, margin_right: 30 });
    software_token_input = new Gtk.Entry({ hexpand: true, text: "" });

    // remove
    remove_token_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_top: 15});
    remove_token_label = new Gtk.Label({label: _("Clean user status menu"), xalign: 0, margin_right: 30 });
    remove_token_input = new Gtk.Switch({active: remove});
    remove_token_input.connect ('notify::active', Lang.bind (this, onSwitchChangedRemove));

    // save settings box
    save_settings_box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL });
    save_settings_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
    save_settings_button = new Gtk.Button({label: _("Save Settings") });
}

function widget_packaging()
{
    // auth
    area_token_box.pack_start(area_token_label, false, false, 15);
    area_token_box.pack_start(area_token_input, true, true, 15);

    // reefresh
    position_box.pack_start(position_label, false, false, 15);
    position_box.pack_start(position_input, true, true, 15);

    // software center
    software_token_box.pack_start(software_token_label, false, false, 15);
    software_token_box.pack_start(software_token_input, true, true, 15);

    // remove
    remove_token_box.pack_start(remove_token_label, false, false, 15);
    remove_token_box.pack_start(remove_token_input, true, true, 15);

    // save settings
    save_settings_box.pack_start(save_settings_spacer, true, true, 15);
    save_settings_box.pack_start(save_settings_button, false, false, 15);

    main_frame.add(area_token_box);
    main_frame.add(position_box)
    main_frame.add(software_token_box);
    main_frame.add(remove_token_box);
    main_frame.add(save_settings_box);
}

function widget_connect()
{
    // save settings action
    save_settings_button.connect('clicked', Lang.bind(this, save_settings_button_callback));
}

// callbacks

function save_settings_button_callback()
{
    // get the settings
    settings = Convenience.getSettings();
    settings_data = Settings.getSettings(settings);

    // update the values
    settings_data.area = area;
    settings_data.position = position_input.get_value();
    settings_data.software = software_token_input.get_text();
    settings_data.remove = remove;

    settings.set_string("settings-json", JSON.stringify(settings_data));
}

// setting init values
function widget_init_values()
{
    // setup settings
    settings = Convenience.getSettings();
    settings_data = Settings.getSettings(settings);

    // set the saved area token value
    if (settings_data.area=='left') area_token_input.set_active(0);
    if (settings_data.area=='center') area_token_input.set_active(1);
    if (settings_data.area=='right') area_token_input.set_active(2);

    // set the save refresh value
    position_input.set_value(settings_data.position);

    // set the saved software token value
    software_token_input.set_text(settings_data.software);

    // set the saved remove token value
   remove_token_input.set_active(settings_data.remove);
}

function buildPrefsWidget()
{
    // lifecycle
    widget_initliaze();
    widget_packaging();
    widget_connect();
    widget_init_values();

    // show frame
    main_frame.show_all();
    return main_frame;
}
