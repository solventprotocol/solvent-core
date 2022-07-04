export type StepStaking = {
  "version": "0.1.0",
  "name": "step_staking",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceVault",
          "type": "u8"
        },
        {
          "name": "nonceStaking",
          "type": "u8"
        },
        {
          "name": "lockEndDate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateLockEndDate",
      "accounts": [
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceStaking",
          "type": "u8"
        },
        {
          "name": "newLockEndDate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "toggleFreezeProgram",
      "accounts": [
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceStaking",
          "type": "u8"
        }
      ]
    },
    {
      "name": "stake",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenFromAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userStakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceVault",
          "type": "u8"
        },
        {
          "name": "nonceStaking",
          "type": "u8"
        },
        {
          "name": "nonceUserStaking",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstake",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "xTokenFromAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userStakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceVault",
          "type": "u8"
        },
        {
          "name": "nonceStaking",
          "type": "u8"
        },
        {
          "name": "nonceUserStaking",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "emitPrice",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "emitReward",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStakingAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "stakingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initializerKey",
            "type": "publicKey"
          },
          {
            "name": "lockEndDate",
            "type": "u64"
          },
          {
            "name": "totalXToken",
            "type": "u64"
          },
          {
            "name": "freezeProgram",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "userStakingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "xTokenAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "PriceChange",
      "fields": [
        {
          "name": "oldStepPerXstepE9",
          "type": "u64",
          "index": false
        },
        {
          "name": "oldStepPerXstep",
          "type": "string",
          "index": false
        },
        {
          "name": "newStepPerXstepE9",
          "type": "u64",
          "index": false
        },
        {
          "name": "newStepPerXstep",
          "type": "string",
          "index": false
        }
      ]
    },
    {
      "name": "Price",
      "fields": [
        {
          "name": "stepPerXstepE9",
          "type": "u64",
          "index": false
        },
        {
          "name": "stepPerXstep",
          "type": "string",
          "index": false
        }
      ]
    },
    {
      "name": "Reward",
      "fields": [
        {
          "name": "deposit",
          "type": "u64",
          "index": false
        },
        {
          "name": "reward",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotExceedLockEndDate",
      "msg": "Not exceed lock end date"
    }
  ]
};

export const IDL: StepStaking = {
  "version": "0.1.0",
  "name": "step_staking",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "initializer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceVault",
          "type": "u8"
        },
        {
          "name": "nonceStaking",
          "type": "u8"
        },
        {
          "name": "lockEndDate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateLockEndDate",
      "accounts": [
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceStaking",
          "type": "u8"
        },
        {
          "name": "newLockEndDate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "toggleFreezeProgram",
      "accounts": [
        {
          "name": "initializer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceStaking",
          "type": "u8"
        }
      ]
    },
    {
      "name": "stake",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenFrom",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenFromAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userStakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceVault",
          "type": "u8"
        },
        {
          "name": "nonceStaking",
          "type": "u8"
        },
        {
          "name": "nonceUserStaking",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstake",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "xTokenFromAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userStakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonceVault",
          "type": "u8"
        },
        {
          "name": "nonceStaking",
          "type": "u8"
        },
        {
          "name": "nonceUserStaking",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "emitPrice",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "emitReward",
      "accounts": [
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakingAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenFromAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userStakingAccount",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "stakingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initializerKey",
            "type": "publicKey"
          },
          {
            "name": "lockEndDate",
            "type": "u64"
          },
          {
            "name": "totalXToken",
            "type": "u64"
          },
          {
            "name": "freezeProgram",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "userStakingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "xTokenAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "PriceChange",
      "fields": [
        {
          "name": "oldStepPerXstepE9",
          "type": "u64",
          "index": false
        },
        {
          "name": "oldStepPerXstep",
          "type": "string",
          "index": false
        },
        {
          "name": "newStepPerXstepE9",
          "type": "u64",
          "index": false
        },
        {
          "name": "newStepPerXstep",
          "type": "string",
          "index": false
        }
      ]
    },
    {
      "name": "Price",
      "fields": [
        {
          "name": "stepPerXstepE9",
          "type": "u64",
          "index": false
        },
        {
          "name": "stepPerXstep",
          "type": "string",
          "index": false
        }
      ]
    },
    {
      "name": "Reward",
      "fields": [
        {
          "name": "deposit",
          "type": "u64",
          "index": false
        },
        {
          "name": "reward",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotExceedLockEndDate",
      "msg": "Not exceed lock end date"
    }
  ]
};
