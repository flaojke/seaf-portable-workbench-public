#!/bin/sh
export npm_package_version="%VERSION%"
exec /sbin/tini -- "$@"