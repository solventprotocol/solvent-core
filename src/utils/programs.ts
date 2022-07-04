import * as anchor from "@project-serum/anchor";
import {
  FLEXIBLE_TOKEN_STAKING_PROGRAM_ID,
  LOCKED_TOKEN_STAKING_PROGRAM_ID,
  SOLVENT_PROGRAM_ID,
} from "../constants";
import { Solvent } from "../types/solvent";
import { StepStaking as FlexibleStaking } from "../types/flexible-staking";
import { StepStaking as LockedStaking } from "../types/locked-staking";
import * as solventIdl from "../idls/solvent.json";
import * as lockedStakingIdl from "../idls/locked-staking.json";
import * as flexibleStakingIdl from "../idls/flexible-staking.json";
import * as gemFarmIdl from "../idls/gem_farm.json";
import * as gemBankIdl from "../idls/gem_bank.json";
import { GemBankClient, GemFarmClient } from "@gemworks/gem-farm-ts";

export const getSolvent = (provider: anchor.AnchorProvider) => {
  return new anchor.Program(
    // @ts-ignore
    solventIdl,
    SOLVENT_PROGRAM_ID,
    provider
  ) as anchor.Program<Solvent>;
};

export const getLockedSvtStaking = (provider: anchor.AnchorProvider) => {
  return new anchor.Program(
    // @ts-ignore
    lockedStakingIdl,
    LOCKED_TOKEN_STAKING_PROGRAM_ID,
    provider
  ) as anchor.Program<LockedStaking>;
};

export const getFlexibleSvtStaking = (provider: anchor.AnchorProvider) => {
  return new anchor.Program(
    // @ts-ignore
    flexibleStakingIdl,
    FLEXIBLE_TOKEN_STAKING_PROGRAM_ID,
    provider
  ) as anchor.Program<FlexibleStaking>;
};

export const getGemFarm = (
  provider: anchor.AnchorProvider,
  gembankProgram: anchor.web3.PublicKey,
  gemfarmProgram: anchor.web3.PublicKey
) =>
  new GemFarmClient(
    provider.connection,
    provider.wallet as anchor.Wallet,
    // @ts-ignore
    gemFarmIdl,
    gemfarmProgram,
    gemBankIdl,
    gembankProgram
  );

export const getGemBank = (
  provider: anchor.AnchorProvider,
  gembankProgram: anchor.web3.PublicKey
) =>
  new GemBankClient(
    provider.connection,
    provider.wallet as anchor.Wallet,
    // @ts-ignore
    gemBankIdl,
    gembankProgram
  );
