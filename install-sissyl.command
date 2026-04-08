#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SISTER SYLVESTER LX MANAGER - INSTALLER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Installing to Applications folder..."
echo ""

# Copy app to Applications
cp -r "Sister Sylvester LX Manager.app" "/Applications/"

# Remove quarantine attribute
xattr -cr "/Applications/Sister Sylvester LX Manager.app"

echo "✓ Installation complete!"
echo ""
echo "You can now close this window and open"
echo "Sister Sylvester LX Manager from Applications."
echo ""
echo "Press any key to close..."

read -n 1 -s
