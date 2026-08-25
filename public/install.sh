#!/usr/bin/env bash

set -euo pipefail

API_URL=""
CLOINK_VERSION=""
ARCHITECTURE=""
DOWNLOAD_URL=""
EXPECTED_SHA256=""
RESOLVE_ONLY=false

die() {
    printf 'Error: %s\n' "$*" >&2
    exit 1
}

usage() {
    cat <<'EOF'
Install Cloink from artifacts published by the Cloink management server.

Usage:
  install.sh --api-url https://cloink.example.com [options]

Options:
  --api-url URL         Management API origin used to read version releases.
  --version VERSION     Install an exact published version.
  --architecture ARCH   Override detected architecture (amd64, arm64, armv7).
  --download-url URL    Install a specific tar.gz artifact directly.
  --sha256 HEX          Expected SHA256 when --download-url is used.
  --resolve-only        Print the selected release without installing it.
  -h, --help            Show this help.
EOF
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --api-url|-m|--management)
            [ "$#" -ge 2 ] || die "$1 requires a value"
            API_URL="$2"
            shift 2
            ;;
        --version|-v)
            [ "$#" -ge 2 ] || die "$1 requires a value"
            CLOINK_VERSION="$2"
            shift 2
            ;;
        --architecture|-a)
            [ "$#" -ge 2 ] || die "$1 requires a value"
            ARCHITECTURE="$2"
            shift 2
            ;;
        --download-url|-u|--url)
            [ "$#" -ge 2 ] || die "$1 requires a value"
            DOWNLOAD_URL="$2"
            shift 2
            ;;
        --sha256)
            [ "$#" -ge 2 ] || die "$1 requires a value"
            EXPECTED_SHA256="$2"
            shift 2
            ;;
        --resolve-only)
            RESOLVE_ONLY=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        http://*|https://*)
            API_URL="$1"
            shift
            ;;
        *)
            die "unknown argument: $1"
            ;;
    esac
done

API_URL="${API_URL%/}"

normalize_architecture() {
    case "${ARCHITECTURE:-$(uname -m)}" in
        x86_64|amd64)
            printf 'amd64\n'
            ;;
        aarch64|arm64)
            printf 'arm64\n'
            ;;
        armv7l|armv7|armhf)
            printf 'armv7\n'
            ;;
        *)
            die "unsupported Linux architecture: ${ARCHITECTURE:-$(uname -m)}"
            ;;
    esac
}

install_dependencies() {
    local missing=()
    local command_name
    for command_name in curl jq tar sha256sum find install; do
        command -v "$command_name" >/dev/null 2>&1 || missing+=("$command_name")
    done
    [ "${#missing[@]}" -eq 0 ] && return

    [ "${EUID}" -eq 0 ] || die "run the installer through sudo; missing commands: ${missing[*]}"

    if command -v apt-get >/dev/null 2>&1; then
        apt-get update -y
        apt-get install -y ca-certificates coreutils curl findutils jq tar
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y ca-certificates coreutils curl findutils jq tar
    elif command -v yum >/dev/null 2>&1; then
        yum install -y ca-certificates coreutils curl findutils jq tar
    elif command -v pacman >/dev/null 2>&1; then
        pacman -Sy --noconfirm ca-certificates coreutils curl findutils jq tar
    elif command -v zypper >/dev/null 2>&1; then
        zypper --non-interactive install ca-certificates coreutils curl findutils jq tar
    else
        die "install these commands first: ${missing[*]}"
    fi
}

