import * as anchor from "@project-serum/anchor";
import { getSolvent, getLockerState } from "../../utils";

/**
 * Fetch LockerState account contents
 * @param connection Solana Web3 connection object
 * @param dropletMint Droplet mint associated with the collection
 * @param nftMint Mint of the NFT locked in the locker
 * @returns Promise resolving to the LockerState account contents
 */
export const getLocker = async (
  connection: anchor.web3.Connection,
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey
) => {
  const provider = new anchor.AnchorProvider(connection, null, null);
  const solvent = getSolvent(provider);
  const lockerAddress = await getLockerState(dropletMint, nftMint);
  return await solvent.account.lockerState.fetch(lockerAddress);
};

/**
 * Fetch all LockerState accounts, optionally filtering by collection
 * @param connection Solana Web3 connection object
 * @param dropletMint Droplet mint associated with the collection
 * @returns Promise resolving to the the list of LockerState accounts
 */
export const getAllLockers = async (
  connection: anchor.web3.Connection,
  dropletMint?: anchor.web3.PublicKey
) => {
  const provider = new anchor.AnchorProvider(connection, null, null);
  const solvent = getSolvent(provider);
  if (dropletMint) {
    return await solvent.account.lockerState.all([
      {
        memcmp: {
          offset: 9,
          bytes: dropletMint.toBase58(),
        },
      },
    ]);
  } else {
    return await solvent.account.lockerState.all();
  }
};
