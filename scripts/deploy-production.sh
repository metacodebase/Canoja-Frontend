#!/usr/bin/env bash

set -Eeuo pipefail

required_vars=(DEPLOY_HOST DEPLOY_USER DEPLOY_PATH)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: ${var_name}" >&2
    exit 1
  fi
done

if [[ "${DEPLOY_PATH}" != /* || "${DEPLOY_PATH}" == "/" ]]; then
  echo "DEPLOY_PATH must be an absolute directory other than /." >&2
  exit 1
fi

command -v yarn >/dev/null || { echo "yarn is required." >&2; exit 1; }
command -v ssh >/dev/null || { echo "ssh is required." >&2; exit 1; }
command -v rsync >/dev/null || { echo "rsync is required." >&2; exit 1; }

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd -- "${script_dir}/.." && pwd)"
release_id="$(date -u +%Y%m%d%H%M%S)"
release_dir="${DEPLOY_PATH}/releases/${release_id}"
remote="${DEPLOY_USER}@${DEPLOY_HOST}"

ssh_args=()
if [[ -n "${DEPLOY_PORT:-}" ]]; then
  ssh_args+=("-p" "${DEPLOY_PORT}")
fi
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  ssh_args+=("-i" "${DEPLOY_SSH_KEY}")
fi

rsync_ssh=(ssh "${ssh_args[@]}")

cd "${project_dir}"
echo "Building production frontend..."
yarn build

[[ -f dist/index.html ]] || { echo "Production build did not create dist/index.html." >&2; exit 1; }

echo "Creating release ${release_id} on ${DEPLOY_HOST}..."
ssh "${ssh_args[@]}" "${remote}" "mkdir -p '${release_dir}'"

echo "Uploading production assets..."
rsync -az --checksum -e "${rsync_ssh[*]}" dist/ "${remote}:${release_dir}/"

echo "Activating release..."
ssh "${ssh_args[@]}" "${remote}" \
  "test -f '${release_dir}/index.html' && ln -sfn '${release_dir}' '${DEPLOY_PATH}/current'"

echo "Production deployment complete: ${release_id}"
