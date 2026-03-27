#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# create-bundle.sh — Create a .jsdos bundle from Ignition game files
#
# Usage:
#   ./create-bundle.sh /path/to/ignition/game/folder
#
# This produces ignition.jsdos which you can drag-and-drop into
# the browser player.
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

GAME_DIR="${1:?Usage: $0 /path/to/ignition/game/folder}"

if [ ! -d "$GAME_DIR" ]; then
  echo "Error: '$GAME_DIR' is not a directory"
  exit 1
fi

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

# Copy game files
cp -r "$GAME_DIR"/* "$WORK_DIR/"

# Create DOSBox config
mkdir -p "$WORK_DIR/.jsdos"
cat > "$WORK_DIR/.jsdos/dosbox.conf" << 'DOSCONF'
[sdl]
fullscreen=false
autolock=true
output=surface

[dosbox]
machine=svga_s3

[cpu]
core=auto
cputype=auto
cycles=max

[mixer]
rate=44100
blocksize=1024

[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
oplmode=auto
oplemu=default
oplrate=44100

[gus]
gus=false

[serial]
serial1=dummy
serial2=dummy
serial3=disabled
serial4=disabled

[autoexec]
@echo off
mount c .
c:
cls
ignition.exe
DOSCONF

# Create the .jsdos bundle (it's just a zip)
cd "$WORK_DIR"
zip -r /tmp/ignition.jsdos . -x ".*" > /dev/null 2>&1 || true
zip -r /tmp/ignition.jsdos .jsdos/ > /dev/null 2>&1 || true

OUTFILE="$(pwd -P)/../../ignition/ignition.jsdos"
cp /tmp/ignition.jsdos "$OUTFILE" 2>/dev/null || cp /tmp/ignition.jsdos ./ignition.jsdos

echo "Bundle created: ignition.jsdos"
echo "Drag and drop it into the browser player to play!"
