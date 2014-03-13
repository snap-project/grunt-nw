#!/bin/bash

. ./libudev-linker.sh

export APP_WRAPPER="`readlink -f "$0"`"

HERE="`dirname "$APP_WRAPPER"`"

# Always use our versions of ffmpeg libs.
# This also makes RPMs find the compatibly-named library symlinks.
if [[ -n "$LD_LIBRARY_PATH" ]]; then
  LD_LIBRARY_PATH="$HERE:$HERE/lib:$LD_LIBRARY_PATH"
else
  LD_LIBRARY_PATH="$HERE:$HERE/lib"
fi
export LD_LIBRARY_PATH

export NODE_ENV=production

exec -a "$0" "$HERE/nw-bin" "$@"