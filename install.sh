#!/bin/bash

sh compile.sh
mkdir -p ~/.local/share/gnome-shell/extensions/SystemMenu@jonnius.github.com
cp -R * -t ~/.local/share/gnome-shell/extensions/SystemMenu@jonnius.github.com/
