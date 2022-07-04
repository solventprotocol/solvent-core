#!/usr/bin/env bash

cp ../solvent-contracts/target/idl/solvent.json src/idls && cp ../solvent-contracts/target/types/solvent.ts src/types/ && cp ../solvent-contracts/target/deploy/solvent.so tests/genesis-programs/
echo "✨ Copied updated contract's files to solvent core!"
