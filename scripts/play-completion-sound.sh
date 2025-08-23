#!/bin/bash

# Play completion sound script for macOS
# This script plays a sound when a command completes

# Function to play sound on macOS
play_sound() {
    # Use macOS built-in sounds
    # Options: Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink
    local sound_name="${1:-Glass}"
    
    # Path to system sounds
    local sound_path="/System/Library/Sounds/${sound_name}.aiff"
    
    # Check if sound file exists
    if [ -f "$sound_path" ]; then
        # Play the sound using afplay (macOS audio file player)
        afplay "$sound_path" 2>/dev/null &
    else
        # Fallback to terminal bell
        echo -e "\a"
    fi
}

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    play_sound "Glass"
else
    # For other systems, use terminal bell
    echo -e "\a"
fi