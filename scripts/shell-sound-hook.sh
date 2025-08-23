#!/bin/bash

# Shell integration for command completion sounds
# This can be sourced in .bashrc or .zshrc

# Configuration
export TASK_SOUND_ENABLED=${TASK_SOUND_ENABLED:-true}
export TASK_SOUND_NAME=${TASK_SOUND_NAME:-Glass}
export TASK_SOUND_MIN_DURATION=${TASK_SOUND_MIN_DURATION:-3}  # Only play sound for commands taking longer than 3 seconds

# Store command start time
task_preexec() {
    TASK_START_TIME=$(date +%s)
    TASK_COMMAND="$1"
}

# Play sound after command completion
task_precmd() {
    local exit_code=$?
    
    # Skip if sound is disabled
    if [[ "$TASK_SOUND_ENABLED" != "true" ]]; then
        return
    fi
    
    # Skip if no start time (first prompt)
    if [[ -z "$TASK_START_TIME" ]]; then
        return
    fi
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - TASK_START_TIME))
    
    # Only play sound for long-running commands
    if [[ $duration -ge $TASK_SOUND_MIN_DURATION ]]; then
        # Different sounds for success/failure
        local sound_name="$TASK_SOUND_NAME"
        if [[ $exit_code -ne 0 ]]; then
            sound_name="Basso"  # Error sound
        fi
        
        # Play the sound
        play_task_sound "$sound_name" &
    fi
    
    # Reset start time
    unset TASK_START_TIME
}

# Function to play sound
play_task_sound() {
    local sound_name="${1:-Glass}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        local sound_path="/System/Library/Sounds/${sound_name}.aiff"
        if [ -f "$sound_path" ]; then
            afplay "$sound_path" 2>/dev/null
        fi
    elif command -v paplay &> /dev/null; then
        # Linux with PulseAudio
        paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null
    elif command -v aplay &> /dev/null; then
        # Linux with ALSA
        aplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null
    else
        # Fallback to terminal bell
        echo -e "\a"
    fi
}

# Setup hooks based on shell
setup_sound_hooks() {
    if [[ -n "$ZSH_VERSION" ]]; then
        # Zsh setup
        autoload -Uz add-zsh-hook
        add-zsh-hook preexec task_preexec
        add-zsh-hook precmd task_precmd
    elif [[ -n "$BASH_VERSION" ]]; then
        # Bash setup (requires bash-preexec)
        # Check if preexec_functions is available
        if [[ -n "${preexec_functions}" ]]; then
            preexec_functions+=(task_preexec)
            precmd_functions+=(task_precmd)
        else
            # Manual trap setup for older bash
            trap 'task_preexec "$BASH_COMMAND"' DEBUG
            PROMPT_COMMAND="${PROMPT_COMMAND:+$PROMPT_COMMAND; }task_precmd"
        fi
    fi
}

# Utility functions
enable_task_sounds() {
    export TASK_SOUND_ENABLED=true
    echo "Task completion sounds enabled"
}

disable_task_sounds() {
    export TASK_SOUND_ENABLED=false
    echo "Task completion sounds disabled"
}

set_task_sound() {
    local sound="$1"
    if [[ -z "$sound" ]]; then
        echo "Available sounds: Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink"
        return
    fi
    export TASK_SOUND_NAME="$sound"
    echo "Task sound set to: $sound"
    play_task_sound "$sound"
}

# Auto-setup if sourced
setup_sound_hooks

# Provide feedback
if [[ "$TASK_SOUND_ENABLED" == "true" ]]; then
    echo "✅ Task completion sounds enabled (min duration: ${TASK_SOUND_MIN_DURATION}s)"
    echo "   Commands: enable_task_sounds, disable_task_sounds, set_task_sound <name>"
fi