import * as anchor from "@project-serum/anchor";
import {
  SOLVENT_AUTHORITY_SEED,
  BUCKET_SEED,
  DEPOSIT_SEED,
  LOCKER_SEED,
  SOLVENT_PROGRAM_ID,
  FARMER_AUTHORITY_SEED,
  SWAP_SEED,
} from "../constants";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

export const getSolventAuthority = async () => {
  const [solventAuthority] = await anchor.web3.PublicKey.findProgramAddress(
    [SOLVENT_AUTHORITY_SEED],
    SOLVENT_PROGRAM_ID
  );
  return solventAuthority;
};

export const getBucketState = async (dropletMint: anchor.web3.PublicKey) => {
  const [bucketState] = await anchor.web3.PublicKey.findProgramAddress(
    [dropletMint.toBuffer(), BUCKET_SEED],
    SOLVENT_PROGRAM_ID
  );
  return bucketState;
};

export const getLockerState = async (
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey
) => {
  const [lockerState] = await anchor.web3.PublicKey.findProgramAddress(
    [dropletMint.toBuffer(), nftMint.toBuffer(), LOCKER_SEED],
    SOLVENT_PROGRAM_ID
  );
  return lockerState;
};

export const getDepositState = async (
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey
) => {
  const [depositState] = await anchor.web3.PublicKey.findProgramAddress(
    [dropletMint.toBuffer(), nftMint.toBuffer(), DEPOSIT_SEED],
    SOLVENT_PROGRAM_ID
  );
  return depositState;
};

export const getSwapState = async (
  dropletMint: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey
) => {
  const [swapState] = await anchor.web3.PublicKey.findProgramAddress(
    [dropletMint.toBuffer(), signer.toBuffer(), SWAP_SEED],
    SOLVENT_PROGRAM_ID
  );
  return swapState;
}

export const getTokenMetadata = async (tokenMint: anchor.web3.PublicKey) => {
  const [tokenMetadataAddress] = await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  return tokenMetadataAddress;
};

export const getFarmerAuthority = async (nftMint: anchor.web3.PublicKey) => {
  const [farmerAuthority] = await anchor.web3.PublicKey.findProgramAddress(
    [FARMER_AUTHORITY_SEED, nftMint.toBuffer()],
    SOLVENT_PROGRAM_ID
  );
  return farmerAuthority;
};
