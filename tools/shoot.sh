#!/usr/bin/env bash
# Wrapper: Node fetches fonts through the agent proxy with the proxy CA trusted.
export NODE_USE_ENV_PROXY=1
export NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
export DC_RUNTIME="${DC_RUNTIME:-/tmp/claude-0/-home-user-intent-design/3108e9a0-420a-5b2a-bc5e-064d718df98b/scratchpad/support.js}"
exec node "$(dirname "$0")/shoot.mjs" "$@"
