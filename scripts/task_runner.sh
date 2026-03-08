#!/bin/bash

# A simple wrapper for executing tasks and auto-reporting to the Mission Control Tasks API

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <task-id> <command-to-run>"
  echo "Example: $0 task-001 ./ai-news-daily.sh"
  exit 1
fi

TASK_ID=$1
shift
COMMAND="$@"

echo "[Task Runner] Starting Execution for Task: $TASK_ID"
echo "[Task Runner] Command: $COMMAND"

# Execute the actual command
eval "$COMMAND"
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "[Task Runner] Execution complete! Marking task $TASK_ID as 'done'..."
  curl -s -X POST http://localhost:3000/api/tasks/$TASK_ID/status \
       -H "Content-Type: application/json" \
       -d "{\"status\":\"done\", \"_message\":\"自动回写：任务执行成功 (Exit code: $EXIT_CODE)\"}" > /dev/null
else
  echo "[Task Runner] Execution failed! Marking task $TASK_ID as 'reviewing'..."
  curl -s -X POST http://localhost:3000/api/tasks/$TASK_ID/status \
       -H "Content-Type: application/json" \
       -d "{\"status\":\"reviewing\", \"_message\":\"自动回写：任务执行遇到错误告警，请人工复核 (Exit code: $EXIT_CODE)\"}" > /dev/null
fi

exit $EXIT_CODE
