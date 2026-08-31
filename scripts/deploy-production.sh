#!/usr/bin/env bash

set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd -- "${script_dir}/.." && pwd)"
deploy_env_file="${DEPLOY_ENV_FILE:-${project_dir}/.env.deploy}"

if [[ -f "${deploy_env_file}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${deploy_env_file}"
  set +a
fi

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

command -v npm >/dev/null || { echo "npm is required." >&2; exit 1; }
command -v ssh >/dev/null || { echo "ssh is required." >&2; exit 1; }
command -v rsync >/dev/null || { echo "rsync is required." >&2; exit 1; }

release_id="$(date -u +%Y%m%d%H%M%S)"
backup_dir="${DEPLOY_PATH}-releases/${release_id}"
remote="${DEPLOY_USER}@${DEPLOY_HOST}"

ssh_args=("-o" "BatchMode=yes" "-o" "ConnectTimeout=10")
if [[ -n "${DEPLOY_PORT:-}" ]]; then
  ssh_args+=("-p" "${DEPLOY_PORT}")
fi
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  [[ -f "${DEPLOY_SSH_KEY}" ]] || { echo "SSH key not found: ${DEPLOY_SSH_KEY}" >&2; exit 1; }
  ssh_args+=("-i" "${DEPLOY_SSH_KEY}")
fi

rsync_ssh=(ssh "${ssh_args[@]}")

cd "${project_dir}"
echo "Building production frontend..."
npm run build

[[ -f dist/index.html ]] || { echo "Production build did not create dist/index.html." >&2; exit 1; }

echo "Backing up the currently served frontend..."
ssh "${ssh_args[@]}" "${remote}" \
  "mkdir -p '${DEPLOY_PATH}' '${backup_dir}' && if test -f '${DEPLOY_PATH}/index.html'; then cp -a '${DEPLOY_PATH}/.' '${backup_dir}/'; fi"

echo "Uploading production assets..."
rsync -az --checksum --delete -e "${rsync_ssh[*]}" dist/ "${remote}:${DEPLOY_PATH}/"

echo "Verifying deployed frontend..."
ssh "${ssh_args[@]}" "${remote}" \
  "test -f '${DEPLOY_PATH}/index.html'"

echo "Production deployment complete: ${release_id}"
