#!/bin/bash

# Enhanced sound notification with multiple fallback methods

play_notification_sound() {
    local sound_type="${1:-success}"
    local force_volume="${2:-false}"
    
    # Map sound types to system sounds
    local sound_file=""
    case "$sound_type" in
        success)
            sound_file="Glass"
            ;;
        error)
            sound_file="Basso"
            ;;
        alert)
            sound_file="Hero"
            ;;
        complete)
            sound_file="Ping"
            ;;
        *)
            sound_file="Glass"
            ;;
    esac
    
    # Method 1: Try playing system sound with afplay
    if [[ -f "/System/Library/Sounds/${sound_file}.aiff" ]]; then
        echo "🔊 Playing ${sound_file} sound..."
        afplay "/System/Library/Sounds/${sound_file}.aiff" 2>/dev/null
        return 0
    fi
    
    # Method 2: Use osascript to play sound with system audio
    osascript -e "do shell script \"afplay /System/Library/Sounds/${sound_file}.aiff\"" 2>/dev/null
    
    # Method 3: System beep as fallback
    osascript -e "beep 2" 2>/dev/null
    
    # Method 4: Terminal bell
    printf '\a'
    
    # Method 5: Say command for voice notification
    if command -v say &> /dev/null; then
        say "Task completed" &
    fi
}

# Test function with visual feedback
test_sound_system() {
    echo "🎵 Testing Sound Notification System"
    echo "====================================="
    echo ""
    
    # Check volume
    local current_volume=$(osascript -e "output volume of (get volume settings)")
    echo "📊 Current system volume: ${current_volume}%"
    
    if [[ $current_volume -lt 20 ]]; then
        echo "⚠️  Volume is low! Setting to 50%..."
        osascript -e "set volume output volume 50"
    fi
    
    # Test different sounds
    echo ""
    echo "Testing different notification sounds:"
    echo ""
    
    sounds=("success" "error" "alert" "complete")
    for sound in "${sounds[@]}"; do
        echo "  🔊 Testing ${sound} sound..."
        play_notification_sound "$sound"
        sleep 1
    done
    
    echo ""
    echo "✅ Sound test complete!"
    echo ""
    echo "If you didn't hear anything:"
    echo "1. Check System Preferences > Sound > Output volume"
    echo "2. Make sure 'Mute' is not checked"
    echo "3. Check Do Not Disturb is OFF"
    echo "4. Try: osascript -e 'set volume 5'"
}

# Main execution
if [[ "${1}" == "test" ]]; then
    test_sound_system
else
    play_notification_sound "${1:-success}"
fi