#!/bin/bash

glib-compile-schemas schemas

DIR="po"
SUFFIX="po"

xgettext -k_ -kN_ -o $DIR/XmenuSystem.pot prefs.js extension.js

for file in $DIR/*.$SUFFIX
do 
	lingua=${file%.*}
	lingua=${lingua#*/}
	msgfmt $file
	mkdir locale/$lingua/LC_MESSAGES -p
	mv messages.mo locale/$lingua/LC_MESSAGES/XmenuSystem.mo
done
