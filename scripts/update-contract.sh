#!/usr/bin/env bash

cp ../solvent-program/target/idl/solvent_protocol.json src/idls && cp ../solvent-program/target/types/solvent_protocol.ts src/types/ && cp ../solvent-program/target/deploy/solvent_protocol.so tests/genesis-programs/
echo "✨ Copied updated contract's files to solvent core!"
