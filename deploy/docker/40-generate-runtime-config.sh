#!/bin/sh
set -eu

: "${SPA_API_BASE_URL:?SPA_API_BASE_URL is required}"
: "${SPA_LAUNCH_MODE:?SPA_LAUNCH_MODE is required}"
: "${SPA_AUTHENTICATION_MODE:?SPA_AUTHENTICATION_MODE is required}"
: "${SPA_AUTHENTICATION_URL:?SPA_AUTHENTICATION_URL is required}"

case "$SPA_LAUNCH_MODE" in
  Dev|Certification) ;;
  *)
    echo "SPA_LAUNCH_MODE must be Dev or Certification." >&2
    exit 1
    ;;
esac

case "$SPA_AUTHENTICATION_MODE" in
  LocalJwt)
    SPA_ENTRA_CLIENT_ID="${SPA_ENTRA_CLIENT_ID:-replace-with-public-client-id}"
    SPA_ENTRA_AUTHORITY="${SPA_ENTRA_AUTHORITY:-https://login.microsoftonline.com/common}"
    SPA_ENTRA_SCOPE="${SPA_ENTRA_SCOPE:-api://replace-with-api-client-id/access_as_user}"
    ;;
  MicrosoftEntra)
    : "${SPA_ENTRA_CLIENT_ID:?SPA_ENTRA_CLIENT_ID is required with MicrosoftEntra}"
    : "${SPA_ENTRA_AUTHORITY:?SPA_ENTRA_AUTHORITY is required with MicrosoftEntra}"
    : "${SPA_ENTRA_SCOPE:?SPA_ENTRA_SCOPE is required with MicrosoftEntra}"
    ;;
  *)
    echo "SPA_AUTHENTICATION_MODE must be LocalJwt or MicrosoftEntra." >&2
    exit 1
    ;;
esac

mkdir -p /usr/share/nginx/html/assets/config

envsubst '$SPA_API_BASE_URL $SPA_AUTHENTICATION_MODE $SPA_LAUNCH_MODE $SPA_AUTHENTICATION_URL $SPA_ENTRA_CLIENT_ID $SPA_ENTRA_AUTHORITY $SPA_ENTRA_SCOPE' \
    < /opt/assistant-spa/config.template.json \
    > /usr/share/nginx/html/assets/config/config.json
