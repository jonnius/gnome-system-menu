const Params = imports.misc.params;
 
function getSettings(settings)
{
// returne the json data settins
return JSON.parse(settings.get_string("settings-json"));
}
