#!/bin/bash

# Simple sound notification that definitely works

# Function to play sound - simplified version
play_sound() {
    # Play the Glass sound directly
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
}

# For zsh - simplified hook
if [[ -n "$ZSH_VERSION" ]]; then
    # Store the original precmd if it exists
    if typeset -f precmd > /dev/null; then
        eval "original_$(typeset -f precmd)"
    fi
    
    # Simple precmd that plays sound for long commands
    precmd() {
        # Call original precmd if it exists
        if typeset -f original_precmd > /dev/null; then
            original_precmd
        fi
        
        # Check if we have a start time
        if [[ -n "$COMMAND_START_TIME" ]]; then
            local end_time=$(date +%s)
            local duration=$((end_time - COMMAND_START_TIME))
            
            # Play sound for commands longer than 3 seconds
            if [[ $duration -ge 3 ]]; then
                echo "🔔 Command took ${duration} seconds"
                afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
            fi
            
            # Clear the start time
            unset COMMAND_START_TIME
        fi
    }
    
    # Simple preexec to record start time
    preexec() {
        COMMAND_START_TIME=$(date +%s)
    }
fi

echo "✅ Simple sound hooks activated"