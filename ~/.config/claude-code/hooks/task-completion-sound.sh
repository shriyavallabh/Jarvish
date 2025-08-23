#!/bin/bash

# Claude Code Task Completion Sound Hook
# Plays a mild notification sound when tasks are completed

# Configuration
SOUND_TYPE="completion"  # completion, success, notification
VOLUME=0.3              # Volume level (0.0 to 1.0)

# Function to play sound on macOS
play_macos_sound() {
    case $SOUND_TYPE in
        "completion")
            # Play a gentle completion sound
            afplay /System/Library/Sounds/Glass.aiff &
            ;;
        "success")
            # Play success sound
            afplay /System/Library/Sounds/Hero.aiff &
            ;;
        "notification")
            # Play notification sound
            afplay /System/Library/Sounds/Ping.aiff &
            ;;
        *)
            # Default system sound
            afplay /System/Library/Sounds/Glass.aiff &
            ;;
    esac
}

# Function to play sound on Linux
play_linux_sound() {
    if command -v paplay &> /dev/null; then
        # Using PulseAudio
        paplay /usr/share/sounds/alsa/Front_Left.wav 2>/dev/null &
    elif command -v aplay &> /dev/null; then
        # Using ALSA
        aplay /usr/share/sounds/alsa/Front_Left.wav 2>/dev/null &
    elif command -v speaker-test &> /dev/null; then
        # Generate a brief tone
        speaker-test -t sine -f 1000 -l 1 -s 1 2>/dev/null &
        sleep 0.2
        killall speaker-test 2>/dev/null
    fi
}

# Function to play terminal bell
play_terminal_bell() {
    # Terminal bell (works on most systems)
    echo -e "\a"
}

# Main execution
main() {
    # Get the event type from arguments
    EVENT_TYPE="${1:-PostToolUse}"
    TOOL_NAME="${2:-unknown}"
    
    # Only play sound for specific events
    case $EVENT_TYPE in
        "PostToolUse"|"task_completion"|"work_done")
            # Detect operating system and play appropriate sound
            case "$(uname -s)" in
                Darwin*)
                    play_macos_sound
                    ;;
                Linux*)
                    play_linux_sound
                    ;;
                *)
                    play_terminal_bell
                    ;;
            esac
            
            # Optional: Log the completion
            echo "$(date): Task completed - $TOOL_NAME" >> ~/.config/claude-code/completion.log
            ;;
        *)
            # No sound for other events
            ;;
    esac
}

# Execute main function with all arguments
main "$@"