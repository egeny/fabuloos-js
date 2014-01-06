#!/bin/bash

# Change for current directory
cd "$(dirname "$0")"
clear

# Check if Gulp is installed and prompt for installation otherwise
if ! gulp -v > /dev/null 2>&1; then
	# Check if NPM is installed
	if ! npm -v > /dev/null 2>&1; then
		echo "NPM is not installed, you should install it first."
		exit
	fi

	echo "Gulp is not installed."
	read -p "Do you want to install it (Y/N)? "

	if [ "$(echo $REPLY | tr [:upper:] [:lower:])" == "y" ]; then
		echo ""
		echo "It may take a while to install all dependencies."
		npm install gulp -g
		$0
		exit
	else
		exit
	fi
fi

if [ ! -d "node_modules" ]; then
	echo "The dependencies needed to build the project are not installed."
	read -p "Do you want to install them (Y/N)? "

	if [ "$(echo $REPLY | tr [:upper:] [:lower:])" == "y" ]; then
		echo ""
		echo "It may take a while to install all dependencies."
		npm install
		$0
		exit
	else
		exit
	fi
fi

# Finally launch the build
gulp build
echo ""
read -n1 -r -p "Press any key to exit"