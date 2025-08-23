#!/bin/bash

echo "🎵 Testing Task Completion Sound Hooks"
echo "======================================="
echo ""

# Test 1: Direct sound playback
echo "Test 1: Playing direct sound..."
/Users/shriyavallabh/Desktop/Jarvish/scripts/play-completion-sound.sh
sleep 1

# Test 2: Different sounds
echo ""
echo "Test 2: Testing different sound options..."
sounds=("Glass" "Ping" "Pop" "Hero")
for sound in "${sounds[@]}"; do
    echo "  Playing: $sound"
    afplay "/System/Library/Sounds/${sound}.aiff" 2>/dev/null &
    sleep 1
done

# Test 3: Check shell integration
echo ""
echo "Test 3: Checking shell integration..."
if [ -f "$HOME/Desktop/Jarvish/scripts/shell-sound-hook.sh" ]; then
    echo "  ✅ Shell hook script exists"
else
    echo "  ❌ Shell hook script not found"
fi

if grep -q "shell-sound-hook.sh" "$HOME/.zshrc" 2>/dev/null; then
    echo "  ✅ Hook integrated in .zshrc"
else
    echo "  ❌ Hook not found in .zshrc"
fi

# Test 4: Check Claude hooks
echo ""
echo "Test 4: Checking Claude Code hooks..."
if [ -f "$HOME/Desktop/Jarvish/.claude/hooks/task-completion-sound.json" ]; then
    echo "  ✅ Claude Code hook configuration exists"
else
    echo "  ❌ Claude Code hook configuration not found"
fi

echo ""
echo "======================================="
echo "Setup Instructions:"
echo ""
echo "1. For immediate effect in current terminal:"
echo "   source ~/Desktop/Jarvish/scripts/shell-sound-hook.sh"
echo ""
echo "2. For all new terminals (already configured):"
echo "   Just open a new terminal window"
echo ""
echo "3. Available commands in configured terminals:"
echo "   - enable_task_sounds    # Enable sounds"
echo "   - disable_task_sounds   # Disable sounds"
echo "   - set_task_sound Glass  # Change sound (Glass, Ping, Pop, etc.)"
echo ""
echo "4. Test with a long command (>3 seconds):"
echo "   sleep 4 && echo 'Done!'"
echo ""
echo "✅ Setup complete! Sounds will play for commands taking >3 seconds."