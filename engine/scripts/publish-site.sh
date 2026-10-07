#!/bin/bash
# publish-site.sh <dist-dir> <auth-header-file>
# Push a built site to main (fast-forward on top of the remote history), open a
# PR main -> production and squash-merge it with the one-line $TITLE.
# Never force-pushes. Needs TITLE (and optionally BODY) in the environment.
#
# production was squash-merged before, so it holds commits main lacks and a new
# PR would conflict. Before pushing, a sync commit is built with plumbing
# (a textual merge trips over renamed pages): tree = today's build + the files
# ONLY production has (deploy workflow, build script), parents = build +
# origin/production. Production-only is measured against origin/MAIN - comparing
# against HEAD wrongly treats old images today's build deletes as prod-only.
set -u
DIR="$1"; HDR="$2"
dom=$(basename "$DIR"); dom="${dom%%-*}"
TITLE="${TITLE:?TITLE required}"
BODY="${BODY:-Site update.}"
tok=$(sed -n 's/^Authorization: token //p' "$HDR")
[ -n "$tok" ] || { echo "$dom FAIL no token"; exit 1; }
basic=$(printf 'x-access-token:%s' "$tok" | base64 -w0)
export GIT_CONFIG_COUNT=2 GIT_CONFIG_KEY_0="http.https://github.com/.extraheader" GIT_CONFIG_VALUE_0="AUTHORIZATION: basic $basic" GIT_CONFIG_KEY_1="credential.helper" GIT_CONFIG_VALUE_1=""
cd "$DIR" || { echo "$dom FAIL cd"; exit 1; }
if [ ! -d .git ]; then git init -q -b main && git remote add origin "https://github.com/OrangeToolzBD/$dom" || { echo "$dom FAIL init"; exit 1; }; fi
git config user.name "lovable-1"; git config user.email "lovable-1@orangetoolz.com"
git fetch -q origin main production 2>&1 | sed 's/basic [A-Za-z0-9+/=]*/basic ***/'
git rev-parse -q --verify origin/main >/dev/null || { echo "$dom FAIL fetch"; exit 1; }
git reset -q --mixed origin/main || { echo "$dom FAIL reset"; exit 1; }
git add -A
if git diff --cached --quiet; then echo "$dom NOCHANGE"; exit 0; fi
git commit -q -m "$TITLE" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" || { echo "$dom FAIL commit"; exit 1; }
stat=$(git diff --shortstat origin/main HEAD)
if git rev-parse -q --verify origin/production >/dev/null && ! git merge-base --is-ancestor origin/production HEAD; then
  built=$(git rev-parse HEAD)
  prodonly=$(comm -13 <(git ls-tree -r --name-only origin/main | sort) <(git ls-tree -r --name-only origin/production | sort))
  [ -z "$prodonly" ] || git checkout origin/production -- $prodonly || { echo "$dom FAIL sync checkout"; exit 1; }
  tree=$(git write-tree)
  c=$(git commit-tree "$tree" -p "$built" -p origin/production -m "Sync production into main") || { echo "$dom FAIL sync commit"; exit 1; }
  git reset -q --soft "$c"
  extra=$(git diff --name-only "$built" HEAD | grep -v -E '^(\.github/|build-upload-s3\.sh$)' | head -3)
  [ -z "$extra" ] || { echo "$dom FAIL sync changed site files: $extra"; exit 1; }
fi
git push -q origin main 2>&1 | sed 's/basic [A-Za-z0-9+/=]*/basic ***/'
[ "$(git ls-remote origin refs/heads/main | cut -f1)" = "$(git rev-parse HEAD)" ] || { echo "$dom FAIL push (remote main != local HEAD)"; exit 1; }
api() { curl -s -H @"$HDR" -H "Accept: application/vnd.github+json" "$@"; }
payload=$(python3 -c 'import json,sys;print(json.dumps({"title":sys.argv[1],"head":"main","base":"production","body":sys.argv[2]}))' "$TITLE" "$BODY")
pr=$(api -X POST "https://api.github.com/repos/OrangeToolzBD/$dom/pulls" -d "$payload" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("number") or "ERR:"+str(d.get("message"))+str(d.get("errors","")))')
case "$pr" in ERR*) echo "$dom FAIL pr $pr"; exit 1;; esac
st=""; for i in 1 2 3 4 5 6 7 8; do st=$(api "https://api.github.com/repos/OrangeToolzBD/$dom/pulls/$pr" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("mergeable"))'); [ "$st" = True ] && break; sleep 3; done
[ "$st" = True ] || { echo "$dom FAIL PR#$pr not mergeable ($st)"; exit 1; }
mpayload=$(python3 -c 'import json,sys;print(json.dumps({"merge_method":"squash","commit_title":sys.argv[1],"commit_message":""}))' "$TITLE")
mg=$(api -X PUT "https://api.github.com/repos/OrangeToolzBD/$dom/pulls/$pr/merge" -d "$mpayload" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("merged" if d.get("merged") else "ERR:"+str(d.get("message")))')
[ "$mg" = merged ] || { echo "$dom FAIL merge PR#$pr $mg"; exit 1; }
msg=$(api "https://api.github.com/repos/OrangeToolzBD/$dom/commits/production" | python3 -c 'import sys,json;print(repr(json.load(sys.stdin)["commit"]["message"]))')
echo "$dom OK | main pushed ($stat) | PR #$pr merged | production msg: $msg"
