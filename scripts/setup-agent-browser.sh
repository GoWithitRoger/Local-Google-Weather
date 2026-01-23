#!/bin/bash

# Ensure agent-browser is installed
if ! command -v agent-browser &> /dev/null; then
    echo "Installing agent-browser..."
    npm install -g agent-browser
else
    echo "agent-browser is already installed."
fi

# Ensure Chromium is installed
echo "Checking browser binaries..."
agent-browser install
