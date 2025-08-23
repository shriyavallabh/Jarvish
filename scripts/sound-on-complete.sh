#!/bin/bash

# Wrapper script to run commands with sound notification

# Function to play completion sound
play_completion_sound() {
    local exit_code=$1
    
    if [[ $exit_code -eq 0 ]]; then
        # Success sound
        afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
    else
        # Error sound
        afplay /System/Library/Sounds/Basso.aiff 2>/dev/null &
    fi
}

# Run the command passed as arguments
"$@"
exit_code=$?

# Play sound based on exit code
play_completion_sound $exit_code

# Return the original exit code
exit $exit_code