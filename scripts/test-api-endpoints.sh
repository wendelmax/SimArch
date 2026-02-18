#!/usr/bin/env bash
FAIL=0
BASE="${1:-http://localhost:5000}"
PROJECT_DIR="${2:-/mnt/c/Users/JacksonWendelSantosS/Project/SimArch}"
YAML_FILE="$PROJECT_DIR/samples/checkout-flow.yaml"
if [ ! -f "$YAML_FILE" ]; then
  echo "Sample YAML not found: $YAML_FILE"
  exit 1
fi
BODY=$(python3 -c "import json,sys; print(json.dumps({'yaml': open(sys.argv[1]).read()}))" "$YAML_FILE")

test_get() {
  local path=$1
  local code=$(curl -s -o /tmp/resp -w "%{http_code}" "$BASE$path")
  echo "  $path -> $code"
  if [ "$code" != "200" ]; then cat /tmp/resp 2>/dev/null; FAIL=1; fi
}

test_post() {
  local path=$1
  local code=$(curl -s -o /tmp/resp -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$BODY" "$BASE$path")
  echo "  $path -> $code"
  if [ "$code" != "200" ]; then head -c 400 /tmp/resp 2>/dev/null; echo; FAIL=1; fi
}

echo "Testing API at $BASE"
echo "---"
echo "GET /health"
test_get "/health"
echo "POST /api/model/load"
test_post "/api/model/load"
echo "POST /api/simulation/run"
test_post "/api/simulation/run"
echo "POST /api/decision/evaluate"
test_post "/api/decision/evaluate"
echo "POST /api/quality/profile"
test_post "/api/quality/profile"
echo "POST /api/export/adr"
test_post "/api/export/adr"
echo "POST /api/export/decision-log"
test_post "/api/export/decision-log"
echo "POST /api/export/costs-csv"
test_post "/api/export/costs-csv"
echo "POST /api/export/markdown"
test_post "/api/export/markdown"
echo "POST /api/export/json"
test_post "/api/export/json"
echo "POST /api/export/traceability"
test_post "/api/export/traceability"
echo "POST /api/export/traceability-csv"
test_post "/api/export/traceability-csv"
echo "POST /api/export/mermaid"
test_post "/api/export/mermaid"
echo "POST /api/export/traceability-graph"
test_post "/api/export/traceability-graph"
echo "POST /api/validation/conflicts"
test_post "/api/validation/conflicts"
echo "POST /api/simulation/compare"
COMPARE_BODY=$(python3 -c "import json,sys; y=open(sys.argv[1]).read(); print(json.dumps({'yaml':y,'scenarioA':{'durationSec':3,'rate':20},'scenarioB':{'durationSec':3,'rate':50}}))" "$YAML_FILE")
code=$(curl -s -o /tmp/resp -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$COMPARE_BODY" "$BASE/api/simulation/compare")
echo "  /api/simulation/compare -> $code"
if [ "$code" != "200" ]; then head -c 400 /tmp/resp 2>/dev/null; echo; FAIL=1; fi
echo "POST /api/export/consolidated"
CONSOL_BODY=$(python3 -c "import json,sys; y=open(sys.argv[1]).read(); print(json.dumps({'yaml':y}))" "$YAML_FILE")
code=$(curl -s -o /tmp/resp -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$CONSOL_BODY" "$BASE/api/export/consolidated")
echo "  /api/export/consolidated -> $code"
if [ "$code" != "200" ]; then head -c 400 /tmp/resp 2>/dev/null; echo; FAIL=1; fi
echo "---"
if [ $FAIL -eq 0 ]; then echo "All endpoints OK"; else echo "Some endpoints failed"; exit 1; fi
