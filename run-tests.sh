#!/bin/bash
# Taken from: https://stackoverflow.com/a/10909842/5837426

yarn test:validator > /dev/null 2>&1 & pid=$!
PID_LIST+=" $pid";
sleep 3

yarn test && echo "Press Ctrl C to exit." & pid=$!
PID_LIST+=" $pid";

trap "kill $PID_LIST" SIGINT
wait $PID_LIST