resolve_release() {
    local architecture response release release_url
    architecture="$(normalize_architecture)"

    if [ -n "$DOWNLOAD_URL" ]; then
        printf '%s\n%s\n%s\n%s\n' "$DOWNLOAD_URL" "$EXPECTED_SHA256" "$CLOINK_VERSION" "$architecture"
        return
    fi

    [ -n "$API_URL" ] || die "--api-url is required"
    response="$(curl --fail --silent --show-error --get \
        --data-urlencode 'platform=linux' \
        --data-urlencode 'channel=stable' \
        "${API_URL}/api/version-releases/public")"

    release="$(printf '%s' "$response" | jq -c \
        --arg architecture "$architecture" \
        --arg version "$CLOINK_VERSION" '
          map(select(
            .platform == "linux" and
            (.architecture == $architecture or .architecture == "universal") and
            ($version == "" or .version == $version)
          ))
          | sort_by(.createdAt // "")
          | reverse
          | (
              map(select(.architecture == $architecture and .isLatest == true))[0]
              // map(select(.architecture == $architecture))[0]
              // map(select(.architecture == "universal" and .isLatest == true))[0]
              // map(select(.architecture == "universal"))[0]
              // empty
            )
        ')"
    [ -n "$release" ] || die "no published Linux release matches version '${CLOINK_VERSION:-latest}' and architecture '$architecture'"

    release_url="$(printf '%s' "$release" | jq -r '.downloadUrl')"
    case "$release_url" in
        http://*|https://*) ;;
        /*) release_url="${API_URL}${release_url}" ;;
        *) release_url="${API_URL}/${release_url}" ;;
    esac

    printf '%s\n%s\n%s\n%s\n' \
        "$release_url" \
        "$(printf '%s' "$release" | jq -r '.sha256 // ""')" \
        "$(printf '%s' "$release" | jq -r '.version')" \
        "$(printf '%s' "$release" | jq -r '.architecture')"
}

install_dependencies
release_output="$(resolve_release)"
mapfile -t release_fields <<< "$release_output"
[ "${#release_fields[@]}" -eq 4 ] || die "version release response is incomplete"
DOWNLOAD_URL="${release_fields[0]}"
EXPECTED_SHA256="${release_fields[1]}"
CLOINK_VERSION="${release_fields[2]}"
ARCHITECTURE="${release_fields[3]}"

if $RESOLVE_ONLY; then
    printf 'version=%s\narchitecture=%s\ndownload_url=%s\nsha256=%s\n' \
        "$CLOINK_VERSION" "$ARCHITECTURE" "$DOWNLOAD_URL" "$EXPECTED_SHA256"
    exit 0
fi

[ "${EUID}" -eq 0 ] || die "run this installer through sudo"

work_dir="$(mktemp -d /tmp/cloink-install.XXXXXX)"
cleanup() {
    case "$work_dir" in
        /tmp/cloink-install.*) rm -rf -- "$work_dir" ;;
    esac
}
trap cleanup EXIT

archive="$work_dir/cloink.tar.gz"
extract_dir="$work_dir/extracted"
mkdir -p "$extract_dir"

printf 'Downloading Cloink %s for %s...\n' "$CLOINK_VERSION" "$ARCHITECTURE"
curl --fail --location --show-error --output "$archive" "$DOWNLOAD_URL"

if [ -n "$EXPECTED_SHA256" ]; then
    read -r actual_sha256 _ < <(sha256sum "$archive")
    [ "$actual_sha256" = "$EXPECTED_SHA256" ] || die "SHA256 verification failed"
fi

tar -tzf "$archive" >/dev/null || die "published Linux artifact is not a valid tar.gz archive"
while IFS= read -r archive_entry; do
    case "$archive_entry" in
        /*|../*|*/../*|*/..)
            die "published archive contains an unsafe path"
            ;;
    esac
done < <(tar -tzf "$archive")
tar -xzf "$archive" -C "$extract_dir"

cloink_binary="$(find "$extract_dir" -type f -name cloink -print -quit)"
[ -n "$cloink_binary" ] || die "published archive does not contain the cloink binary"
cloink_ui_binary="$(find "$extract_dir" -type f -name cloink-ui -print -quit)"

if command -v cloink >/dev/null 2>&1; then
    cloink service stop >/dev/null 2>&1 || true
    cloink service uninstall >/dev/null 2>&1 || true
fi

install -m 0755 "$cloink_binary" /usr/bin/cloink
if [ -n "$cloink_ui_binary" ]; then
    install -m 0755 "$cloink_ui_binary" /usr/bin/cloink-ui
fi

/usr/bin/cloink service install
/usr/bin/cloink service start

printf '\nCloink %s was installed successfully.\n' "$CLOINK_VERSION"
printf 'Connect with: cloink up'
if [ -n "$API_URL" ]; then
    printf ' --management-url %s' "$API_URL"
fi
printf '\n'
