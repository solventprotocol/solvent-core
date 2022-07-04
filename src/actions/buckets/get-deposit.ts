import * as anchor from "@project-serum/anchor";
import { getDepositState, getSolvent } from "../../utils";

/**
 * Fetch DepositState account contents
 * @param connection Solana Web3 connection object
 * @param dropletMint Droplet mint associated with the collection
 * @param nftMint Mint of the NFT deposited in the locker
 * @returns Promise resolving to the DepositState account contents
 */
export const getDeposit = async (
  connection: anchor.web3.Connection,
  dropletMint: anchor.web3.PublicKey,
  nftMint: anchor.web3.PublicKey
) => {
  const provider = new anchor.AnchorProvider(connection, null, null);
  const solvent = getSolvent(provider);
  const depositAddress = await getDepositState(dropletMint, nftMint);
  return await solvent.account.depositState.fetch(depositAddress);
};

/**
 * Fetch all DepositState accounts, optionally filtering by collection
 * @param connection Solana Web3 connection object
 * @param dropletMint Droplet mint associated with the collection
 * @returns Promise resolving to the the list of DepositState accounts
 */
export const getAllDeposits = async (
  connection: anchor.web3.Connection,
  dropletMint?: anchor.web3.PublicKey
) => {
  const provider = new anchor.AnchorProvider(connection, null, null);
  const solvent = getSolvent(provider);
  if (dropletMint) {
    return await solvent.account.depositState.all([
      {
        memcmp: {
          offset: 9,
          bytes: dropletMint.toBase58(),
        },
      },
    ]);
  } else {
    return await solvent.account.depositState.all();
  }
};
